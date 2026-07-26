# Migrates core tables from local SQL Server (SSMS) → Railway Postgres.
# Usage (PowerShell):
#   $env:PG_URL = "postgresql://..."   # from Railway Postgres Variables
#   .\tools\Migrate-SqlServerToPostgres.ps1

param(
  [string]$SqlServer = "localhost\SQLEXPRESS",
  [string]$SqlDatabase = "DealerManagementDB",
  [string]$PgUrl = $env:PG_URL
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($PgUrl)) {
  Write-Host "ERROR: Set PG_URL to Railway Postgres DATABASE_URL first." -ForegroundColor Red
  Write-Host 'Example: $env:PG_URL = "postgresql://user:pass@host:port/railway"'
  exit 1
}

function Get-SqlRows([string]$query) {
  $cs = "Server=$SqlServer;Database=$SqlDatabase;Trusted_Connection=True;TrustServerCertificate=True;"
  $conn = New-Object System.Data.SqlClient.SqlConnection $cs
  $conn.Open()
  try {
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $query
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter $cmd
    $table = New-Object System.Data.DataTable
    [void]$adapter.Fill($table)
    return $table
  }
  finally { $conn.Close() }
}

Write-Host "Reading local SQL Server: $SqlServer / $SqlDatabase"
$dealers = Get-SqlRows "SELECT Id, DealerCode, DealerName, Email, Phone, Status, IsActive, IsDeleted, CreatedDate FROM Dealers WHERE IsDeleted = 0"
$products = Get-SqlRows "SELECT Id, ProductCode, ProductName, Description, UnitPrice, CostPrice, TaxRate, SKU, UnitOfMeasure, IsActive, IsDeleted, CreatedDate FROM Products WHERE IsDeleted = 0"
$orders = Get-SqlRows "SELECT TOP 500 Id, OrderNumber, DealerId, OrderDate, Status, SubTotal, TaxAmount, DiscountAmount, ShippingCost, TotalAmount, PaymentStatus, ShippingAddress, Notes, IsActive, IsDeleted, CreatedDate FROM Orders WHERE IsDeleted = 0 ORDER BY Id"

Write-Host ("Dealers={0} Products={1} Orders={2}" -f $dealers.Rows.Count, $products.Rows.Count, $orders.Rows.Count)
Write-Host ""
Write-Host "NOTE: Full automated insert into Railway Postgres needs the 'psql' client or Npgsql."
Write-Host "Phase 1 must work first (API + DATABASE_URL). Then either:"
Write-Host "  1) Use DBeaver: SQL Server → Postgres copy"
Write-Host "  2) Paste PG_URL here and ask agent to finish inserts after psql/dotnet tool is available"
Write-Host ""
Write-Host "Counts exported OK from SSMS. Open PHASE2-MIGRATE.md for copy order."
