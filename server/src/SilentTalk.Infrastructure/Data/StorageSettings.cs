namespace SilentTalk.Infrastructure.Data;

/// <summary>
/// Storage configuration settings for MinIO/S3
/// </summary>
public class StorageSettings
{
    public string Provider { get; set; } = "MinIO"; // MinIO or S3
    public MinIOSettings MinIO { get; set; } = new();
    public S3Settings S3 { get; set; } = new();
    public int MaxFileSizeMB { get; set; } = 500;
    public List<string> AllowedFileTypes { get; set; } = new() { ".webm", ".mp4", ".mkv" };
}

public class MinIOSettings
{
    public string Endpoint { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public bool UseSSL { get; set; }
    public string Region { get; set; } = "us-east-1";
}

public class S3Settings
{
    public string ServiceUrl { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string Region { get; set; } = "us-east-1";
}
