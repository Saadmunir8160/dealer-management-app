using DealerManagement.Domain.Common;
using DealerManagement.Domain.Enums;

namespace DealerManagement.Domain.Entities.Inventory;

public class Warehouse : BaseEntity
{
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? ManagerName { get; set; }
    public string? ContactNumber { get; set; }
    public decimal Capacity { get; set; } = 0;

    // Navigation properties
    public ICollection<Stock> StockLevels { get; set; } = new List<Stock>();
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
}

public class Stock : BaseEntity
{
    public int ProductId { get; set; }
    public int WarehouseId { get; set; }
    public decimal QuantityOnHand { get; set; } = 0;
    public decimal QuantityReserved { get; set; } = 0;
    public decimal MinStockLevel { get; set; } = 0;
    public decimal MaxStockLevel { get; set; } = 0;
    public DateTime? LastStockDate { get; set; }

    // Navigation properties
    public Product.Product Product { get; set; } = null!;
    public Warehouse Warehouse { get; set; } = null!;
}

public class StockMovement : BaseEntity
{
    public int ProductId { get; set; }
    public int WarehouseId { get; set; }
    public StockMovementType MovementType { get; set; }
    public decimal Quantity { get; set; }
    public int? OrderId { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public DateTime MovementDate { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Product.Product Product { get; set; } = null!;
    public Warehouse Warehouse { get; set; } = null!;
    public Sales.Order? Order { get; set; }
}
