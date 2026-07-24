namespace DealerManagement.Domain.Common;

/// <summary>
/// Base entity that all domain entities inherit from.
/// Provides common audit fields, soft-delete, and identity.
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public int? UpdatedBy { get; set; }
    public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
}
