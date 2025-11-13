using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SilentTalk.Domain.Documents;

/// <summary>
/// Message document for MongoDB storage
/// </summary>
public class Message
{
    /// <summary>
    /// Message ID (MongoDB ObjectId, mapped as string for UUID compatibility)
    /// </summary>
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public Guid MessageId { get; set; }

    /// <summary>
    /// ID of the call this message belongs to
    /// </summary>
    [BsonElement("callId")]
    [BsonRepresentation(BsonType.String)]
    public Guid CallId { get; set; }

    /// <summary>
    /// ID of the user who sent the message
    /// </summary>
    [BsonElement("senderId")]
    [BsonRepresentation(BsonType.String)]
    public Guid SenderId { get; set; }

    /// <summary>
    /// Content of the message
    /// </summary>
    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when the message was sent (ISO-8601 format)
    /// </summary>
    [BsonElement("timestamp")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Type of message: "text" or "sign"
    /// </summary>
    [BsonElement("type")]
    public string Type { get; set; } = "text";
}
