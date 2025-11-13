namespace SilentTalk.Application.DTOs.Auth;

/// <summary>
/// Request model for user login
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// Email address or username
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Password
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Remember me for extended session
    /// </summary>
    public bool RememberMe { get; set; }

    /// <summary>
    /// Two-factor authentication code (if 2FA is enabled)
    /// </summary>
    public string? TwoFactorCode { get; set; }
}
