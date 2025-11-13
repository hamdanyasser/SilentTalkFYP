using System.ComponentModel.DataAnnotations;

namespace SilentTalk.Shared.DTOs.Auth;

/// <summary>
/// DTO for user login request
/// Maps to FR-001.2: User login
/// </summary>
public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
}
