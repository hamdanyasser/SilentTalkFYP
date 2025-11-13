namespace SilentTalk.Domain.Entities;

/// <summary>
/// Participant entity for tracking users in video calls
/// Maps to FR-003: Video Conferencing
/// </summary>
public class Participant : BaseEntity
{
    public Guid CallId { get; set; }
    public Guid UserId { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    public bool IsMuted { get; set; }
    public bool IsVideoOn { get; set; }
    public string? PeerId { get; set; } // WebRTC peer ID

    // Navigation properties
    public virtual Call Call { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
