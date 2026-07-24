// Maps DealerManagement.Api Auth ↔ app auth types
// POST /api/auth/login  body { username, password }
// Response: ApiResponse<AuthResponse> { success, message, data: { token, refreshToken, userId, ... } }
import { LoginResponse, User, UserRole } from '@types';

export interface BackendLoginRequest {
  username: string;
  password: string;
}

export interface BackendAuthResponse {
  token: string;
  refreshToken: string;
  expiresAt?: string;
  userId: number;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[];
}

const ROLE_MAP: Record<string, UserRole> = {
  SuperAdmin: 'Admin',
  Admin: 'Admin',
  Sales: 'Sales',
  Dealer: 'Dealer',
};

export const toBackendLoginRequest = (
  emailOrUsername: string,
  password: string,
): BackendLoginRequest => ({
  username: emailOrUsername.trim(),
  password,
});

export const mapBackendAuthToLoginResponse = (data: BackendAuthResponse): LoginResponse => {
  const roleName = data.roles?.[0] ?? 'Dealer';
  const role: UserRole = ROLE_MAP[roleName] ?? 'Dealer';
  const fullName =
    [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || data.username;

  const user: User = {
    userId: data.userId,
    fullName,
    email: data.email,
    phone: null,
    role,
    isActive: true,
    createdDate: new Date().toISOString(),
    username: data.username,
  };

  return {
    accessToken: data.token,
    refreshToken: data.refreshToken || data.token,
    user,
  };
};
