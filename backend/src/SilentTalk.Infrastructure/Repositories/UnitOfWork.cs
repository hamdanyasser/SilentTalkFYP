using Microsoft.EntityFrameworkCore.Storage;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation for transaction management
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(
        ApplicationDbContext context,
        IUserRepository users,
        ICallRepository calls,
        IContactRepository contacts,
        IForumPostRepository forumPosts,
        IResourceRepository resources)
    {
        _context = context;
        Users = users;
        Calls = calls;
        Contacts = contacts;
        ForumPosts = forumPosts;
        Resources = resources;
    }

    public IUserRepository Users { get; }
    public ICallRepository Calls { get; }
    public IContactRepository Contacts { get; }
    public IForumPostRepository ForumPosts { get; }
    public IResourceRepository Resources { get; }

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

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
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
