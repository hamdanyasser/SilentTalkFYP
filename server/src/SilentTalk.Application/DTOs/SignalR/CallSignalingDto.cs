namespace SilentTalk.Application.DTOs.SignalR;

/// <summary>
/// DTO for WebRTC offer
/// </summary>
public class OfferDto
{
    public string CallId { get; set; } = string.Empty;
    public string FromUserId { get; set; } = string.Empty;
    public string ToUserId { get; set; } = string.Empty;
    public string Sdp { get; set; } = string.Empty;
    public string Type { get; set; } = "offer";
}

/// <summary>
/// DTO for WebRTC answer
/// </summary>
public class AnswerDto
{
    public string CallId { get; set; } = string.Empty;
    public string FromUserId { get; set; } = string.Empty;
    public string ToUserId { get; set; } = string.Empty;
    public string Sdp { get; set; } = string.Empty;
    public string Type { get; set; } = "answer";
}

/// <summary>
/// DTO for ICE candidate
/// </summary>
public class IceCandidateDto
{
    public string CallId { get; set; } = string.Empty;
    public string FromUserId { get; set; } = string.Empty;
    public string ToUserId { get; set; } = string.Empty;
    public string Candidate { get; set; } = string.Empty;
    public string SdpMid { get; set; } = string.Empty;
    public int? SdpMLineIndex { get; set; }
}

/// <summary>
/// DTO for joining a call room
/// </summary>
public class JoinCallRequest
{
    public string CallId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool AudioEnabled { get; set; } = true;
    public bool VideoEnabled { get; set; } = true;
}

/// <summary>
/// DTO for leaving a call
/// </summary>
public class LeaveCallRequest
{
    public string CallId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? Reason { get; set; }
}

/// <summary>
/// DTO for participant info
/// </summary>
public class ParticipantDto
{
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
    public bool AudioEnabled { get; set; }
    public bool VideoEnabled { get; set; }
    public DateTime JoinedAt { get; set; }
    public NetworkQuality? Quality { get; set; }
}

/// <summary>
/// DTO for media state changes
/// </summary>
public class MediaStateDto
{
    public string CallId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public bool? AudioEnabled { get; set; }
    public bool? VideoEnabled { get; set; }
}

/// <summary>
/// DTO for typing indicator
/// </summary>
public class TypingDto
{
    public string CallId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsTyping { get; set; }
}

/// <summary>
/// DTO for network quality
/// </summary>
public class NetworkQualityDto
{
    public string CallId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public NetworkQuality Quality { get; set; }
    public NetworkStats? Stats { get; set; }
}

/// <summary>
/// Network quality levels
/// </summary>
public enum NetworkQuality
{
    Excellent = 0,
    Good = 1,
    Fair = 2,
    Poor = 3,
    VeryPoor = 4,
    Disconnected = 5
}

/// <summary>
/// Network statistics
/// </summary>
public class NetworkStats
{
    public double? Latency { get; set; }
    public double? PacketLoss { get; set; }
    public double? Jitter { get; set; }
    public long? BytesSent { get; set; }
    public long? BytesReceived { get; set; }
    public double? Bitrate { get; set; }
}

/// <summary>
/// DTO for room state
/// </summary>
public class RoomStateDto
{
    public string CallId { get; set; } = string.Empty;
    public List<ParticipantDto> Participants { get; set; } = new();
    public int MaxParticipants { get; set; } = 10;
    public bool IsLocked { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for ICE server configuration
/// </summary>
public class IceServerDto
{
    public List<string> Urls { get; set; } = new();
    public string? Username { get; set; }
    public string? Credential { get; set; }
}

/// <summary>
/// DTO for complete ICE configuration
/// </summary>
public class IceConfigurationDto
{
    public List<IceServerDto> IceServers { get; set; } = new();
    public string IceTransportPolicy { get; set; } = "all";
}

/// <summary>
/// DTO for call reconnection
/// </summary>
public class ReconnectRequest
{
    public string CallId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string PreviousConnectionId { get; set; } = string.Empty;
}
