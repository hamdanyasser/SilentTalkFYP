using Microsoft.EntityFrameworkCore;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

public class ParticipantRepository : Repository<Participant>, IParticipantRepository
{
    public ParticipantRepository(ApplicationDbContext context) : base(context) { }

    public override async Task<Participant?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(p => p.ParticipantId == id, cancellationToken);
    }

    public async Task<IEnumerable<Participant>> GetByCallIdAsync(Guid callId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.CallId == callId)
            .Include(p => p.User)
            .OrderBy(p => p.JoinedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Participant?> GetWithUserAsync(Guid participantId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.ParticipantId == participantId, cancellationToken);
    }

    public async Task<IEnumerable<Participant>> GetActiveParticipantsAsync(Guid callId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.CallId == callId && p.LeftAt == null)
            .Include(p => p.User)
            .ToListAsync(cancellationToken);
    }

    public async Task<Participant?> GetByCallAndUserAsync(Guid callId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(p => p.CallId == callId && p.UserId == userId, cancellationToken);
    }
}
