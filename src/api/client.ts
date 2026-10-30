import axios from 'axios';
import { Platform } from 'react-native';
import { store } from '../store';
import { logoutAction, updateTokens } from '../store/authSlice';
import {
  setStoredTokens,
  clearStoredTokens,
  parseExpiryToMs,
  calculateTokenExpiry,
} from '../utils/tokenManager';
import { showGlobalToast } from '../context/ToastContext';
import { AuthResponse } from '../types';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Isolated call to refresh access token using refresh token cookie or header.
 * Uses plain axios to bypass apiClient interceptors and avoid circular retry loops.
 */
const executeTokenRefresh = async (): Promise<AuthResponse> => {
  const refreshToken = store.getState().auth?.refreshToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (Platform.OS !== 'web' && refreshToken) {
    headers['Cookie'] = `refreshToken=${refreshToken}`;
  }

  const response = await axios.post<AuthResponse>(
    `${BASE_URL}/auth/refresh-token`,
    {},
    {
      headers,
      withCredentials: true,
      timeout: 10000,
    }
  );
  return response.data;
};

/**
 * Handles fatal authentication failure by notifying backend to revoke token/cookie
 * and cleaning up all local tokens and Redux session.
 */
const handleAuthFailure = async (): Promise<void> => {
  try {
    const refreshToken = store.getState().auth?.refreshToken;
    const headers: Record<string, string> = {};
    if (Platform.OS !== 'web' && refreshToken) {
      headers['Cookie'] = `refreshToken=${refreshToken}`;
    }
    await axios.post(
      `${BASE_URL}/auth/logout`,
      {},
      {
        headers,
        withCredentials: true,
        timeout: 5000,
      }
    );
  } catch {
    // Suppress network errors during logout
  } finally {
    await clearStoredTokens();
    store.dispatch(logoutAction());
  }
};

// Interceptor to inject bearer token and native cookie header
apiClient.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/refresh-token');

    // On native platforms, explicitly forward refreshToken cookie if available
    if (Platform.OS !== 'web') {
      const refreshToken = store.getState().auth?.refreshToken;
      if (refreshToken) {
        if (!config.headers) {
          config.headers = {} as any;
        }
        if (typeof config.headers.set === 'function') {
          config.headers.set('Cookie', `refreshToken=${refreshToken}`);
        } else {
          config.headers['Cookie'] = `refreshToken=${refreshToken}`;
        }
      }
    }

    if (isAuthRoute) {
      return config;
    }

    const state = store.getState();
    const token = state.auth?.token;

    if (token) {
      if (config.headers) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const extractErrorMessage = (error: any): string => {
  if (!error) return 'An unexpected error occurred.';

  const response = error.response;
  if (response && response.data) {
    let data = response.data;

    // Handle binary responses (e.g. ArrayBuffer or Uint8Array) when responseType is 'arraybuffer'
    if (data instanceof ArrayBuffer || (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(data))) {
      try {
        const text = new TextDecoder('utf-8').decode(data);
        data = JSON.parse(text);
      } catch {
        try {
          data = new TextDecoder('utf-8').decode(data);
        } catch {
          // ignore decoding failure
        }
      }
    }

    // 1. Plain String error response (Exception.class)
    if (typeof data === 'string' && data.trim().length > 0 && !data.trim().startsWith('<html')) {
      return data.trim();
    }

    // 2. Map<String, String> response
    if (typeof data === 'object' && data !== null) {
      // ResourceNotFoundException or Conflict Exception -> { "error": "Message" } or { "message": "Message" }
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error.trim();
      }
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message.trim();
      }

      // MethodArgumentNotValidException -> { "fullName": "Full name cannot be empty", ... }
      const validationMessages = Object.values(data)
        .filter((val): val is string => typeof val === 'string' && val.trim().length > 0)
        .join('\n');

      if (validationMessages) {
        return validationMessages;
      }
    }
  }

  if (error.request) {
    return 'Unable to connect to the server. Please check your network connection.';
  }

  return error.message || 'An unexpected error occurred.';
};

export const extractSuccessMessage = (response: any): string => {
  if (!response) return 'Operation completed successfully.';

  const data = response.data;
  const config = response.config || {};
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  if (url.includes('/auth/login')) {
    if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
    return 'Logged in successfully.';
  }

  if (typeof data === 'string' && data.trim().length > 0 && !data.trim().startsWith('<html') && data.trim().length < 200) {
    return data.trim();
  }

  if (typeof data === 'object' && data !== null) {
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.msg === 'string' && data.msg.trim()) {
      return data.msg.trim();
    }
    if (typeof data.success === 'string' && data.success.trim()) {
      return data.success.trim();
    }
  }

  if (url.includes('/auth/forgot-password')) {
    return 'Password reset instructions sent successfully.';
  }
  if (url.includes('/auth/logout')) {
    return 'Logged out successfully.';
  }
  if (url.includes('/user/inviteAdmin')) {
    return 'Admin invitation sent successfully.';
  }
  if (url.includes('/user/change-password')) {
    return 'Password changed successfully.';
  }
  if (url.includes('/user/profile') || url.includes('/profile')) {
    return 'Profile updated successfully.';
  }
  if (url.includes('/user/toggle')) {
    return 'Admin status updated successfully.';
  }
  if (url.includes('/events') && url.includes('/close')) {
    return 'Event closed and bill finalized successfully.';
  }

  if (url.includes('/donors')) {
    if (method === 'delete') return 'Donor deleted successfully.';
    if (method === 'post') {
      return data && typeof data === 'object' && data.fullName
        ? `Donor "${data.fullName}" saved successfully.`
        : 'Donor saved successfully.';
    }
  }

  if (url.includes('/events')) {
    if (method === 'delete') return 'Event deleted successfully.';
    if (method === 'post') return 'Event booking created successfully.';
    if (method === 'put') return 'Event booking updated successfully.';
  }

  if (url.includes('/items')) {
    if (method === 'delete') return 'Inventory item deleted successfully.';
    if (method === 'post' || method === 'put') {
      return data && typeof data === 'object' && data.itemName
        ? `Item "${data.itemName}" saved successfully.`
        : 'Inventory item saved successfully.';
    }
  }

  if (url.includes('/expenses')) {
    if (method === 'delete') return 'Expense record deleted successfully.';
    if (method === 'post' || method === 'put') return 'Expense recorded successfully.';
  }

  if (method === 'delete') return 'Deleted successfully.';
  if (method === 'post' || method === 'put' || method === 'patch') return 'Saved successfully.';

  return 'Operation completed successfully.';
};

apiClient.interceptors.response.use(
  (response) => {
    const config = response.config || {};
    const method = (config.method || 'get').toLowerCase();
    const url = config.url || '';

    const isMutating = ['post', 'put', 'patch', 'delete'].includes(method);
    const isListQuery = url.endsWith('/list') || url.includes('/list?');
    const isRefreshToken = url.includes('/auth/refresh-token');
    const suppressToast =
      config.headers?.['x-suppress-toast'] === 'true' ||
      config.headers?.['x-suppress-toast'] === true;

    if (isMutating && !isListQuery && !isRefreshToken && !suppressToast) {
      const message = extractSuccessMessage(response);
      showGlobalToast({ message, type: 'success' });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || '';

    const isLoginRoute = url.includes('/auth/login');
    const isRefreshRoute = url.includes('/auth/refresh-token');
    const isLogoutRoute = url.includes('/auth/logout');
    const isAuthRoute = isLoginRoute || isRefreshRoute || isLogoutRoute;

    const is401 =
      status === 401 ||
      error?.isAuthError ||
      error?.message === 'Unauthorized';

    // Intercept 401 on authenticated API requests to trigger silent token refresh
    if (is401 && !isAuthRoute && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refresh is in flight
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              if (typeof originalRequest.headers.set === 'function') {
                originalRequest.headers.set('Authorization', `Bearer ${token}`);
              } else {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
              }
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshData = await executeTokenRefresh();
        const newJwtToken = refreshData.jwtToken;
        const newRefreshToken = refreshData.refreshToken;
        const newExpireAt = refreshData.expireAt;
        const expiresAtMs =
          parseExpiryToMs(newExpireAt) ?? calculateTokenExpiry(newJwtToken);

        await setStoredTokens(newJwtToken, newRefreshToken);
        store.dispatch(
          updateTokens({
            token: newJwtToken,
            refreshToken: newRefreshToken,
            expiresAt: expiresAtMs,
          })
        );

        if (apiClient.defaults.headers.common) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newJwtToken}`;
        }

        if (originalRequest.headers) {
          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${newJwtToken}`);
          } else {
            originalRequest.headers['Authorization'] = `Bearer ${newJwtToken}`;
          }
        }

        processQueue(null, newJwtToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await handleAuthFailure();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 401 on auth routes or when retry already failed
    if (is401 && (isAuthRoute || originalRequest?._retry)) {
      // Login 401 = bad credentials — do NOT wipe session, just reject
      if (!isLoginRoute) {
        if (isRefreshRoute || originalRequest?._retry) {
          await handleAuthFailure();
        }
      }
      return Promise.reject(error);
    }

    error.userMessage = error.userMessage || extractErrorMessage(error);

    const suppressToast =
      error.config?.headers?.['x-suppress-toast'] === 'true' ||
      error.config?.headers?.['x-suppress-toast'] === true;

    if (!suppressToast) {
      showGlobalToast({ message: error.userMessage, type: 'error' });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
