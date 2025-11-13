using Microsoft.EntityFrameworkCore;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Enums;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

public class ContactRepository : Repository<Contact>, IContactRepository
{
    public ContactRepository(ApplicationDbContext context) : base(context) { }

    public override async Task<Contact?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(c => c.ContactId == id, cancellationToken);
    }

    public async Task<IEnumerable<Contact>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.UserId == userId)
            .Include(c => c.ContactUser)
            .OrderByDescending(c => c.AddedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Contact>> GetByStatusAsync(Guid userId, ContactStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.UserId == userId && c.Status == status)
            .Include(c => c.ContactUser)
            .OrderByDescending(c => c.AddedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Contact?> GetWithUsersAsync(Guid contactId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.User)
            .Include(c => c.ContactUser)
            .FirstOrDefaultAsync(c => c.ContactId == contactId, cancellationToken);
    }

    public async Task<bool> ContactExistsAsync(Guid userId, Guid contactUserId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(c => c.UserId == userId && c.ContactUserId == contactUserId, cancellationToken);
    }

    public async Task<Contact?> GetContactBetweenUsersAsync(Guid userId, Guid contactUserId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ContactUserId == contactUserId, cancellationToken);
    }
}
