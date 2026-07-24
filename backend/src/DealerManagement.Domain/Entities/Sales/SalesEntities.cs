using DealerManagement.Domain.Common;
using DealerManagement.Domain.Enums;

namespace DealerManagement.Domain.Entities.Sales;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public int DealerId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? DeliveryDate { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal TotalAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public string? ShippingAddress { get; set; }
    public string? BillingAddress { get; set; }
    public string? Notes { get; set; }
    public string? ReferenceNumber { get; set; }
    public int? SalesPersonId { get; set; }

    // Navigation properties
    public Dealer.Dealer Dealer { get; set; } = null!;
    public Auth.User? SalesPerson { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<Finance.Payment> Payments { get; set; } = new List<Finance.Payment>();
    public Finance.Invoice? Invoice { get; set; }
}

public class OrderItem : BaseEntity
{
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; } = 0;
    public decimal TaxRate { get; set; } = 0;
    public string? Notes { get; set; }

    // Navigation properties
    public Order Order { get; set; } = null!;
    public Product.Product Product { get; set; } = null!;
}
