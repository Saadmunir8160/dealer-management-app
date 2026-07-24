import Config from '@config';
import { authApi } from '@api/authApi';
import { StorageService } from './storageService';
import { STORAGE_KEYS } from '@constants';
import { LoginRequest, LoginResponse, User } from '@types';
import { parseApiError } from '@utils/errorHandler';
import { mockLogin, mockLogout } from '../mock/handlers/authHandler.mock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        const response = await authApi.login(credentials);
        data = response.data.data;
      }

      const { accessToken, refreshToken, user } = data;

      if (Config.ENABLE_LOGS) {
        console.log('[LOGIN] success=', !!accessToken, 'userId=', user?.userId);
      }

      await Promise.all([
        StorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        StorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        StorageService.setItem(STORAGE_KEYS.USER, user),
      ]);

      return { accessToken, refreshToken, user };
    } catch (error) {
      if (Config.ENABLE_LOGS) {
        const err = error as { message?: string; response?: { status?: number } };
        console.log(
          '[LOGIN] error=',
          err?.message,
          'status=',
          err?.response?.status,
        );
      }
      throw parseApiError(error);
    }
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
