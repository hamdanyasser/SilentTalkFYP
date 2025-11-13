using Microsoft.EntityFrameworkCore;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Enums;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

public class CallRepository : Repository<Call>, ICallRepository
{
    public CallRepository(ApplicationDbContext context) : base(context) { }

    public override async Task<Call?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(c => c.CallId == id, cancellationToken);
    }

    public async Task<Call?> GetWithParticipantsAsync(Guid callId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.CallId == callId, cancellationToken);
    }

    public async Task<Call?> GetWithDetailsAsync(Guid callId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Initiator)
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.CallId == callId, cancellationToken);
    }

    public async Task<IEnumerable<Call>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.InitiatorId == userId || c.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(c => c.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Call>> GetByStatusAsync(CallStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.Status == status)
            .OrderByDescending(c => c.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Call>> GetActiveCallsAsync(CancellationToken cancellationToken = default)
    {
        return await GetByStatusAsync(CallStatus.Active, cancellationToken);
    }

    public async Task<IEnumerable<Call>> GetCallsByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.StartTime >= startDate && c.StartTime <= endDate)
            .OrderByDescending(c => c.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Call>> GetScheduledCallsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Initiator)
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .Where(c => c.IsScheduled &&
                       c.Status == CallStatus.Scheduled &&
                       (c.InitiatorId == userId || c.InvitedUserIds!.Contains(userId.ToString())))
            .OrderBy(c => c.ScheduledStartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Call>> GetUpcomingScheduledCallsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await _dbSet
            .Include(c => c.Initiator)
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .Where(c => c.IsScheduled &&
                       c.Status == CallStatus.Scheduled &&
                       c.ScheduledStartTime >= now &&
                       (c.InitiatorId == userId || c.InvitedUserIds!.Contains(userId.ToString())))
            .OrderBy(c => c.ScheduledStartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IEnumerable<Call> Calls, int TotalCount)> GetCallHistoryAsync(
        Guid? userId,
        CallStatus? status,
        DateTime? startDate,
        DateTime? endDate,
        bool scheduledOnly,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(c => c.Initiator)
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .AsQueryable();

        // Filter by user
        if (userId.HasValue)
        {
            query = query.Where(c => c.InitiatorId == userId.Value ||
                                    c.Participants.Any(p => p.UserId == userId.Value));
        }

        // Filter by status
        if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        // Filter by date range
        if (startDate.HasValue)
        {
            query = query.Where(c => c.StartTime >= startDate.Value || c.ScheduledStartTime >= startDate.Value);
        }
        if (endDate.HasValue)
        {
            query = query.Where(c => c.StartTime <= endDate.Value || c.ScheduledStartTime <= endDate.Value);
        }

        // Filter scheduled only
        if (scheduledOnly)
        {
            query = query.Where(c => c.IsScheduled);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and ordering
        var calls = await query
            .OrderByDescending(c => c.ScheduledStartTime ?? c.StartTime ?? c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (calls, totalCount);
    }

    public async Task<(int Total, int Active, int Scheduled, int Completed, int Cancelled, int Missed, int TotalMinutes, double AvgDuration)>
        GetCallStatisticsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var calls = await _dbSet
            .Where(c => c.InitiatorId == userId || c.Participants.Any(p => p.UserId == userId))
            .ToListAsync(cancellationToken);

        var total = calls.Count;
        var active = calls.Count(c => c.Status == CallStatus.Active);
        var scheduled = calls.Count(c => c.Status == CallStatus.Scheduled);
        var completed = calls.Count(c => c.Status == CallStatus.Ended);
        var cancelled = calls.Count(c => c.Status == CallStatus.Cancelled);
        var missed = calls.Count(c => c.Status == CallStatus.Missed);

        var completedCalls = calls.Where(c => c.StartTime.HasValue && c.EndTime.HasValue);
        var totalMinutes = (int)completedCalls.Sum(c => (c.EndTime!.Value - c.StartTime!.Value).TotalMinutes);
        var avgDuration = completedCalls.Any()
            ? completedCalls.Average(c => (c.EndTime!.Value - c.StartTime!.Value).TotalMinutes)
            : 0;

        return (total, active, scheduled, completed, cancelled, missed, totalMinutes, avgDuration);
    }
}
