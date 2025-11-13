using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Enums;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for Call entity
/// </summary>
public interface ICallRepository : IRepository<Call>
{
    /// <summary>
    /// Get call with participants
    /// </summary>
    Task<Call?> GetWithParticipantsAsync(Guid callId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get call with initiator and participants
    /// </summary>
    Task<Call?> GetWithDetailsAsync(Guid callId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get calls by user ID
    /// </summary>
    Task<IEnumerable<Call>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get calls by status
    /// </summary>
    Task<IEnumerable<Call>> GetByStatusAsync(CallStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get active calls
    /// </summary>
    Task<IEnumerable<Call>> GetActiveCallsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get calls in date range
    /// </summary>
    Task<IEnumerable<Call>> GetCallsByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get scheduled calls for a user
    /// </summary>
    Task<IEnumerable<Call>> GetScheduledCallsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get upcoming scheduled calls (scheduled for the future)
    /// </summary>
    Task<IEnumerable<Call>> GetUpcomingScheduledCallsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get call history with pagination and filters
    /// </summary>
    Task<(IEnumerable<Call> Calls, int TotalCount)> GetCallHistoryAsync(
        Guid? userId,
        CallStatus? status,
        DateTime? startDate,
        DateTime? endDate,
        bool scheduledOnly,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get call statistics for a user
    /// </summary>
    Task<(int Total, int Active, int Scheduled, int Completed, int Cancelled, int Missed, int TotalMinutes, double AvgDuration)>
        GetCallStatisticsAsync(Guid userId, CancellationToken cancellationToken = default);
}
