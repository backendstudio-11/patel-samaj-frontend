import axios from 'axios';
import { store } from '../store';
import { logoutAction } from '../store/authSlice';
import { isTokenExpired, clearStoredToken } from '../utils/tokenManager';
import { showGlobalToast } from '../context/ToastContext';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject bearer token
apiClient.interceptors.request.use(
  (config) => {
    const isPublic =
      config.url &&
      (config.url.includes('/auth/login') ||
        config.url.includes('/auth/forgot-password'));

    if (isPublic) {
      return config;
    }

    const state = store.getState();
    const token = state.auth?.token;
    const expiresAt = state.auth?.expiresAt;

    if (token) {
      // Check if the 24-hour token or JWT expiry has passed
      if (isTokenExpired(token, expiresAt)) {
        clearStoredToken();
        store.dispatch(logoutAction());
        const silentAuthError = new Error('Unauthorized');
        (silentAuthError as any).isAuthError = true;
        return Promise.reject(silentAuthError);
      }

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
    const suppressToast =
      config.headers?.['x-suppress-toast'] === 'true' ||
      config.headers?.['x-suppress-toast'] === true;

    if (isMutating && !isListQuery && !suppressToast) {
      const message = extractSuccessMessage(response);
      showGlobalToast({ message, type: 'success' });
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const isAuthError =
      status === 401 ||
      status === 403 ||
      error?.isAuthError ||
      error?.message === 'Unauthorized';

    if (isAuthError) {
      clearStoredToken();
      store.dispatch(logoutAction());
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
