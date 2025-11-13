namespace SilentTalk.Domain.Entities;

/// <summary>
/// Forum post entity for community discussions
/// Maps to FR-007: Community Forum
/// </summary>
public class ForumPost : BaseEntity
{
    public Guid AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid? ParentPostId { get; set; } // For replies/threading
    public string? Category { get; set; }
    public int UpvoteCount { get; set; }
    public int DownvoteCount { get; set; }
    public bool IsEdited { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsPinned { get; set; }

    // Navigation properties
    public virtual User Author { get; set; } = null!;
    public virtual ForumPost? ParentPost { get; set; }
    public virtual ICollection<ForumPost> Replies { get; set; } = new List<ForumPost>();
}
