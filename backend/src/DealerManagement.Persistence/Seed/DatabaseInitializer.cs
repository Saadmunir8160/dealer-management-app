using DealerManagement.Domain.Entities.Auth;
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
