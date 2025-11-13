using SilentTalk.Domain.Entities;
using System.Security.Claims;

namespace SilentTalk.Application.Services;

/// <summary>
/// Service interface for JWT token operations
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Generate JWT access token for user
    /// </summary>
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);

    /// <summary>
    /// Generate refresh token
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Validate access token and extract claims
    /// </summary>
    ClaimsPrincipal? ValidateToken(string token);

    /// <summary>
    /// Get user ID from token claims
    /// </summary>
    Guid? GetUserIdFromToken(string token);

    /// <summary>
    /// Check if token is expired
    /// </summary>
    bool IsTokenExpired(string token);
}
