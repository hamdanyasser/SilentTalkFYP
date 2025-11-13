using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using SilentTalk.Api.Middleware;
using SilentTalk.Application.Repositories;
using SilentTalk.Application.Services;
using SilentTalk.Domain.Entities;
using SilentTalk.Infrastructure.Data;
using SilentTalk.Infrastructure.Repositories;
using SilentTalk.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// Configure Serilog
// ============================================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// ============================================
// Add services to the container
// ============================================

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("SilentTalk.Infrastructure")));

// ============================================
// ASP.NET Core Identity Configuration
// ============================================
var identitySettings = builder.Configuration.GetSection("IdentitySettings");

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = identitySettings.GetValue<bool>("PasswordRequireDigit", true);
    options.Password.RequireLowercase = identitySettings.GetValue<bool>("PasswordRequireLowercase", true);
    options.Password.RequireUppercase = identitySettings.GetValue<bool>("PasswordRequireUppercase", true);
    options.Password.RequireNonAlphanumeric = identitySettings.GetValue<bool>("PasswordRequireNonAlphanumeric", true);
    options.Password.RequiredLength = identitySettings.GetValue<int>("PasswordRequiredLength", 8);
    options.Password.RequiredUniqueChars = identitySettings.GetValue<int>("PasswordRequiredUniqueChars", 1);

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(
        identitySettings.GetValue<int>("LockoutTimeSpanMinutes", 15));
    options.Lockout.MaxFailedAccessAttempts = identitySettings.GetValue<int>("MaxFailedAccessAttempts", 5);
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = identitySettings.GetValue<bool>("RequireUniqueEmail", true);
    options.SignIn.RequireConfirmedEmail = identitySettings.GetValue<bool>("RequireConfirmedEmail", false);

    // Token settings
    options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultProvider;
    options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultProvider;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// ============================================
// JWT Authentication Configuration
// ============================================
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero // No tolerance for expired tokens
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
            {
                context.Response.Headers.Add("Token-Expired", "true");
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ============================================
// Rate Limiting Configuration
// ============================================
var rateLimitSettings = builder.Configuration.GetSection("RateLimiting");

builder.Services.AddRateLimiter(options =>
{
    // General fixed window rate limiter
    options.AddFixedWindowLimiter("fixed", limiterOptions =>
    {
        limiterOptions.PermitLimit = rateLimitSettings.GetValue<int>("GeneralLimit", 100);
        limiterOptions.Window = TimeSpan.FromSeconds(rateLimitSettings.GetValue<int>("GeneralWindow", 60));
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0;
    });

    // Sliding window for login attempts
    options.AddSlidingWindowLimiter("sliding", limiterOptions =>
    {
        limiterOptions.PermitLimit = rateLimitSettings.GetValue<int>("LoginLimit", 5);
        limiterOptions.Window = TimeSpan.FromSeconds(rateLimitSettings.GetValue<int>("LoginWindow", 900));
        limiterOptions.SegmentsPerWindow = 3;
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsync("Too many requests. Please try again later.", cancellationToken: token);
    };
});

// ============================================
// Application Services
// ============================================

// JWT Token Service
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// SignalR Services
builder.Services.AddSingleton<ICallRoomService, CallRoomService>();
builder.Services.AddScoped<IIceServerConfigService, IceServerConfigService>();

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICallRepository, CallRepository>();
builder.Services.AddScoped<IParticipantRepository, ParticipantRepository>();
builder.Services.AddScoped<IContactRepository, ContactRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IUserReportRepository, UserReportRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ============================================
// FluentValidation
// ============================================
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<SilentTalk.Application.Validators.RegisterRequestValidator>();

// ============================================
// SignalR Configuration
// ============================================
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    options.MaximumReceiveMessageSize = 102400; // 100 KB
});

// ============================================
// CORS
// ============================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173") // React dev servers
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR
    });
});

// ============================================
// Controllers
// ============================================
builder.Services.AddControllers();

// ============================================
// Swagger/OpenAPI with JWT Support
// ============================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SilentTalk API",
        Version = "v1",
        Description = "REST API for SilentTalk - Real-time Sign Language Recognition Platform",
        Contact = new OpenApiContact
        {
            Name = "SilentTalk Team",
            Email = "support@silenttalk.com"
        }
    });

    // JWT Bearer authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ============================================
// Health Checks
// ============================================
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgres",
        tags: new[] { "db", "postgres" })
    .AddRedis(
        builder.Configuration.GetConnectionString("Redis")!,
        name: "redis",
        tags: new[] { "cache", "redis" });

var app = builder.Build();

// ============================================
// Configure the HTTP request pipeline
// ============================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SilentTalk API V1");
        c.DocumentTitle = "SilentTalk API Documentation";
    });
}

// HTTPS redirection
app.UseHttpsRedirection();

// Request logging
app.UseSerilogRequestLogging();

// Security headers (must be early in pipeline)
app.UseSecurityHeaders();

// Rate limiting
app.UseRateLimiter();

// CORS (before authentication)
app.UseCors("AllowAll");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Activity tracking for idle timeout (after authentication)
app.UseActivityTracking();

// Map controllers
app.MapControllers();

// Map SignalR hubs
app.MapHub<SilentTalk.Api.Hubs.CallHub>("/hubs/call");

// Health check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");
app.MapHealthChecks("/health/live");

// Root endpoint
app.MapGet("/", () => new
{
    service = "SilentTalk API",
    version = "1.0.0",
    status = "running",
    timestamp = DateTime.UtcNow
});

// ============================================
// Run application
// ============================================

try
{
    Log.Information("Starting SilentTalk API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application start-up failed");
}
finally
{
    Log.CloseAndFlush();
}
