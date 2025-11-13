namespace SilentTalk.Domain.Entities;

/// <summary>
/// Resource entity for educational content library
/// Maps to FR-008: Resource Library
/// </summary>
public class Resource : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ResourceType Type { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? SignLanguage { get; set; } // ASL, BSL, etc.
    public int Duration { get; set; } // Duration in seconds for videos
    public decimal AverageRating { get; set; }
    public int RatingCount { get; set; }
    public int ViewCount { get; set; }
    public Guid UploadedBy { get; set; }

    // Navigation properties
    public virtual User Uploader { get; set; } = null!;
}

public enum ResourceType
{
    Video,
    PDF,
    Image,
    Article,
    Tutorial
}
