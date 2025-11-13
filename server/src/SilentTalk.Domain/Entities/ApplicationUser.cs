using Microsoft.AspNetCore.Identity;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// Application user entity extending ASP.NET Core Identity
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    /// <summary>
    /// Display name shown to other users
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// URL to user's profile image
    /// </summary>
    public string? ProfileImageUrl { get; set; }

    /// <summary>
    /// User's preferred sign language (e.g., ASL, BSL, etc.)
    /// </summary>
    public string? PreferredLanguage { get; set; }

    /// <summary>
    /// Whether the user has enabled two-factor authentication
    /// </summary>
    public override bool TwoFactorEnabled { get; set; }

    /// <summary>
    /// Date and time when the user was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Date and time when the user was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Refresh token for JWT authentication
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Refresh token expiry date
    /// </summary>
    public DateTime? RefreshTokenExpiryTime { get; set; }

    /// <summary>
    /// Last activity timestamp for idle timeout tracking
    /// </summary>
    public DateTime? LastActivityAt { get; set; }

    // Navigation properties

    /// <summary>
    /// Calls initiated by this user
    /// </summary>
    public ICollection<Call> InitiatedCalls { get; set; } = new List<Call>();

    /// <summary>
    /// Call participations
    /// </summary>
    public ICollection<Participant> Participations { get; set; } = new List<Participant>();

    /// <summary>
    /// Contacts where this user is the owner
    /// </summary>
    public ICollection<Contact> UserContacts { get; set; } = new List<Contact>();

    /// <summary>
    /// Contacts where this user is the contact
    /// </summary>
    public ICollection<Contact> ContactOfUsers { get; set; } = new List<Contact>();
}
