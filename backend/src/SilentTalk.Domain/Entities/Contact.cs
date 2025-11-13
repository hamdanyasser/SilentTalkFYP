namespace SilentTalk.Domain.Entities;

/// <summary>
/// Contact entity for user contact management
/// Maps to FR-006: Contact Management
/// </summary>
public class Contact : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ContactUserId { get; set; }
    public ContactStatus Status { get; set; }
    public DateTime AddedAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual User ContactUser { get; set; } = null!;
}

public enum ContactStatus
{
    Pending,
    Accepted,
    Blocked
}
