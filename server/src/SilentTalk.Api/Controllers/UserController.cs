using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SilentTalk.Application.DTOs;
using SilentTalk.Domain.Entities;
using System.Security.Claims;

namespace SilentTalk.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;

        public UserController(ILogger<UserController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Get current user's profile
        /// </summary>
        [HttpGet("profile")]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // TODO: Fetch from database
            var profile = new UserProfileDto
            {
                Id = userId,
                Email = User.FindFirst(ClaimTypes.Email)?.Value ?? "",
                DisplayName = User.FindFirst(ClaimTypes.Name)?.Value ?? "",
                FirstName = "",
                LastName = "",
                Bio = "",
                AvatarUrl = "/default-avatar.png",
                PreferredSignLanguage = "ASL",
                Pronouns = "",
                Location = "",
                JoinedDate = DateTime.UtcNow.AddDays(-30),
                LastActive = DateTime.UtcNow
            };

            return Ok(profile);
        }

        /// <summary>
        /// Update current user's profile
        /// </summary>
        [HttpPut("profile")]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // TODO: Update in database
            _logger.LogInformation("Profile updated for user {UserId}", userId);

            var updatedProfile = new UserProfileDto
            {
                Id = userId,
                Email = User.FindFirst(ClaimTypes.Email)?.Value ?? "",
                DisplayName = dto.DisplayName,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Bio = dto.Bio,
                AvatarUrl = dto.AvatarUrl ?? "/default-avatar.png",
                PreferredSignLanguage = dto.PreferredSignLanguage,
                Pronouns = dto.Pronouns,
                Location = dto.Location,
                JoinedDate = DateTime.UtcNow.AddDays(-30),
                LastActive = DateTime.UtcNow
            };

            return Ok(updatedProfile);
        }

        /// <summary>
        /// Upload avatar image
        /// </summary>
        [HttpPost("avatar")]
        [ProducesResponseType(typeof(AvatarUploadResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
            }

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest("File size exceeds 5MB limit");
            }

            // TODO: Save to storage service (MinIO/S3)
            var avatarUrl = $"/avatars/{userId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            _logger.LogInformation("Avatar uploaded for user {UserId}: {AvatarUrl}", userId, avatarUrl);

            return Ok(new AvatarUploadResponse { AvatarUrl = avatarUrl });
        }

        /// <summary>
        /// Get user's preferences
        /// </summary>
        [HttpGet("preferences")]
        [ProducesResponseType(typeof(UserPreferencesDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPreferences()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // TODO: Fetch from database
            var preferences = new UserPreferencesDto
            {
                PreferredSignLanguage = "ASL",
                EnableCaptions = true,
                EnableTTS = false,
                CaptionFontSize = 16,
                TTSSpeed = 1.0,
                Theme = "light",
                HighContrast = false,
                ReducedMotion = false
            };

            return Ok(preferences);
        }

        /// <summary>
        /// Update user's preferences
        /// </summary>
        [HttpPut("preferences")]
        [ProducesResponseType(typeof(UserPreferencesDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> UpdatePreferences([FromBody] UserPreferencesDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // TODO: Save to database
            _logger.LogInformation("Preferences updated for user {UserId}", userId);

            return Ok(dto);
        }
    }
}
