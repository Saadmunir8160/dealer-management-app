import { Platform } from 'react-native';

type Environment = 'development' | 'staging' | 'production';

const ENV: Environment =
  (process.env.EXPO_PUBLIC_APP_ENV as Environment) ||
  (process.env.APP_ENV as Environment) ||
  'development';

/**
 * Public / build-time API base (no trailing slash).
 * Set via EXPO_PUBLIC_API_URL in .env or eas.json — required for standalone APK
 * on devices that are not on your LAN.
 * Example: https://api.example.com   OR   http://192.168.0.111:5246
 */
const PUBLIC_API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

/** Local PC Wi‑Fi IPv4 — Expo Go / same-network only. Update if IP changes. */
const DEV_LAN_IP = '192.168.0.111';

const toApiBaseUrl = (hostOrBase: string): string => {
  const base = hostOrBase.replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
};

const resolveApiBaseUrl = (): string => {
  if (PUBLIC_API_URL) {
    return toApiBaseUrl(PUBLIC_API_URL);
  }

  // Fallback when EXPO_PUBLIC_API_URL is unset — DealerManagement.Api (port 5246).
  // Prefer 127.0.0.1 on web — Chrome often resolves "localhost" to IPv6 (::1).
  const host =
    Platform.OS === 'web'
      ? 'http://127.0.0.1:5246'
      : `http://${DEV_LAN_IP}:5246`;
  return toApiBaseUrl(host);
};

const API_BASE_URL = resolveApiBaseUrl();
const ENABLE_LOGS =
  process.env.EXPO_PUBLIC_ENABLE_LOGS === 'true' || ENV !== 'production';

export interface AppConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENABLE_LOGS: boolean;
  ENABLE_FLIPPER: boolean;
  USE_MOCK: boolean;
  MOCK_DELAY_MS: number;
  /** Prefer server proxy so the Gemini key never ships in the APK. */
  GEMINI_PROXY_URL: string;
  /**
   * Dev-only direct key (Expo public env is visible in client bundles).
   * Production: leave empty and set GEMINI_PROXY_URL instead.
   */
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
}

const configs: Record<
  Environment,
  Omit<AppConfig, 'GEMINI_PROXY_URL' | 'GEMINI_API_KEY' | 'GEMINI_MODEL'>
> = {
  development: {
    API_BASE_URL,
    API_TIMEOUT: 30000,
    ENABLE_LOGS: true,
    ENABLE_FLIPPER: true,
    USE_MOCK: false,
    MOCK_DELAY_MS: 400,
  },
  staging: {
    API_BASE_URL,
    API_TIMEOUT: 30000,
    ENABLE_LOGS: true,
    ENABLE_FLIPPER: false,
    USE_MOCK: false,
    MOCK_DELAY_MS: 0,
  },
  production: {
    API_BASE_URL,
    API_TIMEOUT: 30000,
    ENABLE_LOGS,
    ENABLE_FLIPPER: false,
    USE_MOCK: false,
    MOCK_DELAY_MS: 0,
  },
};

const GEMINI_PROXY_URL = (process.env.EXPO_PUBLIC_GEMINI_PROXY_URL || '').trim();
const GEMINI_API_KEY = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
const GEMINI_MODEL =
  (process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash').trim() ||
  'gemini-2.0-flash';

const withGemini = (
  base: Omit<AppConfig, 'GEMINI_PROXY_URL' | 'GEMINI_API_KEY' | 'GEMINI_MODEL'>,
): AppConfig => ({
  ...base,
  GEMINI_PROXY_URL,
  GEMINI_API_KEY,
  GEMINI_MODEL,
});

export const Config: AppConfig = withGemini(configs[ENV]);

if (Config.ENABLE_LOGS) {
  console.log(
    '[Config] ENV=',
    ENV,
    'API_BASE_URL=',
    Config.API_BASE_URL,
    'GeminiProxy=',
    !!Config.GEMINI_PROXY_URL,
    'GeminiKey=',
    Config.GEMINI_API_KEY ? 'set' : 'missing',
  );
}

export default Config;
