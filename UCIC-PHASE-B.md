# Phase B — Frontend wired to UCIC (shared with webapp)

## Done
| Item | Change |
|------|--------|
| **B1 Config** | `.env` → `http://127.0.0.1:5152` (UCIC) |
| **B2 Auth** | `POST /api/Auth/Login` `{ email, password }` → JWT |
| **B3 Orders** | `GetAllOrders` / `GetMyOrders` / `GetOrderByOrderId` |
| **B4 Products** | `Product/GetAll` from UcicLive |
| **Customers** | Dropdown built from unique customers on live orders |
| **Create** | `POST /Order/CreateOrder` (UCIC payload) |
| **Voice** | Local STT + product match (no separate voice API); save via CreateOrder |
| **Axios** | No refresh-token (UCIC); clear session on 401 |

## How to run
1. UCIC API: `cd D:\ucic_api\Api` → `dotnet run --launch-profile http`
2. App: `cd frontend` → `npx expo start --web` (restart after `.env` change)
3. Login: `admin@ucic.com` / `Admin@123`

## Shared data proof
- Webapp create order → App Orders list (`GetAllOrders`) shows same `trackingID`
- App list/detail reads **UcicLive** via UCIC API

## Notes / remaining polish
- **CreateOrder** requires logged-in user linked to a `Customer` row (JWT). Admin without Customer may get an error — use a customer user for create, or create via webapp.
- Coverage area / city on create currently default to `1` — refine form in a follow-up if needed.
- `Category/GetAllDealer` still blocked until Dealer table exists on live DB.
- Dashboard built from `GetAllOrders` (UCIC has no `/dashboard`).
- **APK build** still last (Phase C) after QA.

## Files touched (frontend)
- `frontend/.env`, `.env.example`, `src/config/index.ts`
- `src/api/authApi.ts`, `axios.ts`, `orderApi.ts`, `productApi.ts`, `dealerApi.ts`
- `src/utils/authMappers.ts`, `orderMappers.ts`, `productMappers.ts`, `dealerMappers.ts`, `localVoiceExtract.ts`
- `src/services/orderService.ts`, `productService.ts`
- `src/screens/Orders/CreateOrder/CreateOrderScreen.tsx` (voice → local extract)
