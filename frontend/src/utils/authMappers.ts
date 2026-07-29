// Maps DealerManagement.Api Auth ↔ app auth types
// POST /api/auth/login  body { username, password }
// Response: ApiResponse<AuthResponse>
import { LoginResponse, User, UserRole } from '@types';

export interface BackendLoginRequest {
  username: string;
  password: string;
}

export interface BackendAuthResponse {
  token?: string;
  Token?: string;
  refreshToken?: string;
  RefreshToken?: string;
  userId?: number | string;
  UserId?: number | string;
  username?: string;
  Username?: string;
  email?: string;
  Email?: string;
  firstName?: string | null;
  FirstName?: string | null;
  lastName?: string | null;
  LastName?: string | null;
  roles?: string[];
  Roles?: string[];
  name?: string;
  Name?: string;
  role?: string;
  Role?: string;
}

const ROLE_MAP: Record<string, UserRole> = {
  SuperAdmin: 'Admin',
  Admin: 'Admin',
  Sales: 'Sales',
  User: 'Dealer',
  Dealer: 'Dealer',
};

export const hashUserId = (id: string | number): number => {
  if (typeof id === 'number' && Number.isFinite(id)) return id;
  const s = String(id ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
};

export const toBackendLoginRequest = (
  emailOrUsername: string,
  password: string,
): BackendLoginRequest => ({
  username: emailOrUsername.trim(),
  password,
});

export const mapBackendAuthToLoginResponse = (
  data: BackendAuthResponse,
  fallbackEmail = '',
): LoginResponse => {
  const token = data.token ?? data.Token ?? '';
  const refreshToken = data.refreshToken ?? data.RefreshToken ?? token;
  const rawUserId = data.userId ?? data.UserId ?? '';
  const roles = data.roles ?? data.Roles ?? [];
  const roleName = data.role ?? data.Role ?? roles[0] ?? 'User';
  const role: UserRole = ROLE_MAP[roleName] ?? 'Dealer';

  let fullName = data.name ?? data.Name ?? '';
  if (!fullName) {
    fullName = [data.firstName ?? data.FirstName, data.lastName ?? data.LastName]
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  const username = data.username ?? data.Username ?? fallbackEmail;
  if (!fullName) fullName = username || 'User';

  const email = data.email ?? data.Email ?? fallbackEmail;

  const user: User = {
    userId: hashUserId(rawUserId),
    fullName: String(fullName),
    email: String(email),
    phone: null,
    role,
    isActive: true,
    createdDate: new Date().toISOString(),
    username: String(username),
  };

  return {
    accessToken: token,
    refreshToken,
    user,
  };
};
