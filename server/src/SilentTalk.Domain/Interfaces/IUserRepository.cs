using SilentTalk.Domain.Entities;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for User entity
/// </summary>
public interface IUserRepository : IRepository<User>
{
    /// <summary>
    /// Get user by email address
    /// </summary>
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user with their initiated calls
    /// </summary>
    Task<User?> GetWithCallsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user with their contacts
    /// </summary>
    Task<User?> GetWithContactsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if email exists
    /// </summary>
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
}
