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
    /// Timestamp when the call started
    /// </summary>
    public DateTime StartTime { get; set; }

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

    // Navigation properties

    /// <summary>
    /// User who initiated the call
    /// </summary>
    public User Initiator { get; set; } = null!;

    /// <summary>
    /// Participants in this call
    /// </summary>
    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
}
