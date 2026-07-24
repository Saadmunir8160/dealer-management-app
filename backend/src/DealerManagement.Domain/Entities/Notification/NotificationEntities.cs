using DealerManagement.Domain.Common;
using DealerManagement.Domain.Enums;

namespace DealerManagement.Domain.Entities.Notification;

public class Notification : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public NotificationCategory Category { get; set; } = NotificationCategory.Info;
    public int? UserId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadDate { get; set; }
    public string? ActionUrl { get; set; }
    public string? ActionText { get; set; }

    // Navigation properties
    public Auth.User? User { get; set; }
}
