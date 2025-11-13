using SilentTalk.Domain.Entities;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for Resource-specific operations
/// Maps to FR-008: Resource Library
/// </summary>
public interface IResourceRepository : IRepository<Resource>
{
    Task<IEnumerable<Resource>> GetByTypeAsync(ResourceType type, CancellationToken cancellationToken = default);
    Task<IEnumerable<Resource>> GetByCategoryAsync(string category, CancellationToken cancellationToken = default);
    Task<IEnumerable<Resource>> GetBySignLanguageAsync(string signLanguage, CancellationToken cancellationToken = default);
    Task<IEnumerable<Resource>> SearchResourcesAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task IncrementViewCountAsync(Guid resourceId, CancellationToken cancellationToken = default);
}
