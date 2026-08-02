import Config from '@config';
import { authApi } from '@api/authApi';
import { StorageService } from './storageService';
import { STORAGE_KEYS } from '@constants';
import { LoginRequest, LoginResponse, User } from '@types';
import { parseApiError } from '@utils/errorHandler';
import { enrichUserProfile, findDealerForUser } from '@utils/profileEnricher';
import { DealerService } from './dealerService';
import { mockLogin, mockLogout } from '../mock/handlers/authHandler.mock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function enrichUser(user: User): Promise<User> {
  try {
    let profile: Record<string, unknown> | null = null;
    if (!Config.USE_MOCK) {
      try {
        const res = await authApi.getMe();
        const envelope = res.data as {
          data?: Record<string, unknown>;
          Data?: Record<string, unknown>;
        };
        profile = (envelope?.data ?? envelope?.Data ?? envelope) as Record<string, unknown>;
      } catch {
        profile = null;
      }
    }

    let dealer = null;
    try {
      const dealers = await DealerService.fetchDealers({ page: 1, limit: 200 });
      dealer = findDealerForUser(user, dealers.data ?? []) ?? null;
    } catch {
      dealer = null;
    }

    return enrichUserProfile(user, { profile, dealer });
  } catch {
    return user;
  }
}

/** One automatic retry on transient network / timeout (Norway ↔ tunnel). */
async function withLoginRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (first) {
    const err = first as { response?: unknown; code?: string; message?: string };
    const transient =
      !err?.response ||
      err?.code === 'ECONNABORTED' ||
      /network|timeout|fetch failed/i.test(String(err?.message ?? ''));
    if (!transient) throw first;
    await delay(1500);
    return fn();
  }
}

export const AuthService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      let data: LoginResponse;

      if (Config.ENABLE_LOGS) {
        console.log('[LOGIN] API_BASE_URL=', Config.API_BASE_URL);
        console.log('[LOGIN] username=', credentials.email);
      }

      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockLogin(credentials);
        data = response.data;
      } else {
        data = await withLoginRetry(async () => {
          const response = await authApi.login(credentials);
          return response.data.data;
        });
      }

      const { accessToken, refreshToken, user } = data;
      if (!accessToken || !user) {
        throw { message: 'Login failed. No token returned.', statusCode: 401 };
      }

      if (Config.ENABLE_LOGS) {
        console.log('[LOGIN] success=', !!accessToken, 'userId=', user?.userId);
      }

      // Persist session immediately so login succeeds even if profile enrich is slow/offline.
      await Promise.all([
        StorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        StorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        StorageService.setItem(STORAGE_KEYS.USER, user),
      ]);

      // Enrich UCIC fields in background — never block / fail login.
      void enrichUser(user)
        .then(enriched => StorageService.setItem(STORAGE_KEYS.USER, enriched))
        .catch(() => undefined);

      return { accessToken, refreshToken, user };
    } catch (error) {
      if (Config.ENABLE_LOGS) {
        const err = error as { message?: string; response?: { status?: number }; code?: string };
        console.log(
          '[LOGIN] error=',
          err?.message,
          'status=',
          err?.response?.status,
          'code=',
          err?.code,
        );
      }
      throw parseApiError(error);
    }
  },

  /** Refresh UCIC customer fields from profile + dealers (for Profile screen / OTA). */
  refreshProfile: async (current: User): Promise<User> => {
    const enriched = await enrichUser(current);
    await StorageService.setItem(STORAGE_KEYS.USER, enriched);
    return enriched;
  },

  logout: async (): Promise<void> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        await mockLogout();
      } else {
        const refreshToken = await StorageService.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
        try {
          await authApi.logout(refreshToken ?? undefined);
        } catch {
          // ignore logout API errors — always clear local session
        }
      }
    } finally {
      await StorageService.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
      ]);
    }
  },

  getStoredUser: (): Promise<User | null> =>
    StorageService.getItem<User>(STORAGE_KEYS.USER),

  getAccessToken: (): Promise<string | null> =>
    StorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN),

  isLoggedIn: async (): Promise<boolean> => {
    const token = await StorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
    return token !== null;
  },
};
