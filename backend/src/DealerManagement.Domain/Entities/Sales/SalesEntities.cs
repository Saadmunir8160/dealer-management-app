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
    /// <summary>UCIC coupon / delivery slip number shown on portal.</summary>
    public string? CouponNumber { get; set; }
    /// <summary>External ERP order reference.</summary>
    public string? ErpOrderNumber { get; set; }
    /// <summary>Delivery area / zone (also mirrored to ShippingAddress).</summary>
    public string? DeliveryArea { get; set; }
    public string? Driver { get; set; }
    public string? Vehicle { get; set; }
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
