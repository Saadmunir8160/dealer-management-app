# Voice Order — local testing

## Frontend API (required)
`.env` must point at an API that has `/api/voice/process`:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:5246
EXPO_PUBLIC_ENABLE_LOGS=true
```

Then restart Expo (`Ctrl+C` → `npx expo start --web`) so env reloads.

## Backend
```bash
cd backend/src/DealerManagement.Api
dotnet run
```
Swagger: http://localhost:5246/swagger

## One-shot voice
1. Orders → **Voice**
2. Select customer
3. Tap mic once → say clearly: `Add 20 rods`
4. Draft order is created/updated automatically
