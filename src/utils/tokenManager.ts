import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_STORAGE_KEY = 'jwt_token';
export const TOKEN_EXPIRY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Decodes the payload from a JWT token safely in any environment (Web, iOS, Android).
 */
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

/**
 * Calculates when the token should expire:
 * Defaults to 24 hours from now, or earlier if the JWT payload specifies an earlier expiration.
 */
export const calculateTokenExpiry = (
  token?: string | null,
  durationMs: number = TOKEN_EXPIRY_DURATION_MS
): number => {
  const now = Date.now();
  const maxExpiry = now + durationMs;

  if (token) {
    const payload = parseJwtPayload(token);
    if (payload && typeof payload.exp === 'number') {
      const jwtExpMs = payload.exp * 1000;
      // If JWT exp is valid and in the future, use the minimum of maxExpiry and jwtExpMs
      if (jwtExpMs > now) {
        return Math.min(maxExpiry, jwtExpMs);
      }
    }
  }

  return maxExpiry;
};

/**
 * Checks whether a token or session has expired based on expiresAt timestamp and JWT exp.
 */
export const isTokenExpired = (
  token: string | null | undefined,
  expiresAt: number | null | undefined
): boolean => {
  if (!token) return true;

  const now = Date.now();

  // Check against recorded 24h expiration timestamp
  if (expiresAt && now >= expiresAt) {
    return true;
  }

  // Check against embedded JWT exp claim if present
  const payload = parseJwtPayload(token);
  if (payload && typeof payload.exp === 'number') {
    const jwtExpMs = payload.exp * 1000;
    if (now >= jwtExpMs) {
      return true;
    }
  }

  return false;
};

/**
 * Removes the JWT token from AsyncStorage.
 */
export const clearStoredToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    // Suppress storage clearance errors
  }
};

/**
 * Stores the JWT token in AsyncStorage.
 */
export const setStoredToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    // Suppress storage write errors
  }
};
