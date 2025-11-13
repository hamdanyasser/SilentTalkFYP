using SilentTalk.Domain.Entities;

namespace SilentTalk.Domain.Interfaces;

/// <summary>
/// Repository interface for ForumPost-specific operations
/// Maps to FR-007: Community Forum
/// </summary>
public interface IForumPostRepository : IRepository<ForumPost>
{
    Task<IEnumerable<ForumPost>> GetTopLevelPostsAsync(string? category = null, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<IEnumerable<ForumPost>> GetPostRepliesAsync(Guid postId, CancellationToken cancellationToken = default);
    Task<IEnumerable<ForumPost>> SearchPostsAsync(string searchTerm, CancellationToken cancellationToken = default);
}
