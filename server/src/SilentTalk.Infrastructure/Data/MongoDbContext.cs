using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using SilentTalk.Domain.Documents;

namespace SilentTalk.Infrastructure.Data;

/// <summary>
/// MongoDB context for document collections
/// </summary>
public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoDB")
            ?? throw new InvalidOperationException("MongoDB connection string not found");

        var mongoUrl = MongoUrl.Create(connectionString);
        var client = new MongoClient(mongoUrl);
        _database = client.GetDatabase(mongoUrl.DatabaseName ?? "silentstalk");

        // Create indexes
        CreateIndexes();
    }

    public MongoDbContext(IMongoDatabase database)
    {
        _database = database;
        CreateIndexes();
    }

    /// <summary>
    /// Messages collection
    /// </summary>
    public IMongoCollection<Message> Messages => _database.GetCollection<Message>("messages");

    /// <summary>
    /// Recognition results collection
    /// </summary>
    public IMongoCollection<RecognitionResult> RecognitionResults =>
        _database.GetCollection<RecognitionResult>("recognitionResults");

    private void CreateIndexes()
    {
        // Messages indexes
        var messagesIndexes = Messages.Indexes;

        // Index on CallId and Timestamp for efficient queries
        var callIdTimestampIndex = Builders<Message>.IndexKeys
            .Ascending(m => m.CallId)
            .Descending(m => m.Timestamp);
        messagesIndexes.CreateOne(new CreateIndexModel<Message>(callIdTimestampIndex));

        // Index on SenderId
        var senderIdIndex = Builders<Message>.IndexKeys.Ascending(m => m.SenderId);
        messagesIndexes.CreateOne(new CreateIndexModel<Message>(senderIdIndex));

        // Index on Timestamp for sorting
        var timestampIndex = Builders<Message>.IndexKeys.Descending(m => m.Timestamp);
        messagesIndexes.CreateOne(new CreateIndexModel<Message>(timestampIndex));

        // Recognition Results indexes
        var recognitionResultsIndexes = RecognitionResults.Indexes;

        // Index on UserId for user-specific queries
        var userIdIndex = Builders<RecognitionResult>.IndexKeys.Ascending(r => r.UserId);
        recognitionResultsIndexes.CreateOne(new CreateIndexModel<RecognitionResult>(userIdIndex));
    }
}
