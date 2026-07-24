using DealerManagement.Domain.Entities.Auth;
using Microsoft.EntityFrameworkCore;

namespace DealerManagement.Persistence.Seed;

public static class SeedData
{
    public static void SeedRoles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, RoleName = "SuperAdmin", Description = "Full system access", IsActive = true },
            new Role { Id = 2, RoleName = "Admin", Description = "Administrative access", IsActive = true },
            new Role { Id = 3, RoleName = "Manager", Description = "Managerial access", IsActive = true },
            new Role { Id = 4, RoleName = "SalesPerson", Description = "Sales operations", IsActive = true },
            new Role { Id = 5, RoleName = "User", Description = "Basic user access", IsActive = true }
        );
    }

    public static void SeedPermissions(ModelBuilder modelBuilder)
    {
        var permissions = new List<Permission>();
        int id = 1;
        string[] modules = { "Dealers", "Orders", "Products", "Reports", "Users", "Settings", "Inventory" };
        string[] actions = { "View", "Create", "Edit", "Delete", "Export" };

        foreach (var module in modules)
        {
            foreach (var action in actions)
            {
                permissions.Add(new Permission
                {
                    Id = id++,
                    PermissionName = $"{module}.{action}",
                    Description = $"Can {action.ToLower()} {module.ToLower()}",
                    Module = module,
                    IsActive = true
                });
            }
        }

        modelBuilder.Entity<Permission>().HasData(permissions);
    }

    public static void SeedUsers(ModelBuilder modelBuilder)
    {
        // Password: Admin@123 (BCrypt workFactor 11)
        var passwordHash = "$2a$11$9nqRkEOOZBs1Bq6.SXjgaOkv3rggl3439OmuNdIgs./DJFNir60/2";
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@dealerapp.com",
                PasswordHash = passwordHash,
                FirstName = "System",
                LastName = "Administrator",
                PhoneNumber = "+1234567890",
                IsActive = true
            }
        );

        // Assign SuperAdmin role
        modelBuilder.Entity<UserRole>().HasData(
            new UserRole { Id = 1, UserId = 1, RoleId = 1, IsActive = true }
        );
    }
}
