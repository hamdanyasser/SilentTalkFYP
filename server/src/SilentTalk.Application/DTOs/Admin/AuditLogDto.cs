using SilentTalk.Domain.Entities;

namespace SilentTalk.Application.DTOs.Admin;

/// <summary>
/// DTO for audit log entries
/// </summary>
public class AuditLogDto
{
    public Guid AuditLogId { get; set; }
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public AuditLogSeverity Severity { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for audit log query parameters
/// </summary>
public class AuditLogQueryParams
{
    public Guid? UserId { get; set; }
    public string? Action { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public AuditLogSeverity? Severity { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

/// <summary>
/// Paginated response for audit logs
/// </summary>
public class PaginatedAuditLogResponse
{
    public List<AuditLogDto> Logs { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
