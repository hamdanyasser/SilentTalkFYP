using SilentTalk.Application.DTOs.SignalR;

namespace SilentTalk.Application.Services;

/// <summary>
/// Service for managing call rooms and participant tracking
/// </summary>
public interface ICallRoomService
{
    /// <summary>
    /// Add participant to a call room
    /// </summary>
    Task AddParticipantAsync(string callId, string userId, string connectionId, string displayName, bool audioEnabled, bool videoEnabled);

    /// <summary>
    /// Remove participant from a call room
    /// </summary>
    Task RemoveParticipantAsync(string callId, string userId);

    /// <summary>
    /// Get all participants in a call room
    /// </summary>
    Task<List<ParticipantDto>> GetParticipantsAsync(string callId);

    /// <summary>
    /// Get room state
    /// </summary>
    Task<RoomStateDto?> GetRoomStateAsync(string callId);

    /// <summary>
    /// Update participant media state
    /// </summary>
    Task UpdateMediaStateAsync(string callId, string userId, bool? audioEnabled, bool? videoEnabled);

    /// <summary>
    /// Update participant network quality
    /// </summary>
    Task UpdateNetworkQualityAsync(string callId, string userId, NetworkQuality quality, NetworkStats? stats = null);

    /// <summary>
    /// Get participant by connection ID
    /// </summary>
    Task<ParticipantDto?> GetParticipantByConnectionIdAsync(string connectionId);

    /// <summary>
    /// Update participant connection ID (for reconnection)
    /// </summary>
    Task UpdateParticipantConnectionIdAsync(string callId, string userId, string newConnectionId);

    /// <summary>
    /// Check if user is in call
    /// </summary>
    Task<bool> IsUserInCallAsync(string callId, string userId);

    /// <summary>
    /// Get call ID by connection ID
    /// </summary>
    Task<string?> GetCallIdByConnectionIdAsync(string connectionId);

    /// <summary>
    /// Clean up stale connections (older than threshold)
    /// </summary>
    Task CleanupStaleConnectionsAsync(TimeSpan threshold);
}
