using SilentTalk.Domain.Documents;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for RecognitionResult document
/// </summary>
public interface IRecognitionResultRepository
{
    /// <summary>
    /// Get recognition result by session ID
    /// </summary>
    Task<RecognitionResult?> GetBySessionIdAsync(Guid sessionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recognition results by user ID
    /// </summary>
    Task<IEnumerable<RecognitionResult>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recent recognition results for a user
    /// </summary>
    Task<IEnumerable<RecognitionResult>> GetRecentByUserIdAsync(Guid userId, int limit = 10, CancellationToken cancellationToken = default);

    /// <summary>
    /// Add a new recognition result
    /// </summary>
    Task<RecognitionResult> AddAsync(RecognitionResult recognitionResult, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing recognition result
    /// </summary>
    Task<bool> UpdateAsync(RecognitionResult recognitionResult, CancellationToken cancellationToken = default);

    /// <summary>
    /// Add frames to an existing recognition session
    /// </summary>
    Task<bool> AddFramesAsync(Guid sessionId, IEnumerable<RecognitionFrame> frames, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete recognition results for a user
    /// </summary>
    Task<long> DeleteByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete old recognition results
    /// </summary>
    Task<long> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);
}
