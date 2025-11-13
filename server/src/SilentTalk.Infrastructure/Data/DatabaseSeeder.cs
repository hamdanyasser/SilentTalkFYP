using SilentTalk.Domain.Documents;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Enums;

namespace SilentTalk.Infrastructure.Data;

/// <summary>
/// Database seeder for local testing
/// </summary>
public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly MongoDbContext _mongoContext;

    public DatabaseSeeder(ApplicationDbContext context, MongoDbContext mongoContext)
    {
        _context = context;
        _mongoContext = mongoContext;
    }

    public async Task SeedAsync()
    {
        // Check if database is already seeded
        if (_context.Users.Any())
        {
            return;
        }

        await SeedUsersAsync();
        await SeedCallsAsync();
        await SeedContactsAsync();
        await SeedMessagesAsync();
        await SeedRecognitionResultsAsync();

        await _context.SaveChangesAsync();
    }

    private async Task SeedUsersAsync()
    {
        var users = new[]
        {
            new User
            {
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "john.doe@example.com",
                PasswordHash = "$2a$11$hashedpassword1", // In production, use proper password hashing
                DisplayName = "John Doe",
                ProfileImageUrl = "https://i.pravatar.cc/150?img=1",
                PreferredLanguage = "ASL",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                UserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Email = "jane.smith@example.com",
                PasswordHash = "$2a$11$hashedpassword2",
                DisplayName = "Jane Smith",
                ProfileImageUrl = "https://i.pravatar.cc/150?img=2",
                PreferredLanguage = "BSL",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Email = "bob.wilson@example.com",
                PasswordHash = "$2a$11$hashedpassword3",
                DisplayName = "Bob Wilson",
                ProfileImageUrl = "https://i.pravatar.cc/150?img=3",
                PreferredLanguage = "ASL",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        await _context.Users.AddRangeAsync(users);
    }

    private async Task SeedCallsAsync()
    {
        var now = DateTime.UtcNow;

        var calls = new[]
        {
            new Call
            {
                CallId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                InitiatorId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                StartTime = now.AddHours(-2),
                EndTime = now.AddHours(-1),
                Status = CallStatus.Ended,
                CreatedAt = now.AddHours(-2),
                UpdatedAt = now.AddHours(-1)
            },
            new Call
            {
                CallId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                InitiatorId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                StartTime = now.AddMinutes(-30),
                EndTime = null,
                Status = CallStatus.Active,
                CreatedAt = now.AddMinutes(-30),
                UpdatedAt = now.AddMinutes(-30)
            }
        };

        await _context.Calls.AddRangeAsync(calls);

        var participants = new[]
        {
            new Participant
            {
                ParticipantId = Guid.NewGuid(),
                CallId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                JoinedAt = now.AddHours(-2),
                LeftAt = now.AddHours(-1),
                CreatedAt = now.AddHours(-2),
                UpdatedAt = now.AddHours(-1)
            },
            new Participant
            {
                ParticipantId = Guid.NewGuid(),
                CallId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                UserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                JoinedAt = now.AddHours(-2).AddMinutes(5),
                LeftAt = now.AddHours(-1).AddMinutes(5),
                CreatedAt = now.AddHours(-2),
                UpdatedAt = now.AddHours(-1)
            },
            new Participant
            {
                ParticipantId = Guid.NewGuid(),
                CallId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                UserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                JoinedAt = now.AddMinutes(-30),
                LeftAt = null,
                CreatedAt = now.AddMinutes(-30),
                UpdatedAt = now.AddMinutes(-30)
            },
            new Participant
            {
                ParticipantId = Guid.NewGuid(),
                CallId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                JoinedAt = now.AddMinutes(-25),
                LeftAt = null,
                CreatedAt = now.AddMinutes(-25),
                UpdatedAt = now.AddMinutes(-25)
            }
        };

        await _context.Participants.AddRangeAsync(participants);
    }

    private async Task SeedContactsAsync()
    {
        var contacts = new[]
        {
            new Contact
            {
                ContactId = Guid.NewGuid(),
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                ContactUserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Status = ContactStatus.Accepted,
                AddedAt = DateTime.UtcNow.AddDays(-30),
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow.AddDays(-30)
            },
            new Contact
            {
                ContactId = Guid.NewGuid(),
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                ContactUserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Status = ContactStatus.Pending,
                AddedAt = DateTime.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new Contact
            {
                ContactId = Guid.NewGuid(),
                UserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ContactUserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Status = ContactStatus.Accepted,
                AddedAt = DateTime.UtcNow.AddDays(-15),
                CreatedAt = DateTime.UtcNow.AddDays(-15),
                UpdatedAt = DateTime.UtcNow.AddDays(-15)
            }
        };

        await _context.Contacts.AddRangeAsync(contacts);
    }

    private async Task SeedMessagesAsync()
    {
        var messages = new[]
        {
            new Message
            {
                MessageId = Guid.NewGuid(),
                CallId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                SenderId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Content = "Hello! How are you?",
                Timestamp = DateTime.UtcNow.AddHours(-2).AddMinutes(5),
                Type = "text"
            },
            new Message
            {
                MessageId = Guid.NewGuid(),
                CallId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                SenderId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Content = "I'm doing great, thanks!",
                Timestamp = DateTime.UtcNow.AddHours(-2).AddMinutes(6),
                Type = "text"
            },
            new Message
            {
                MessageId = Guid.NewGuid(),
                CallId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                SenderId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Content = "Let's start the meeting",
                Timestamp = DateTime.UtcNow.AddMinutes(-25),
                Type = "text"
            }
        };

        await _mongoContext.Messages.InsertManyAsync(messages);
    }

    private async Task SeedRecognitionResultsAsync()
    {
        var recognitionResults = new[]
        {
            new RecognitionResult
            {
                SessionId = Guid.NewGuid(),
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Frames = new List<RecognitionFrame>
                {
                    new RecognitionFrame
                    {
                        Timestamp = DateTime.UtcNow.AddMinutes(-10),
                        Predictions = new List<Prediction>
                        {
                            new Prediction { Sign = "hello", Confidence = 0.95 },
                            new Prediction { Sign = "hi", Confidence = 0.75 }
                        }
                    },
                    new RecognitionFrame
                    {
                        Timestamp = DateTime.UtcNow.AddMinutes(-9),
                        Predictions = new List<Prediction>
                        {
                            new Prediction { Sign = "thank", Confidence = 0.92 },
                            new Prediction { Sign = "you", Confidence = 0.88 }
                        }
                    }
                }
            },
            new RecognitionResult
            {
                SessionId = Guid.NewGuid(),
                UserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Frames = new List<RecognitionFrame>
                {
                    new RecognitionFrame
                    {
                        Timestamp = DateTime.UtcNow.AddMinutes(-5),
                        Predictions = new List<Prediction>
                        {
                            new Prediction { Sign = "good", Confidence = 0.94 },
                            new Prediction { Sign = "morning", Confidence = 0.91 }
                        }
                    }
                }
            }
        };

        await _mongoContext.RecognitionResults.InsertManyAsync(recognitionResults);
    }
}
