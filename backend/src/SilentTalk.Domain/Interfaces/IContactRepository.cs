using SilentTalk.Domain.Entities;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for Contact-specific operations
/// Maps to FR-006: Contact Management
/// </summary>
public interface IContactRepository : IRepository<Contact>
{
    Task<IEnumerable<Contact>> GetUserContactsAsync(Guid userId, ContactStatus? status = null, CancellationToken cancellationToken = default);
    Task<Contact?> GetContactRelationshipAsync(Guid userId, Guid contactUserId, CancellationToken cancellationToken = default);
    Task<bool> IsContactAsync(Guid userId, Guid contactUserId, CancellationToken cancellationToken = default);
}
