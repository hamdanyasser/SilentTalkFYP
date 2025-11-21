using SilentTalk.Domain.Common;
using SilentTalk.Domain.Enums;

namespace SilentTalk.Domain.Entities;

/// <summary>
/// Contact entity representing user connections/friendships
/// </summary>
public class Contact : BaseEntity
{
    /// <summary>
    /// Contact ID (Primary Key)
    /// </summary>
    public Guid ContactId { get; set; }

    /// <summary>
    /// ID of the user who owns this contact (Foreign Key)
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// ID of the user who is the contact (Foreign Key)
    /// </summary>
    public Guid ContactUserId { get; set; }

    /// <summary>
    /// Status of the contact relationship
    /// </summary>
    public ContactStatus Status { get; set; }

    /// <summary>
    /// Timestamp when the contact was added
    /// </summary>
    public DateTime AddedAt { get; set; }

    // Navigation properties

    /// <summary>
    /// The user who owns this contact
    /// </summary>
    public ApplicationUser User { get; set; } = null!;

    /// <summary>
    /// The user who is the contact
    /// </summary>
    public ApplicationUser ContactUser { get; set; } = null!;
}
