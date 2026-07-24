# Deploy on Railway (free credits) — NOT Render

Railway new accounts often get **trial credits**. After credits end you may need a small paid plan.
This uses the same Docker + Postgres setup already in the repo.

---

## What is already ready in code
- `backend/Dockerfile` — API image
- Postgres support (Npgsql)
- Auto tables + admin seed: `admin` / `Admin@123`
- `backend/railway.toml`

---

## Step 1 — GitHub (required)
1. Create repo: https://github.com/new
2. Push project:

```powershell
cd "C:\Users\hp\OneDrive\Desktop\Dealer Management App"
git init
git add .
git commit -m "Deploy ready for Railway (Docker + Postgres)"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2 — Railway account
1. Open https://railway.app
2. Login with **GitHub**
3. New Project

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
{ "username": "admin", "password": "Admin@123" }
```

---

## Step 6 — App + client (after URL works)
Tell the agent your Railway URL, then:
1. Set `EXPO_PUBLIC_API_URL=https://something.up.railway.app`
2. New APK build (EAS)
3. Send Expo Install link to Norway client

---

## Local vs cloud
- Local PC: still SQL Server (`dotnet run`) — unchanged
- Railway: Postgres — automatic

## If Railway asks for payment
Use **Oracle Cloud Always Free** VM instead (more setup). Ask the agent for Oracle steps if needed.
