using System.Text;
using DealerManagement.Api.Middleware;
using DealerManagement.Application;
using DealerManagement.Application.Interfaces;
using DealerManagement.Infrastructure;
using DealerManagement.Persistence;
using DealerManagement.Persistence.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Cloud (Railway/etc.): PORT. Local: all interfaces so APK can use http://192.168.x.x:5246
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://*:{port}");
}
else
{
    // Do not bind localhost-only — physical devices / APK need LAN access
    builder.WebHost.UseUrls("http://0.0.0.0:5246");
}

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();
builder.Host.UseSerilog();

// Prefer cloud env (Railway/Render) over local appsettings SQL Server.
// In Production, never fall back to local SSMS connection baked into the image.
var isProduction = builder.Environment.IsProduction()
    || string.Equals(
        Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
        "Production",
        StringComparison.OrdinalIgnoreCase);

var connectionString = isProduction
    ? FirstNonEmpty(
        Environment.GetEnvironmentVariable("DATABASE_URL"),
        Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection"))
    : FirstNonEmpty(
        Environment.GetEnvironmentVariable("DATABASE_URL"),
        Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection"),
        builder.Configuration["ConnectionStrings:DefaultConnection"],
        builder.Configuration.GetConnectionString("DefaultConnection"));

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        isProduction
            ? "Production requires DATABASE_URL (or ConnectionStrings__DefaultConnection) pointing to Railway Postgres. Set it in Railway Variables → Add Reference → Postgres.DATABASE_URL"
            : "Database connection string missing. Set DATABASE_URL or ConnectionStrings__DefaultConnection.");
}

// Render often gives postgres:// — convert to Npgsql format
connectionString = NormalizeConnectionString(connectionString);
var usePostgres = IsPostgresConnection(connectionString);

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (usePostgres)
    {
        options.UseNpgsql(
            connectionString,
            b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName));
    }
    else
    {
        options.UseSqlServer(
            connectionString,
            b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName));
    }

    options.ConfigureWarnings(warnings =>
        warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
});

Log.Information("Database provider: {Provider}", usePostgres ? "PostgreSQL" : "SQL Server");

// Add Application Services
builder.Services.AddApplicationServices();

// Add Infrastructure Services
builder.Services.AddInfrastructureServices(builder.Configuration);

// Add Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JwtSettings missing");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Mobile APK has no CORS origin; allow all for API clients
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactNative", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(
        httpContext => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
});

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

// Swagger available in all environments (useful to test Render URL)
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Dealer Management API v1"));

app.UseRateLimiter();
app.UseCors("AllowReactNative");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));

// DB init (local SQL Server migrations OR Postgres EnsureCreated + seed)
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("DatabaseInitializer");
    try
    {
        await DatabaseInitializer.InitializeAsync(dbContext, logger);
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Database initialization failed. API will still start.");
    }
}

Log.Information("API listening. Swagger at /swagger");
app.Run();

static string? FirstNonEmpty(params string?[] values)
{
    foreach (var v in values)
    {
        if (!string.IsNullOrWhiteSpace(v))
            return v;
    }
    return null;
}

static bool IsPostgresConnection(string cs)
{
    var v = cs.Trim();
    return v.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
           || v.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
           || v.Contains("Host=", StringComparison.OrdinalIgnoreCase)
           || Environment.GetEnvironmentVariable("DATABASE_PROVIDER")
               ?.Equals("postgres", StringComparison.OrdinalIgnoreCase) == true;
}

static string NormalizeConnectionString(string cs)
{
    // postgres://user:pass@host:port/db → Npgsql key-value
    if (!cs.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
        && !cs.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        return cs;
    }

    var uri = new Uri(cs);
    var userInfo = uri.UserInfo.Split(':', 2);
    var username = Uri.UnescapeDataString(userInfo[0]);
    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
    var database = uri.AbsolutePath.Trim('/');

    return $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
}
