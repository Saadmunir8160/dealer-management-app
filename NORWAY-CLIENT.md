# Norway client — share this

## Install (Android APK)
Install page (Railway API):  
https://expo.dev/accounts/khanyahyas-team/projects/yahyakhan/builds/0bf92dc1-767a-4c08-a444-fad5bd43534a

Direct APK:  
https://expo.dev/artifacts/eas/Ofjztc0eHKK8HMRqGa6Di1EkPrxTE2AAhUZdDXnS-6Y.apk

After install: force-close app **twice** to load latest OTA (UCIC item list from Railway).

OTA: https://expo.dev/accounts/khanyahyas-team/projects/yahyakhan/updates/761b6ca5-68eb-4430-b4e1-cf34b6be040c

Version: **1.0.13**

API (Railway — always on):  
`https://dealer-management-app-production.up.railway.app`

## Login
- Username: `admin` (or `admin@dealerapp.com`)
- Password: `Admin@123`

## Notes for client
1. Allow install from unknown sources if Android asks.
2. Need internet (Wi‑Fi or mobile data).
3. **PC / Cloudflare tunnel NOT required.**
4. After install: open app → login.

## What they will see
- **Please Select Item Code:** UCIC LN list (5601 OPC Bags, 5505 MCT Bulk, 5719, …)
- **New Order:** Coupon, bags 500/600, Place Order
- **Profile:** UCIC Customer Information (LN 1087 Mashid)
- **Orders list:** Coupon, ERP, Status, Area, Driver, Vehicle

## Backend status
- Railway API + Postgres: Online
- UCIC products seeded (no PRD-* demo codes)
- Login verified
