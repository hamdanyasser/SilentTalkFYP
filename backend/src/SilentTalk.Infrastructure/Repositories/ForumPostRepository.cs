using Microsoft.EntityFrameworkCore;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

/// <summary>
/// Forum post repository implementation
/// Maps to FR-007: Community Forum
/// </summary>
public class ForumPostRepository : Repository<ForumPost>, IForumPostRepository
{
    public ForumPostRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ForumPost>> GetTopLevelPostsAsync(string? category = null, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Where(p => p.ParentPostId == null)
            .Include(p => p.Author);

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(p => p.Category == category);
        }

        return await query
            .OrderByDescending(p => p.IsPinned)
            .ThenByDescending(p => p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ForumPost>> GetPostRepliesAsync(Guid postId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.ParentPostId == postId)
            .Include(p => p.Author)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ForumPost>> SearchPostsAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.Title.Contains(searchTerm) || p.Content.Contains(searchTerm))
            .Include(p => p.Author)
            .OrderByDescending(p => p.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);
    }
}
