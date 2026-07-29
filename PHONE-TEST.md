# Local / phone testing

## Dashboard "Failed to load"
1. App `.env` points at Railway API.
2. If you logged in while API was local (or token expired), logout → login again:
   - `admin` / `Admin@123`
3. Pull down to refresh Dashboard.

## Phone QR not opening
`npx expo start --web` alone is for the **PC browser** (`localhost`). Phone cannot open `localhost`.

### Recommended (same Wi‑Fi)
Expo is started in **LAN** mode on port **8081**.

1. Phone + PC same Wi‑Fi.
2. Install **Expo Go**.
3. Scan the QR from the Expo terminal (not a random browser localhost QR).
4. Or open in Expo Go: `exp://192.168.0.111:8081`

### Tunnel (different networks)
```powershell
npm install -g @expo/ngrok@^4.1.0
cd frontend
npx expo start --tunnel
```
