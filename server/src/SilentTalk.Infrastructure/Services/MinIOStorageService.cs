using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using SilentTalk.Application.Services;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Services;

/// <summary>
/// MinIO/S3 storage service implementation
/// </summary>
public class MinIOStorageService : IStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly StorageSettings _settings;
    private readonly string _bucketName;

    public MinIOStorageService(IOptions<StorageSettings> settings)
    {
        _settings = settings.Value;

        if (_settings.Provider == "MinIO")
        {
            var minioSettings = _settings.MinIO;
            _bucketName = minioSettings.BucketName;

            _minioClient = new MinioClient()
                .WithEndpoint(minioSettings.Endpoint)
                .WithCredentials(minioSettings.AccessKey, minioSettings.SecretKey)
                .WithSSL(minioSettings.UseSSL)
                .Build();
        }
        else // S3
        {
            var s3Settings = _settings.S3;
            _bucketName = s3Settings.BucketName;

            _minioClient = new MinioClient()
                .WithEndpoint(s3Settings.ServiceUrl)
                .WithCredentials(s3Settings.AccessKey, s3Settings.SecretKey)
                .WithRegion(s3Settings.Region)
                .WithSSL(true)
                .Build();
        }

        // Ensure bucket exists
        EnsureBucketExistsAsync().GetAwaiter().GetResult();
    }

    private async Task EnsureBucketExistsAsync()
    {
        var bucketExistsArgs = new BucketExistsArgs()
            .WithBucket(_bucketName);

        bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs);

        if (!found)
        {
            var makeBucketArgs = new MakeBucketArgs()
                .WithBucket(_bucketName);

            await _minioClient.MakeBucketAsync(makeBucketArgs);
        }
    }

    public async Task<string> UploadFileAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        return await UploadFileAsync(stream, fileName, "recordings", contentType, cancellationToken);
    }

    public async Task<string> UploadFileAsync(Stream stream, string fileName, string folderPath, string contentType, CancellationToken cancellationToken = default)
    {
        var objectName = $"{folderPath}/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}_{fileName}";

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithStreamData(stream)
            .WithObjectSize(stream.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(putObjectArgs, cancellationToken);

        return objectName; // Return the object key/path
    }

    public async Task<Stream> DownloadFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        var objectName = ExtractObjectName(fileUrl);
        var memoryStream = new MemoryStream();

        var getObjectArgs = new GetObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithCallbackStream((stream) =>
            {
                stream.CopyTo(memoryStream);
            });

        await _minioClient.GetObjectAsync(getObjectArgs, cancellationToken);

        memoryStream.Position = 0;
        return memoryStream;
    }

    public async Task DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        var objectName = ExtractObjectName(fileUrl);

        var removeObjectArgs = new RemoveObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName);

        await _minioClient.RemoveObjectAsync(removeObjectArgs, cancellationToken);
    }

    public async Task<string> GetPresignedUrlAsync(string fileUrl, int expiresInSeconds = 3600)
    {
        var objectName = ExtractObjectName(fileUrl);

        var presignedGetObjectArgs = new PresignedGetObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithExpiry(expiresInSeconds);

        return await _minioClient.PresignedGetObjectAsync(presignedGetObjectArgs);
    }

    public async Task<bool> FileExistsAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            var objectName = ExtractObjectName(fileUrl);

            var statObjectArgs = new StatObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName);

            await _minioClient.StatObjectAsync(statObjectArgs, cancellationToken);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<long> GetFileSizeAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        var objectName = ExtractObjectName(fileUrl);

        var statObjectArgs = new StatObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName);

        var stat = await _minioClient.StatObjectAsync(statObjectArgs, cancellationToken);
        return stat.Size;
    }

    public async Task<IEnumerable<string>> ListFilesAsync(string folderPath, CancellationToken cancellationToken = default)
    {
        var files = new List<string>();

        var listObjectsArgs = new ListObjectsArgs()
            .WithBucket(_bucketName)
            .WithPrefix(folderPath)
            .WithRecursive(true);

        var observable = _minioClient.ListObjectsAsync(listObjectsArgs, cancellationToken);

        // Use TaskCompletionSource to convert IObservable to async/await
        var tcs = new TaskCompletionSource<List<string>>();

        observable.Subscribe(
            onNext: item =>
            {
                if (!item.IsDir)
                {
                    files.Add(item.Key);
                }
            },
            onError: ex => tcs.SetException(ex),
            onCompleted: () => tcs.SetResult(files)
        );

        return await tcs.Task;
    }

    private string ExtractObjectName(string fileUrl)
    {
        // If it's already just an object name (key), return it
        if (!fileUrl.Contains("://"))
        {
            return fileUrl;
        }

        // Extract object name from full URL
        var uri = new Uri(fileUrl);
        return uri.AbsolutePath.TrimStart('/');
    }
}
