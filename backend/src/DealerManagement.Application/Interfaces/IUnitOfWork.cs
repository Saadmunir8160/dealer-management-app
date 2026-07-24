using DealerManagement.Domain.Entities.Auth;
using DealerManagement.Domain.Entities.Config;
using DealerManagement.Domain.Entities.Dealer;
using DealerManagement.Domain.Entities.Finance;
using DealerManagement.Domain.Entities.Inventory;
using DealerManagement.Domain.Entities.Notification;
using DealerManagement.Domain.Entities.Product;
using DealerManagement.Domain.Entities.Sales;

namespace DealerManagement.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    // Auth
    IGenericRepository<User> Users { get; }
    IGenericRepository<Role> Roles { get; }
    IGenericRepository<Permission> Permissions { get; }
    IGenericRepository<UserRole> UserRoles { get; }
    IGenericRepository<RolePermission> RolePermissions { get; }
    IGenericRepository<AuditLog> AuditLogs { get; }
    IGenericRepository<ErrorLog> ErrorLogs { get; }

    // Dealers
    IGenericRepository<Dealer> Dealers { get; }
    IGenericRepository<DealerAddress> DealerAddresses { get; }
    IGenericRepository<DealerContact> DealerContacts { get; }

    // Products
    IGenericRepository<Product> Products { get; }
    IGenericRepository<Category> Categories { get; }
    IGenericRepository<Brand> Brands { get; }

    // Sales
    IGenericRepository<Order> Orders { get; }
    IGenericRepository<OrderItem> OrderItems { get; }

    // Finance
    IGenericRepository<Payment> Payments { get; }
    IGenericRepository<Invoice> Invoices { get; }
    IGenericRepository<Tax> Taxes { get; }

    // Inventory
    IGenericRepository<Warehouse> Warehouses { get; }
    IGenericRepository<Stock> Stock { get; }
    IGenericRepository<StockMovement> StockMovements { get; }

    // Notifications
    IGenericRepository<Notification> Notifications { get; }

    // Config
    IGenericRepository<AppSetting> AppSettings { get; }

    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
