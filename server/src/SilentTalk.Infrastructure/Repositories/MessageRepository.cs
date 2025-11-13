using MongoDB.Driver;
using SilentTalk.Domain.Documents;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

public class MessageRepository : IMessageRepository
{
    private readonly IMongoCollection<Message> _messages;

    public MessageRepository(MongoDbContext context)
    {
        _messages = context.Messages;
    }

    public async Task<Message?> GetByIdAsync(Guid messageId, CancellationToken cancellationToken = default)
    {
        return await _messages.Find(m => m.MessageId == messageId).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<Message>> GetByCallIdAsync(Guid callId, CancellationToken cancellationToken = default)
    {
        return await _messages.Find(m => m.CallId == callId)
            .SortByDescending(m => m.Timestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Message>> GetBySenderIdAsync(Guid senderId, CancellationToken cancellationToken = default)
    {
        return await _messages.Find(m => m.SenderId == senderId)
            .SortByDescending(m => m.Timestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Message>> GetByTimeRangeAsync(DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default)
    {
        return await _messages.Find(m => m.Timestamp >= startTime && m.Timestamp <= endTime)
            .SortByDescending(m => m.Timestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Message>> GetRecentMessagesAsync(Guid callId, int limit = 50, CancellationToken cancellationToken = default)
    {
        return await _messages.Find(m => m.CallId == callId)
            .SortByDescending(m => m.Timestamp)
            .Limit(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<Message> AddAsync(Message message, CancellationToken cancellationToken = default)
    {
        await _messages.InsertOneAsync(message, cancellationToken: cancellationToken);
        return message;
    }

    public async Task AddManyAsync(IEnumerable<Message> messages, CancellationToken cancellationToken = default)
    {
        await _messages.InsertManyAsync(messages, cancellationToken: cancellationToken);
    }

    public async Task<long> DeleteByCallIdAsync(Guid callId, CancellationToken cancellationToken = default)
    {
        var result = await _messages.DeleteManyAsync(m => m.CallId == callId, cancellationToken);
        return result.DeletedCount;
    }
}
