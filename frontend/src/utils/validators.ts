// ─────────────────────────────────────────────────────────────────────────────
// src/utils/validators.ts
// Reusable validation functions. Used by Yup schemas and manual checks.
// ─────────────────────────────────────────────────────────────────────────────
import { REGEX } from '@constants';

export const isValidEmail = (email: string): boolean => REGEX.EMAIL.test(email);

export const isValidPhone = (phone: string): boolean => REGEX.PHONE.test(phone);

export const isValidPassword = (password: string): boolean => REGEX.PASSWORD.test(password);

export const isValidOTP = (otp: string): boolean => REGEX.OTP.test(otp);

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
