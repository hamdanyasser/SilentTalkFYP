using SilentTalk.Domain.Common;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// Participant entity representing users participating in calls
/// </summary>
public class Participant : BaseEntity
{
    /// <summary>
    /// Participant ID (Primary Key)
    /// </summary>
    public Guid ParticipantId { get; set; }

    /// <summary>
    /// ID of the call (Foreign Key)
    /// </summary>
    public Guid CallId { get; set; }

    /// <summary>
    /// ID of the participating user (Foreign Key)
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Timestamp when the user joined the call
    /// </summary>
    public DateTime JoinedAt { get; set; }

    /// <summary>
    /// Timestamp when the user left the call (null if still in call)
    /// </summary>
    public DateTime? LeftAt { get; set; }

    // Navigation properties

    /// <summary>
    /// The call that this participant is part of
    /// </summary>
    public Call Call { get; set; } = null!;

    /// <summary>
    /// The user who is participating
    /// </summary>
    public ApplicationUser User { get; set; } = null!;
}
