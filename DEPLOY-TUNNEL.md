# Cloudflare Tunnel (Option A) — client APK without cloud hosting

## What is running
- Local API: `dotnet run` on port **5246**
- Tunnel: `tools/cloudflared.exe tunnel --url http://127.0.0.1:5246`
- Current public URL (changes if you restart quick tunnel):

```text
https://moderators-parliament-fragrances-brook.trycloudflare.com
```

## Norway client (when Railway has no public domain yet)
1. Keep **dotnet run** + **cloudflared** running on this PC (do not close / sleep)
2. APK / IPA must use the **exact** URL above in `EXPO_PUBLIC_API_URL` (`eas.json` preview/production)
3. Client installs Expo Install link
4. Login: `admin` / `Admin@123` (or `admin@dealerapp.com`)
5. For always-on (PC off OK): Railway → service → **Settings → Networking → Generate Domain**, then set that URL in `.env` + `eas.json` + OTA/APK

## Client test checklist
1. Keep **dotnet run** running
2. Keep **cloudflared** running (same URL as baked into the build)
3. Client installs build with this `EXPO_PUBLIC_API_URL`
4. Login: `admin` / `Admin@123`
5. Manual order: select item → bags 500/600 → coupon → Place Order
6. Voice: say `5505 600 bags ORD-121`

## Restart tunnel later
```powershell
cd "C:\Users\hp\OneDrive\Desktop\Dealer Management App"
.\tools\cloudflared.exe tunnel --url http://127.0.0.1:5246
```
Copy the **new** `https://….trycloudflare.com` URL → update `.env` + `eas.json` → publish **OTA** (`eas update --channel preview`). No new APK install needed if runtimeVersion matches.

## Swagger via tunnel
`https://YOUR-TUNNEL.trycloudflare.com/swagger`

## Railway note
Dashboard **Online** alone is not enough. Without **Generate Domain**, public URL returns `Application not found` (404). After domain works (`/swagger` = 200), point the app to Railway permanently.
