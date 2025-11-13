namespace SilentTalk.Application.DTOs.SignalR;

/// <summary>
/// DTO for chat message
/// </summary>
public class ChatMessageDto
{
    public string MessageId { get; set; } = Guid.NewGuid().ToString();
    public string CallId { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "text"; // text, sign, system
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? ReplyToId { get; set; }
}

/// <summary>
/// DTO for sending chat message
/// </summary>
public class SendChatMessageRequest
{
    public string CallId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public string? ReplyToId { get; set; }
}

/// <summary>
/// DTO for screenshare state
/// </summary>
public class ScreenshareDto
{
    public string CallId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public bool IsSharing { get; set; }
}

/// <summary>
/// DTO for recording state
/// </summary>
public class RecordingStateDto
{
    public string CallId { get; set; } = string.Empty;
    public string RecordingId { get; set; } = string.Empty;
    public bool IsRecording { get; set; }
    public string InitiatedBy { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
}

/// <summary>
/// DTO for recording consent
/// </summary>
public class RecordingConsentDto
{
    public string CallId { get; set; } = string.Empty;
    public string RecordingId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public bool Consent { get; set; }
}

/// <summary>
/// DTO for start recording request
/// </summary>
public class StartRecordingRequest
{
    public string CallId { get; set; } = string.Empty;
    public bool RequireConsent { get; set; } = true;
}

/// <summary>
/// DTO for stop recording request
/// </summary>
public class StopRecordingRequest
{
    public string CallId { get; set; } = string.Empty;
    public string RecordingId { get; set; } = string.Empty;
}

/// <summary>
/// DTO for recording metadata
/// </summary>
public class RecordingMetadata
{
    public string RecordingId { get; set; } = string.Empty;
    public string CallId { get; set; } = string.Empty;
    public string InitiatedBy { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public long? FileSizeBytes { get; set; }
    public int? DurationSeconds { get; set; }
    public List<string> Participants { get; set; } = new();
    public Dictionary<string, bool> Consents { get; set; } = new();
    public string? StorageUrl { get; set; }
}

/// <summary>
/// DTO for call quality report
/// </summary>
public class CallQualityReport
{
    public string CallId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public int VideoResolutionWidth { get; set; }
    public int VideoResolutionHeight { get; set; }
    public int VideoFrameRate { get; set; }
    public int VideoBitrate { get; set; }
    public int AudioBitrate { get; set; }
    public double PacketLossRate { get; set; }
    public double Jitter { get; set; }
    public double RoundTripTime { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
