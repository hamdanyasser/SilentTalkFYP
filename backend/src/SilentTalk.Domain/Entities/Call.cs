namespace SilentTalk.Domain.Entities;

/// <summary>
/// Call entity for video conferencing sessions
/// Maps to FR-003: Video Conferencing
/// </summary>
public class Call : BaseEntity
{
    public Guid InitiatorId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public CallStatus Status { get; set; }
    public string? RecordingUrl { get; set; }
    public bool IsRecording { get; set; }
    public string? SessionId { get; set; } // For SignalR session tracking

    // Navigation properties
    public virtual User Initiator { get; set; } = null!;
    public virtual ICollection<Participant> Participants { get; set; } = new List<Participant>();
}

public enum CallStatus
{
    Scheduled,
    Active,
    Ended,
    Cancelled
}
