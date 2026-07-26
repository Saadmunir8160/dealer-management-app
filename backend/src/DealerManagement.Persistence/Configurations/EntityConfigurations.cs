using DealerManagement.Domain.Entities.Auth;
using DealerManagement.Domain.Entities.Config;
using DealerManagement.Domain.Entities.Dealer;
using DealerManagement.Domain.Entities.Finance;
using DealerManagement.Domain.Entities.Inventory;
using DealerManagement.Domain.Entities.Notification;
using DealerManagement.Domain.Entities.Product;
using DealerManagement.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealerManagement.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users", "Auth");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Username).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Email).HasMaxLength(255).IsRequired();
        builder.Property(e => e.PasswordHash).HasMaxLength(500).IsRequired();
        builder.Property(e => e.FirstName).HasMaxLength(100);
        builder.Property(e => e.LastName).HasMaxLength(100);
        builder.Property(e => e.PhoneNumber).HasMaxLength(20);
        builder.Property(e => e.ProfilePictureUrl).HasMaxLength(500);
        builder.Property(e => e.RefreshToken).HasMaxLength(500);
        builder.Property(e => e.ResetToken).HasMaxLength(500);

        builder.HasIndex(e => e.Username).IsUnique();
        builder.HasIndex(e => e.Email).IsUnique();
    }
}

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles", "Auth");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.RoleName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.HasIndex(e => e.RoleName).IsUnique();
    }
}

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Permissions", "Auth");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.PermissionName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.Property(e => e.Module).HasMaxLength(100).IsRequired();
    }
}

public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.ToTable("UserRoles", "Auth");
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.User).WithMany(e => e.UserRoles).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Role).WithMany(e => e.UserRoles).HasForeignKey(e => e.RoleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.UserId, e.RoleId }).IsUnique();
    }
}

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("RolePermissions", "Auth");
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Role).WithMany(e => e.RolePermissions).HasForeignKey(e => e.RoleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Permission).WithMany(e => e.RolePermissions).HasForeignKey(e => e.PermissionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.RoleId, e.PermissionId }).IsUnique();
    }
}

public class DealerConfiguration : IEntityTypeConfiguration<Dealer>
{
    public void Configure(EntityTypeBuilder<Dealer> builder)
    {
        builder.ToTable("Dealers", "Dealer");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.DealerCode).HasMaxLength(50).IsRequired();
        builder.Property(e => e.DealerName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.ContactPerson).HasMaxLength(200);
        builder.Property(e => e.Email).HasMaxLength(255);
        builder.Property(e => e.Phone).HasMaxLength(20);
        builder.Property(e => e.Mobile).HasMaxLength(20);
        builder.Property(e => e.Website).HasMaxLength(500);
        builder.Property(e => e.TaxId).HasMaxLength(50);
        builder.Property(e => e.RegistrationNumber).HasMaxLength(100);
        builder.Property(e => e.CreditLimit).HasColumnType("decimal(18,2)");

        builder.HasIndex(e => e.DealerCode).IsUnique();
        builder.HasIndex(e => e.DealerName);
        builder.HasIndex(e => e.Status);
    }
}

public class DealerAddressConfiguration : IEntityTypeConfiguration<DealerAddress>
{
    public void Configure(EntityTypeBuilder<DealerAddress> builder)
    {
        builder.ToTable("DealerAddresses", "Dealer");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.AddressLine1).HasMaxLength(500);
        builder.Property(e => e.AddressLine2).HasMaxLength(500);
        builder.Property(e => e.City).HasMaxLength(100);
        builder.Property(e => e.State).HasMaxLength(100);
        builder.Property(e => e.PostalCode).HasMaxLength(20);
        builder.Property(e => e.Country).HasMaxLength(100);
        builder.Property(e => e.Latitude).HasColumnType("decimal(18,8)");
        builder.Property(e => e.Longitude).HasColumnType("decimal(18,8)");

        builder.HasOne(e => e.Dealer).WithMany(e => e.Addresses).HasForeignKey(e => e.DealerId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class DealerContactConfiguration : IEntityTypeConfiguration<DealerContact>
{
    public void Configure(EntityTypeBuilder<DealerContact> builder)
    {
        builder.ToTable("DealerContacts", "Dealer");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ContactName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Designation).HasMaxLength(100);
        builder.Property(e => e.Email).HasMaxLength(255);
        builder.Property(e => e.Phone).HasMaxLength(20);
        builder.Property(e => e.Mobile).HasMaxLength(20);

        builder.HasOne(e => e.Dealer).WithMany(e => e.Contacts).HasForeignKey(e => e.DealerId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products", "Product");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ProductCode).HasMaxLength(50).IsRequired();
        builder.Property(e => e.ProductName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.SKU).HasMaxLength(100);
        builder.Property(e => e.Barcode).HasMaxLength(100);
        builder.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
        builder.Property(e => e.CostPrice).HasColumnType("decimal(18,2)");
        builder.Property(e => e.TaxRate).HasColumnType("decimal(5,2)");
        builder.Property(e => e.UnitOfMeasure).HasMaxLength(50);
        builder.Property(e => e.Weight).HasColumnType("decimal(18,4)");
        builder.Property(e => e.DiscountPercent).HasColumnType("decimal(5,2)");

        builder.HasIndex(e => e.ProductCode).IsUnique();
        builder.HasIndex(e => e.SKU);
        builder.HasOne(e => e.Category).WithMany(e => e.Products).HasForeignKey(e => e.CategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Brand).WithMany(e => e.Products).HasForeignKey(e => e.BrandId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories", "Product");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.CategoryName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(1000);

        builder.HasOne(e => e.ParentCategory).WithMany(e => e.SubCategories).HasForeignKey(e => e.ParentCategoryId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.ToTable("Brands", "Product");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.BrandName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(1000);
        builder.Property(e => e.LogoUrl).HasMaxLength(500);
    }
}

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders", "Sales");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.OrderNumber).HasMaxLength(50).IsRequired();
        builder.Property(e => e.SubTotal).HasColumnType("decimal(18,2)");
        builder.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
        builder.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");
        builder.Property(e => e.ShippingCost).HasColumnType("decimal(18,2)");
        builder.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
        builder.Property(e => e.ShippingAddress).HasMaxLength(1000);
        builder.Property(e => e.BillingAddress).HasMaxLength(1000);
        builder.Property(e => e.Notes).HasMaxLength(2000);
        builder.Property(e => e.ReferenceNumber).HasMaxLength(100);
        builder.Property(e => e.CouponNumber).HasMaxLength(50);
        builder.Property(e => e.ErpOrderNumber).HasMaxLength(100);
        builder.Property(e => e.DeliveryArea).HasMaxLength(200);
        builder.Property(e => e.Driver).HasMaxLength(150);
        builder.Property(e => e.Vehicle).HasMaxLength(100);

        builder.HasIndex(e => e.OrderNumber).IsUnique();
        builder.HasIndex(e => e.DealerId);
        builder.HasIndex(e => e.Status);
        builder.HasOne(e => e.Dealer).WithMany(e => e.Orders).HasForeignKey(e => e.DealerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.SalesPerson).WithMany().HasForeignKey(e => e.SalesPersonId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems", "Sales");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
        builder.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
        builder.Property(e => e.DiscountPercent).HasColumnType("decimal(5,2)");
        builder.Property(e => e.TaxRate).HasColumnType("decimal(5,2)");
        builder.Property(e => e.Notes).HasMaxLength(500);

        builder.HasOne(e => e.Order).WithMany(e => e.OrderItems).HasForeignKey(e => e.OrderId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Product).WithMany(e => e.OrderItems).HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments", "Finance");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.PaymentReference).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Amount).HasColumnType("decimal(18,2)");
        builder.Property(e => e.TransactionId).HasMaxLength(200);
        builder.Property(e => e.Notes).HasMaxLength(1000);

        builder.HasOne(e => e.Order).WithMany(e => e.Payments).HasForeignKey(e => e.OrderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Dealer).WithMany(e => e.Payments).HasForeignKey(e => e.DealerId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("Invoices", "Finance");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.InvoiceNumber).HasMaxLength(50).IsRequired();
        builder.Property(e => e.SubTotal).HasColumnType("decimal(18,2)");
        builder.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
        builder.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");
        builder.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
        builder.Property(e => e.PaidAmount).HasColumnType("decimal(18,2)");
        builder.Property(e => e.BalanceAmount).HasColumnType("decimal(18,2)");
        builder.Property(e => e.Notes).HasMaxLength(1000);

        builder.HasIndex(e => e.InvoiceNumber).IsUnique();
        builder.HasOne(e => e.Order).WithOne(e => e.Invoice).HasForeignKey<Invoice>(e => e.OrderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Dealer).WithMany(e => e.Invoices).HasForeignKey(e => e.DealerId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class TaxConfiguration : IEntityTypeConfiguration<Tax>
{
    public void Configure(EntityTypeBuilder<Tax> builder)
    {
        builder.ToTable("Taxes", "Finance");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.TaxName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Rate).HasColumnType("decimal(5,2)");
        builder.Property(e => e.Description).HasMaxLength(500);
    }
}

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("Warehouses", "Inventory");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.WarehouseCode).HasMaxLength(50).IsRequired();
        builder.Property(e => e.WarehouseName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Address).HasMaxLength(500);
        builder.Property(e => e.City).HasMaxLength(100);
        builder.Property(e => e.State).HasMaxLength(100);
        builder.Property(e => e.Country).HasMaxLength(100);
        builder.Property(e => e.ManagerName).HasMaxLength(200);
        builder.Property(e => e.ContactNumber).HasMaxLength(20);
        builder.Property(e => e.Capacity).HasColumnType("decimal(18,2)");

        builder.HasIndex(e => e.WarehouseCode).IsUnique();
    }
}

public class StockConfiguration : IEntityTypeConfiguration<Stock>
{
    public void Configure(EntityTypeBuilder<Stock> builder)
    {
        builder.ToTable("Stock", "Inventory");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.QuantityOnHand).HasColumnType("decimal(18,2)");
        builder.Property(e => e.QuantityReserved).HasColumnType("decimal(18,2)");
        builder.Property(e => e.MinStockLevel).HasColumnType("decimal(18,2)");
        builder.Property(e => e.MaxStockLevel).HasColumnType("decimal(18,2)");

        builder.HasIndex(e => new { e.ProductId, e.WarehouseId }).IsUnique();
        builder.HasOne(e => e.Product).WithMany(e => e.StockLevels).HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Warehouse).WithMany(e => e.StockLevels).HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("StockMovements", "Inventory");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
        builder.Property(e => e.ReferenceNumber).HasMaxLength(100);
        builder.Property(e => e.Notes).HasMaxLength(500);

        builder.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Warehouse).WithMany(e => e.StockMovements).HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Order).WithMany().HasForeignKey(e => e.OrderId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications", "Notification");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Title).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Message).HasMaxLength(2000).IsRequired();
        builder.Property(e => e.ActionUrl).HasMaxLength(500);
        builder.Property(e => e.ActionText).HasMaxLength(100);

        builder.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs", "Logging");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Action).HasMaxLength(100).IsRequired();
        builder.Property(e => e.EntityType).HasMaxLength(100).IsRequired();
        builder.Property(e => e.OldValues).HasMaxLength(4000);
        builder.Property(e => e.NewValues).HasMaxLength(4000);
        builder.Property(e => e.IPAddress).HasMaxLength(50);
        builder.Property(e => e.UserAgent).HasMaxLength(500);

        builder.HasOne(e => e.User).WithMany(e => e.AuditLogs).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class ErrorLogConfiguration : IEntityTypeConfiguration<ErrorLog>
{
    public void Configure(EntityTypeBuilder<ErrorLog> builder)
    {
        builder.ToTable("ErrorLogs", "Logging");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ErrorMessage).HasMaxLength(4000).IsRequired();
        builder.Property(e => e.StackTrace).HasMaxLength(4000);
        builder.Property(e => e.Source).HasMaxLength(500);
        builder.Property(e => e.RequestUrl).HasMaxLength(2000);
        builder.Property(e => e.RequestMethod).HasMaxLength(10);
        builder.Property(e => e.RequestBody).HasMaxLength(4000);
        builder.Property(e => e.IPAddress).HasMaxLength(50);
    }
}

public class AppSettingConfiguration : IEntityTypeConfiguration<AppSetting>
{
    public void Configure(EntityTypeBuilder<AppSetting> builder)
    {
        builder.ToTable("AppSettings", "Config");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.SettingKey).HasMaxLength(100).IsRequired();
        builder.Property(e => e.SettingValue).HasMaxLength(4000).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.Property(e => e.Category).HasMaxLength(100);

        builder.HasIndex(e => e.SettingKey).IsUnique();
    }
}
