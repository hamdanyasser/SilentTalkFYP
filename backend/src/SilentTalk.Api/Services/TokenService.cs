using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.IdentityModel.Tokens;
using SilentTalk.Domain.Entities;

namespace SilentTalk.Api.Services;

/// <summary>
/// JWT token service implementation
/// Maps to FR-001.3: JWT-based authentication
/// NFR-004: Security with JWT tokens
/// </summary>
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly IDistributedCache? _cache;
    private readonly ILogger<TokenService> _logger;

    public TokenService(
        IConfiguration configuration,
        ILogger<TokenService> logger,
        IDistributedCache? cache = null)
    {
        _configuration = configuration;
        _logger = logger;
        _cache = cache;
    }

    public string GenerateAccessToken(User user, IList<string> roles)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.DisplayName),
            new("preferred_language", user.PreferredLanguage)
        };

        // Add roles as claims
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");
        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public async Task<bool> ValidateRefreshTokenAsync(string userId, string refreshToken)
    {
        if (_cache == null)
        {
            _logger.LogWarning("Distributed cache not configured, refresh token validation skipped");
            return true;
        }

        try
        {
            var cacheKey = $"refresh_token:{userId}";
            var storedToken = await _cache.GetStringAsync(cacheKey);
            return storedToken == refreshToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating refresh token for user {UserId}", userId);
            return false;
        }
    }

    public async Task SaveRefreshTokenAsync(string userId, string refreshToken)
    {
        if (_cache == null)
        {
            _logger.LogWarning("Distributed cache not configured, refresh token not saved");
            return;
        }

        try
        {
            var cacheKey = $"refresh_token:{userId}";
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var expirationDays = int.Parse(jwtSettings["RefreshTokenExpirationDays"] ?? "7");

            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(expirationDays)
            };

            await _cache.SetStringAsync(cacheKey, refreshToken, options);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving refresh token for user {UserId}", userId);
        }
    }

    public async Task RevokeRefreshTokenAsync(string userId)
    {
        if (_cache == null)
        {
            _logger.LogWarning("Distributed cache not configured, refresh token not revoked");
            return;
        }

        try
        {
            var cacheKey = $"refresh_token:{userId}";
            await _cache.RemoveAsync(cacheKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking refresh token for user {UserId}", userId);
        }
    }
}
