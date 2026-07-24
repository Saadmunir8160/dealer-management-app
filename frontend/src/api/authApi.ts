import apiClient from './axios';
import Config from '@config';
import {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  VerifyOTPRequest,
  ResetPasswordRequest,
  ApiResponse,
} from '@types';
import {
  BackendAuthResponse,
  mapBackendAuthToLoginResponse,
  toBackendLoginRequest,
} from '@utils/authMappers';

/**
 * DealerManagement.Api AuthController (port 5246)
 * POST /api/auth/login
 * POST /api/auth/logout
 * POST /api/auth/refresh-token
 */
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_OTP: '/auth/verify-otp',
  RESET_PASSWORD: '/auth/reset-password',
  ME: '/auth/profile',
} as const;

export const authApi = {
  login: async (payload: LoginRequest): Promise<{ data: ApiResponse<LoginResponse> }> => {
    const body = toBackendLoginRequest(payload.email, payload.password);
    if (Config.ENABLE_LOGS) {
      console.log('[LOGIN] POST', AUTH_ENDPOINTS.LOGIN, 'body.username=', body.username);
    }

    const response = await apiClient.post<ApiResponse<BackendAuthResponse>>(
      AUTH_ENDPOINTS.LOGIN,
      body,
    );

    const envelope = response.data;
    const raw = envelope?.data;
    if (Config.ENABLE_LOGS) {
      console.log(
        '[LOGIN] response success=',
        envelope?.success,
        'hasToken=',
        !!raw?.token,
      );
    }

    if (!raw?.token) {
      throw {
        message: envelope?.message || 'Login failed. No token returned.',
        statusCode: 401,
      };
    }

    const mapped = mapBackendAuthToLoginResponse({
      token: raw.token ?? (raw as unknown as { Token?: string }).Token ?? '',
      refreshToken:
        raw.refreshToken ?? (raw as unknown as { RefreshToken?: string }).RefreshToken ?? '',
      expiresAt: raw.expiresAt,
      userId: raw.userId ?? (raw as unknown as { UserId?: number }).UserId ?? 0,
      username: raw.username ?? (raw as unknown as { Username?: string }).Username ?? '',
      email: raw.email ?? (raw as unknown as { Email?: string }).Email ?? payload.email,
      firstName: raw.firstName ?? (raw as unknown as { FirstName?: string }).FirstName,
      lastName: raw.lastName ?? (raw as unknown as { LastName?: string }).LastName,
      roles: raw.roles ?? (raw as unknown as { Roles?: string[] }).Roles,
    });

    return {
      data: {
        success: envelope.success ?? true,
        message: envelope.message ?? 'Login successful',
        data: mapped,
      },
    };
  },

  logout: (refreshToken?: string) =>
    apiClient.post<ApiResponse<null>>(AUTH_ENDPOINTS.LOGOUT, refreshToken ? { refreshToken } : {}),

  forgotPassword: (payload: ForgotPasswordRequest) =>
    apiClient.post<ApiResponse<null>>(AUTH_ENDPOINTS.FORGOT_PASSWORD, payload),

  verifyOTP: (payload: VerifyOTPRequest) =>
    apiClient.post<ApiResponse<null>>(AUTH_ENDPOINTS.VERIFY_OTP, payload),

  resetPassword: (payload: ResetPasswordRequest) =>
    apiClient.post<ApiResponse<null>>(AUTH_ENDPOINTS.RESET_PASSWORD, payload),

  getMe: () => apiClient.get(AUTH_ENDPOINTS.ME),
};
