using SilentTalk.Domain.Entities;

namespace SilentTalk.Api.Services;

/// <summary>
/// JWT token service interface
/// Maps to FR-001.3: JWT-based authentication
/// </summary>
public interface ITokenService
{
    string GenerateAccessToken(User user, IList<string> roles);
    string GenerateRefreshToken();
    Task<bool> ValidateRefreshTokenAsync(string userId, string refreshToken);
    Task SaveRefreshTokenAsync(string userId, string refreshToken);
    Task RevokeRefreshTokenAsync(string userId);
}
