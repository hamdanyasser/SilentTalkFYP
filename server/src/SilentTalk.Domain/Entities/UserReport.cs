using SilentTalk.Domain.Common;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// User report for content moderation
/// </summary>
public class UserReport : BaseEntity
{
    public Guid ReportId { get; set; }

    /// <summary>
    /// User who submitted the report
    /// </summary>
    public Guid ReporterId { get; set; }

    /// <summary>
    /// User being reported
    /// </summary>
    public Guid ReportedUserId { get; set; }

    /// <summary>
    /// Type of content being reported
    /// </summary>
    public ReportContentType ContentType { get; set; }

    /// <summary>
    /// ID of the content being reported (CallId, MessageId, etc.)
    /// </summary>
    public string? ContentId { get; set; }

    /// <summary>
    /// Reason for the report
    /// </summary>
    public ReportReason Reason { get; set; }

    /// <summary>
    /// Additional details provided by reporter
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// Current status of the report
    /// </summary>
    public ReportStatus Status { get; set; } = ReportStatus.Pending;

    /// <summary>
    /// Admin who reviewed the report
    /// </summary>
    public Guid? ReviewedByUserId { get; set; }

    /// <summary>
    /// When the report was reviewed
    /// </summary>
    public DateTime? ReviewedAt { get; set; }

    /// <summary>
    /// Admin's decision/notes
    /// </summary>
    public string? ReviewNotes { get; set; }

    /// <summary>
    /// Action taken (if any)
    /// </summary>
    public ModerationAction? ActionTaken { get; set; }

    // Navigation properties
    public ApplicationUser? Reporter { get; set; }
    public ApplicationUser? ReportedUser { get; set; }
    public ApplicationUser? ReviewedByUser { get; set; }
}

/// <summary>
/// Type of content being reported
/// </summary>
public enum ReportContentType
{
    User = 0,
    Message = 1,
    Call = 2,
    Profile = 3
}

/// <summary>
/// Reason for reporting
/// </summary>
public enum ReportReason
{
    Spam = 0,
    Harassment = 1,
    InappropriateContent = 2,
    Impersonation = 3,
    Violence = 4,
    HateSpeech = 5,
    Other = 99
}

/// <summary>
/// Status of the report
/// </summary>
public enum ReportStatus
{
    Pending = 0,
    UnderReview = 1,
    Resolved = 2,
    Dismissed = 3
}

/// <summary>
/// Moderation action taken
/// </summary>
public enum ModerationAction
{
    None = 0,
    Warning = 1,
    ContentRemoved = 2,
    UserSuspended = 3,
    UserBanned = 4
}
