// ─────────────────────────────────────────────────────────────────────────────
// src/store/slices/authSlice.ts
// Redux slice for authentication state.
// Handles login, logout, token refresh, and user hydration.
// ─────────────────────────────────────────────────────────────────────────────
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginRequest } from '@types';
import { AuthService } from '@services/authService';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      return await AuthService.login(credentials);
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const logoutThunk = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await AuthService.logout();
  } catch (error) {
    return rejectWithValue(error);
  }
});

export const hydrateAuthThunk = createAsyncThunk('auth/hydrate', async (_, { rejectWithValue }) => {
  try {
    const [user, accessToken] = await Promise.all([
      AuthService.getStoredUser(),
      AuthService.getAccessToken(),
    ]);
    return { user, accessToken };
  } catch (error) {
    return rejectWithValue(error);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    clearAuth: state => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginThunk.pending, state => { state.isLoading = true; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(loginThunk.rejected, state => { state.isLoading = false; })

      .addCase(logoutThunk.fulfilled, state => { Object.assign(state, initialState); })

      .addCase(hydrateAuthThunk.fulfilled, (state, action) => {
        if (action.payload.user && action.payload.accessToken) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { setTokens, clearAuth } = authSlice.actions;
export default authSlice.reducer;
