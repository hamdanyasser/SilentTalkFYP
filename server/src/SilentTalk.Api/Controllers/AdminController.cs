using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SilentTalk.Application.DTOs.Admin;
using SilentTalk.Application.Repositories;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Enums;
using SilentTalk.Infrastructure.Data;
using System.Security.Claims;
using System.Text.Json;

namespace SilentTalk.Api.Controllers;

/// <summary>
/// Admin panel endpoints for user management, content moderation, and system analytics
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IUserReportRepository _reportRepository;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ApplicationDbContext context,
        IAuditLogRepository auditLogRepository,
        IUserReportRepository reportRepository,
        ILogger<AdminController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _auditLogRepository = auditLogRepository;
        _reportRepository = reportRepository;
        _logger = logger;
    }

    #region User Management

    /// <summary>
    /// Get paginated list of users with filters
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(PaginatedUserListResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedUserListResponse>> GetUsers([FromQuery] UserListQueryParams queryParams)
    {
        var query = _userManager.Users.AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
        {
            var searchLower = queryParams.SearchTerm.ToLower();
            query = query.Where(u =>
                u.Email!.ToLower().Contains(searchLower) ||
                u.DisplayName.ToLower().Contains(searchLower));
        }

        // Apply email confirmed filter
        if (queryParams.EmailConfirmed.HasValue)
            query = query.Where(u => u.EmailConfirmed == queryParams.EmailConfirmed.Value);

        // Apply lockout filter
        if (queryParams.IsLockedOut.HasValue)
        {
            if (queryParams.IsLockedOut.Value)
                query = query.Where(u => u.LockoutEnd != null && u.LockoutEnd > DateTimeOffset.UtcNow);
            else
                query = query.Where(u => u.LockoutEnd == null || u.LockoutEnd <= DateTimeOffset.UtcNow);
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = queryParams.SortBy.ToLower() switch
        {
            "email" => queryParams.SortOrder.ToLower() == "asc"
                ? query.OrderBy(u => u.Email)
                : query.OrderByDescending(u => u.Email),
            "displayname" => queryParams.SortOrder.ToLower() == "asc"
                ? query.OrderBy(u => u.DisplayName)
                : query.OrderByDescending(u => u.DisplayName),
            "lastactivity" => queryParams.SortOrder.ToLower() == "asc"
                ? query.OrderBy(u => u.LastActivityAt)
                : query.OrderByDescending(u => u.LastActivityAt),
            _ => queryParams.SortOrder.ToLower() == "asc"
                ? query.OrderBy(u => u.CreatedAt)
                : query.OrderByDescending(u => u.CreatedAt)
        };

        // Apply pagination
        var users = await query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync();

        // Map to DTOs with additional data
        var userDtos = new List<UserManagementDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var totalCalls = await _context.Calls.CountAsync(c => c.InitiatorId == user.Id);
            var reportsReceived = await _context.UserReports.CountAsync(r => r.ReportedUserId == user.Id);
            var reportsSubmitted = await _context.UserReports.CountAsync(r => r.ReporterId == user.Id);

            userDtos.Add(new UserManagementDto
            {
                Id = user.Id,
                Email = user.Email!,
                DisplayName = user.DisplayName,
                ProfileImageUrl = user.ProfileImageUrl,
                PreferredLanguage = user.PreferredLanguage,
                EmailConfirmed = user.EmailConfirmed,
                TwoFactorEnabled = user.TwoFactorEnabled,
                IsLockedOut = user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow,
                LockoutEnd = user.LockoutEnd,
                AccessFailedCount = user.AccessFailedCount,
                LastActivityAt = user.LastActivityAt,
                CreatedAt = user.CreatedAt,
                Roles = roles.ToList(),
                TotalCalls = totalCalls,
                ReportsReceived = reportsReceived,
                ReportsSubmitted = reportsSubmitted
            });
        }

        // Filter by role if specified
        if (!string.IsNullOrWhiteSpace(queryParams.Role))
        {
            userDtos = userDtos.Where(u => u.Roles.Contains(queryParams.Role, StringComparer.OrdinalIgnoreCase)).ToList();
            totalCount = userDtos.Count;
        }

        return Ok(new PaginatedUserListResponse
        {
            Users = userDtos,
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize
        });
    }

    /// <summary>
    /// Get user details by ID
    /// </summary>
    [HttpGet("users/{userId}")]
    [ProducesResponseType(typeof(UserManagementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserManagementDto>> GetUser(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(new { error = "User not found" });

        var roles = await _userManager.GetRolesAsync(user);
        var totalCalls = await _context.Calls.CountAsync(c => c.InitiatorId == user.Id);
        var reportsReceived = await _context.UserReports.CountAsync(r => r.ReportedUserId == user.Id);
        var reportsSubmitted = await _context.UserReports.CountAsync(r => r.ReporterId == user.Id);

        return Ok(new UserManagementDto
        {
            Id = user.Id,
            Email = user.Email!,
            DisplayName = user.DisplayName,
            ProfileImageUrl = user.ProfileImageUrl,
            PreferredLanguage = user.PreferredLanguage,
            EmailConfirmed = user.EmailConfirmed,
            TwoFactorEnabled = user.TwoFactorEnabled,
            IsLockedOut = user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow,
            LockoutEnd = user.LockoutEnd,
            AccessFailedCount = user.AccessFailedCount,
            LastActivityAt = user.LastActivityAt,
            CreatedAt = user.CreatedAt,
            Roles = roles.ToList(),
            TotalCalls = totalCalls,
            ReportsReceived = reportsReceived,
            ReportsSubmitted = reportsSubmitted
        });
    }

    /// <summary>
    /// Update user roles
    /// </summary>
    [HttpPut("users/{userId}/roles")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRoles(Guid userId, [FromBody] UpdateUserRolesRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(new { error = "User not found" });

        // Get current roles
        var currentRoles = await _userManager.GetRolesAsync(user);

        // Remove current roles
        var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
        if (!removeResult.Succeeded)
            return BadRequest(new { error = "Failed to remove current roles", errors = removeResult.Errors.Select(e => e.Description) });

        // Add new roles
        var addResult = await _userManager.AddToRolesAsync(user, request.Roles);
        if (!addResult.Succeeded)
            return BadRequest(new { error = "Failed to add new roles", errors = addResult.Errors.Select(e => e.Description) });

        // Log audit
        await LogAuditAsync("RolesUpdated", "User", userId.ToString(),
            $"Roles updated for user {user.Email}",
            JsonSerializer.Serialize(currentRoles),
            JsonSerializer.Serialize(request.Roles));

        _logger.LogInformation("Roles updated for user {UserId} by admin {AdminId}", userId, GetCurrentUserId());

        return Ok(new { message = "User roles updated successfully" });
    }

    /// <summary>
    /// Suspend user account
    /// </summary>
    [HttpPost("users/{userId}/suspend")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendUser(Guid userId, [FromBody] SuspendUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(new { error = "User not found" });

        var lockoutEnd = DateTimeOffset.UtcNow.AddDays(request.DurationDays);
        await _userManager.SetLockoutEndDateAsync(user, lockoutEnd);
        await _userManager.SetLockoutEnabledAsync(user, true);

        // Log audit
        await LogAuditAsync("UserSuspended", "User", userId.ToString(),
            $"User {user.Email} suspended for {request.DurationDays} days. Reason: {request.Reason}",
            null,
            JsonSerializer.Serialize(new { LockoutEnd = lockoutEnd, Reason = request.Reason }),
            AuditLogSeverity.Warning);

        _logger.LogWarning("User {UserId} suspended for {Days} days by admin {AdminId}. Reason: {Reason}",
            userId, request.DurationDays, GetCurrentUserId(), request.Reason);

        return Ok(new { message = "User suspended successfully", lockoutEnd });
    }

    /// <summary>
    /// Unlock user account
    /// </summary>
    [HttpPost("users/{userId}/unlock")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnlockUser(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(new { error = "User not found" });

        await _userManager.SetLockoutEndDateAsync(user, null);
        await _userManager.ResetAccessFailedCountAsync(user);

        // Log audit
        await LogAuditAsync("UserUnlocked", "User", userId.ToString(),
            $"User {user.Email} unlocked");

        _logger.LogInformation("User {UserId} unlocked by admin {AdminId}", userId, GetCurrentUserId());

        return Ok(new { message = "User unlocked successfully" });
    }

    /// <summary>
    /// Delete user account (soft delete by locking permanently)
    /// </summary>
    [HttpDelete("users/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid userId, [FromQuery] string reason)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(new { error = "User not found" });

        // Instead of deleting, lock out permanently
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
        await _userManager.SetLockoutEnabledAsync(user, true);

        // Log audit
        await LogAuditAsync("UserDeleted", "User", userId.ToString(),
            $"User {user.Email} deleted. Reason: {reason}",
            null,
            JsonSerializer.Serialize(new { Deleted = true, Reason = reason }),
            AuditLogSeverity.Critical);

        _logger.LogWarning("User {UserId} deleted by admin {AdminId}. Reason: {Reason}",
            userId, GetCurrentUserId(), reason);

        return Ok(new { message = "User deleted successfully" });
    }

    #endregion

    #region Content Moderation

    /// <summary>
    /// Get reports with filters
    /// </summary>
    [HttpGet("reports")]
    [ProducesResponseType(typeof(PaginatedReportResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedReportResponse>> GetReports([FromQuery] ReportQueryParams queryParams)
    {
        var (reports, totalCount, pendingCount, underReviewCount) = await _reportRepository.GetFilteredAsync(
            queryParams.Status,
            queryParams.Reason,
            queryParams.ContentType,
            queryParams.ReportedUserId,
            queryParams.ReporterId,
            queryParams.PageNumber,
            queryParams.PageSize);

        var reportDtos = reports.Select(r => new UserReportDto
        {
            ReportId = r.ReportId,
            ReporterId = r.ReporterId,
            ReporterEmail = r.Reporter?.Email ?? "Unknown",
            ReportedUserId = r.ReportedUserId,
            ReportedUserEmail = r.ReportedUser?.Email ?? "Unknown",
            ContentType = r.ContentType,
            ContentId = r.ContentId,
            Reason = r.Reason,
            Details = r.Details,
            Status = r.Status,
            ReviewedByUserId = r.ReviewedByUserId,
            ReviewedByEmail = r.ReviewedByUser?.Email,
            ReviewedAt = r.ReviewedAt,
            ReviewNotes = r.ReviewNotes,
            ActionTaken = r.ActionTaken,
            CreatedAt = r.CreatedAt
        }).ToList();

        return Ok(new PaginatedReportResponse
        {
            Reports = reportDtos,
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize,
            PendingCount = pendingCount,
            UnderReviewCount = underReviewCount
        });
    }

    /// <summary>
    /// Get report details
    /// </summary>
    [HttpGet("reports/{reportId}")]
    [ProducesResponseType(typeof(UserReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserReportDto>> GetReport(Guid reportId)
    {
        var report = await _reportRepository.GetWithDetailsAsync(reportId);
        if (report == null)
            return NotFound(new { error = "Report not found" });

        return Ok(new UserReportDto
        {
            ReportId = report.ReportId,
            ReporterId = report.ReporterId,
            ReporterEmail = report.Reporter?.Email ?? "Unknown",
            ReportedUserId = report.ReportedUserId,
            ReportedUserEmail = report.ReportedUser?.Email ?? "Unknown",
            ContentType = report.ContentType,
            ContentId = report.ContentId,
            Reason = report.Reason,
            Details = report.Details,
            Status = report.Status,
            ReviewedByUserId = report.ReviewedByUserId,
            ReviewedByEmail = report.ReviewedByUser?.Email,
            ReviewedAt = report.ReviewedAt,
            ReviewNotes = report.ReviewNotes,
            ActionTaken = report.ActionTaken,
            CreatedAt = report.CreatedAt
        });
    }

    /// <summary>
    /// Review and take action on a report
    /// </summary>
    [HttpPost("reports/{reportId}/review")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReviewReport(Guid reportId, [FromBody] ReviewReportRequest request)
    {
        var report = await _reportRepository.GetWithDetailsAsync(reportId);
        if (report == null)
            return NotFound(new { error = "Report not found" });

        var adminId = GetCurrentUserId();

        report.Status = request.Status;
        report.ActionTaken = request.ActionTaken;
        report.ReviewNotes = request.ReviewNotes;
        report.ReviewedByUserId = adminId;
        report.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Take action if specified
        if (request.ActionTaken.HasValue)
        {
            await ExecuteModerationActionAsync(report.ReportedUserId, request.ActionTaken.Value, request.ReviewNotes);
        }

        // Log audit
        await LogAuditAsync("ReportReviewed", "UserReport", reportId.ToString(),
            $"Report reviewed. Action: {request.ActionTaken}, Status: {request.Status}",
            JsonSerializer.Serialize(new { OldStatus = report.Status }),
            JsonSerializer.Serialize(new { NewStatus = request.Status, ActionTaken = request.ActionTaken }));

        return Ok(new { message = "Report reviewed successfully" });
    }

    #endregion

    #region Analytics and Reports

    /// <summary>
    /// Get system analytics dashboard
    /// </summary>
    [HttpGet("analytics/dashboard")]
    [ProducesResponseType(typeof(SystemAnalyticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemAnalyticsDto>> GetAnalyticsDashboard()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekAgo = now.AddDays(-7);
        var monthAgo = now.AddMonths(-1);

        // User statistics
        var totalUsers = await _userManager.Users.CountAsync();
        var activeUsers = await _userManager.Users.CountAsync(u =>
            u.LastActivityAt.HasValue && u.LastActivityAt.Value >= weekAgo);
        var newUsersToday = await _userManager.Users.CountAsync(u => u.CreatedAt >= today);
        var newUsersThisWeek = await _userManager.Users.CountAsync(u => u.CreatedAt >= weekAgo);
        var newUsersThisMonth = await _userManager.Users.CountAsync(u => u.CreatedAt >= monthAgo);
        var emailConfirmedUsers = await _userManager.Users.CountAsync(u => u.EmailConfirmed);
        var twoFactorUsers = await _userManager.Users.CountAsync(u => u.TwoFactorEnabled);
        var lockedOutUsers = await _userManager.Users.CountAsync(u =>
            u.LockoutEnd != null && u.LockoutEnd > DateTimeOffset.UtcNow);

        // Call statistics
        var totalCalls = await _context.Calls.CountAsync();
        var activeCalls = await _context.Calls.CountAsync(c => c.Status == CallStatus.Active);
        var callsToday = await _context.Calls.CountAsync(c => c.StartTime >= today);
        var callsThisWeek = await _context.Calls.CountAsync(c => c.StartTime >= weekAgo);
        var callsThisMonth = await _context.Calls.CountAsync(c => c.StartTime >= monthAgo);
        var totalParticipants = await _context.Participants.CountAsync();

        var completedCalls = await _context.Calls
            .Where(c => c.Status == CallStatus.Ended && c.EndTime.HasValue)
            .ToListAsync();
        var avgCallDuration = completedCalls.Any()
            ? completedCalls.Average(c => (c.EndTime!.Value - c.StartTime).TotalMinutes)
            : 0;

        // System health
        var pendingReports = await _reportRepository.GetPendingCountAsync();
        var criticalLogs = await _auditLogRepository.GetCriticalLogsAsync(10);

        return Ok(new SystemAnalyticsDto
        {
            Users = new UserStatistics
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                NewUsersToday = newUsersToday,
                NewUsersThisWeek = newUsersThisWeek,
                NewUsersThisMonth = newUsersThisMonth,
                EmailConfirmedUsers = emailConfirmedUsers,
                TwoFactorEnabledUsers = twoFactorUsers,
                LockedOutUsers = lockedOutUsers
            },
            Calls = new CallStatistics
            {
                TotalCalls = totalCalls,
                ActiveCalls = activeCalls,
                CallsToday = callsToday,
                CallsThisWeek = callsThisWeek,
                CallsThisMonth = callsThisMonth,
                AverageCallDurationMinutes = avgCallDuration,
                TotalParticipants = totalParticipants
            },
            Messages = new MessageStatistics
            {
                // Note: Messages are in MongoDB, would need separate service
                TotalMessages = 0,
                MessagesToday = 0,
                MessagesThisWeek = 0,
                MessagesThisMonth = 0,
                TextMessages = 0,
                SignMessages = 0
            },
            Health = new SystemHealth
            {
                Status = pendingReports > 100 || criticalLogs.Count() > 10 ? "Degraded" : "Healthy",
                Database = new DatabaseHealth
                {
                    IsConnected = await _context.Database.CanConnectAsync(),
                    TotalTables = 10, // Approximate
                    TotalRecords = totalUsers + totalCalls + totalParticipants
                },
                PendingReports = pendingReports,
                CriticalAuditLogs = criticalLogs.Count(),
                SystemUptime = 0 // Would need to track app start time
            },
            GeneratedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get user growth analytics
    /// </summary>
    [HttpGet("analytics/user-growth")]
    [ProducesResponseType(typeof(UserGrowthAnalytics), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserGrowthAnalytics>> GetUserGrowth([FromQuery] string period = "daily", [FromQuery] int days = 30)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days);
        var users = await _userManager.Users
            .Where(u => u.CreatedAt >= startDate)
            .Select(u => new { u.CreatedAt, u.LastActivityAt })
            .ToListAsync();

        var newUsers = new List<TimeSeriesDataPoint>();
        var activeUsers = new List<TimeSeriesDataPoint>();

        for (int i = 0; i < days; i++)
        {
            var date = startDate.AddDays(i);
            var nextDate = date.AddDays(1);

            newUsers.Add(new TimeSeriesDataPoint
            {
                Date = date,
                Count = users.Count(u => u.CreatedAt >= date && u.CreatedAt < nextDate)
            });

            activeUsers.Add(new TimeSeriesDataPoint
            {
                Date = date,
                Count = users.Count(u => u.LastActivityAt.HasValue && u.LastActivityAt.Value >= date && u.LastActivityAt.Value < nextDate)
            });
        }

        return Ok(new UserGrowthAnalytics
        {
            NewUsers = newUsers,
            ActiveUsers = activeUsers,
            Period = period
        });
    }

    #endregion

    #region Audit Logs

    /// <summary>
    /// Get audit logs with filters
    /// </summary>
    [HttpGet("audit-logs")]
    [ProducesResponseType(typeof(PaginatedAuditLogResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedAuditLogResponse>> GetAuditLogs([FromQuery] AuditLogQueryParams queryParams)
    {
        var (logs, totalCount) = await _auditLogRepository.GetFilteredAsync(
            queryParams.UserId,
            queryParams.Action,
            queryParams.EntityType,
            queryParams.EntityId,
            queryParams.Severity,
            queryParams.StartDate,
            queryParams.EndDate,
            queryParams.PageNumber,
            queryParams.PageSize);

        var logDtos = logs.Select(l => new AuditLogDto
        {
            AuditLogId = l.AuditLogId,
            UserId = l.UserId,
            UserEmail = l.UserEmail,
            Action = l.Action,
            EntityType = l.EntityType,
            EntityId = l.EntityId,
            Description = l.Description,
            OldValues = l.OldValues,
            NewValues = l.NewValues,
            IpAddress = l.IpAddress,
            Severity = l.Severity,
            CreatedAt = l.CreatedAt
        }).ToList();

        return Ok(new PaginatedAuditLogResponse
        {
            Logs = logDtos,
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize
        });
    }

    #endregion

    #region Helper Methods

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    private async Task LogAuditAsync(
        string action,
        string entityType,
        string? entityId,
        string description,
        string? oldValues = null,
        string? newValues = null,
        AuditLogSeverity severity = AuditLogSeverity.Info)
    {
        var userId = GetCurrentUserId();
        var user = await _userManager.FindByIdAsync(userId.ToString());

        var auditLog = new AuditLog
        {
            AuditLogId = Guid.NewGuid(),
            UserId = userId,
            UserEmail = user?.Email,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Description = description,
            OldValues = oldValues,
            NewValues = newValues,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = HttpContext.Request.Headers.UserAgent.ToString(),
            Severity = severity
        };

        await _auditLogRepository.AddAsync(auditLog);
        await _context.SaveChangesAsync();
    }

    private async Task ExecuteModerationActionAsync(Guid userId, ModerationAction action, string? reason)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return;

        switch (action)
        {
            case ModerationAction.Warning:
                // Log warning
                await LogAuditAsync("UserWarned", "User", userId.ToString(),
                    $"User {user.Email} received a warning. Reason: {reason}",
                    severity: AuditLogSeverity.Warning);
                break;

            case ModerationAction.UserSuspended:
                await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddDays(7));
                await _userManager.SetLockoutEnabledAsync(user, true);
                await LogAuditAsync("UserSuspended", "User", userId.ToString(),
                    $"User {user.Email} suspended. Reason: {reason}",
                    severity: AuditLogSeverity.Warning);
                break;

            case ModerationAction.UserBanned:
                await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
                await _userManager.SetLockoutEnabledAsync(user, true);
                await LogAuditAsync("UserBanned", "User", userId.ToString(),
                    $"User {user.Email} banned permanently. Reason: {reason}",
                    severity: AuditLogSeverity.Critical);
                break;
        }
    }

    #endregion
}
