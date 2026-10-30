import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_STORAGE_KEY = 'jwt_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
export const TOKEN_EXPIRY_DURATION_MS = 5 * 60 * 1000; // 5 minutes default for access token

export const parseExpiryToMs = (expireAt?: string | number | null): number | null => {
  if (!expireAt) return null;
  if (typeof expireAt === 'number') {
    return expireAt < 10000000000 ? expireAt * 1000 : expireAt;
  }
  if (typeof expireAt === 'string') {
    const parsed = Date.parse(expireAt);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

export const parseJwtPayload = (token: string): { exp?: number; [key: string]: any } | null => {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Decode base64
    let jsonStr = '';
    if (typeof atob === 'function') {
      const binaryString = atob(base64);
      jsonStr = decodeURIComponent(
        binaryString
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } else {
      // Pure JS fallback base64 decoder
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let buffer = 0;
      let bits = 0;
      for (let i = 0; i < base64.length; i++) {
        const c = base64.charAt(i);
        if (c === '=') break;
        const idx = chars.indexOf(c);
        if (idx === -1) continue;
        buffer = (buffer << 6) | idx;
        bits += 6;
        if (bits >= 8) {
          bits -= 8;
          jsonStr += String.fromCharCode((buffer >> bits) & 0xff);
        }
      }
    }

    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
};

export const calculateTokenExpiry = (
  token?: string | null,
  expireAt?: string | number | null,
  durationMs: number = TOKEN_EXPIRY_DURATION_MS
): number => {
  const fromExpireAt = parseExpiryToMs(expireAt);
  if (fromExpireAt && fromExpireAt > Date.now()) {
    return fromExpireAt;
  }

  const now = Date.now();
  const defaultExpiry = now + durationMs;

  if (token) {
    const payload = parseJwtPayload(token);
    if (payload && typeof payload.exp === 'number') {
      const jwtExpMs = payload.exp * 1000;
      if (jwtExpMs > now) {
        return jwtExpMs;
      }
    }
  }

  return defaultExpiry;
};

export const isTokenExpired = (
  token: string | null | undefined,
  expiresAt: number | null | undefined,
  bufferMs: number = 5000
): boolean => {
  if (!token) return true;

  const now = Date.now();

  // Check against recorded expiration timestamp
  if (expiresAt && now + bufferMs >= expiresAt) {
    return true;
  }

  // Check against embedded JWT exp claim if present
  const payload = parseJwtPayload(token);
  if (payload && typeof payload.exp === 'number') {
    const jwtExpMs = payload.exp * 1000;
    if (now + bufferMs >= jwtExpMs) {
      return true;
    }
  }

  return false;
};

/**
 * Retrieves the stored JWT token from AsyncStorage.
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Retrieves the stored refresh token from AsyncStorage.
 */
export const getStoredRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Stores the JWT token in AsyncStorage.
 */
export const setStoredToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Suppress storage write errors
  }
};

/**
 * Stores the refresh token in AsyncStorage.
 */
export const setStoredRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } catch {
    // Suppress storage write errors
  }
};

/**
 * Stores both access token and refresh token in AsyncStorage.
 */
export const setStoredTokens = async (
  token: string,
  refreshToken?: string | null
): Promise<void> => {
  try {
    const items: [string, string][] = [[TOKEN_STORAGE_KEY, token]];
    if (refreshToken) {
      items.push([REFRESH_TOKEN_STORAGE_KEY, refreshToken]);
    }
    await AsyncStorage.multiSet(items);
  } catch {
    // Suppress storage write errors
  }
};

/**
 * Removes both JWT access token and refresh token from AsyncStorage.
 */
export const clearStoredTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY]);
  } catch {
    // Suppress storage clearance errors
  }
};

/**
 * Backward compatibility alias for clearStoredTokens.
 */
export const clearStoredToken = clearStoredTokens;
