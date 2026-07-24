using DealerManagement.Domain.Common;
using DealerManagement.Domain.Enums;

namespace DealerManagement.Domain.Entities.Auth;

public class AuditLog : BaseEntity
{
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IPAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime ActionDate { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
}

public class ErrorLog : BaseEntity
{
    public string ErrorMessage { get; set; } = string.Empty;
    public string? StackTrace { get; set; }
    public string? Source { get; set; }
    public string? RequestUrl { get; set; }
    public string? RequestMethod { get; set; }
    public string? RequestBody { get; set; }
    public int? UserId { get; set; }
    public string? IPAddress { get; set; }
    public LogLevel LogLevel { get; set; } = LogLevel.Error;
    public DateTime ErrorDate { get; set; } = DateTime.UtcNow;
    public bool IsResolved { get; set; } = false;
}
