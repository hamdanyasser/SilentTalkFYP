using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SilentTalk.Application.DTOs.SignalR;
using SilentTalk.Application.Services;
using System.Security.Claims;

namespace SilentTalk.Api.Hubs;

/// <summary>
/// SignalR hub for WebRTC signaling and call management
/// Handles room management, WebRTC negotiation (offer/answer/ICE), presence, typing, and network quality
/// </summary>
[Authorize]
public class CallHub : Hub
{
    private readonly ICallRoomService _roomService;
    private readonly IIceServerConfigService _iceServerConfig;
    private readonly ILogger<CallHub> _logger;

    public CallHub(
        ICallRoomService roomService,
        IIceServerConfigService iceServerConfig,
        ILogger<CallHub> logger)
    {
        _roomService = roomService;
        _iceServerConfig = iceServerConfig;
        _logger = logger;
    }

    #region Connection Lifecycle

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var connectionId = Context.ConnectionId;

        _logger.LogInformation("User {UserId} connected with connection {ConnectionId}", userId, connectionId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;
        var participant = await _roomService.GetParticipantByConnectionIdAsync(connectionId);

        if (participant != null)
        {
            var callId = await _roomService.GetCallIdByConnectionIdAsync(connectionId);
            if (callId != null)
            {
                _logger.LogInformation("User {UserId} disconnected from call {CallId}", participant.UserId, callId);

                // Notify others in the room
                await Clients.OthersInGroup(callId).SendAsync("UserDisconnected", new
                {
                    UserId = participant.UserId,
                    DisplayName = participant.DisplayName,
                    Reason = exception?.Message ?? "Connection lost"
                });

                // Mark as disconnected but don't remove immediately (reconnection grace period)
                await _roomService.UpdateNetworkQualityAsync(callId, participant.UserId, NetworkQuality.Disconnected);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    #endregion

    #region Room Management

    /// <summary>
    /// Join a call room
    /// </summary>
    [HubMethodName("JoinCall")]
    public async Task<RoomStateDto> JoinCall(JoinCallRequest request)
    {
        var userId = GetUserId();
        var displayName = GetUserDisplayName();
        var connectionId = Context.ConnectionId;

        _logger.LogInformation("User {UserId} joining call {CallId}", userId, request.CallId);

        // Add to SignalR group
        await Groups.AddToGroupAsync(connectionId, request.CallId);

        // Add to room service
        await _roomService.AddParticipantAsync(
            request.CallId,
            userId,
            connectionId,
            displayName,
            request.AudioEnabled,
            request.VideoEnabled);

        // Get current room state
        var roomState = await _roomService.GetRoomStateAsync(request.CallId);

        // Notify others in the room
        await Clients.OthersInGroup(request.CallId).SendAsync("UserJoined", new ParticipantDto
        {
            UserId = userId,
            DisplayName = displayName,
            ConnectionId = connectionId,
            AudioEnabled = request.AudioEnabled,
            VideoEnabled = request.VideoEnabled,
            JoinedAt = DateTime.UtcNow
        });

        _logger.LogInformation("User {UserId} successfully joined call {CallId} with {Count} participants",
            userId, request.CallId, roomState?.Participants.Count ?? 0);

        return roomState ?? new RoomStateDto { CallId = request.CallId };
    }

    /// <summary>
    /// Leave a call room
    /// </summary>
    [HubMethodName("LeaveCall")]
    public async Task LeaveCall(LeaveCallRequest request)
    {
        var userId = GetUserId();
        var connectionId = Context.ConnectionId;

        _logger.LogInformation("User {UserId} leaving call {CallId}", userId, request.CallId);

        // Remove from room service
        await _roomService.RemoveParticipantAsync(request.CallId, userId);

        // Remove from SignalR group
        await Groups.RemoveFromGroupAsync(connectionId, request.CallId);

        // Notify others in the room
        await Clients.OthersInGroup(request.CallId).SendAsync("UserLeft", new
        {
            UserId = userId,
            Reason = request.Reason ?? "User left"
        });

        _logger.LogInformation("User {UserId} successfully left call {CallId}", userId, request.CallId);
    }

    /// <summary>
    /// Get current room state
    /// </summary>
    [HubMethodName("GetRoomState")]
    public async Task<RoomStateDto?> GetRoomState(string callId)
    {
        return await _roomService.GetRoomStateAsync(callId);
    }

    /// <summary>
    /// Reconnect to a call after disconnection
    /// </summary>
    [HubMethodName("ReconnectToCall")]
    public async Task<RoomStateDto> ReconnectToCall(ReconnectRequest request)
    {
        var userId = GetUserId();
        var newConnectionId = Context.ConnectionId;

        _logger.LogInformation("User {UserId} reconnecting to call {CallId} (previous: {PreviousConnectionId}, new: {NewConnectionId})",
            userId, request.CallId, request.PreviousConnectionId, newConnectionId);

        // Add to SignalR group
        await Groups.AddToGroupAsync(newConnectionId, request.CallId);

        // Update connection ID in room service
        await _roomService.UpdateParticipantConnectionIdAsync(request.CallId, userId, newConnectionId);

        // Update network quality back to good
        await _roomService.UpdateNetworkQualityAsync(request.CallId, userId, NetworkQuality.Good);

        // Get current room state
        var roomState = await _roomService.GetRoomStateAsync(request.CallId);

        // Notify others in the room
        await Clients.OthersInGroup(request.CallId).SendAsync("UserReconnected", new
        {
            UserId = userId,
            ConnectionId = newConnectionId
        });

        _logger.LogInformation("User {UserId} successfully reconnected to call {CallId}", userId, request.CallId);

        return roomState ?? new RoomStateDto { CallId = request.CallId };
    }

    #endregion

    #region WebRTC Signaling

    /// <summary>
    /// Send WebRTC offer to another peer
    /// </summary>
    [HubMethodName("SendOffer")]
    public async Task SendOffer(OfferDto offer)
    {
        var fromUserId = GetUserId();
        offer.FromUserId = fromUserId;

        _logger.LogDebug("Forwarding offer from {FromUserId} to {ToUserId} in call {CallId}",
            fromUserId, offer.ToUserId, offer.CallId);

        // Forward offer to specific peer
        var participants = await _roomService.GetParticipantsAsync(offer.CallId);
        var targetParticipant = participants.FirstOrDefault(p => p.UserId == offer.ToUserId);

        if (targetParticipant != null)
        {
            await Clients.Client(targetParticipant.ConnectionId).SendAsync("ReceiveOffer", offer);
        }
        else
        {
            _logger.LogWarning("Target user {ToUserId} not found in call {CallId}", offer.ToUserId, offer.CallId);
        }
    }

    /// <summary>
    /// Send WebRTC answer to another peer
    /// </summary>
    [HubMethodName("SendAnswer")]
    public async Task SendAnswer(AnswerDto answer)
    {
        var fromUserId = GetUserId();
        answer.FromUserId = fromUserId;

        _logger.LogDebug("Forwarding answer from {FromUserId} to {ToUserId} in call {CallId}",
            fromUserId, answer.ToUserId, answer.CallId);

        // Forward answer to specific peer
        var participants = await _roomService.GetParticipantsAsync(answer.CallId);
        var targetParticipant = participants.FirstOrDefault(p => p.UserId == answer.ToUserId);

        if (targetParticipant != null)
        {
            await Clients.Client(targetParticipant.ConnectionId).SendAsync("ReceiveAnswer", answer);
        }
        else
        {
            _logger.LogWarning("Target user {ToUserId} not found in call {CallId}", answer.ToUserId, answer.CallId);
        }
    }

    /// <summary>
    /// Send ICE candidate to another peer
    /// </summary>
    [HubMethodName("SendIceCandidate")]
    public async Task SendIceCandidate(IceCandidateDto candidate)
    {
        var fromUserId = GetUserId();
        candidate.FromUserId = fromUserId;

        _logger.LogDebug("Forwarding ICE candidate from {FromUserId} to {ToUserId} in call {CallId}",
            fromUserId, candidate.ToUserId, candidate.CallId);

        // Forward ICE candidate to specific peer
        var participants = await _roomService.GetParticipantsAsync(candidate.CallId);
        var targetParticipant = participants.FirstOrDefault(p => p.UserId == candidate.ToUserId);

        if (targetParticipant != null)
        {
            await Clients.Client(targetParticipant.ConnectionId).SendAsync("ReceiveIceCandidate", candidate);
        }
    }

    /// <summary>
    /// Get ICE server configuration (STUN/TURN)
    /// </summary>
    [HubMethodName("GetIceConfiguration")]
    public async Task<IceConfigurationDto> GetIceConfiguration()
    {
        var userId = GetUserId();
        return await _iceServerConfig.GetIceConfigurationWithCredentialsAsync(userId);
    }

    #endregion

    #region Media State

    /// <summary>
    /// Update media state (audio/video enabled)
    /// </summary>
    [HubMethodName("UpdateMediaState")]
    public async Task UpdateMediaState(MediaStateDto mediaState)
    {
        var userId = GetUserId();

        await _roomService.UpdateMediaStateAsync(
            mediaState.CallId,
            userId,
            mediaState.AudioEnabled,
            mediaState.VideoEnabled);

        // Notify others in the room
        await Clients.OthersInGroup(mediaState.CallId).SendAsync("MediaStateChanged", new
        {
            UserId = userId,
            AudioEnabled = mediaState.AudioEnabled,
            VideoEnabled = mediaState.VideoEnabled
        });

        _logger.LogDebug("User {UserId} updated media state in call {CallId}: Audio={AudioEnabled}, Video={VideoEnabled}",
            userId, mediaState.CallId, mediaState.AudioEnabled, mediaState.VideoEnabled);
    }

    #endregion

    #region Typing Indicators

    /// <summary>
    /// Send typing indicator
    /// </summary>
    [HubMethodName("SendTyping")]
    public async Task SendTyping(TypingDto typing)
    {
        var userId = GetUserId();
        var displayName = GetUserDisplayName();

        // Notify others in the room
        await Clients.OthersInGroup(typing.CallId).SendAsync("UserTyping", new
        {
            UserId = userId,
            DisplayName = displayName,
            IsTyping = typing.IsTyping
        });
    }

    #endregion

    #region Network Quality

    /// <summary>
    /// Update network quality metrics
    /// </summary>
    [HubMethodName("UpdateNetworkQuality")]
    public async Task UpdateNetworkQuality(NetworkQualityDto quality)
    {
        var userId = GetUserId();

        await _roomService.UpdateNetworkQualityAsync(
            quality.CallId,
            userId,
            quality.Quality,
            quality.Stats);

        // Notify others in the room
        await Clients.OthersInGroup(quality.CallId).SendAsync("NetworkQualityChanged", new
        {
            UserId = userId,
            Quality = quality.Quality,
            Stats = quality.Stats
        });

        if (quality.Quality >= NetworkQuality.Poor)
        {
            _logger.LogWarning("User {UserId} experiencing poor network quality in call {CallId}: {Quality}",
                userId, quality.CallId, quality.Quality);
        }
    }

    #endregion

    #region Helper Methods

    private string GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim ?? throw new HubException("User not authenticated");
    }

    private string GetUserDisplayName()
    {
        var displayNameClaim = Context.User?.FindFirst("display_name")?.Value;
        return displayNameClaim ?? Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
    }

    #endregion
}
