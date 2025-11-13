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
}
