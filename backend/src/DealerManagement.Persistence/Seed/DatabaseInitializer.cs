using DealerManagement.Domain.Entities.Auth;
using DealerManagement.Domain.Entities.Dealer;
using DealerManagement.Domain.Entities.Product;
using DealerManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

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

        await EnsureOrderUcicColumnsAsync(db, logger, isPostgres, ct);
        await EnsureAdminAsync(db, logger, ct);
        await EnsureCatalogAsync(db, logger, ct);
        await EnsureUcIcDemoDealerAsync(db, logger, ct);
    }

    /// <summary>
    /// UCIC Customer Information demo dealer (LN 1087) — upsert so Profile is never empty for admin.
    /// </summary>
    private static async Task EnsureUcIcDemoDealerAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        const string code = "1087";
        var existing = await db.Dealers.FirstOrDefaultAsync(d => d.DealerCode == code, ct);

        if (existing == null)
        {
            var dealer = new Dealer
            {
                DealerCode = code,
                DealerName = "شركة مشيد للتجارة",
                ContactPerson = "شركة مشيد للتجارة والنقل شركة مشيد",
                Phone = "009660138870114",
                Mobile = "009660138870114",
                Email = "Amar.abuzaid@saudireadymix.com.sa",
                DealerType = DealerType.Authorized,
                Status = DealerStatus.Active,
                CreditLimit = 0,
                PaymentTermsDays = 30,
                IsActive = true,
                Notes = "UCIC demo — FullName: شركة مشيد للتجارة والنقل شركة مشيد"
            };

            dealer.Addresses.Add(new DealerAddress
            {
                AddressType = AddressType.Shipping,
                AddressLine1 = "Saudi Arabia",
                City = "Dammam",
                Country = "Saudi Arabia",
                IsDefault = true,
                IsActive = true
            });

            dealer.Contacts.Add(new DealerContact
            {
                ContactName = "Amar Abuzaid",
                Email = "Amar.abuzaid@saudireadymix.com.sa",
                Phone = "009660138870114",
                Mobile = "009660138870114",
                IsPrimary = true,
                IsActive = true
            });

            db.Dealers.Add(dealer);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded UCIC demo dealer LN {Code}", code);
            return;
        }

        existing.DealerName = "شركة مشيد للتجارة";
        existing.ContactPerson = "شركة مشيد للتجارة والنقل شركة مشيد";
        existing.Phone = "009660138870114";
        existing.Mobile = "009660138870114";
        existing.Email = "Amar.abuzaid@saudireadymix.com.sa";
        existing.CreditLimit = 0;
        existing.Status = DealerStatus.Active;
        existing.IsActive = true;
        existing.Notes = "UCIC demo — FullName: شركة مشيد للتجارة والنقل شركة مشيد";
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Ensured UCIC demo dealer LN {Code}", code);
    }

    /// <summary>
    /// EnsureCreated / older migrations may lack UCIC columns — add if missing.
    /// </summary>
    private static async Task EnsureOrderUcicColumnsAsync(AppDbContext db, ILogger logger, bool isPostgres, CancellationToken ct)
    {
        if (isPostgres)
        {
            var sql = """
                ALTER TABLE "Sales"."Orders" ADD COLUMN IF NOT EXISTS "CouponNumber" character varying(50);
                ALTER TABLE "Sales"."Orders" ADD COLUMN IF NOT EXISTS "ErpOrderNumber" character varying(100);
                ALTER TABLE "Sales"."Orders" ADD COLUMN IF NOT EXISTS "DeliveryArea" character varying(200);
                ALTER TABLE "Sales"."Orders" ADD COLUMN IF NOT EXISTS "Driver" character varying(150);
                ALTER TABLE "Sales"."Orders" ADD COLUMN IF NOT EXISTS "Vehicle" character varying(100);
                """;
            await db.Database.ExecuteSqlRawAsync(sql, ct);
        }
        else
        {
            // SQL Server: add columns only when missing
            var sql = """
                IF COL_LENGTH('Sales.Orders', 'CouponNumber') IS NULL ALTER TABLE Sales.Orders ADD CouponNumber nvarchar(50) NULL;
                IF COL_LENGTH('Sales.Orders', 'ErpOrderNumber') IS NULL ALTER TABLE Sales.Orders ADD ErpOrderNumber nvarchar(100) NULL;
                IF COL_LENGTH('Sales.Orders', 'DeliveryArea') IS NULL ALTER TABLE Sales.Orders ADD DeliveryArea nvarchar(200) NULL;
                IF COL_LENGTH('Sales.Orders', 'Driver') IS NULL ALTER TABLE Sales.Orders ADD Driver nvarchar(150) NULL;
                IF COL_LENGTH('Sales.Orders', 'Vehicle') IS NULL ALTER TABLE Sales.Orders ADD Vehicle nvarchar(100) NULL;
                """;
            await db.Database.ExecuteSqlRawAsync(sql, ct);
        }
        logger.LogInformation("Ensured UCIC order columns on Sales.Orders");
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

        await EnsureUcIcProductsAsync(db, logger, categoryId, brandId, ct);

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

    /// <summary>
    /// UCIC "Please Select Item Code" catalog — replace demo PRD products with portal LN list.
    /// </summary>
    private static async Task EnsureUcIcProductsAsync(
        AppDbContext db,
        ILogger logger,
        int categoryId,
        int brandId,
        CancellationToken ct)
    {
        // Exact UCIC portal list (Product Name + LN Code)
        var catalog = new (string Code, string Name, string Uom, decimal Price)[]
        {
            ("5719", "SCRAP-Switch Breaker القواطع", "Unit", 100m),
            ("5501", "5501", "TONS", 280m),
            ("5505", "5505 - MCT Bulk (Masonery Cement - Tameer)", "TONS", 290m),
            ("5601", "5601 - OPC Bags (إسمنت بورتلاندي عادي - مكيس)", "BAGS", 18m),
            ("5602", "5602 - SRC Bags (أسمنت مكيس مقاوم للكبريتات)", "BAGS", 19m),
            ("5603", "5603 - PPC Bags (إسمنت بورتلاندي بوزولاني - مكيس)", "BAGS", 17m),
            ("5604", "5604 - MCT Bags (إسمنت التشطيب - مكيس تعمير)", "BAGS", 20m),
            ("5703", "5703 - SCRAP-MIXED STEEL - حديد مشكل", "Unit", 150m),
            ("5828", "ttnew", "BAGS", 10m),
            ("0021", "new test", "BAGS", 10m),
            ("5557", "ttnew1", "BAGS", 10m),
            ("55", "ttnew1", "BAGS", 10m),
        };

        var keepCodes = new HashSet<string>(
            catalog.Select(c => c.Code),
            StringComparer.OrdinalIgnoreCase);

        var existing = await db.Products.IgnoreQueryFilters().ToListAsync(ct);
        var added = 0;
        var updated = 0;

        foreach (var item in catalog)
        {
            var row = existing.FirstOrDefault(p =>
                string.Equals(p.ProductCode, item.Code, StringComparison.OrdinalIgnoreCase));

            if (row == null)
            {
                db.Products.Add(new Product
                {
                    ProductCode = item.Code,
                    ProductName = item.Name,
                    SKU = item.Code,
                    Description = "UCIC item code",
                    UnitPrice = item.Price,
                    CostPrice = Math.Round(item.Price * 0.7m, 2),
                    CategoryId = categoryId,
                    BrandId = brandId,
                    UnitOfMeasure = item.Uom,
                    TaxRate = 0,
                    MinOrderQuantity = 1,
                    MaxOrderQuantity = 100000,
                    IsActive = true,
                    IsDeleted = false
                });
                added++;
            }
            else
            {
                row.ProductName = item.Name;
                row.SKU = item.Code;
                row.UnitOfMeasure = item.Uom;
                row.UnitPrice = item.Price;
                row.CostPrice = Math.Round(item.Price * 0.7m, 2);
                row.CategoryId = categoryId;
                row.BrandId = brandId;
                row.IsActive = true;
                row.IsDeleted = false;
                updated++;
            }
        }

        // Hide old demo catalog (Cement Bag / PRD-* / 5801…) from picker
        var deactivated = 0;
        foreach (var p in existing)
        {
            if (keepCodes.Contains(p.ProductCode)) continue;
            if (!p.IsActive && p.IsDeleted) continue;
            p.IsActive = false;
            p.IsDeleted = true;
            deactivated++;
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation(
            "UCIC products ensured: added={Added}, updated={Updated}, deactivated={Deactivated}",
            added, updated, deactivated);
    }
}
