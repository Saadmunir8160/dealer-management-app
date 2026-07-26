# Norway client — share this

## Install (Android APK)
Install page: https://expo.dev/accounts/khanasad/projects/ucic-customer-portal/builds/753d664a-3ca4-45f9-9340-3ac76ff992a3

Direct APK: https://expo.dev/artifacts/eas/OiSvbstKiy9t5Wpnz6CCMhZqdPQkFCcVDt0BJzR_IsU.apk

Version: **1.0.7** (UCIC fields + live Dashboard + OTA)

API: `https://dealer-management-app-production.up.railway.app`

## Login
- Username: `admin`
- Password: `Admin@123`

## Notes for client
1. Allow install from unknown sources if Android asks.
2. Need internet (Wi‑Fi or mobile data).
3. PC / Cloudflare tunnel **not required**.
4. Later UI-only fixes can ship via OTA (no reinstall).

## What they will see
- **New Order:** Coupon, ERP #, Delivery Area, Driver, Vehicle + live products
- **Dashboard recent orders:** Coupon, Status, Area, Driver, Vehicle, ERP
- **Orders list:** same UCIC fields

## Backend status
- Railway API + Postgres: Online
- Dealers / products seeded
- Orders store UCIC delivery fields
