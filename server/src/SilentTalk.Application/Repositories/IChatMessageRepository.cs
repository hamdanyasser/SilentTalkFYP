using SilentTalk.Domain.Entities;

namespace SilentTalk.Application.Repositories;

/// <summary>
/// Repository for chat messages stored in MongoDB
/// </summary>
public interface IChatMessageRepository
{
    /// <summary>
    /// Add a new chat message
    /// </summary>
    Task<ChatMessage> AddAsync(ChatMessage message);

    /// <summary>
    /// Get chat message by message ID
    /// </summary>
    Task<ChatMessage?> GetByMessageIdAsync(string messageId);

    /// <summary>
    /// Get all messages for a call with pagination
    /// </summary>
    Task<IEnumerable<ChatMessage>> GetByCallIdAsync(string callId, int skip = 0, int limit = 100);

    /// <summary>
    /// Get messages for a call after a specific timestamp
    /// </summary>
    Task<IEnumerable<ChatMessage>> GetByCallIdSinceAsync(string callId, DateTime since);

    /// <summary>
    /// Get total message count for a call
    /// </summary>
    Task<long> GetMessageCountByCallIdAsync(string callId);

    /// <summary>
    /// Search messages by content
    /// </summary>
    Task<IEnumerable<ChatMessage>> SearchMessagesAsync(string callId, string searchTerm, int skip = 0, int limit = 50);

    /// <summary>
    /// Update message (for editing)
    /// </summary>
    Task<bool> UpdateMessageAsync(string messageId, string newContent);

    /// <summary>
    /// Soft delete a message
    /// </summary>
    Task<bool> DeleteMessageAsync(string messageId);

    /// <summary>
    /// Hard delete all messages for a call (cleanup after call ends)
    /// </summary>
    Task<long> DeleteAllByCallIdAsync(string callId);

    /// <summary>
    /// Get messages by sender
    /// </summary>
    Task<IEnumerable<ChatMessage>> GetBySenderIdAsync(string senderId, int skip = 0, int limit = 100);
}
