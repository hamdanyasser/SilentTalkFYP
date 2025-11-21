using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SilentTalk.Application.DTOs.SignalR;
using SilentTalk.Application.Services;
using System.Security.Cryptography;
using System.Text;

namespace SilentTalk.Infrastructure.Services;

/// <summary>
/// Service for providing ICE server configuration with support for Twilio and Xirsys
/// </summary>
public class IceServerConfigService : IIceServerConfigService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<IceServerConfigService> _logger;

    public IceServerConfigService(
        IConfiguration configuration,
        ILogger<IceServerConfigService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public Task<IceConfigurationDto> GetIceConfigurationAsync()
    {
        var config = new IceConfigurationDto();

        // Add Google STUN servers (public, no auth required)
        config.IceServers.Add(new IceServerDto
        {
            Urls = new List<string>
            {
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302"
            }
        });

        // Add custom STUN servers from configuration
        var customStunUrls = _configuration.GetSection("WebRTC:StunServers").Get<List<string>>();
        if (customStunUrls?.Any() == true)
        {
            config.IceServers.Add(new IceServerDto
            {
                Urls = customStunUrls
            });
        }

        // Add TURN servers with static credentials (if configured)
        var turnUrls = _configuration.GetSection("WebRTC:TurnServers").Get<List<string>>();
        var turnUsername = _configuration["WebRTC:TurnUsername"];
        var turnCredential = _configuration["WebRTC:TurnCredential"];

        if (turnUrls?.Any() == true && !string.IsNullOrEmpty(turnUsername) && !string.IsNullOrEmpty(turnCredential))
        {
            config.IceServers.Add(new IceServerDto
            {
                Urls = turnUrls,
                Username = turnUsername,
                Credential = turnCredential
            });
        }

        // Set ICE transport policy
        config.IceTransportPolicy = _configuration["WebRTC:IceTransportPolicy"] ?? "all";

        return Task.FromResult(config);
    }

    public async Task<IceConfigurationDto> GetIceConfigurationWithCredentialsAsync(string userId)
    {
        var config = await GetIceConfigurationAsync();

        // Try to get Twilio credentials
        var twilioConfig = await GetTwilioIceServersAsync(userId);
        if (twilioConfig != null)
        {
            config.IceServers.AddRange(twilioConfig.IceServers);
        }

        // Try to get Xirsys credentials
        var xirsysConfig = await GetXirsysIceServersAsync(userId);
        if (xirsysConfig != null)
        {
            config.IceServers.AddRange(xirsysConfig.IceServers);
        }

        // Try to get Coturn with time-limited credentials
        var coturnConfig = GetCoturnIceServersWithTimeLimitedCredentials(userId);
        if (coturnConfig != null)
        {
            config.IceServers.AddRange(coturnConfig.IceServers);
        }

        return config;
    }

    private async Task<IceConfigurationDto?> GetTwilioIceServersAsync(string userId)
    {
        var accountSid = _configuration["Twilio:AccountSid"];
        var authToken = _configuration["Twilio:AuthToken"];

        if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken))
        {
            _logger.LogDebug("Twilio credentials not configured");
            return null;
        }

        try
        {
            // In production, call Twilio API to get time-limited TURN credentials
            // For now, return null - implement when needed
            _logger.LogInformation("Twilio ICE server configuration requested for user {UserId}", userId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Twilio ICE servers");
            return null;
        }
    }

    private async Task<IceConfigurationDto?> GetXirsysIceServersAsync(string userId)
    {
        var channel = _configuration["Xirsys:Channel"];
        var ident = _configuration["Xirsys:Ident"];
        var secret = _configuration["Xirsys:Secret"];

        if (string.IsNullOrEmpty(channel) || string.IsNullOrEmpty(ident) || string.IsNullOrEmpty(secret))
        {
            _logger.LogDebug("Xirsys credentials not configured");
            return null;
        }

        try
        {
            // In production, call Xirsys API to get TURN credentials
            // For now, return null - implement when needed
            _logger.LogInformation("Xirsys ICE server configuration requested for user {UserId}", userId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Xirsys ICE servers");
            return null;
        }
    }

    private IceConfigurationDto? GetCoturnIceServersWithTimeLimitedCredentials(string userId)
    {
        var turnUrl = _configuration["WebRTC:Coturn:Url"];
        var sharedSecret = _configuration["WebRTC:Coturn:SharedSecret"];

        if (string.IsNullOrEmpty(turnUrl) || string.IsNullOrEmpty(sharedSecret))
        {
            return null;
        }

        try
        {
            // Generate time-limited credentials using TURN REST API (RFC 5389)
            var expirationSeconds = int.Parse(_configuration["WebRTC:Coturn:CredentialTTL"] ?? "86400"); // 24 hours
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + expirationSeconds;
            var username = $"{timestamp}:{userId}";

            // Generate HMAC-SHA1 credential
            using var hmac = new HMACSHA1(Encoding.UTF8.GetBytes(sharedSecret));
            var credentialBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(username));
            var credential = Convert.ToBase64String(credentialBytes);

            return new IceConfigurationDto
            {
                IceServers = new List<IceServerDto>
                {
                    new IceServerDto
                    {
                        Urls = new List<string> { turnUrl },
                        Username = username,
                        Credential = credential
                    }
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Coturn time-limited credentials");
            return null;
        }
    }
}
