# UCIC Shared Backend — A2 / A3 / A4 / A5 Lock

> Continues from `UCIC-A0-A1-LOCK.md`  
> Same API: `D:\ucic_api` · Same DB: `UcicLive` · Base: `http://127.0.0.1:5152`

---

## A2 — Orders API (verified)

| Endpoint | Status | Notes |
|----------|--------|--------|
| `GET /api/Order/GetAllOrders?pageNumber=&pageSize=` | ✅ | Live orders from `UcicLive` (e.g. total=3) |
| `GET /api/Order/GetOrderByOrderId/{id}` | ✅ | Detail + line items |
| `GET /api/Order/GetMyOrders` | ✅ | Admin without Customer → empty list (not 500) |
| `POST /api/Order/CreateOrder` | ⏳ | Contract documented; full create E2E in Phase B with real customer user |
| `GET /api/Order/ValidateCoupon` | ✅ | Returns `{ isValid, discountPercentage, promotionID }` |

### Fixes applied (live DB schema drift)
Live `UcicLive` does **not** have `Dealer` table / `Orders.DealerId` yet (code was ahead of DB).

1. `ApplicationDbContext` — ignore `Order.DealerId`, `Order.Dealer`, `Dealer.Orders`
2. `QueryRepository.GetByIdAsync(Order)` — removed `.Include(o => o.Dealer)`
3. `GetAllOrdersQuery` — safer includes + mapping
4. `GetMyOrdersQuery` — no Customer → empty success (Admin-friendly)
5. Exception middleware — surfaces `InnerException` for debugging

> When Dealer migration is applied on `UcicLive`, re-enable the Dealer mappings.

### Admin vs Customer
- **Admin** (`admin@ucic.com`): use `GetAllOrders` for lists.
- **Customer/User** with `Customers.UserId` link: use `GetMyOrders`.

---

## A3 — Catalog API (verified)

| Endpoint | Status |
|----------|--------|
| `GET /api/CoverageArea/GetAll` | ✅ |
| `GET /api/Country/GetAll` | ✅ |
| `GET /api/Category/GetAll` | ✅ |
| `GET /api/Category/GetAllOrderType` | ✅ |
| `GET /api/Product/GetAll` | ✅ |
| `GET /api/Product/GetProductsByCoverageArea/{id}` | ✅ |
| `GET /api/Order/GetGeneralDataAndCities/{coverageAreaId}` | ✅ → `{ vatPercentage, country, cities }` |
| `GET /api/Category/GetAllDealer` | ❌ Gap — `Invalid object name 'Dealer'` |

---

## A4 — Gaps (app needs vs UCIC)

| Gap | Impact | Plan |
|-----|--------|------|
| No `Dealer` table on live DB | GetAllDealer / OrderConfirm dealer assign | Wait for DB migration **or** app skips dealer-assign UI |
| App “Dealers” ≠ UCIC Dealers | App previously used local dealers | Phase B: map to **UCIC Customers** (`Customer` + Identity) |
| No refresh-token in UCIC Auth | App refresh interceptor | Phase B: login again on 401 / use CheckLogin |
| Voice endpoints | Only on DealerManagement.Api | Autofill local/optional; **save via CreateOrder** |
| CreateOrder needs Customer + LocationDTO | App form fields differ | Phase B mappers: coverageAreaId, cityId, address, items, trucks |
| `GetMyOrders` empty for Admin | Expected | App admin role → call `GetAllOrders` |

---

## A5 — Contract freeze (frontend ready)

### Base URL
```
EXPO_PUBLIC_API_URL=http://127.0.0.1:5152
```
(production: webapp’s deployed UCIC API host — same DB)

### Auth contract
```
POST /api/Auth/Login
Body: { "email": "...", "password": "..." }
Resp: { userId, name, role, token }
Header: Authorization: Bearer {token}
```

### Orders contract (app list/detail)
```
GET /api/Order/GetAllOrders?pageNumber=1&pageSize=10   // Admin / shared list
GET /api/Order/GetMyOrders                              // Logged-in customer
GET /api/Order/GetOrderByOrderId/{orderId}
```

List item fields (camelCase JSON): `orderId`, `trackingID`, `status`, `customerName`, `totalQuantity`, `totalPrice`, `createdDate`, `orderItems[]`…

### Create contract (Phase B)
```
POST /api/Order/CreateOrder
```
Required shape (see `CreateOrderCommand`):
- `customerId`, `customerEmail`
- `totalQuantity`, `totalPrice`, `totalVat`, `shippingCost`
- `couponCode?`
- `orderItemDTOs[]` → `{ productId, quantity, price, numberOfTrucks }`
- `locationDTO` → `{ locationID?, coverageAreaId, cityId, address, zipCode?, gpsCoordinates? }`

### Catalog for New Order form
```
GET /api/CoverageArea/GetAll
GET /api/Product/GetProductsByCoverageArea/{coverageAreaId}
GET /api/Order/GetGeneralDataAndCities/{coverageAreaId}
GET /api/Order/ValidateCoupon?couponCode=&coverageAreaId=
```

### Smoke checklist (backend done)
- [x] Health
- [x] Login + JWT
- [x] CORS `*`
- [x] GetAllOrders (live data)
- [x] GetOrderByOrderId
- [x] GetMyOrders (empty-safe)
- [x] Products + Coverage + Cities + Coupon
- [ ] CreateOrder E2E with real customer (Phase B)
- [ ] App pointed at UCIC (Phase B1)

---

## Next: Phase B (Frontend)
`B1` Point Expo app → UCIC URL  
`B2` Orders list/detail mappers (web create ↔ app show)  
`B3` Create order form → `CreateOrder` payload  
`B4` Auth adapter  
`B5` Voice autofill only  
`C2` APK last

## Milestone status
`A0 ✅ A1 ✅ A2 ✅ A3 ✅ A4 ✅ A5 ✅` → **Backend ready for frontend wiring**
