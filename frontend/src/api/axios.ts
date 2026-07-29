// Shared Axios client for DealerManagement.Api (Bearer JWT from /auth/login).
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Config from '@config';
import { StorageService } from '@services/storageService';
import { STORAGE_KEYS } from '@constants';

const apiClient: AxiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await StorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (Config.ENABLE_LOGS) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = (originalRequest?.url ?? '').toLowerCase();
    const isAuthCall =
      url.includes('/auth/login') || url.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthCall) {
      if (originalRequest) originalRequest._retry = true;

      try {
        const [accessToken, refreshToken] = await Promise.all([
          StorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN),
          StorageService.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN),
        ]);
        if (accessToken && refreshToken) {
          const refreshRes = await axios.post(
            `${Config.API_BASE_URL}/auth/refresh-token`,
            { token: accessToken, refreshToken },
            { timeout: Config.API_TIMEOUT },
          );
          const data = refreshRes.data?.data ?? refreshRes.data;
          const newToken = data?.token ?? data?.Token;
          const newRefresh = data?.refreshToken ?? data?.RefreshToken ?? refreshToken;
          if (newToken) {
            await StorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
            await StorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefresh);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          }
        }
      } catch {
        // fall through to clear session
      }

      await StorageService.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
      ]);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
