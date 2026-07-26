# Remaining phases — D + E

## Phase D (done)
Live API no longer silently falls back to mock demo data for:
- Orders (list / detail / create / cancel)
- Dealers list
- Products
- Dashboard

Mock still used only when `USE_MOCK=true`.

## Phase E (done)
- `expo-updates` installed
- `runtimeVersion` = appVersion policy
- EAS channels: `development` / `preview` / `production`
- App checks for OTA on launch (production builds)

## Client APK
Version **1.0.7** — includes Create Order UCIC fields + live Dashboard + OTA.

Publish JS-only fixes later:
```bash
cd frontend
eas update --channel preview --message "UI fix"
```
