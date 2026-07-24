# Cloudflare Tunnel (Option A) — client APK without cloud hosting

## What is running
- Local API: `dotnet run` on port **5246**
- Tunnel: `tools/cloudflared.exe tunnel --url http://127.0.0.1:5246`
- Current public URL (changes if you restart quick tunnel):

```text
https://indicator-hansen-slot-fighters.trycloudflare.com
```

## Client test checklist
1. Keep **dotnet run** running
2. Keep **cloudflared** running (same URL as baked into APK)
3. Client installs APK built with this `EXPO_PUBLIC_API_URL`
4. Login: `admin` / `Admin@123`

## Restart tunnel later
```powershell
cd "C:\Users\hp\OneDrive\Desktop\Dealer Management App"
.\tools\cloudflared.exe tunnel --url http://127.0.0.1:5246
```
Copy the **new** `https://….trycloudflare.com` URL → update `.env` + `eas.json` → **rebuild APK**.

## Swagger via tunnel
`https://YOUR-TUNNEL.trycloudflare.com/swagger`
