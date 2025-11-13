using Microsoft.AspNetCore.Identity;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// User entity extending Identity for authentication
/// Maps to FR-001: User Authentication and Authorization
/// </summary>
public class User : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public string PreferredLanguage { get; set; } = "ASL"; // ASL, BSL, Auslan
    public bool IsOnline { get; set; }
    public string? AvailabilityStatus { get; set; } // Available, Busy, Away
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsVerified { get; set; }

    // Navigation properties
    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public virtual ICollection<Contact> ContactOf { get; set; } = new List<Contact>();
    public virtual ICollection<Call> InitiatedCalls { get; set; } = new List<Call>();
    public virtual ICollection<Participant> CallParticipations { get; set; } = new List<Participant>();
}
