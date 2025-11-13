using SilentTalk.Domain.Entities;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for Call-specific operations
/// Maps to FR-003: Video Conferencing
/// </summary>
public interface ICallRepository : IRepository<Call>
{
    Task<Call?> GetByIdWithParticipantsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Call>> GetActiveCallsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Call>> GetCallHistoryByUserAsync(Guid userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task EndCallAsync(Guid callId, CancellationToken cancellationToken = default);
}
