using SilentTalk.Domain.Common;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// Audit log entry for tracking admin actions and system events
/// </summary>
public class AuditLog : BaseEntity
{
    public Guid AuditLogId { get; set; }

    /// <summary>
    /// User who performed the action (null for system actions)
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// User email for quick reference
    /// </summary>
    public string? UserEmail { get; set; }

    /// <summary>
    /// Action performed (e.g., "UserSuspended", "UserDeleted", "ContentModerated")
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Entity type affected (e.g., "User", "Call", "Message")
    /// </summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>
    /// ID of the affected entity
    /// </summary>
    public string? EntityId { get; set; }

    /// <summary>
    /// Detailed description of the action
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Previous state (JSON serialized)
    /// </summary>
    public string? OldValues { get; set; }

    /// <summary>
    /// New state (JSON serialized)
    /// </summary>
    public string? NewValues { get; set; }

    /// <summary>
    /// IP address of the user who performed the action
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent string
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Severity level (Info, Warning, Error, Critical)
    /// </summary>
    public AuditLogSeverity Severity { get; set; } = AuditLogSeverity.Info;

    /// <summary>
    /// Additional metadata (JSON)
    /// </summary>
    public string? Metadata { get; set; }

    // Navigation properties
    public ApplicationUser? User { get; set; }
}

/// <summary>
/// Severity levels for audit log entries
/// </summary>
public enum AuditLogSeverity
{
    Info = 0,
    Warning = 1,
    Error = 2,
    Critical = 3
}
