// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useAuth.ts
// Encapsulates all authentication logic for UI consumption.
// Components never import from store or services directly.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { loginThunk, logoutThunk } from '@store/slices/authSlice';
import { LoginRequest } from '@types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, accessToken } = useAppSelector(state => state.auth);

  const login = useCallback(
    (credentials: LoginRequest) => dispatch(loginThunk(credentials)),
    [dispatch],
  );

  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch]);

  return { user, isAuthenticated, isLoading, accessToken, login, logout };
};
