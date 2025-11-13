namespace SilentTalk.Shared.DTOs.Calls;

/// <summary>
/// DTO for call information
/// Maps to FR-003: Video Conferencing
/// </summary>
public class CallDto
{
    public Guid CallId { get; set; }
    public Guid InitiatorId { get; set; }
    public string InitiatorName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsRecording { get; set; }
    public string? SessionId { get; set; }
    public List<ParticipantDto> Participants { get; set; } = new();
}

public class ParticipantDto
{
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    public bool IsMuted { get; set; }
    public bool IsVideoOn { get; set; }
    public string? PeerId { get; set; }
}
