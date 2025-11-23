using SilentTalk.Domain.Entities;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for User entity
/// </summary>
public interface IUserRepository : IRepository<ApplicationUser>
{
    /// <summary>
    /// Get user by email address
    /// </summary>
    Task<ApplicationUser?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user with their initiated calls
    /// </summary>
    Task<ApplicationUser?> GetWithCallsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user with their contacts
    /// </summary>
    Task<ApplicationUser?> GetWithContactsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if email exists
    /// </summary>
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
}
