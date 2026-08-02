# Deploy on Railway (free credits) — NOT Render

Railway new accounts often get **trial credits**. After credits end you may need a small paid plan.
This uses the same Docker + Postgres setup already in the repo.

> **Status (2026-08-02):** Railway **Online** + public domain live:  
> `https://dealer-management-app-production.up.railway.app` (swagger + login verified).  
> App `EXPO_PUBLIC_API_URL` points here — Norway no longer needs Cloudflare tunnel.

---

## What is already ready in code
- `backend/Dockerfile` — API image
- Postgres support (Npgsql)
- Auto tables + admin seed: `admin@dealerapp.com` / `Admin@123` (username `admin` also works)
- `backend/railway.toml`

---

## Step 1 — GitHub (required)
Repo already: https://github.com/Saadmunir8160/dealer-management-app

```powershell
cd "C:\Users\hp\OneDrive\Desktop\Dealer Management App"
git push -u origin main
```

---

## Step 2 — Railway account + plan
1. Open https://railway.app
2. Login with **GitHub**
3. If trial expired → **Activate Hobby** (required for new deploys)
4. New Project

---

## Step 3 — Add Postgres
1. In project → **+ New** → **Database** → **PostgreSQL**
2. Wait until it is Running
3. Open Postgres → **Variables** / **Connect** → copy `DATABASE_URL`
   (or use Reference Variables in the next step)

---

## Step 4 — Add API (Docker)
1. **+ New** → **GitHub Repo** → select your repo
2. Settings:
   - **Root Directory:** `backend`
   - Builder will detect `Dockerfile`
3. **Variables** (Add):

| Key | Value |
|-----|--------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `DATABASE_PROVIDER` | `postgres` |
| `ConnectionStrings__DefaultConnection` | `${{Postgres.DATABASE_URL}}` |
| `JwtSettings__Secret` | (any long random 40+ character string) |
| `JwtSettings__Issuer` | `DealerManagement.Api` |
| `JwtSettings__Audience` | `DealerManagement.Client` |
| `JwtSettings__ExpirationMinutes` | `60` |
| `JwtSettings__RefreshTokenExpirationDays` | `7` |

> In Railway UI, use **Variable Reference** to link Postgres `DATABASE_URL` if `${{...}}` autocomplete is shown.  
> If your Postgres service has a different name, pick that service’s `DATABASE_URL`.

4. Deploy → wait until success

---

## Step 5 — Public URL
1. API service → **Settings** → **Networking** → **Generate Domain**
2. You get: `https://something.up.railway.app`
3. Open: `https://something.up.railway.app/swagger`

Login test (`POST /api/auth/login`):
```json
{ "username": "admin@dealerapp.com", "password": "Admin@123" }
```
(Username `admin` also works.)

---

## Step 6 — App + client (after URL works)
1. Set `EXPO_PUBLIC_API_URL=https://something.up.railway.app` in `.env` + `eas.json`
2. New APK build (EAS)
3. Send Expo Install link to Norway client

---

## Local vs cloud
- Local PC: still SQL Server (`dotnet run`) — unchanged
- Railway: Postgres — automatic

## If Railway asks for payment
1. Prefer activate **Hobby** on Railway (simplest for this repo).
2. Or use **Render Blueprint** ([render.yaml](./render.yaml)) — free web + free Postgres (cold starts).
3. Or **Cloudflare Tunnel** for short demos ([DEPLOY-TUNNEL.md](./DEPLOY-TUNNEL.md)) — PC must stay on.
