// ─────────────────────────────────────────────────────────────────────────────
// src/utils/errorHandler.ts
// Normalizes Axios and unknown errors into a consistent ApiError shape.
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';
import { ApiError } from '@types';

export const parseApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    let message = 'An unexpected error occurred.';
    const status = error.response?.status ?? 0;
    const code = error.code ?? '';

    // No response = network / tunnel / timeout (common for overseas clients).
    if (!error.response) {
      if (code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
        return {
          message:
            'Server is slow or unreachable. Check internet and try again in a moment.',
          statusCode: 0,
        };
      }
      return {
        message:
          'Cannot reach server. Check internet connection and try again.',
        statusCode: 0,
      };
    }

    if (typeof data === 'string' && data.trim()) {
      message = data
        .replace(/^An error occurred while processing your request\./i, '')
        .trim() || data;
    } else if (data && typeof data === 'object') {
      const obj = data as { message?: string; title?: string; errors?: ApiError['errors'] };
      message = obj.message ?? obj.title ?? message;
      return {
        message: cleanAuthMessage(message),
        statusCode: status,
        errors: obj.errors,
      };
    } else if (error.message) {
      message = error.message;
    }

    // Prefer API business message (Invalid credentials, etc.)
    if (status === 400 || status === 401) {
      return {
        message: cleanAuthMessage(message) || 'Invalid email or password.',
        statusCode: status,
      };
    }

    return {
      message: cleanAuthMessage(message),
      statusCode: status,
    };
  }
  if (error instanceof Error) {
    return { message: error.message, statusCode: 0 };
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const e = error as { message?: string; statusCode?: number; errors?: ApiError['errors'] };
    return {
      message: cleanAuthMessage(e.message ?? 'An unexpected error occurred.'),
      statusCode: e.statusCode ?? 0,
      errors: e.errors,
    };
  }
  return { message: 'An unexpected error occurred.', statusCode: 0 };
};

const cleanAuthMessage = (message: string) =>
  message
    .replace(/^An error occurred while processing your request\./i, '')
    .trim() || message;
