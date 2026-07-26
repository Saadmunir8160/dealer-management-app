# Phase 2 — SSMS (SQL Server) → Railway Postgres data migrate

**Blocked until Phase 1 login works** (token with `admin` / `Admin@123`).

## After Phase 1 OK

### Option A — Demo only (fast)
Skip SSMS copy. Use Railway seeded `admin`. Create dealers/orders in the app.

### Option B — Full data copy (DBeaver)
1. Install [DBeaver](https://dbeaver.io/download/)
2. Connect **SQL Server**: `localhost\SQLEXPRESS` / database `DealerManagementDB`
3. Connect **Postgres**: paste Railway Postgres `DATABASE_URL` (Postgres service → Variables → `DATABASE_URL`)
4. Copy tables in FK-safe order, e.g.:
   - Roles, Permissions, RolePermissions
   - Users, UserRoles
   - Dealers, DealerAddresses, DealerContacts
   - Categories, Brands, Products
   - Orders, OrderItems
   - Payments, Invoices (if any)

### Option C — Agent-assisted migrate
When Phase 1 is OK, paste Railway Postgres `DATABASE_URL` (private OK in chat if you trust session) and ask agent to run export/import script against local SSMS.

## Then Phase 3 — APK
Set `EXPO_PUBLIC_API_URL=https://dealer-management-app-production.up.railway.app` → EAS rebuild → send Install link to Norway.
