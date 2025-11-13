using SilentTalk.Application.DTOs.SignalR;

namespace SilentTalk.Application.Services;

/// <summary>
/// Service for providing ICE server configuration (STUN/TURN)
/// </summary>
public interface IIceServerConfigService
{
    /// <summary>
    /// Get ICE server configuration for WebRTC
    /// </summary>
    Task<IceConfigurationDto> GetIceConfigurationAsync();

    /// <summary>
    /// Get ICE servers with time-limited credentials (for TURN servers)
    /// </summary>
    Task<IceConfigurationDto> GetIceConfigurationWithCredentialsAsync(string userId);
}
