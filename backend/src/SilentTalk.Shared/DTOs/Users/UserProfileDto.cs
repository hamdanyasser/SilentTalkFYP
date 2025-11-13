namespace SilentTalk.Shared.DTOs.Users;

/// <summary>
/// DTO for user profile information
/// Maps to FR-005: User Profile Management
/// </summary>
public class UserProfileDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public string PreferredLanguage { get; set; } = string.Empty;
    public bool IsOnline { get; set; }
    public string? AvailabilityStatus { get; set; }
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
}
