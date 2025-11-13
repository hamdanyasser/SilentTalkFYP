using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SilentTalk.Domain.Documents;

/// <summary>
/// Recognition result document for MongoDB storage
/// </summary>
public class RecognitionResult
{
    /// <summary>
    /// Session ID (Primary identifier)
    /// </summary>
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public Guid SessionId { get; set; }

    /// <summary>
    /// ID of the user performing the signs
    /// </summary>
    [BsonElement("userId")]
    [BsonRepresentation(BsonType.String)]
    public Guid UserId { get; set; }

    /// <summary>
    /// Array of recognition frames
    /// </summary>
    [BsonElement("frames")]
    public List<RecognitionFrame> Frames { get; set; } = new();
}

/// <summary>
/// Individual recognition frame within a session
/// </summary>
public class RecognitionFrame
{
    /// <summary>
    /// Timestamp of this frame (ISO-8601 format)
    /// </summary>
    [BsonElement("timestamp")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Array of predictions for this frame
    /// </summary>
    [BsonElement("predictions")]
    public List<Prediction> Predictions { get; set; } = new();
}

/// <summary>
/// Individual prediction within a recognition frame
/// </summary>
public class Prediction
{
    /// <summary>
    /// Recognized sign
    /// </summary>
    [BsonElement("sign")]
    public string Sign { get; set; } = string.Empty;

    /// <summary>
    /// Confidence score (0.0 to 1.0)
    /// </summary>
    [BsonElement("confidence")]
    public double Confidence { get; set; }
}
