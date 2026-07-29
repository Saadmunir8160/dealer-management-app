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

/** DealerManagement.Api AuthController */
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  PROFILE: '/auth/profile',
} as const;

export const authApi = {
  login: async (payload: LoginRequest): Promise<{ data: ApiResponse<LoginResponse> }> => {
    const body = toBackendLoginRequest(payload.email, payload.password);
    if (Config.ENABLE_LOGS) {
      console.log('[LOGIN] POST', AUTH_ENDPOINTS.LOGIN, 'username=', body.username);
    }

    const response = await apiClient.post<ApiResponse<BackendAuthResponse>>(
      AUTH_ENDPOINTS.LOGIN,
      body,
    );
    const envelope = response.data ?? ({} as ApiResponse<BackendAuthResponse>);
    const raw = (envelope.data ?? envelope) as BackendAuthResponse;

    if (envelope.success === false) {
      throw {
        message: envelope.message || 'Login failed.',
        statusCode: 400,
      };
    }

    const token = raw.token ?? raw.Token;
    if (!token) {
      throw {
        message: 'Login failed. No token returned.',
        statusCode: 401,
      };
    }

    if (Config.ENABLE_LOGS) {
      console.log(
        '[LOGIN] hasToken=',
        !!token,
        'roles=',
        raw.roles ?? raw.Roles ?? raw.role ?? raw.Role,
      );
    }

    const mapped = mapBackendAuthToLoginResponse(raw, payload.email);

    return {
      data: {
        success: true,
        message: envelope.message || 'Login successful',
        data: mapped,
      },
    };
  },

  logout: (_refreshToken?: string) => apiClient.post(AUTH_ENDPOINTS.LOGOUT, {}),

  refreshToken: (token: string, refreshToken: string) =>
    apiClient.post<ApiResponse<BackendAuthResponse>>(AUTH_ENDPOINTS.REFRESH, {
      token,
      refreshToken,
    }),

  forgotPassword: (payload: ForgotPasswordRequest) =>
    apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, payload),

  verifyOTP: (_payload: VerifyOTPRequest) =>
    Promise.reject({
      message: 'OTP verify is not available on DealerManagement.Api.',
      statusCode: 501,
    }),

  resetPassword: (payload: ResetPasswordRequest) =>
    apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
      email: payload.email,
      newPassword: payload.newPassword,
      token: payload.otp,
    }),

  getMe: () => apiClient.get(AUTH_ENDPOINTS.PROFILE),
};
