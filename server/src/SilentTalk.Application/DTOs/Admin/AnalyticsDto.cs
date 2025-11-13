namespace SilentTalk.Application.DTOs.Admin;

/// <summary>
/// DTO for system analytics and usage reports
/// </summary>
public class SystemAnalyticsDto
{
    public UserStatistics Users { get; set; } = new();
    public CallStatistics Calls { get; set; } = new();
    public MessageStatistics Messages { get; set; } = new();
    public SystemHealth Health { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// User statistics
/// </summary>
public class UserStatistics
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int NewUsersToday { get; set; }
    public int NewUsersThisWeek { get; set; }
    public int NewUsersThisMonth { get; set; }
    public int EmailConfirmedUsers { get; set; }
    public int TwoFactorEnabledUsers { get; set; }
    public int LockedOutUsers { get; set; }
}

/// <summary>
/// Call statistics
/// </summary>
public class CallStatistics
{
    public int TotalCalls { get; set; }
    public int ActiveCalls { get; set; }
    public int CallsToday { get; set; }
    public int CallsThisWeek { get; set; }
    public int CallsThisMonth { get; set; }
    public double AverageCallDurationMinutes { get; set; }
    public int TotalParticipants { get; set; }
}

/// <summary>
/// Message statistics
/// </summary>
public class MessageStatistics
{
    public long TotalMessages { get; set; }
    public long MessagesToday { get; set; }
    public long MessagesThisWeek { get; set; }
    public long MessagesThisMonth { get; set; }
    public long TextMessages { get; set; }
    public long SignMessages { get; set; }
}

/// <summary>
/// System health metrics
/// </summary>
public class SystemHealth
{
    public string Status { get; set; } = "Healthy";
    public DatabaseHealth Database { get; set; } = new();
    public int PendingReports { get; set; }
    public int CriticalAuditLogs { get; set; }
    public double SystemUptime { get; set; }
}

/// <summary>
/// Database health metrics
/// </summary>
public class DatabaseHealth
{
    public bool IsConnected { get; set; }
    public int TotalTables { get; set; }
    public long TotalRecords { get; set; }
}

/// <summary>
/// DTO for time-series analytics
/// </summary>
public class TimeSeriesDataPoint
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}

/// <summary>
/// DTO for user growth analytics
/// </summary>
public class UserGrowthAnalytics
{
    public List<TimeSeriesDataPoint> NewUsers { get; set; } = new();
    public List<TimeSeriesDataPoint> ActiveUsers { get; set; } = new();
    public string Period { get; set; } = "daily"; // daily, weekly, monthly
}

/// <summary>
/// DTO for call usage analytics
/// </summary>
public class CallUsageAnalytics
{
    public List<TimeSeriesDataPoint> Calls { get; set; } = new();
    public List<TimeSeriesDataPoint> Participants { get; set; } = new();
    public Dictionary<string, int> CallsByHour { get; set; } = new();
    public string Period { get; set; } = "daily";
}
