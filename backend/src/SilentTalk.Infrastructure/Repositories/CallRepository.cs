using Microsoft.EntityFrameworkCore;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

/// <summary>
/// Call repository implementation
/// Maps to FR-003: Video Conferencing
/// </summary>
public class CallRepository : Repository<Call>, ICallRepository
{
    public CallRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Call?> GetByIdWithParticipantsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Initiator)
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Call>> GetActiveCallsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.Status == CallStatus.Active)
            .Include(c => c.Participants)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Call>> GetCallHistoryByUserAsync(Guid userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.InitiatorId == userId || c.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(c => c.StartTime)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task EndCallAsync(Guid callId, CancellationToken cancellationToken = default)
    {
        var call = await GetByIdAsync(callId, cancellationToken);
        if (call != null && call.Status == CallStatus.Active)
        {
            call.Status = CallStatus.Ended;
            call.EndTime = DateTime.UtcNow;
        }
    }
}
