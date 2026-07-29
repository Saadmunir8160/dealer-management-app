# UCIC Shared Backend — A0 / A1 Lock

> Goal: Webapp + App share **same API** (`d:\ucic_api`) and **same DB** (`UcicLive`).  
> APK build is **last** (Phase C). Frontend wiring starts after backend milestones.

## A0 — Locked (local)

| Item | Value |
|------|--------|
| API folder | `D:\ucic_api` |
| Solution | `D:\ucic_api\UCIC.sln` |
| Local base URL | `http://127.0.0.1:5152` |
| Swagger | `http://127.0.0.1:5152/swagger` |
| Health | `GET /api/Health/CheckStatus` → `"server is running"` |
| Database | `UcicLive` on `208.64.33.128` (see `Api/appsettings.json` → `ConnectionStrings:DefaultConnection`) |
| Launch profile | `http` → `applicationUrl: http://localhost:5152` |

### Start API
```powershell
cd D:\ucic_api\Api
$env:ASPNETCORE_ENVIRONMENT='Development'
dotnet run --launch-profile http
```

### Fix applied (A0)
- Missing `wwwroot\Resume` (and siblings) caused startup crash.
- `Program.cs` now auto-creates `wwwroot/{News,Payment,Vendors,Product,Resume}` on boot.

---

## A1 — Auth ready (verified)

| Item | Value |
|------|--------|
| Login | `POST /api/Auth/Login` |
| Body | `{ "email": "admin@ucic.com", "password": "Admin@123" }` |
| Response | `{ userId, name, role, token }` |
| Roles | `Admin`, `User` (seeded) |
| JWT header | `Authorization: Bearer {token}` |
| Check session | `GET /api/Auth/CheckLogin` → `true` |
| CORS | `AllowAnyOrigin` + any method/header (Expo web `8081` / LAN OK) |
| Seeded admin | email `admin@ucic.com` / password `Admin@123` (from `DataSeeder`) |

### Verified locally (2026-07-26)
- Health OK  
- Login OK → JWT issued, role `Admin`  
- CheckLogin OK with Bearer token  
- CORS policy already open for app clients  

### App notes (for Phase B — not yet)
- App currently calls `/auth/login` on DealerManagement API — must switch to `/Auth/Login` + `email` field + read `token` (not nested `data.token` unless adapter wraps it).
- No refresh-token endpoint in UCIC Auth (logout + CheckLogin only).

---

## Next: A2 — Orders API verify
- `GET /api/Order/GetMyOrders`
- `GET /api/Order/GetAllOrders`
- `GET /api/Order/GetOrderByOrderId/{id}`
- `POST /api/Order/CreateOrder`

> Note: during A0/A1 smoke, `GetAllOrders` returned **500** once — investigate in A2 (do not block A1).

## Milestone order reminder
`A0 ✅ → A1 ✅ → A2 → A3 → A4 → B1… → C2 APK last`
