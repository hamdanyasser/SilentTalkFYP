using Microsoft.EntityFrameworkCore;
using SilentTalk.Application.Repositories;
using SilentTalk.Domain.Entities;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for UserReport operations
/// </summary>
public class UserReportRepository : Repository<UserReport>, IUserReportRepository
{
    public UserReportRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<UserReport>> GetByStatusAsync(ReportStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Reporter)
            .Include(r => r.ReportedUser)
            .Include(r => r.ReviewedByUser)
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<UserReport>> GetReportsForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Reporter)
            .Include(r => r.ReviewedByUser)
            .Where(r => r.ReportedUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<UserReport>> GetReportsByReporterAsync(Guid reporterId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.ReportedUser)
            .Include(r => r.ReviewedByUser)
            .Where(r => r.ReporterId == reporterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .CountAsync(r => r.Status == ReportStatus.Pending, cancellationToken);
    }

    public async Task<(IEnumerable<UserReport> Reports, int TotalCount, int PendingCount, int UnderReviewCount)> GetFilteredAsync(
        ReportStatus? status,
        ReportReason? reason,
        ReportContentType? contentType,
        Guid? reportedUserId,
        Guid? reporterId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(r => r.Reporter)
            .Include(r => r.ReportedUser)
            .Include(r => r.ReviewedByUser)
            .AsQueryable();

        // Apply filters
        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        if (reason.HasValue)
            query = query.Where(r => r.Reason == reason.Value);

        if (contentType.HasValue)
            query = query.Where(r => r.ContentType == contentType.Value);

        if (reportedUserId.HasValue)
            query = query.Where(r => r.ReportedUserId == reportedUserId.Value);

        if (reporterId.HasValue)
            query = query.Where(r => r.ReporterId == reporterId.Value);

        // Get counts
        var totalCount = await query.CountAsync(cancellationToken);
        var pendingCount = await _dbSet.CountAsync(r => r.Status == ReportStatus.Pending, cancellationToken);
        var underReviewCount = await _dbSet.CountAsync(r => r.Status == ReportStatus.UnderReview, cancellationToken);

        // Apply pagination
        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (reports, totalCount, pendingCount, underReviewCount);
    }

    public async Task<UserReport?> GetWithDetailsAsync(Guid reportId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Reporter)
            .Include(r => r.ReportedUser)
            .Include(r => r.ReviewedByUser)
            .FirstOrDefaultAsync(r => r.ReportId == reportId, cancellationToken);
    }
}
