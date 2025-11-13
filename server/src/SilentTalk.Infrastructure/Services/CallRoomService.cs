using System.Collections.Concurrent;
using SilentTalk.Application.DTOs.SignalR;
using SilentTalk.Application.Services;

namespace SilentTalk.Infrastructure.Services;

/// <summary>
/// In-memory implementation of call room service
/// For production, consider using Redis for distributed scenarios
/// </summary>
public class CallRoomService : ICallRoomService
{
    // CallId -> List of Participants
    private readonly ConcurrentDictionary<string, List<ParticipantDto>> _rooms = new();

    // ConnectionId -> (CallId, UserId)
    private readonly ConcurrentDictionary<string, (string CallId, string UserId)> _connections = new();

    public Task AddParticipantAsync(string callId, string userId, string connectionId, string displayName, bool audioEnabled, bool videoEnabled)
    {
        var participant = new ParticipantDto
        {
            UserId = userId,
            DisplayName = displayName,
            ConnectionId = connectionId,
            AudioEnabled = audioEnabled,
            VideoEnabled = videoEnabled,
            JoinedAt = DateTime.UtcNow,
            Quality = NetworkQuality.Good
        };

        _rooms.AddOrUpdate(callId,
            new List<ParticipantDto> { participant },
            (key, existing) =>
            {
                // Remove any existing participant with same userId (reconnection case)
                existing.RemoveAll(p => p.UserId == userId);
                existing.Add(participant);
                return existing;
            });

        _connections[connectionId] = (callId, userId);

        return Task.CompletedTask;
    }

    public Task RemoveParticipantAsync(string callId, string userId)
    {
        if (_rooms.TryGetValue(callId, out var participants))
        {
            var participant = participants.FirstOrDefault(p => p.UserId == userId);
            if (participant != null)
            {
                participants.Remove(participant);
                _connections.TryRemove(participant.ConnectionId, out _);

                // Clean up empty rooms
                if (participants.Count == 0)
                {
                    _rooms.TryRemove(callId, out _);
                }
            }
        }

        return Task.CompletedTask;
    }

    public Task<List<ParticipantDto>> GetParticipantsAsync(string callId)
    {
        if (_rooms.TryGetValue(callId, out var participants))
        {
            return Task.FromResult(new List<ParticipantDto>(participants));
        }

        return Task.FromResult(new List<ParticipantDto>());
    }

    public async Task<RoomStateDto?> GetRoomStateAsync(string callId)
    {
        var participants = await GetParticipantsAsync(callId);

        if (participants.Count == 0)
            return null;

        return new RoomStateDto
        {
            CallId = callId,
            Participants = participants,
            MaxParticipants = 10,
            IsLocked = false,
            CreatedAt = participants.Min(p => p.JoinedAt)
        };
    }

    public Task UpdateMediaStateAsync(string callId, string userId, bool? audioEnabled, bool? videoEnabled)
    {
        if (_rooms.TryGetValue(callId, out var participants))
        {
            var participant = participants.FirstOrDefault(p => p.UserId == userId);
            if (participant != null)
            {
                if (audioEnabled.HasValue)
                    participant.AudioEnabled = audioEnabled.Value;

                if (videoEnabled.HasValue)
                    participant.VideoEnabled = videoEnabled.Value;
            }
        }

        return Task.CompletedTask;
    }

    public Task UpdateNetworkQualityAsync(string callId, string userId, NetworkQuality quality, NetworkStats? stats = null)
    {
        if (_rooms.TryGetValue(callId, out var participants))
        {
            var participant = participants.FirstOrDefault(p => p.UserId == userId);
            if (participant != null)
            {
                participant.Quality = quality;
            }
        }

        return Task.CompletedTask;
    }

    public Task<ParticipantDto?> GetParticipantByConnectionIdAsync(string connectionId)
    {
        if (_connections.TryGetValue(connectionId, out var info))
        {
            var (callId, userId) = info;
            if (_rooms.TryGetValue(callId, out var participants))
            {
                var participant = participants.FirstOrDefault(p => p.UserId == userId);
                return Task.FromResult(participant);
            }
        }

        return Task.FromResult<ParticipantDto?>(null);
    }

    public Task UpdateParticipantConnectionIdAsync(string callId, string userId, string newConnectionId)
    {
        if (_rooms.TryGetValue(callId, out var participants))
        {
            var participant = participants.FirstOrDefault(p => p.UserId == userId);
            if (participant != null)
            {
                // Remove old connection mapping
                _connections.TryRemove(participant.ConnectionId, out _);

                // Update connection ID
                participant.ConnectionId = newConnectionId;

                // Add new connection mapping
                _connections[newConnectionId] = (callId, userId);
            }
        }

        return Task.CompletedTask;
    }

    public Task<bool> IsUserInCallAsync(string callId, string userId)
    {
        if (_rooms.TryGetValue(callId, out var participants))
        {
            return Task.FromResult(participants.Any(p => p.UserId == userId));
        }

        return Task.FromResult(false);
    }

    public Task<string?> GetCallIdByConnectionIdAsync(string connectionId)
    {
        if (_connections.TryGetValue(connectionId, out var info))
        {
            return Task.FromResult<string?>(info.CallId);
        }

        return Task.FromResult<string?>(null);
    }

    public Task CleanupStaleConnectionsAsync(TimeSpan threshold)
    {
        var cutoffTime = DateTime.UtcNow - threshold;
        var roomsToCleanup = new List<string>();

        foreach (var room in _rooms)
        {
            var staleParticipants = room.Value
                .Where(p => p.JoinedAt < cutoffTime && p.Quality == NetworkQuality.Disconnected)
                .ToList();

            foreach (var participant in staleParticipants)
            {
                room.Value.Remove(participant);
                _connections.TryRemove(participant.ConnectionId, out _);
            }

            if (room.Value.Count == 0)
            {
                roomsToCleanup.Add(room.Key);
            }
        }

        foreach (var callId in roomsToCleanup)
        {
            _rooms.TryRemove(callId, out _);
        }

        return Task.CompletedTask;
    }
}
