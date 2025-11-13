namespace SilentTalk.Shared.DTOs.Auth;

/// <summary>
/// DTO for authentication response with JWT token
/// Maps to FR-001.3: JWT-based authentication
/// </summary>
public class AuthResponse
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; } // Seconds
    public DateTime ExpiresAt { get; set; }
}
