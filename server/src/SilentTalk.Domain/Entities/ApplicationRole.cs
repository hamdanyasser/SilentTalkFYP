using Microsoft.AspNetCore.Identity;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// Application role for RBAC
/// </summary>
public class ApplicationRole : IdentityRole<Guid>
{
    /// <summary>
    /// Role description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Date and time when the role was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Role names constants
/// </summary>
public static class Roles
{
    public const string User = "User";
    public const string Admin = "Admin";
    public const string Moderator = "Moderator";

    public static readonly string[] All = { User, Admin, Moderator };
}
