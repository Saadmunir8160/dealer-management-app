using DealerManagement.Application.Interfaces;
using DealerManagement.Domain.Common;
using DealerManagement.Domain.Entities.Auth;
using DealerManagement.Domain.Entities.Config;
using DealerManagement.Domain.Entities.Dealer;
using DealerManagement.Domain.Entities.Finance;
using DealerManagement.Domain.Entities.Inventory;
using DealerManagement.Domain.Entities.Notification;
using DealerManagement.Domain.Entities.Product;
using DealerManagement.Domain.Entities.Sales;
using DealerManagement.Persistence;
using Microsoft.EntityFrameworkCore.Storage;

namespace DealerManagement.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _transaction;

    // Private repository fields
    private IGenericRepository<User>? _users;
    private IGenericRepository<Role>? _roles;
    private IGenericRepository<Permission>? _permissions;
    private IGenericRepository<UserRole>? _userRoles;
    private IGenericRepository<RolePermission>? _rolePermissions;
    private IGenericRepository<AuditLog>? _auditLogs;
    private IGenericRepository<ErrorLog>? _errorLogs;
    private IGenericRepository<Dealer>? _dealers;
    private IGenericRepository<DealerAddress>? _dealerAddresses;
    private IGenericRepository<DealerContact>? _dealerContacts;
    private IGenericRepository<Product>? _products;
    private IGenericRepository<Category>? _categories;
    private IGenericRepository<Brand>? _brands;
    private IGenericRepository<Order>? _orders;
    private IGenericRepository<OrderItem>? _orderItems;
    private IGenericRepository<Payment>? _payments;
    private IGenericRepository<Invoice>? _invoices;
    private IGenericRepository<Tax>? _taxes;
    private IGenericRepository<Warehouse>? _warehouses;
    private IGenericRepository<Stock>? _stock;
    private IGenericRepository<StockMovement>? _stockMovements;
    private IGenericRepository<Notification>? _notifications;
    private IGenericRepository<AppSetting>? _appSettings;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    // Auth
    public IGenericRepository<User> Users => _users ??= new GenericRepository<User>(_context);
    public IGenericRepository<Role> Roles => _roles ??= new GenericRepository<Role>(_context);
    public IGenericRepository<Permission> Permissions => _permissions ??= new GenericRepository<Permission>(_context);
    public IGenericRepository<UserRole> UserRoles => _userRoles ??= new GenericRepository<UserRole>(_context);
    public IGenericRepository<RolePermission> RolePermissions => _rolePermissions ??= new GenericRepository<RolePermission>(_context);
    public IGenericRepository<AuditLog> AuditLogs => _auditLogs ??= new GenericRepository<AuditLog>(_context);
    public IGenericRepository<ErrorLog> ErrorLogs => _errorLogs ??= new GenericRepository<ErrorLog>(_context);

    // Dealers
    public IGenericRepository<Dealer> Dealers => _dealers ??= new GenericRepository<Dealer>(_context);
    public IGenericRepository<DealerAddress> DealerAddresses => _dealerAddresses ??= new GenericRepository<DealerAddress>(_context);
    public IGenericRepository<DealerContact> DealerContacts => _dealerContacts ??= new GenericRepository<DealerContact>(_context);

    // Products
    public IGenericRepository<Product> Products => _products ??= new GenericRepository<Product>(_context);
    public IGenericRepository<Category> Categories => _categories ??= new GenericRepository<Category>(_context);
    public IGenericRepository<Brand> Brands => _brands ??= new GenericRepository<Brand>(_context);

    // Sales
    public IGenericRepository<Order> Orders => _orders ??= new GenericRepository<Order>(_context);
    public IGenericRepository<OrderItem> OrderItems => _orderItems ??= new GenericRepository<OrderItem>(_context);

    // Finance
    public IGenericRepository<Payment> Payments => _payments ??= new GenericRepository<Payment>(_context);
    public IGenericRepository<Invoice> Invoices => _invoices ??= new GenericRepository<Invoice>(_context);
    public IGenericRepository<Tax> Taxes => _taxes ??= new GenericRepository<Tax>(_context);

    // Inventory
    public IGenericRepository<Warehouse> Warehouses => _warehouses ??= new GenericRepository<Warehouse>(_context);
    public IGenericRepository<Stock> Stock => _stock ??= new GenericRepository<Stock>(_context);
    public IGenericRepository<StockMovement> StockMovements => _stockMovements ??= new GenericRepository<StockMovement>(_context);

    // Notifications
    public IGenericRepository<Notification> Notifications => _notifications ??= new GenericRepository<Notification>(_context);

    // Config
    public IGenericRepository<AppSetting> AppSettings => _appSettings ??= new GenericRepository<AppSetting>(_context);

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
            }
        }
        catch
        {
            await RollbackTransactionAsync();
            throw;
        }
        finally
        {
            _transaction?.Dispose();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
