using SilentTalk.Domain.Common;
using SilentTalk.Domain.Enums;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// Call entity representing video calls between users
/// </summary>
public class Call : BaseEntity
{
    /// <summary>
    /// Call ID (Primary Key)
    /// </summary>
    public Guid CallId { get; set; }

    /// <summary>
    /// ID of the user who initiated the call (Foreign Key)
    /// </summary>
    public Guid InitiatorId { get; set; }

    /// <summary>
    /// Timestamp when the call started (null for scheduled calls that haven't started)
    /// </summary>
    public DateTime? StartTime { get; set; }

    /// <summary>
    /// Timestamp when the call ended (null if still active)
    /// </summary>
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Current status of the call
    /// </summary>
    public CallStatus Status { get; set; }

    /// <summary>
    /// URL to the call recording (if recorded)
    /// </summary>
    public string? RecordingUrl { get; set; }

    // Scheduling fields

    /// <summary>
    /// Scheduled start time for the call (null for instant calls)
    /// </summary>
    public DateTime? ScheduledStartTime { get; set; }

    /// <summary>
    /// Expected duration in minutes (null if not specified)
    /// </summary>
    public int? DurationMinutes { get; set; }

    /// <summary>
    /// Title/subject of the call (for scheduled calls)
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Description or agenda of the call
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// List of invited user IDs (comma-separated for scheduled calls)
    /// </summary>
    public string? InvitedUserIds { get; set; }

    /// <summary>
    /// True if this is a scheduled call, false for instant calls
    /// </summary>
    public bool IsScheduled { get; set; }

    // Navigation properties

    /// <summary>
    /// User who initiated the call
    /// </summary>
    public ApplicationUser Initiator { get; set; } = null!;

    /// <summary>
    /// Participants in this call
    /// </summary>
    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
}
