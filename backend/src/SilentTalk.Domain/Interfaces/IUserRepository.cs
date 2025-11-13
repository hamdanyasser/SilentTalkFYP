using SilentTalk.Domain.Entities;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for User-specific operations
/// Maps to FR-001 and FR-005
/// </summary>
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByIdWithContactsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> SearchUsersAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> GetOnlineUsersAsync(CancellationToken cancellationToken = default);
    Task UpdateOnlineStatusAsync(Guid userId, bool isOnline, CancellationToken cancellationToken = default);
}
