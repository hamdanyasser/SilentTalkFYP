using SilentTalk.Domain.Entities;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for Participant entity
/// </summary>
public interface IParticipantRepository : IRepository<Participant>
{
    /// <summary>
    /// Get participants by call ID
    /// </summary>
    Task<IEnumerable<Participant>> GetByCallIdAsync(Guid callId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get participant with user details
    /// </summary>
    Task<Participant?> GetWithUserAsync(Guid participantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get active participants in a call
    /// </summary>
    Task<IEnumerable<Participant>> GetActiveParticipantsAsync(Guid callId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get participant by call and user
    /// </summary>
    Task<Participant?> GetByCallAndUserAsync(Guid callId, Guid userId, CancellationToken cancellationToken = default);
}
