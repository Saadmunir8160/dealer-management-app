// ─────────────────────────────────────────────────────────────────────────────
// src/utils/tokenUtils.ts
// JWT token utilities — decode payload, check expiry.
// The app never validates tokens against the DB; it only reads the payload.
// ─────────────────────────────────────────────────────────────────────────────
import { TokenPayload } from '@types';
import { APP_LIMITS } from '@constants';

export const decodeJWT = (token: string): TokenPayload | null => {
  try {
    const base64Payload = token.split('.')[1];
    const decoded = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp < nowInSeconds;
};

export const isTokenExpiringSoon = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp - nowInSeconds < APP_LIMITS.TOKEN_REFRESH_BUFFER_SECONDS;
};
