using DealerManagement.Domain.Common;
using DealerManagement.Domain.Enums;

namespace DealerManagement.Domain.Entities.Finance;

public class Payment : BaseEntity
{
    public int OrderId { get; set; }
    public int DealerId { get; set; }
    public string PaymentReference { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public string? TransactionId { get; set; }
    public string? Notes { get; set; }
    public int? ReceivedBy { get; set; }

    // Navigation properties
    public Sales.Order Order { get; set; } = null!;
    public Dealer.Dealer Dealer { get; set; } = null!;
    public Auth.User? ReceivedByUser { get; set; }
}

public class Invoice : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public int DealerId { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public Sales.Order Order { get; set; } = null!;
    public Dealer.Dealer Dealer { get; set; } = null!;
}

public class Tax : BaseEntity
{
    public string TaxName { get; set; } = string.Empty;
    public TaxType TaxType { get; set; }
    public decimal Rate { get; set; }
    public DateTime EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Description { get; set; }
}
