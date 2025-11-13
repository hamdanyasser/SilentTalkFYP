namespace SilentTalk.Application.Services;

/// <summary>
/// Service for managing file storage (MinIO/S3)
/// </summary>
public interface IStorageService
{
    /// <summary>
    /// Upload a file to storage
    /// </summary>
    /// <param name="stream">File stream</param>
    /// <param name="fileName">File name</param>
    /// <param name="contentType">Content type (e.g., video/webm)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>URL of the uploaded file</returns>
    Task<string> UploadFileAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Upload a file to a specific folder/path
    /// </summary>
    Task<string> UploadFileAsync(Stream stream, string fileName, string folderPath, string contentType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Download a file from storage
    /// </summary>
    /// <param name="fileUrl">File URL or key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>File stream</returns>
    Task<Stream> DownloadFileAsync(string fileUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a file from storage
    /// </summary>
    /// <param name="fileUrl">File URL or key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a presigned URL for temporary access to a file
    /// </summary>
    /// <param name="fileUrl">File URL or key</param>
    /// <param name="expiresInSeconds">Expiration time in seconds (default: 3600)</param>
    /// <returns>Presigned URL</returns>
    Task<string> GetPresignedUrlAsync(string fileUrl, int expiresInSeconds = 3600);

    /// <summary>
    /// Check if a file exists
    /// </summary>
    Task<bool> FileExistsAsync(string fileUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get file size in bytes
    /// </summary>
    Task<long> GetFileSizeAsync(string fileUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// List files in a folder
    /// </summary>
    Task<IEnumerable<string>> ListFilesAsync(string folderPath, CancellationToken cancellationToken = default);
}
