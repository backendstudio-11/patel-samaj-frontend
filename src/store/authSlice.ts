import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';
import { calculateTokenExpiry } from '../utils/tokenManager';

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  rememberedMobile: string | null;
  expiresAt: number | null;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  rememberedMobile: null,
  expiresAt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string | null;
        user: User;
        isAdmin?: boolean;
        expiresAt?: number;
      }>
    ) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isAdmin = action.payload.isAdmin ?? true;
      state.expiresAt =
        action.payload.expiresAt ?? calculateTokenExpiry(action.payload.token);
    },
    updateTokens: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string | null;
        expiresAt?: number;
      }>
    ) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.expiresAt =
        action.payload.expiresAt ?? calculateTokenExpiry(action.payload.token);
    },
    updateProfile: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logoutAction: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.expiresAt = null;
    },
    setRememberedMobile: (state, action: PayloadAction<string | null>) => {
      state.rememberedMobile = action.payload;
    },
  },
});

export const {
  setCredentials,
  updateTokens,
  updateProfile,
  logoutAction,
  setRememberedMobile,
} = authSlice.actions;

export default authSlice.reducer;
