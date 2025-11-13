using Microsoft.EntityFrameworkCore.Storage;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly MongoDbContext _mongoContext;
    private IDbContextTransaction? _transaction;

    private IUserRepository? _users;
    private ICallRepository? _calls;
    private IParticipantRepository? _participants;
    private IContactRepository? _contacts;
    private IMessageRepository? _messages;
    private IRecognitionResultRepository? _recognitionResults;

    public UnitOfWork(ApplicationDbContext context, MongoDbContext mongoContext)
    {
        _context = context;
        _mongoContext = mongoContext;
    }

    public IUserRepository Users => _users ??= new UserRepository(_context);

    public ICallRepository Calls => _calls ??= new CallRepository(_context);

    public IParticipantRepository Participants => _participants ??= new ParticipantRepository(_context);

    public IContactRepository Contacts => _contacts ??= new ContactRepository(_context);

    public IMessageRepository Messages => _messages ??= new MessageRepository(_mongoContext);

    public IRecognitionResultRepository RecognitionResults =>
        _recognitionResults ??= new RecognitionResultRepository(_mongoContext);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
