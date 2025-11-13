using System.ComponentModel.DataAnnotations;

namespace SilentTalk.Shared.DTOs.Calls;

/// <summary>
/// DTO for creating a new video call
/// Maps to FR-003.1: Video call initiation
/// </summary>
public class CreateCallRequest
{
    [Required]
    public List<Guid> ParticipantIds { get; set; } = new();

    public bool EnableRecording { get; set; }
}
