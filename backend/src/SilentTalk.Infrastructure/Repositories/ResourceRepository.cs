using Microsoft.EntityFrameworkCore;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Interfaces;
using SilentTalk.Infrastructure.Data;

namespace SilentTalk.Infrastructure.Repositories;

/// <summary>
/// Resource repository implementation
/// Maps to FR-008: Resource Library
/// </summary>
public class ResourceRepository : Repository<Resource>, IResourceRepository
{
    public ResourceRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Resource>> GetByTypeAsync(ResourceType type, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.Type == type)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Resource>> GetByCategoryAsync(string category, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.Category == category)
            .OrderByDescending(r => r.AverageRating)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Resource>> GetBySignLanguageAsync(string signLanguage, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.SignLanguage == signLanguage)
            .OrderByDescending(r => r.ViewCount)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Resource>> SearchResourcesAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.Title.Contains(searchTerm) || r.Description.Contains(searchTerm))
            .OrderByDescending(r => r.AverageRating)
            .Take(50)
            .ToListAsync(cancellationToken);
    }

    public async Task IncrementViewCountAsync(Guid resourceId, CancellationToken cancellationToken = default)
    {
        var resource = await GetByIdAsync(resourceId, cancellationToken);
        if (resource != null)
        {
            resource.ViewCount++;
        }
    }
}
