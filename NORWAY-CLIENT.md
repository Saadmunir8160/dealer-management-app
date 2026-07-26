# Norway client — share this

## Install (Android APK)
**Version 1.0.7** — UCIC Create Order fields + live Dashboard + OTA updates.

APK link: *(building — will update when EAS finishes)*

API: `https://dealer-management-app-production.up.railway.app`

## Login
- Username: `admin`
- Password: `Admin@123`

## Notes for client
1. Allow install from unknown sources if Android asks.
2. Need internet (Wi‑Fi or mobile data).
3. PC / Cloudflare tunnel **not required**.
4. After install, app can receive UI fixes via OTA (no reinstall for JS-only changes).

## What they will see
- **New Order:** Coupon, ERP #, Delivery Area, Driver, Vehicle + live products
- **Dashboard recent orders:** Coupon, Status, Area, Driver, Vehicle, ERP
- **Orders list:** same UCIC fields

## Backend status
- Railway API + Postgres: Online
- Dealers / products seeded
- Orders store UCIC delivery fields
