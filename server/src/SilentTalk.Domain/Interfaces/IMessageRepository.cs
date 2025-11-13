using SilentTalk.Domain.Documents;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for Message document
/// </summary>
public interface IMessageRepository
{
    /// <summary>
    /// Get message by ID
    /// </summary>
    Task<Message?> GetByIdAsync(Guid messageId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get messages for a call
    /// </summary>
    Task<IEnumerable<Message>> GetByCallIdAsync(Guid callId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get messages by sender
    /// </summary>
    Task<IEnumerable<Message>> GetBySenderIdAsync(Guid senderId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get messages in a time range
    /// </summary>
    Task<IEnumerable<Message>> GetByTimeRangeAsync(DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recent messages for a call
    /// </summary>
    Task<IEnumerable<Message>> GetRecentMessagesAsync(Guid callId, int limit = 50, CancellationToken cancellationToken = default);

    /// <summary>
    /// Add a new message
    /// </summary>
    Task<Message> AddAsync(Message message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Add multiple messages
    /// </summary>
    Task AddManyAsync(IEnumerable<Message> messages, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete messages for a call
    /// </summary>
    Task<long> DeleteByCallIdAsync(Guid callId, CancellationToken cancellationToken = default);
}
