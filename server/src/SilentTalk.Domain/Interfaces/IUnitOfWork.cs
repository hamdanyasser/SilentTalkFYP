namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Unit of Work pattern for managing transactions
/// </summary>
public interface IUnitOfWork : IDisposable
{
    /// <summary>
    /// User repository
    /// </summary>
    IUserRepository Users { get; }

    /// <summary>
    /// Call repository
    /// </summary>
    ICallRepository Calls { get; }

    /// <summary>
    /// Participant repository
    /// </summary>
    IParticipantRepository Participants { get; }

    /// <summary>
    /// Contact repository
    /// </summary>
    IContactRepository Contacts { get; }

    /// <summary>
    /// Message repository (MongoDB)
    /// </summary>
    IMessageRepository Messages { get; }

    /// <summary>
    /// Recognition result repository (MongoDB)
    /// </summary>
    IRecognitionResultRepository RecognitionResults { get; }

    /// <summary>
    /// Save all changes to the database
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Begin a database transaction
    /// </summary>
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Commit the current transaction
    /// </summary>
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Rollback the current transaction
    /// </summary>
    Task RollbackTransactionAsync();
}
