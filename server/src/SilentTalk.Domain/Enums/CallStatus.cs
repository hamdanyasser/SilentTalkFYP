namespace SilentTalk.Domain.Enums;

/// <summary>
/// Status of a video call
/// </summary>
public enum CallStatus
{
    /// <summary>
    /// Call is scheduled for the future
    /// </summary>
    Scheduled,

    /// <summary>
    /// Call is currently active
    /// </summary>
    Active,

    /// <summary>
    /// Call has ended normally
    /// </summary>
    Ended,

    /// <summary>
    /// Call was cancelled before completion
    /// </summary>
    Cancelled,

    /// <summary>
    /// Scheduled call was missed (no one joined)
    /// </summary>
    Missed
}
