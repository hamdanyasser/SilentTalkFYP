using SilentTalk.Domain.Entities;

namespace SilentTalk.Application.Repositories;

/// <summary>
/// Repository interface for UserReport operations
/// </summary>
public interface IUserReportRepository : IRepository<UserReport>
{
    /// <summary>
    /// Get reports by status
    /// </summary>
    Task<IEnumerable<UserReport>> GetByStatusAsync(ReportStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get reports for a specific user
    /// </summary>
    Task<IEnumerable<UserReport>> GetReportsForUserAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get reports submitted by a user
    /// </summary>
    Task<IEnumerable<UserReport>> GetReportsByReporterAsync(Guid reporterId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get pending reports count
    /// </summary>
    Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get reports with filters and pagination
    /// </summary>
    Task<(IEnumerable<UserReport> Reports, int TotalCount, int PendingCount, int UnderReviewCount)> GetFilteredAsync(
        ReportStatus? status,
        ReportReason? reason,
        ReportContentType? contentType,
        Guid? reportedUserId,
        Guid? reporterId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get report with related entities loaded
    /// </summary>
    Task<UserReport?> GetWithDetailsAsync(Guid reportId, CancellationToken cancellationToken = default);
}
