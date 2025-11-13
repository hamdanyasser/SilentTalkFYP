using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// MongoDB entity for chat messages during calls
/// </summary>
public class ChatMessage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("messageId")]
    public string MessageId { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("callId")]
    [BsonRequired]
    public string CallId { get; set; } = string.Empty;

    [BsonElement("senderId")]
    [BsonRequired]
    public string SenderId { get; set; } = string.Empty;

    [BsonElement("senderName")]
    public string SenderName { get; set; } = string.Empty;

    [BsonElement("content")]
    [BsonRequired]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Message type: "text", "sign", "system"
    /// </summary>
    [BsonElement("type")]
    public string Type { get; set; } = "text";

    [BsonElement("timestamp")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [BsonElement("replyToId")]
    [BsonIgnoreIfNull]
    public string? ReplyToId { get; set; }

    /// <summary>
    /// True if message has been edited
    /// </summary>
    [BsonElement("isEdited")]
    public bool IsEdited { get; set; }

    [BsonElement("editedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    [BsonIgnoreIfNull]
    public DateTime? EditedAt { get; set; }

    /// <summary>
    /// True if message has been deleted
    /// </summary>
    [BsonElement("isDeleted")]
    public bool IsDeleted { get; set; }

    [BsonElement("deletedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    [BsonIgnoreIfNull]
    public DateTime? DeletedAt { get; set; }

    /// <summary>
    /// Additional metadata (reactions, attachments, etc.)
    /// </summary>
    [BsonElement("metadata")]
    [BsonIgnoreIfNull]
    public BsonDocument? Metadata { get; set; }
}
