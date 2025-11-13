using Microsoft.AspNetCore.Identity;
using SilentTalk.Domain.Entities;
using System.Security.Claims;

namespace SilentTalk.Api.Middleware;

/// <summary>
/// Middleware to track user activity for idle timeout detection
/// Updates LastActivityAt timestamp on each authenticated request
/// </summary>
public class ActivityTrackingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ActivityTrackingMiddleware> _logger;

    public ActivityTrackingMiddleware(
        RequestDelegate next,
        ILogger<ActivityTrackingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        // Only track activity for authenticated requests
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId != null && Guid.TryParse(userId, out var userGuid))
            {
                try
                {
                    var user = await userManager.FindByIdAsync(userId);
                    if (user != null)
                    {
                        // Update last activity timestamp
                        user.LastActivityAt = DateTime.UtcNow;
                        await userManager.UpdateAsync(user);
                    }
                }
                catch (Exception ex)
                {
                    // Log error but don't fail the request
                    _logger.LogError(ex, "Error updating LastActivityAt for user {UserId}", userId);
                }
            }
        }

        await _next(context);
    }
}

/// <summary>
/// Extension method to register ActivityTrackingMiddleware
/// </summary>
public static class ActivityTrackingMiddlewareExtensions
{
    public static IApplicationBuilder UseActivityTracking(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ActivityTrackingMiddleware>();
    }
}
