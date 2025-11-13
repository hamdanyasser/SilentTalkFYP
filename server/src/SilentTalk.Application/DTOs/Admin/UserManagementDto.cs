namespace SilentTalk.Application.DTOs.Admin;

/// <summary>
/// DTO for user management in admin panel
/// </summary>
public class UserManagementDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public string? PreferredLanguage { get; set; }
    public bool EmailConfirmed { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public bool IsLockedOut { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public int AccessFailedCount { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
    public int TotalCalls { get; set; }
    public int TotalMessages { get; set; }
    public int ReportsReceived { get; set; }
    public int ReportsSubmitted { get; set; }
}

/// <summary>
/// DTO for updating user roles
/// </summary>
public class UpdateUserRolesRequest
{
    public Guid UserId { get; set; }
    public List<string> Roles { get; set; } = new();
}

/// <summary>
/// DTO for suspending a user
/// </summary>
public class SuspendUserRequest
{
    public Guid UserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int DurationDays { get; set; } = 7;
}

/// <summary>
/// DTO for user list query parameters
/// </summary>
public class UserListQueryParams
{
    public string? SearchTerm { get; set; }
    public bool? EmailConfirmed { get; set; }
    public bool? IsLockedOut { get; set; }
    public string? Role { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "CreatedAt";
    public string SortOrder { get; set; } = "desc";
}

/// <summary>
/// Paginated response for user lists
/// </summary>
public class PaginatedUserListResponse
{
    public List<UserManagementDto> Users { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}
