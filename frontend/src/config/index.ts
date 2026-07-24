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

  // Fallback for local Expo Go / web when EXPO_PUBLIC_API_URL is unset
  const host =
    Platform.OS === 'web'
      ? 'http://localhost:5246'
      : `http://${DEV_LAN_IP}:5246`;
  return toApiBaseUrl(host);
};

const API_BASE_URL = resolveApiBaseUrl();
const ENABLE_LOGS =
  process.env.EXPO_PUBLIC_ENABLE_LOGS === 'true' || ENV !== 'production';

const configs: Record<Environment, AppConfig> = {
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

export interface AppConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENABLE_LOGS: boolean;
  ENABLE_FLIPPER: boolean;
  USE_MOCK: boolean;
  MOCK_DELAY_MS: number;
}

export const Config: AppConfig = configs[ENV];

if (Config.ENABLE_LOGS) {
  console.log('[Config] ENV=', ENV, 'API_BASE_URL=', Config.API_BASE_URL);
}

export default Config;
