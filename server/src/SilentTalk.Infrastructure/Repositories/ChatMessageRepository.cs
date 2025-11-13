using MongoDB.Driver;
using SilentTalk.Application.Repositories;
using SilentTalk.Domain.Entities;

namespace SilentTalk.Infrastructure.Repositories;

/// <summary>
/// MongoDB repository for chat messages
/// </summary>
public class ChatMessageRepository : IChatMessageRepository
{
    private readonly IMongoCollection<ChatMessage> _messages;

    public ChatMessageRepository(IMongoDatabase database)
    {
        _messages = database.GetCollection<ChatMessage>("chat_messages");

        // Create indexes for performance
        CreateIndexes();
    }

    private void CreateIndexes()
    {
        // Index on callId for fast lookup
        var callIdIndexModel = new CreateIndexModel<ChatMessage>(
            Builders<ChatMessage>.IndexKeys.Ascending(m => m.CallId));

        // Index on messageId for unique lookups
        var messageIdIndexModel = new CreateIndexModel<ChatMessage>(
            Builders<ChatMessage>.IndexKeys.Ascending(m => m.MessageId),
            new CreateIndexOptions { Unique = true });

        // Index on timestamp for chronological sorting
        var timestampIndexModel = new CreateIndexModel<ChatMessage>(
            Builders<ChatMessage>.IndexKeys.Descending(m => m.Timestamp));

        // Compound index on callId + timestamp for efficient pagination
        var callIdTimestampIndexModel = new CreateIndexModel<ChatMessage>(
            Builders<ChatMessage>.IndexKeys
                .Ascending(m => m.CallId)
                .Descending(m => m.Timestamp));

        // Index on senderId for user message history
        var senderIdIndexModel = new CreateIndexModel<ChatMessage>(
            Builders<ChatMessage>.IndexKeys.Ascending(m => m.SenderId));

        // Text index for message content search
        var contentTextIndexModel = new CreateIndexModel<ChatMessage>(
            Builders<ChatMessage>.IndexKeys.Text(m => m.Content));

        _messages.Indexes.CreateMany(new[]
        {
            callIdIndexModel,
            messageIdIndexModel,
            timestampIndexModel,
            callIdTimestampIndexModel,
            senderIdIndexModel,
            contentTextIndexModel
        });
    }

    public async Task<ChatMessage> AddAsync(ChatMessage message)
    {
        await _messages.InsertOneAsync(message);
        return message;
    }

    public async Task<ChatMessage?> GetByMessageIdAsync(string messageId)
    {
        var filter = Builders<ChatMessage>.Filter.Eq(m => m.MessageId, messageId);
        return await _messages.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<ChatMessage>> GetByCallIdAsync(string callId, int skip = 0, int limit = 100)
    {
        var filter = Builders<ChatMessage>.Filter.And(
            Builders<ChatMessage>.Filter.Eq(m => m.CallId, callId),
            Builders<ChatMessage>.Filter.Eq(m => m.IsDeleted, false));

        return await _messages
            .Find(filter)
            .SortBy(m => m.Timestamp)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChatMessage>> GetByCallIdSinceAsync(string callId, DateTime since)
    {
        var filter = Builders<ChatMessage>.Filter.And(
            Builders<ChatMessage>.Filter.Eq(m => m.CallId, callId),
            Builders<ChatMessage>.Filter.Gt(m => m.Timestamp, since),
            Builders<ChatMessage>.Filter.Eq(m => m.IsDeleted, false));

        return await _messages
            .Find(filter)
            .SortBy(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task<long> GetMessageCountByCallIdAsync(string callId)
    {
        var filter = Builders<ChatMessage>.Filter.And(
            Builders<ChatMessage>.Filter.Eq(m => m.CallId, callId),
            Builders<ChatMessage>.Filter.Eq(m => m.IsDeleted, false));

        return await _messages.CountDocumentsAsync(filter);
    }

    public async Task<IEnumerable<ChatMessage>> SearchMessagesAsync(string callId, string searchTerm, int skip = 0, int limit = 50)
    {
        var filter = Builders<ChatMessage>.Filter.And(
            Builders<ChatMessage>.Filter.Eq(m => m.CallId, callId),
            Builders<ChatMessage>.Filter.Text(searchTerm),
            Builders<ChatMessage>.Filter.Eq(m => m.IsDeleted, false));

        return await _messages
            .Find(filter)
            .SortByDescending(m => m.Timestamp)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<bool> UpdateMessageAsync(string messageId, string newContent)
    {
        var filter = Builders<ChatMessage>.Filter.Eq(m => m.MessageId, messageId);
        var update = Builders<ChatMessage>.Update
            .Set(m => m.Content, newContent)
            .Set(m => m.IsEdited, true)
            .Set(m => m.EditedAt, DateTime.UtcNow);

        var result = await _messages.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteMessageAsync(string messageId)
    {
        var filter = Builders<ChatMessage>.Filter.Eq(m => m.MessageId, messageId);
        var update = Builders<ChatMessage>.Update
            .Set(m => m.IsDeleted, true)
            .Set(m => m.DeletedAt, DateTime.UtcNow);

        var result = await _messages.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }

    public async Task<long> DeleteAllByCallIdAsync(string callId)
    {
        var filter = Builders<ChatMessage>.Filter.Eq(m => m.CallId, callId);
        var result = await _messages.DeleteManyAsync(filter);
        return result.DeletedCount;
    }

    public async Task<IEnumerable<ChatMessage>> GetBySenderIdAsync(string senderId, int skip = 0, int limit = 100)
    {
        var filter = Builders<ChatMessage>.Filter.And(
            Builders<ChatMessage>.Filter.Eq(m => m.SenderId, senderId),
            Builders<ChatMessage>.Filter.Eq(m => m.IsDeleted, false));

        return await _messages
            .Find(filter)
            .SortByDescending(m => m.Timestamp)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
    }
}
