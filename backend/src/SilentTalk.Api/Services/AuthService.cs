using Microsoft.AspNetCore.Identity;
using SilentTalk.Domain.Entities;
using SilentTalk.Shared.DTOs.Auth;

namespace SilentTalk.Api.Services;

/// <summary>
/// Authentication service implementation
/// Maps to FR-001: User Authentication and Authorization
/// </summary>
public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthService> _logger;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ITokenService tokenService,
        ILogger<AuthService> logger,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Register new user
    /// Maps to FR-001.1: User registration with email verification
    /// </summary>
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException("User with this email already exists");
            }

            // Create new user
            var user = new User
            {
                UserName = request.Email,
                Email = request.Email,
                DisplayName = request.DisplayName,
                PreferredLanguage = request.PreferredLanguage,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"User registration failed: {errors}");
            }

            // Add default role
            await _userManager.AddToRoleAsync(user, "User");

            // Generate email confirmation token
            var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            // TODO: Send confirmation email

            _logger.LogInformation("User {Email} registered successfully", request.Email);

            // Generate tokens
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken();
            await _tokenService.SaveRefreshTokenAsync(user.Id.ToString(), refreshToken);

            var jwtSettings = _configuration.GetSection("JwtSettings");
            var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

            return new AuthResponse
            {
                UserId = user.Id.ToString(),
                Email = user.Email!,
                DisplayName = user.DisplayName,
                Token = accessToken,
                RefreshToken = refreshToken,
                ExpiresIn = expirationMinutes * 60,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration for {Email}", request.Email);
            throw;
        }
    }

    /// <summary>
    /// User login
    /// Maps to FR-001.2: User login with credentials
    /// FR-001.9: Account lockout after failed attempts
    /// </summary>
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Check lockout
            if (await _userManager.IsLockedOutAsync(user))
            {
                var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
                throw new UnauthorizedAccessException($"Account is locked until {lockoutEnd}");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    throw new UnauthorizedAccessException("Account locked due to multiple failed login attempts");
                }

                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Generate tokens
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken();
            await _tokenService.SaveRefreshTokenAsync(user.Id.ToString(), refreshToken);

            // Update online status
            user.IsOnline = true;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {Email} logged in successfully", request.Email);

            var jwtSettings = _configuration.GetSection("JwtSettings");
            var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

            return new AuthResponse
            {
                UserId = user.Id.ToString(),
                Email = user.Email!,
                DisplayName = user.DisplayName,
                Token = accessToken,
                RefreshToken = refreshToken,
                ExpiresIn = expirationMinutes * 60,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {Email}", request.Email);
            throw;
        }
    }

    /// <summary>
    /// Refresh access token
    /// Maps to FR-001.3: JWT token refresh
    /// </summary>
    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        // TODO: Implement refresh token validation and new token generation
        throw new NotImplementedException("Refresh token functionality will be implemented");
    }

    /// <summary>
    /// User logout
    /// Maps to FR-001: Logout functionality
    /// </summary>
    public async Task<bool> LogoutAsync(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                user.IsOnline = false;
                await _userManager.UpdateAsync(user);
                await _tokenService.RevokeRefreshTokenAsync(userId);
                await _signInManager.SignOutAsync();
            }

            _logger.LogInformation("User {UserId} logged out successfully", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout for user {UserId}", userId);
            return false;
        }
    }

    /// <summary>
    /// Confirm user email
    /// Maps to FR-001.1: Email verification
    /// </summary>
    public async Task<bool> ConfirmEmailAsync(string userId, string token)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return false;
            }

            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (result.Succeeded)
            {
                _logger.LogInformation("Email confirmed for user {UserId}", userId);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming email for user {UserId}", userId);
            return false;
        }
    }

    /// <summary>
    /// Forgot password
    /// Maps to FR-001.8: Password reset via email
    /// </summary>
    public async Task<bool> ForgotPasswordAsync(string email)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                // Don't reveal that user doesn't exist
                return true;
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            // TODO: Send password reset email with token

            _logger.LogInformation("Password reset token generated for {Email}", email);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating password reset token for {Email}", email);
            return false;
        }
    }

    /// <summary>
    /// Reset password
    /// Maps to FR-001.8: Password reset functionality
    /// </summary>
    public async Task<bool> ResetPasswordAsync(string email, string token, string newPassword)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return false;
            }

            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            if (result.Succeeded)
            {
                _logger.LogInformation("Password reset successfully for {Email}", email);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for {Email}", email);
            return false;
        }
    }
}
