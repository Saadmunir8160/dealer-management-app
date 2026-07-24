// ─────────────────────────────────────────────────────────────────────────────
// src/constants/index.ts
// Application-wide constants. Never hardcode these values inline in components.
// ─────────────────────────────────────────────────────────────────────────────

// ── Storage Keys ─────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@dma/access_token',
  REFRESH_TOKEN: '@dma/refresh_token',
  USER: '@dma/user',
  THEME: '@dma/theme',
  LANGUAGE: '@dma/language',
  ONBOARDING_DONE: '@dma/onboarding_done',
} as const;

// ── Pagination ────────────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;

// ── Date Formats ──────────────────────────────────────────────────────────────
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  DISPLAY_WITH_TIME: 'dd MMM yyyy, hh:mm a',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// ── Regex ─────────────────────────────────────────────────────────────────────
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s\-()]{10,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  OTP: /^\d{6}$/,
} as const;

// ── HTTP Status Codes ─────────────────────────────────────────────────────────
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE: 422,
  SERVER_ERROR: 500,
} as const;

// ── App Limits ────────────────────────────────────────────────────────────────
export const APP_LIMITS = {
  MAX_FILE_SIZE_MB: 5,
  OTP_LENGTH: 6,
  OTP_EXPIRY_SECONDS: 300,
  TOKEN_REFRESH_BUFFER_SECONDS: 60,
} as const;
