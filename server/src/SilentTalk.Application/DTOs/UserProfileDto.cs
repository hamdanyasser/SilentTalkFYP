using System.ComponentModel.DataAnnotations;

namespace SilentTalk.Application.DTOs
{
    public class UserProfileDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public string PreferredSignLanguage { get; set; } = "ASL";
        public string Pronouns { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime JoinedDate { get; set; }
        public DateTime LastActive { get; set; }
    }

    public class UpdateProfileDto
    {
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string DisplayName { get; set; } = string.Empty;

        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [StringLength(500)]
        public string Bio { get; set; } = string.Empty;

        public string? AvatarUrl { get; set; }

        [Required]
        [RegularExpression("^(ASL|BSL|ISL)$", ErrorMessage = "Must be ASL, BSL, or ISL")]
        public string PreferredSignLanguage { get; set; } = "ASL";

        [StringLength(50)]
        public string Pronouns { get; set; } = string.Empty;

        [StringLength(100)]
        public string Location { get; set; } = string.Empty;
    }

    public class AvatarUploadResponse
    {
        public string AvatarUrl { get; set; } = string.Empty;
    }

    public class UserPreferencesDto
    {
        public string PreferredSignLanguage { get; set; } = "ASL";
        public bool EnableCaptions { get; set; } = true;
        public bool EnableTTS { get; set; } = false;
        public int CaptionFontSize { get; set; } = 16;
        public double TTSSpeed { get; set; } = 1.0;
        public string Theme { get; set; } = "light";
        public bool HighContrast { get; set; } = false;
        public bool ReducedMotion { get; set; } = false;
    }
}
