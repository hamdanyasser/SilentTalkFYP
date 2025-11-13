using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SilentTalk.Application.DTOs.Call;
using SilentTalk.Application.Services;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Enums;
using SilentTalk.Domain.Interfaces;
using System.Security.Claims;

namespace SilentTalk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CallController : ControllerBase
{
    private readonly ICallRepository _callRepository;
    private readonly IStorageService _storageService;
    private readonly ILogger<CallController> _logger;

    public CallController(
        ICallRepository callRepository,
        IStorageService storageService,
        ILogger<CallController> logger)
    {
        _callRepository = callRepository;
        _storageService = storageService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new scheduled call
    /// </summary>
    [HttpPost("schedule")]
    public async Task<ActionResult<CallDto>> CreateScheduledCall([FromBody] CreateScheduledCallRequest request)
    {
        var userId = GetCurrentUserId();

        if (request.ScheduledStartTime <= DateTime.UtcNow)
        {
            return BadRequest(new { error = "Scheduled start time must be in the future" });
        }

        var call = new Call
        {
            CallId = Guid.NewGuid(),
            InitiatorId = userId,
            Status = CallStatus.Scheduled,
            IsScheduled = true,
            ScheduledStartTime = request.ScheduledStartTime,
            DurationMinutes = request.DurationMinutes,
            Title = request.Title,
            Description = request.Description,
            InvitedUserIds = string.Join(",", request.InvitedUserIds),
            CreatedAt = DateTime.UtcNow
        };

        await _callRepository.AddAsync(call);
        await _callRepository.SaveChangesAsync();

        _logger.LogInformation("User {UserId} scheduled a call {CallId} for {ScheduledTime}",
            userId, call.CallId, request.ScheduledStartTime);

        return CreatedAtAction(nameof(GetCall), new { id = call.CallId }, MapToDto(call));
    }

    /// <summary>
    /// Get a specific call by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CallDto>> GetCall(Guid id)
    {
        var call = await _callRepository.GetWithDetailsAsync(id);

        if (call == null)
        {
            return NotFound(new { error = "Call not found" });
        }

        return Ok(MapToDto(call));
    }

    /// <summary>
    /// Get upcoming scheduled calls for the current user
    /// </summary>
    [HttpGet("scheduled/upcoming")]
    public async Task<ActionResult<IEnumerable<CallDto>>> GetUpcomingScheduledCalls()
    {
        var userId = GetCurrentUserId();
        var calls = await _callRepository.GetUpcomingScheduledCallsAsync(userId);

        return Ok(calls.Select(MapToDto));
    }

    /// <summary>
    /// Get all scheduled calls for the current user
    /// </summary>
    [HttpGet("scheduled")]
    public async Task<ActionResult<IEnumerable<CallDto>>> GetScheduledCalls()
    {
        var userId = GetCurrentUserId();
        var calls = await _callRepository.GetScheduledCallsAsync(userId);

        return Ok(calls.Select(MapToDto));
    }

    /// <summary>
    /// Get call history with pagination and filters
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<PaginatedCallHistoryResponse>> GetCallHistory([FromQuery] CallHistoryQueryParams queryParams)
    {
        var userId = queryParams.UserId ?? GetCurrentUserId();

        // Only allow users to view their own history (unless admin)
        if (userId != GetCurrentUserId() && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        var (calls, totalCount) = await _callRepository.GetCallHistoryAsync(
            userId,
            queryParams.Status,
            queryParams.StartDate,
            queryParams.EndDate,
            queryParams.ScheduledOnly,
            queryParams.Page,
            queryParams.PageSize);

        var response = new PaginatedCallHistoryResponse
        {
            Calls = calls.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = queryParams.Page,
            PageSize = queryParams.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / queryParams.PageSize)
        };

        return Ok(response);
    }

    /// <summary>
    /// Get call statistics for the current user
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult<CallStatisticsDto>> GetCallStatistics()
    {
        var userId = GetCurrentUserId();
        var stats = await _callRepository.GetCallStatisticsAsync(userId);

        var response = new CallStatisticsDto
        {
            TotalCalls = stats.Total,
            ActiveCalls = stats.Active,
            ScheduledCalls = stats.Scheduled,
            CompletedCalls = stats.Completed,
            CancelledCalls = stats.Cancelled,
            MissedCalls = stats.Missed,
            TotalMinutes = stats.TotalMinutes,
            AverageCallDurationMinutes = stats.AvgDuration
        };

        return Ok(response);
    }

    /// <summary>
    /// Update a scheduled call
    /// </summary>
    [HttpPut("schedule/{id}")]
    public async Task<ActionResult<CallDto>> UpdateScheduledCall(Guid id, [FromBody] UpdateScheduledCallRequest request)
    {
        var userId = GetCurrentUserId();
        var call = await _callRepository.GetByIdAsync(id);

        if (call == null)
        {
            return NotFound(new { error = "Call not found" });
        }

        // Only the initiator can update the scheduled call
        if (call.InitiatorId != userId)
        {
            return Forbid();
        }

        if (call.Status != CallStatus.Scheduled)
        {
            return BadRequest(new { error = "Only scheduled calls can be updated" });
        }

        if (request.ScheduledStartTime.HasValue)
        {
            if (request.ScheduledStartTime.Value <= DateTime.UtcNow)
            {
                return BadRequest(new { error = "Scheduled start time must be in the future" });
            }
            call.ScheduledStartTime = request.ScheduledStartTime.Value;
        }

        if (request.DurationMinutes.HasValue)
            call.DurationMinutes = request.DurationMinutes;

        if (!string.IsNullOrEmpty(request.Title))
            call.Title = request.Title;

        if (request.Description != null)
            call.Description = request.Description;

        if (request.InvitedUserIds != null)
            call.InvitedUserIds = string.Join(",", request.InvitedUserIds);

        call.UpdatedAt = DateTime.UtcNow;

        await _callRepository.UpdateAsync(call);
        await _callRepository.SaveChangesAsync();

        _logger.LogInformation("User {UserId} updated scheduled call {CallId}", userId, id);

        return Ok(MapToDto(call));
    }

    /// <summary>
    /// Cancel a scheduled call
    /// </summary>
    [HttpPost("schedule/{id}/cancel")]
    public async Task<ActionResult> CancelScheduledCall(Guid id)
    {
        var userId = GetCurrentUserId();
        var call = await _callRepository.GetByIdAsync(id);

        if (call == null)
        {
            return NotFound(new { error = "Call not found" });
        }

        // Only the initiator can cancel the scheduled call
        if (call.InitiatorId != userId)
        {
            return Forbid();
        }

        if (call.Status != CallStatus.Scheduled)
        {
            return BadRequest(new { error = "Only scheduled calls can be cancelled" });
        }

        call.Status = CallStatus.Cancelled;
        call.UpdatedAt = DateTime.UtcNow;

        await _callRepository.UpdateAsync(call);
        await _callRepository.SaveChangesAsync();

        _logger.LogInformation("User {UserId} cancelled scheduled call {CallId}", userId, id);

        return Ok(new { message = "Call cancelled successfully" });
    }

    /// <summary>
    /// Start an instant call (not scheduled)
    /// </summary>
    [HttpPost("start")]
    public async Task<ActionResult<CallDto>> StartInstantCall()
    {
        var userId = GetCurrentUserId();

        var call = new Call
        {
            CallId = Guid.NewGuid(),
            InitiatorId = userId,
            StartTime = DateTime.UtcNow,
            Status = CallStatus.Active,
            IsScheduled = false,
            CreatedAt = DateTime.UtcNow
        };

        await _callRepository.AddAsync(call);
        await _callRepository.SaveChangesAsync();

        _logger.LogInformation("User {UserId} started instant call {CallId}", userId, call.CallId);

        return CreatedAtAction(nameof(GetCall), new { id = call.CallId }, MapToDto(call));
    }

    /// <summary>
    /// End an active call
    /// </summary>
    [HttpPost("{id}/end")]
    public async Task<ActionResult> EndCall(Guid id)
    {
        var userId = GetCurrentUserId();
        var call = await _callRepository.GetByIdAsync(id);

        if (call == null)
        {
            return NotFound(new { error = "Call not found" });
        }

        // Only the initiator or a participant can end the call
        if (call.InitiatorId != userId)
        {
            return Forbid();
        }

        if (call.Status != CallStatus.Active)
        {
            return BadRequest(new { error = "Only active calls can be ended" });
        }

        call.Status = CallStatus.Ended;
        call.EndTime = DateTime.UtcNow;
        call.UpdatedAt = DateTime.UtcNow;

        await _callRepository.UpdateAsync(call);
        await _callRepository.SaveChangesAsync();

        _logger.LogInformation("User {UserId} ended call {CallId}", userId, id);

        return Ok(new { message = "Call ended successfully" });
    }

    /// <summary>
    /// Upload a call recording
    /// </summary>
    [HttpPost("{id}/recording")]
    [RequestSizeLimit(500_000_000)] // 500 MB
    public async Task<ActionResult> UploadRecording(Guid id, IFormFile file)
    {
        var userId = GetCurrentUserId();
        var call = await _callRepository.GetByIdAsync(id);

        if (call == null)
        {
            return NotFound(new { error = "Call not found" });
        }

        // Only the initiator or a participant can upload recordings
        if (call.InitiatorId != userId)
        {
            return Forbid();
        }

        // Validate file type
        var allowedTypes = new[] { ".webm", ".mp4", ".mkv" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedTypes.Contains(fileExtension))
        {
            return BadRequest(new { error = $"Invalid file type. Allowed types: {string.Join(", ", allowedTypes)}" });
        }

        // Validate file size (500 MB max)
        if (file.Length > 500_000_000)
        {
            return BadRequest(new { error = "File size exceeds 500 MB limit" });
        }

        try
        {
            using var stream = file.OpenReadStream();
            var recordingUrl = await _storageService.UploadFileAsync(
                stream,
                file.FileName,
                $"recordings/{call.CallId}",
                file.ContentType);

            call.RecordingUrl = recordingUrl;
            call.UpdatedAt = DateTime.UtcNow;

            await _callRepository.UpdateAsync(call);
            await _callRepository.SaveChangesAsync();

            _logger.LogInformation("User {UserId} uploaded recording for call {CallId}", userId, id);

            return Ok(new
            {
                message = "Recording uploaded successfully",
                recordingUrl = recordingUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading recording for call {CallId}", id);
            return StatusCode(500, new { error = "Failed to upload recording" });
        }
    }

    /// <summary>
    /// Get a presigned URL to download a call recording
    /// </summary>
    [HttpGet("{id}/recording")]
    public async Task<ActionResult> GetRecordingUrl(Guid id, [FromQuery] int expiresInSeconds = 3600)
    {
        var userId = GetCurrentUserId();
        var call = await _callRepository.GetWithDetailsAsync(id);

        if (call == null)
        {
            return NotFound(new { error = "Call not found" });
        }

        // Only participants can access the recording
        var isParticipant = call.InitiatorId == userId ||
                           call.Participants.Any(p => p.UserId == userId);

        if (!isParticipant)
        {
            return Forbid();
        }

        if (string.IsNullOrEmpty(call.RecordingUrl))
        {
            return NotFound(new { error = "No recording available for this call" });
        }

        try
        {
            var presignedUrl = await _storageService.GetPresignedUrlAsync(call.RecordingUrl, expiresInSeconds);

            return Ok(new
            {
                recordingUrl = presignedUrl,
                expiresIn = expiresInSeconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating presigned URL for call {CallId}", id);
            return StatusCode(500, new { error = "Failed to generate download URL" });
        }
    }

    /// <summary>
    /// Delete a call recording
    /// </summary>
    [HttpDelete("{id}/recording")]
    public async Task<ActionResult> DeleteRecording(Guid id)
    {
        var userId = GetCurrentUserId();
        var call = await _callRepository.GetByIdAsync(id);

        if (call == null)
        {
            return NotFound(new { error = "Call not found" });
        }

        // Only the initiator can delete recordings
        if (call.InitiatorId != userId)
        {
            return Forbid();
        }

        if (string.IsNullOrEmpty(call.RecordingUrl))
        {
            return NotFound(new { error = "No recording available for this call" });
        }

        try
        {
            await _storageService.DeleteFileAsync(call.RecordingUrl);

            call.RecordingUrl = null;
            call.UpdatedAt = DateTime.UtcNow;

            await _callRepository.UpdateAsync(call);
            await _callRepository.SaveChangesAsync();

            _logger.LogInformation("User {UserId} deleted recording for call {CallId}", userId, id);

            return Ok(new { message = "Recording deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting recording for call {CallId}", id);
            return StatusCode(500, new { error = "Failed to delete recording" });
        }
    }

    // Helper methods

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim ?? throw new UnauthorizedAccessException("User not authenticated"));
    }

    private CallDto MapToDto(Call call)
    {
        var invitedUserIds = string.IsNullOrEmpty(call.InvitedUserIds)
            ? new List<Guid>()
            : call.InvitedUserIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(id => Guid.Parse(id))
                .ToList();

        return new CallDto
        {
            CallId = call.CallId,
            InitiatorId = call.InitiatorId,
            InitiatorName = call.Initiator?.DisplayName ?? call.Initiator?.Email,
            StartTime = call.StartTime,
            EndTime = call.EndTime,
            Status = call.Status,
            RecordingUrl = call.RecordingUrl,
            IsScheduled = call.IsScheduled,
            ScheduledStartTime = call.ScheduledStartTime,
            DurationMinutes = call.DurationMinutes,
            Title = call.Title,
            Description = call.Description,
            InvitedUserIds = invitedUserIds,
            Participants = call.Participants?.Select(p => new ParticipantSummaryDto
            {
                UserId = p.UserId,
                DisplayName = p.User?.DisplayName ?? p.User?.Email ?? "Unknown",
                JoinedAt = p.JoinedAt,
                LeftAt = p.LeftAt
            }).ToList() ?? new List<ParticipantSummaryDto>(),
            CreatedAt = call.CreatedAt
        };
    }
}
