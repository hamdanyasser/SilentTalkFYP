using SilentTalk.Domain.Entities;

namespace SilentTalk.Application.DTOs.Admin;

/// <summary>
/// DTO for user report
/// </summary>
public class UserReportDto
{
    public Guid ReportId { get; set; }
    public Guid ReporterId { get; set; }
    public string ReporterEmail { get; set; } = string.Empty;
    public Guid ReportedUserId { get; set; }
    public string ReportedUserEmail { get; set; } = string.Empty;
    public ReportContentType ContentType { get; set; }
    public string? ContentId { get; set; }
    public ReportReason Reason { get; set; }
    public string? Details { get; set; }
    public ReportStatus Status { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public string? ReviewedByEmail { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
    public ModerationAction? ActionTaken { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for reviewing a report
/// </summary>
public class ReviewReportRequest
{
    public Guid ReportId { get; set; }
    public ReportStatus Status { get; set; }
    public ModerationAction? ActionTaken { get; set; }
    public string? ReviewNotes { get; set; }
}

/// <summary>
/// DTO for report query parameters
/// </summary>
public class ReportQueryParams
{
    public ReportStatus? Status { get; set; }
    public ReportReason? Reason { get; set; }
    public ReportContentType? ContentType { get; set; }
    public Guid? ReportedUserId { get; set; }
    public Guid? ReporterId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Paginated response for reports
/// </summary>
public class PaginatedReportResponse
{
    public List<UserReportDto> Reports { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public int PendingCount { get; set; }
    public int UnderReviewCount { get; set; }
}
