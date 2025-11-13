using SilentTalk.Domain.Enums;

namespace SilentTalk.Application.DTOs.Call;

/// <summary>
/// DTO for creating a scheduled call
/// </summary>
public class CreateScheduledCallRequest
{
    public DateTime ScheduledStartTime { get; set; }
    public int? DurationMinutes { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<Guid> InvitedUserIds { get; set; } = new();
}

/// <summary>
/// DTO for updating a scheduled call
/// </summary>
public class UpdateScheduledCallRequest
{
    public Guid CallId { get; set; }
    public DateTime? ScheduledStartTime { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public List<Guid>? InvitedUserIds { get; set; }
}

/// <summary>
/// DTO for call response
/// </summary>
public class CallDto
{
    public Guid CallId { get; set; }
    public Guid InitiatorId { get; set; }
    public string? InitiatorName { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public CallStatus Status { get; set; }
    public string? RecordingUrl { get; set; }
    public bool IsScheduled { get; set; }
    public DateTime? ScheduledStartTime { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public List<Guid> InvitedUserIds { get; set; } = new();
    public List<ParticipantSummaryDto> Participants { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for participant summary
/// </summary>
public class ParticipantSummaryDto
{
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
}

/// <summary>
/// DTO for call history query parameters
/// </summary>
public class CallHistoryQueryParams
{
    public Guid? UserId { get; set; }
    public CallStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool ScheduledOnly { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// DTO for paginated call history response
/// </summary>
public class PaginatedCallHistoryResponse
{
    public List<CallDto> Calls { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

/// <summary>
/// DTO for call statistics
/// </summary>
public class CallStatisticsDto
{
    public int TotalCalls { get; set; }
    public int ActiveCalls { get; set; }
    public int ScheduledCalls { get; set; }
    public int CompletedCalls { get; set; }
    public int CancelledCalls { get; set; }
    public int MissedCalls { get; set; }
    public int TotalMinutes { get; set; }
    public double AverageCallDurationMinutes { get; set; }
}
