using DealerManagement.Domain.Common;

namespace DealerManagement.Domain.Entities.Product;

public class Product : BaseEntity
{
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public int? BrandId { get; set; }
    public string? SKU { get; set; }
    public string? Barcode { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal TaxRate { get; set; } = 0;
    public string? UnitOfMeasure { get; set; }
    public decimal MinOrderQuantity { get; set; } = 1;
    public decimal MaxOrderQuantity { get; set; } = 10000;
    public decimal ReorderLevel { get; set; } = 10;
    public decimal Weight { get; set; } = 0;
    public decimal? DiscountPercent { get; set; }

    // Navigation properties
    public Category Category { get; set; } = null!;
    public Brand? Brand { get; set; }
    public ICollection<Inventory.Stock> StockLevels { get; set; } = new List<Inventory.Stock>();
    public ICollection<Sales.OrderItem> OrderItems { get; set; } = new List<Sales.OrderItem>();
}

public class Category : BaseEntity
{
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentCategoryId { get; set; }
    public int SortOrder { get; set; } = 0;

    // Navigation properties
    public Category? ParentCategory { get; set; }
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Brand : BaseEntity
{
    public string BrandName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }

    // Navigation properties
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
