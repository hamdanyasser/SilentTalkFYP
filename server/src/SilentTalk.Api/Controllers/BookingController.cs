using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SilentTalk.Application.DTOs;
using System.Security.Claims;

namespace SilentTalk.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly ILogger<BookingController> _logger;

        public BookingController(ILogger<BookingController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Get all interpreters available for booking
        /// </summary>
        [HttpGet("interpreters")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<InterpreterDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetInterpreters()
        {
            // TODO: Fetch from database
            var interpreters = new List<InterpreterDto>
            {
                new InterpreterDto
                {
                    Id = "1",
                    Name = "Sarah Johnson",
                    Languages = new[] { "ASL", "English" },
                    Rating = 4.9,
                    HourlyRate = 75,
                    Avatar = "/interpreters/sarah.jpg",
                    Specializations = new[] { "Medical", "Legal", "Educational" },
                    Availability = new[] { "Monday", "Wednesday", "Friday" }
                },
                new InterpreterDto
                {
                    Id = "2",
                    Name = "Michael Chen",
                    Languages = new[] { "ASL", "BSL", "English" },
                    Rating = 4.8,
                    HourlyRate = 80,
                    Avatar = "/interpreters/michael.jpg",
                    Specializations = new[] { "Technical", "Business", "Conference" },
                    Availability = new[] { "Tuesday", "Thursday", "Saturday" }
                }
            };

            return Ok(interpreters);
        }

        /// <summary>
        /// Get interpreter details by ID
        /// </summary>
        [HttpGet("interpreters/{id}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(InterpreterDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetInterpreter(string id)
        {
            // TODO: Fetch from database
            return Ok(new InterpreterDto
            {
                Id = id,
                Name = "Sarah Johnson",
                Languages = new[] { "ASL", "English" },
                Rating = 4.9,
                HourlyRate = 75,
                Avatar = "/interpreters/sarah.jpg",
                Specializations = new[] { "Medical", "Legal", "Educational" },
                Availability = new[] { "Monday", "Wednesday", "Friday" }
            });
        }

        /// <summary>
        /// Create a new booking
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(BookingDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
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

            // TODO: Save to database
            var bookingId = Guid.NewGuid().ToString();

            _logger.LogInformation("Booking created: {BookingId} for user {UserId}", bookingId, userId);

            var booking = new BookingDto
            {
                Id = bookingId,
                UserId = userId,
                InterpreterId = dto.InterpreterId,
                Date = dto.Date,
                Time = dto.Time,
                Duration = dto.Duration,
                Type = dto.Type,
                Location = dto.Location,
                Notes = dto.Notes,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            return CreatedAtAction(nameof(GetBooking), new { id = bookingId }, booking);
        }

        /// <summary>
        /// Get a specific booking by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetBooking(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // TODO: Fetch from database
            var booking = new BookingDto
            {
                Id = id,
                UserId = userId ?? "",
                InterpreterId = "1",
                Date = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd"),
                Time = "14:00",
                Duration = 60,
                Type = "video",
                Status = "confirmed",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };

            return Ok(booking);
        }

        /// <summary>
        /// Get all bookings for current user
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<BookingDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyBookings()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // TODO: Fetch from database
            var bookings = new List<BookingDto>();

            return Ok(bookings);
        }

        /// <summary>
        /// Cancel a booking
        /// </summary>
        [HttpPost("{id}/cancel")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CancelBooking(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // TODO: Update in database
            _logger.LogInformation("Booking cancelled: {BookingId} by user {UserId}", id, userId);

            return Ok(new { message = "Booking cancelled successfully" });
        }

        /// <summary>
        /// Get interpreter availability for a specific date
        /// </summary>
        [HttpGet("interpreters/{interpreterId}/availability")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetInterpreterAvailability(
            string interpreterId,
            [FromQuery] string date)
        {
            // TODO: Fetch from database
            var availableSlots = new List<string>
            {
                "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"
            };

            return Ok(availableSlots);
        }
    }
}
