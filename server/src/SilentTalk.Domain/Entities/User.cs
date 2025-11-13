using SilentTalk.Domain.Common;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// User entity representing registered users in the system
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// User ID (Primary Key)
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// User email address (unique, indexed)
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Hashed password for authentication
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Display name shown to other users
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// URL to user's profile image
    /// </summary>
    public string? ProfileImageUrl { get; set; }

    /// <summary>
    /// User's preferred language (e.g., ASL, BSL, etc.)
    /// </summary>
    public string? PreferredLanguage { get; set; }

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
