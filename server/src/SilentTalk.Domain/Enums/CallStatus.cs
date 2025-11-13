namespace SilentTalk.Domain.Enums;

/// <summary>
/// Status of a video call
/// </summary>
public enum CallStatus
{
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
    Cancelled
}
