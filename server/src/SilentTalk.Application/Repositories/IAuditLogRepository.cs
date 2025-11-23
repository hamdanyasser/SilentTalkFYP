using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Interfaces;

namespace SilentTalk.Application.Repositories;

/// <summary>
/// Repository interface for AuditLog operations
/// </summary>
public interface IAuditLogRepository : IRepository<AuditLog>
{
    /// <summary>
    /// Get audit logs by user ID
    /// </summary>
    Task<IEnumerable<AuditLog>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get audit logs by action
    /// </summary>
    Task<IEnumerable<AuditLog>> GetByActionAsync(string action, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get audit logs by entity
    /// </summary>
    Task<IEnumerable<AuditLog>> GetByEntityAsync(string entityType, string entityId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get audit logs with filters and pagination
    /// </summary>
    Task<(IEnumerable<AuditLog> Logs, int TotalCount)> GetFilteredAsync(
        Guid? userId,
        string? action,
        string? entityType,
        string? entityId,
        AuditLogSeverity? severity,
        DateTime? startDate,
        DateTime? endDate,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get critical audit logs
    /// </summary>
    Task<IEnumerable<AuditLog>> GetCriticalLogsAsync(int count = 50, CancellationToken cancellationToken = default);
}
