namespace SilentTalk.Domain.Enums;

/// <summary>
/// Status of a contact relationship
/// </summary>
public enum ContactStatus
{
    /// <summary>
    /// Contact request is pending acceptance
    /// </summary>
    Pending,

    /// <summary>
    /// Contact request has been accepted
    /// </summary>
    Accepted,

    /// <summary>
    /// Contact has been blocked
    /// </summary>
    Blocked
}
