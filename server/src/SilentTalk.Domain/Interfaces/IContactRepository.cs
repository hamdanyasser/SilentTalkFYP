using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Enums;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for Contact entity
/// </summary>
public interface IContactRepository : IRepository<Contact>
{
    /// <summary>
    /// Get contacts for a user
    /// </summary>
    Task<IEnumerable<Contact>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get contacts by status
    /// </summary>
    Task<IEnumerable<Contact>> GetByStatusAsync(Guid userId, ContactStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get contact with user details
    /// </summary>
    Task<Contact?> GetWithUsersAsync(Guid contactId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if contact exists between two users
    /// </summary>
    Task<bool> ContactExistsAsync(Guid userId, Guid contactUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get contact between two users
    /// </summary>
    Task<Contact?> GetContactBetweenUsersAsync(Guid userId, Guid contactUserId, CancellationToken cancellationToken = default);
}
