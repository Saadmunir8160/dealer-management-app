import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { loginThunk, logoutThunk, refreshProfileThunk } from '@store/slices/authSlice';
import { LoginRequest } from '@types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, accessToken } = useAppSelector(state => state.auth);

  const login = useCallback(
    (credentials: LoginRequest) => dispatch(loginThunk(credentials)),
    [dispatch],
  );

  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch]);

  const refreshProfile = useCallback(() => dispatch(refreshProfileThunk()), [dispatch]);

  return { user, isAuthenticated, isLoading, accessToken, login, logout, refreshProfile };
};
