// ─────────────────────────────────────────────────────────────────────────────
// src/mock/handlers/authHandler.mock.ts
//
// WHY THIS FILE EXISTS:
//   Simulates your backend's /api/auth/* endpoints.
//   When USE_MOCK = true, the mock client calls these functions
//   instead of making real HTTP requests.
//
// SIMULATED ENDPOINTS:
//   POST /api/auth/login           → validates credentials, returns token
//   POST /api/auth/logout          → clears session
//   POST /api/auth/forgot-password → sends OTP (simulated)
//   POST /api/auth/verify-otp      → validates OTP
//   POST /api/auth/reset-password  → updates password (simulated)
// ─────────────────────────────────────────────────────────────────────────────

import {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  VerifyOTPRequest,
  ResetPasswordRequest,
  ApiResponse,
} from '@types';
import {
  MOCK_USERS,
  MOCK_CREDENTIALS,
  MOCK_TOKEN,
  MOCK_REFRESH_TOKEN,
} from '../data/users.mock';

// ── Simulated OTP Store ───────────────────────────────────────────────────────
// In production, OTPs are stored in the database with an expiry time.
// Here we use a simple in-memory map.
const otpStore: Record<string, string> = {};

// ── Login Handler ─────────────────────────────────────────────────────────────
export const mockLogin = async (
  payload: LoginRequest,
): Promise<ApiResponse<LoginResponse>> => {
  const { email, password } = payload;

  // Step 1: Find user by email (simulates: SELECT * FROM Users WHERE Email = @email)
  const user = MOCK_USERS.find(u => u.email === email);

  // Step 2: Check if user exists
  if (!user) {
    throw {
      message: 'No account found with this email address.',
      statusCode: 404,
    };
  }

  // Step 3: Check if account is active (simulates: WHERE IsActive = 1)
  if (!user.isActive) {
    throw {
      message: 'Your account has been deactivated. Contact admin.',
      statusCode: 403,
    };
  }

  // Step 4: Validate password (simulates: bcrypt.compare(password, passwordHash))
  const storedPassword = MOCK_CREDENTIALS[email];
  if (storedPassword !== password) {
    throw {
      message: 'Incorrect password. Please try again.',
      statusCode: 401,
    };
  }

  // Step 5: Return success response with token and user data
  return {
    success: true,
    message: 'Login successful',
    data: {
      accessToken: MOCK_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
      user,
    },
  };
};

// ── Logout Handler ────────────────────────────────────────────────────────────
export const mockLogout = async (): Promise<ApiResponse<null>> => {
  // In production: invalidates the refresh token in the database
  return {
    success: true,
    message: 'Logged out successfully',
    data: null,
  };
};

// ── Forgot Password Handler ───────────────────────────────────────────────────
export const mockForgotPassword = async (
  payload: ForgotPasswordRequest,
): Promise<ApiResponse<null>> => {
  const { email } = payload;

  // Check if email exists
  const user = MOCK_USERS.find(u => u.email === email);
  if (!user) {
    throw {
      message: 'No account found with this email address.',
      statusCode: 404,
    };
  }

  // Generate a 6-digit OTP and store it
  // In production: stored in DB with expiry, sent via email service (SendGrid, etc.)
  const otp = '123456'; // fixed OTP for mock — in production this is random
  otpStore[email] = otp;

  console.log(`[MOCK] OTP for ${email}: ${otp}`); // visible in Metro logs

  return {
    success: true,
    message: 'OTP sent to your email address.',
    data: null,
  };
};

// ── Verify OTP Handler ────────────────────────────────────────────────────────
export const mockVerifyOTP = async (
  payload: VerifyOTPRequest,
): Promise<ApiResponse<null>> => {
  const { email, otp } = payload;

  // For mock: accept '123456' as valid OTP for any email
  const storedOtp = otpStore[email] ?? '123456';

  if (otp !== storedOtp) {
    throw {
      message: 'Invalid OTP. Please check your email and try again.',
      statusCode: 400,
    };
  }

  return {
    success: true,
    message: 'OTP verified successfully.',
    data: null,
  };
};

// ── Reset Password Handler ────────────────────────────────────────────────────
export const mockResetPassword = async (
  payload: ResetPasswordRequest,
): Promise<ApiResponse<null>> => {
  const { email, otp } = payload;

  // Verify OTP first
  const storedOtp = otpStore[email] ?? '123456';
  if (otp !== storedOtp) {
    throw {
      message: 'Invalid or expired OTP.',
      statusCode: 400,
    };
  }

  // In production: UPDATE Users SET PasswordHash = bcrypt(newPassword) WHERE Email = @email
  // Clear OTP after use
  delete otpStore[email];

  // Update mock credentials
  MOCK_CREDENTIALS[email] = payload.newPassword;

  return {
    success: true,
    message: 'Password reset successfully. Please login with your new password.',
    data: null,
  };
};
