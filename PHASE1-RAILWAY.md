# Phase 1 — Railway API → Postgres (do this in browser)

Your live API: https://dealer-management-app-production.up.railway.app  
Postgres is already **Online**. API must use it (not SSMS / SQL Server).

## Steps (2–3 minutes)

### 1) Open the API service
Railway project → click **`dealer-management-app`** → tab **Variables**

### 2) Add / edit these variables

| Variable | How to set |
|----------|------------|
| `DATABASE_URL` | Click **Add Variable** → **Add Reference** → choose **Postgres** → **`DATABASE_URL`** |
| `DATABASE_PROVIDER` | Raw value: `postgres` |
| `ASPNETCORE_ENVIRONMENT` | Raw value: `Production` |
| `JwtSettings__Secret` | Raw: any long random string (40+ chars) |
| `JwtSettings__Issuer` | Raw: `DealerManagement.Api` |
| `JwtSettings__Audience` | Raw: `DealerManagement.Client` |

> Use **Add Reference** for `DATABASE_URL` (do not paste SQL Server / SSMS connection string).

Optional (same as DATABASE_URL):  
`ConnectionStrings__DefaultConnection` → also reference Postgres `DATABASE_URL`

### 3) Redeploy
After saving variables → **Deployments** → **Redeploy**  
(or wait for auto-redeploy if GitHub push already triggered)

### 4) Test login
Swagger: https://dealer-management-app-production.up.railway.app/swagger/index.html  

`POST /api/Auth/login`:
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

Expect **200** + token (not SQL Server 500).

## Done when
- [ ] Variables set (Postgres reference)
- [ ] Redeploy finished Online
- [ ] Login returns token with `Admin@123`

Then tell the agent: **Phase 1 OK** → next is data migrate (optional) + APK rebuild.
