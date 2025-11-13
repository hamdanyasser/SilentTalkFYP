namespace SilentTalk.Api.Middleware;

/// <summary>
/// Middleware to add security headers to all HTTP responses
/// Implements security best practices for web applications
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Prevent clickjacking attacks
        context.Response.Headers.Add("X-Frame-Options", "DENY");

        // Prevent MIME type sniffing
        context.Response.Headers.Add("X-Content-Type-Options", "nosniff");

        // Enable XSS protection in older browsers
        context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");

        // Enforce HTTPS (only add in production)
        if (!context.Request.Host.Host.Contains("localhost"))
        {
            context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }

        // Content Security Policy - restrictive by default
        context.Response.Headers.Add("Content-Security-Policy",
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'");

        // Referrer policy
        context.Response.Headers.Add("Referrer-Policy", "no-referrer");

        // Permissions policy (restrict features)
        context.Response.Headers.Add("Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()");

        await _next(context);
    }
}

/// <summary>
/// Extension method to register SecurityHeadersMiddleware
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}
