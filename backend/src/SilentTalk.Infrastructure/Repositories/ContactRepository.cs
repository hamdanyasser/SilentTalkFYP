using Microsoft.EntityFrameworkCore;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

/// <summary>
/// Contact repository implementation
/// Maps to FR-006: Contact Management
/// </summary>
public class ContactRepository : Repository<Contact>, IContactRepository
{
    public ContactRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Contact>> GetUserContactsAsync(Guid userId, ContactStatus? status = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Where(c => c.UserId == userId)
            .Include(c => c.ContactUser);

        if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Contact?> GetContactRelationshipAsync(Guid userId, Guid contactUserId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ContactUserId == contactUserId, cancellationToken);
    }

    public async Task<bool> IsContactAsync(Guid userId, Guid contactUserId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(c => c.UserId == userId && c.ContactUserId == contactUserId && c.Status == ContactStatus.Accepted, cancellationToken);
    }
}
