import { Platform } from 'react-native';
import apiClient from '../client';
import { AuthResponse, AuthenticationDTO } from '../../types';
import { store } from '../../store';
import { logoutAction } from '../../store/authSlice';
import { clearStoredTokens } from '../../utils/tokenManager';

export const authApi = {
  login: async (credentials: AuthenticationDTO): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  refreshToken: async (token?: string | null): Promise<AuthResponse> => {
    const headers: Record<string, string> = {
      'x-suppress-toast': 'true',
    };
    const refreshToken = token || store.getState().auth?.refreshToken;
    if (Platform.OS !== 'web' && refreshToken) {
      headers['Cookie'] = `refreshToken=${refreshToken}`;
    }
    const res = await apiClient.post<AuthResponse>('/auth/refresh-token', {}, { headers });
    return res.data;
  },

  logout: async (): Promise<any> => {
    const headers: Record<string, string> = {};
    const refreshToken = store.getState().auth?.refreshToken;
    if (Platform.OS !== 'web' && refreshToken) {
      headers['Cookie'] = `refreshToken=${refreshToken}`;
    }
    const res = await apiClient.post('/auth/logout', {}, { headers });
    return res.data;
  },

  forgotPassword: async (email: string): Promise<any> => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },
};

export const performLogout = async (dispatch?: any): Promise<void> => {
  try {
    await authApi.logout();
  } catch {
    // Suppress network or server failure to ensure local logout always completes
  } finally {
    await clearStoredTokens();
    if (dispatch) {
      dispatch(logoutAction());
    } else {
      store.dispatch(logoutAction());
    }
  }
};
