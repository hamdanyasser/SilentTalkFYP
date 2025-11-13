using MongoDB.Driver;
using SilentTalk.Domain.Documents;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

public class RecognitionResultRepository : IRecognitionResultRepository
{
    private readonly IMongoCollection<RecognitionResult> _results;

    public RecognitionResultRepository(MongoDbContext context)
    {
        _results = context.RecognitionResults;
    }

    public async Task<RecognitionResult?> GetBySessionIdAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        return await _results.Find(r => r.SessionId == sessionId).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<RecognitionResult>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _results.Find(r => r.UserId == userId).ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<RecognitionResult>> GetRecentByUserIdAsync(Guid userId, int limit = 10, CancellationToken cancellationToken = default)
    {
        return await _results.Find(r => r.UserId == userId)
            .Limit(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<RecognitionResult> AddAsync(RecognitionResult recognitionResult, CancellationToken cancellationToken = default)
    {
        await _results.InsertOneAsync(recognitionResult, cancellationToken: cancellationToken);
        return recognitionResult;
    }

    public async Task<bool> UpdateAsync(RecognitionResult recognitionResult, CancellationToken cancellationToken = default)
    {
        var result = await _results.ReplaceOneAsync(
            r => r.SessionId == recognitionResult.SessionId,
            recognitionResult,
            cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> AddFramesAsync(Guid sessionId, IEnumerable<RecognitionFrame> frames, CancellationToken cancellationToken = default)
    {
        var update = Builders<RecognitionResult>.Update.PushEach(r => r.Frames, frames);
        var result = await _results.UpdateOneAsync(r => r.SessionId == sessionId, update, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<long> DeleteByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var result = await _results.DeleteManyAsync(r => r.UserId == userId, cancellationToken);
        return result.DeletedCount;
    }

    public async Task<long> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default)
    {
        var result = await _results.DeleteManyAsync(
            r => r.Frames.Any(f => f.Timestamp < cutoffDate),
            cancellationToken);
        return result.DeletedCount;
    }
}
