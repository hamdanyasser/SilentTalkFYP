using System.ComponentModel.DataAnnotations;

namespace SilentTalk.Application.DTOs
{
    public class InterpreterDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string[] Languages { get; set; } = Array.Empty<string>();
        public double Rating { get; set; }
        public decimal HourlyRate { get; set; }
        public string Avatar { get; set; } = string.Empty;
        public string[] Specializations { get; set; } = Array.Empty<string>();
        public string[] Availability { get; set; } = Array.Empty<string>();
    }

    public class BookingDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string InterpreterId { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public int Duration { get; set; } // in minutes
        public string Type { get; set; } = "video"; // video or onsite
        public string? Location { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string Status { get; set; } = "pending"; // pending, confirmed, cancelled
        public DateTime CreatedAt { get; set; }
    }

    public class CreateBookingDto
    {
        [Required]
        public string InterpreterId { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "Date must be in format YYYY-MM-DD")]
        public string Date { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{2}:\d{2}$", ErrorMessage = "Time must be in format HH:MM")]
        public string Time { get; set; } = string.Empty;

        [Required]
        [Range(30, 480, ErrorMessage = "Duration must be between 30 and 480 minutes")]
        public int Duration { get; set; } // in minutes

        [Required]
        [RegularExpression("^(video|onsite)$", ErrorMessage = "Type must be 'video' or 'onsite'")]
        public string Type { get; set; } = "video";

        public string? Location { get; set; }

        [StringLength(1000)]
        public string Notes { get; set; } = string.Empty;
    }
}
