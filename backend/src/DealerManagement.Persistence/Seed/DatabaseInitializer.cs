using DealerManagement.Domain.Entities.Auth;
using DealerManagement.Domain.Entities.Dealer;
using DealerManagement.Domain.Entities.Product;
using DealerManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DealerManagement.Persistence.Seed;

/// <summary>
/// Runtime seed for cloud (Postgres) where SQL Server migrations are not applied.
/// </summary>
public static class DatabaseInitializer
{
    public static async Task InitializeAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        var provider = db.Database.ProviderName ?? "";
        var isPostgres = provider.Contains("Npgsql", StringComparison.OrdinalIgnoreCase);

        if (isPostgres)
        {
            // SQL Server migrations are incompatible with Postgres — create schema from model
            await db.Database.EnsureCreatedAsync(ct);
            logger.LogInformation("Postgres schema ensured via EnsureCreated");
        }
        else
        {
            await db.Database.MigrateAsync(ct);
            logger.LogInformation("SQL Server migrations applied");
        }

        await EnsureAdminAsync(db, logger, ct);
        await EnsureCatalogAsync(db, logger, ct);
    }

    private static async Task EnsureCatalogAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        // Categories + brands first (products need CategoryId)
        if (!await db.Categories.AnyAsync(ct))
        {
            db.Categories.Add(new Category
            {
                CategoryName = "Building Materials",
                Description = "Construction supplies",
                SortOrder = 1,
                IsActive = true
            });
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded default category");
        }

        if (!await db.Brands.AnyAsync(ct))
        {
            db.Brands.Add(new Brand
            {
                BrandName = "UCIC",
                Description = "Default brand",
                IsActive = true
            });
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded default brand");
        }

        var categoryId = await db.Categories.Select(c => c.Id).FirstAsync(ct);
        var brandId = await db.Brands.Select(b => b.Id).FirstAsync(ct);

        if (!await db.Products.AnyAsync(ct))
        {
            var products = new (string Code, string Name, string Sku, decimal Price)[]
            {
                ("PRD-CEM", "Cement Bag", "CB001", 1200m),
                ("PRD-STL", "Steel Rod", "SR001", 2500m),
                ("PRD-BRK", "Bricks", "BR001", 18m),
                ("PRD-SND", "Sand (per cubic ft)", "SD001", 150m),
                ("PRD-GRV", "Gravel (per cubic ft)", "GR001", 200m),
                ("PRD-PNT", "Paint (20L)", "PT001", 3500m),
                ("PRD-PVC", "PVC Pipe (per meter)", "PV001", 450m),
            };

            foreach (var p in products)
            {
                db.Products.Add(new Product
                {
                    ProductCode = p.Code,
                    ProductName = p.Name,
                    SKU = p.Sku,
                    UnitPrice = p.Price,
                    CostPrice = Math.Round(p.Price * 0.7m, 2),
                    CategoryId = categoryId,
                    BrandId = brandId,
                    UnitOfMeasure = "Unit",
                    TaxRate = 0,
                    MinOrderQuantity = 1,
                    MaxOrderQuantity = 100000,
                    IsActive = true
                });
            }

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded {Count} products", products.Length);
        }

        if (!await db.Dealers.AnyAsync(ct))
        {
            var dealers = new[]
            {
                new { Code = "DLR-ABC", Name = "ABC Traders", Contact = "Ahmed Ali", Phone = "03001111111", Email = "abc@gmail.com", City = "Lahore", Area = "Main Road, Block 5" },
                new { Code = "DLR-XYZ", Name = "XYZ Traders", Contact = "Ali Khan", Phone = "03002222222", Email = "xyz@gmail.com", City = "Karachi", Area = "Mall Road, Saddar" },
                new { Code = "DLR-ANR", Name = "Al-Noor Builders Supply", Contact = "Usman Tariq", Phone = "03111234567", Email = "alnoor@gmail.com", City = "Islamabad", Area = "GT Road, Sector G-9" },
                new { Code = "DLR-PKT", Name = "Pak Steel Distributors", Contact = "Bilal Hassan", Phone = "03219876543", Email = "paksteel@gmail.com", City = "Faisalabad", Area = "Industrial Estate" },
                new { Code = "DLR-SRN", Name = "Sunrise Building Supplies", Contact = "Sara Ahmed", Phone = "03335554433", Email = "sunrise@gmail.com", City = "Lahore", Area = "Raiwind Road" },
            };

            foreach (var d in dealers)
            {
                var dealer = new Dealer
                {
                    DealerCode = d.Code,
                    DealerName = d.Name,
                    ContactPerson = d.Contact,
                    Phone = d.Phone,
                    Mobile = d.Phone,
                    Email = d.Email,
                    DealerType = DealerType.Authorized,
                    Status = DealerStatus.Active,
                    CreditLimit = 500000,
                    PaymentTermsDays = 30,
                    IsActive = true,
                    Notes = d.Area
                };

                dealer.Addresses.Add(new DealerAddress
                {
                    AddressType = AddressType.Shipping,
                    AddressLine1 = d.Area,
                    City = d.City,
                    Country = "Pakistan",
                    IsDefault = true,
                    IsActive = true
                });

                dealer.Contacts.Add(new DealerContact
                {
                    ContactName = d.Contact,
                    Email = d.Email,
                    Phone = d.Phone,
                    Mobile = d.Phone,
                    IsPrimary = true,
                    IsActive = true
                });

                db.Dealers.Add(dealer);
            }

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded {Count} dealers", dealers.Length);
        }
    }

    private static async Task EnsureAdminAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        const string adminPassword = "Admin@123";

        if (!await db.Roles.AnyAsync(ct))
        {
            db.Roles.AddRange(
                new Role { RoleName = "SuperAdmin", Description = "Full system access", IsActive = true },
                new Role { RoleName = "Admin", Description = "Administrative access", IsActive = true },
                new Role { RoleName = "Manager", Description = "Managerial access", IsActive = true },
                new Role { RoleName = "SalesPerson", Description = "Sales operations", IsActive = true },
                new Role { RoleName = "User", Description = "Basic user access", IsActive = true }
            );
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded roles");
        }

        if (!await db.Permissions.AnyAsync(ct))
        {
            var permissions = new List<Permission>();
            string[] modules = { "Dealers", "Orders", "Products", "Reports", "Users", "Settings", "Inventory" };
            string[] actions = { "View", "Create", "Edit", "Delete", "Export" };
            foreach (var module in modules)
            {
                foreach (var action in actions)
                {
                    permissions.Add(new Permission
                    {
                        PermissionName = $"{module}.{action}",
                        Description = $"Can {action.ToLower()} {module.ToLower()}",
                        Module = module,
                        IsActive = true
                    });
                }
            }
            db.Permissions.AddRange(permissions);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded permissions");
        }

        var admin = await db.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Username == "admin" || u.Email == "admin@dealerapp.com", ct);

        if (admin == null)
        {
            admin = new User
            {
                Username = "admin",
                Email = "admin@dealerapp.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                FirstName = "System",
                LastName = "Administrator",
                PhoneNumber = "+1234567890",
                IsActive = true
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync(ct);

            var superAdmin = await db.Roles.FirstAsync(r => r.RoleName == "SuperAdmin", ct);
            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = superAdmin.Id, IsActive = true });
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded admin user admin / Admin@123");
        }
        else
        {
            var needsReset = false;
            try
            {
                needsReset = !BCrypt.Net.BCrypt.Verify(adminPassword, admin.PasswordHash);
            }
            catch
            {
                needsReset = true;
            }

            if (needsReset || (admin.LockedUntil.HasValue && admin.LockedUntil > DateTime.UtcNow))
            {
                admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
                admin.FailedLoginAttempts = 0;
                admin.LockedUntil = null;
                admin.IsActive = true;
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Reset admin password to Admin@123");
            }
        }
    }
}
