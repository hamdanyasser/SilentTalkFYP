using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SilentTalk.Application.DTOs.SignalR;
using SilentTalk.Application.Repositories;
using SilentTalk.Application.Services;
using SilentTalk.Domain.Entities;
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
    private readonly IChatMessageRepository _chatMessageRepository;
    private readonly ILogger<CallHub> _logger;

    public CallHub(
        ICallRoomService roomService,
        IIceServerConfigService iceServerConfig,
        IChatMessageRepository chatMessageRepository,
        ILogger<CallHub> logger)
    {
        _roomService = roomService;
        _iceServerConfig = iceServerConfig;
        _chatMessageRepository = chatMessageRepository;
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

    #region Chat

    /// <summary>
    /// Send chat message to all participants
    /// </summary>
    [HubMethodName("SendChatMessage")]
    public async Task SendChatMessage(SendChatMessageRequest request)
    {
        var userId = GetUserId();
        var displayName = GetUserDisplayName();
        var messageId = Guid.NewGuid().ToString();

        // Persist message to MongoDB
        var chatMessage = new ChatMessage
        {
            MessageId = messageId,
            CallId = request.CallId,
            SenderId = userId,
            SenderName = displayName,
            Content = request.Content,
            Type = request.Type,
            Timestamp = DateTime.UtcNow,
            ReplyToId = request.ReplyToId
        };

        await _chatMessageRepository.AddAsync(chatMessage);

        // Broadcast DTO to all participants in the call
        var messageDto = new ChatMessageDto
        {
            MessageId = messageId,
            CallId = request.CallId,
            SenderId = userId,
            SenderName = displayName,
            Content = request.Content,
            Type = request.Type,
            Timestamp = chatMessage.Timestamp,
            ReplyToId = request.ReplyToId
        };

        await Clients.Group(request.CallId).SendAsync("ReceiveChatMessage", messageDto);

        _logger.LogDebug("User {UserId} sent chat message to call {CallId}", userId, request.CallId);
    }

    /// <summary>
    /// Get chat message history for a call
    /// </summary>
    [HubMethodName("GetChatHistory")]
    public async Task<IEnumerable<ChatMessageDto>> GetChatHistory(string callId, int skip = 0, int limit = 100)
    {
        var messages = await _chatMessageRepository.GetByCallIdAsync(callId, skip, limit);

        return messages.Select(m => new ChatMessageDto
        {
            MessageId = m.MessageId,
            CallId = m.CallId,
            SenderId = m.SenderId,
            SenderName = m.SenderName,
            Content = m.Content,
            Type = m.Type,
            Timestamp = m.Timestamp,
            ReplyToId = m.ReplyToId
        });
    }

    #endregion

    #region Screenshare

    /// <summary>
    /// Start screenshare
    /// </summary>
    [HubMethodName("StartScreenshare")]
    public async Task StartScreenshare(string callId)
    {
        var userId = GetUserId();
        var displayName = GetUserDisplayName();

        _logger.LogInformation("User {UserId} started screenshare in call {CallId}", userId, callId);

        // Notify all participants
        await Clients.Group(callId).SendAsync("ScreenshareStarted", new
        {
            CallId = callId,
            UserId = userId,
            DisplayName = displayName
        });
    }

    /// <summary>
    /// Stop screenshare
    /// </summary>
    [HubMethodName("StopScreenshare")]
    public async Task StopScreenshare(string callId)
    {
        var userId = GetUserId();

        _logger.LogInformation("User {UserId} stopped screenshare in call {CallId}", userId, callId);

        // Notify all participants
        await Clients.Group(callId).SendAsync("ScreenshareStopped", new
        {
            CallId = callId,
            UserId = userId
        });
    }

    #endregion

    #region Recording

    /// <summary>
    /// Start call recording
    /// </summary>
    [HubMethodName("StartRecording")]
    public async Task<string> StartRecording(StartRecordingRequest request)
    {
        var userId = GetUserId();
        var displayName = GetUserDisplayName();
        var recordingId = Guid.NewGuid().ToString();

        _logger.LogInformation("User {UserId} started recording for call {CallId}", userId, request.CallId);

        var recording = new RecordingStateDto
        {
            CallId = request.CallId,
            RecordingId = recordingId,
            IsRecording = true,
            InitiatedBy = userId,
            StartedAt = DateTime.UtcNow
        };

        // Notify all participants about recording
        await Clients.Group(request.CallId).SendAsync("RecordingStarted", new
        {
            RecordingId = recordingId,
            CallId = request.CallId,
            InitiatedBy = userId,
            InitiatorName = displayName,
            RequireConsent = request.RequireConsent,
            StartedAt = DateTime.UtcNow
        });

        return recordingId;
    }

    /// <summary>
    /// Stop call recording
    /// </summary>
    [HubMethodName("StopRecording")]
    public async Task StopRecording(StopRecordingRequest request)
    {
        var userId = GetUserId();

        _logger.LogInformation("User {UserId} stopped recording {RecordingId} for call {CallId}",
            userId, request.RecordingId, request.CallId);

        // Notify all participants
        await Clients.Group(request.CallId).SendAsync("RecordingStopped", new
        {
            RecordingId = request.RecordingId,
            CallId = request.CallId,
            StoppedBy = userId,
            StoppedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Submit recording consent
    /// </summary>
    [HubMethodName("SubmitRecordingConsent")]
    public async Task SubmitRecordingConsent(RecordingConsentDto consent)
    {
        var userId = GetUserId();
        var displayName = GetUserDisplayName();
        consent.UserId = userId;

        _logger.LogInformation("User {UserId} {Consent} to recording {RecordingId}",
            userId, consent.Consent ? "consented" : "declined", consent.RecordingId);

        // Notify all participants about consent status
        await Clients.Group(consent.CallId).SendAsync("RecordingConsentReceived", new
        {
            RecordingId = consent.RecordingId,
            CallId = consent.CallId,
            UserId = userId,
            DisplayName = displayName,
            Consent = consent.Consent
        });
    }

    #endregion

    #region Call Quality

    /// <summary>
    /// Submit call quality report
    /// </summary>
    [HubMethodName("SubmitCallQualityReport")]
    public async Task SubmitCallQualityReport(CallQualityReport report)
    {
        var userId = GetUserId();
        report.UserId = userId;
        report.Timestamp = DateTime.UtcNow;

        _logger.LogDebug("Received quality report from {UserId}: {Width}x{Height} @ {Fps}fps, {VideoBitrate}kbps video, {AudioBitrate}kbps audio, {PacketLoss}% loss, {RTT}ms RTT",
            userId, report.VideoResolutionWidth, report.VideoResolutionHeight, report.VideoFrameRate,
            report.VideoBitrate, report.AudioBitrate, report.PacketLossRate * 100, report.RoundTripTime);

        // Store or process quality metrics (could be saved to database/analytics)
        // For now, just log it
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
