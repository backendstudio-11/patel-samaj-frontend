import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateTokens } from '../store/authSlice';
import { authApi, performLogout } from '../api/services/authApi';
import {
  isTokenExpired,
  setStoredTokens,
  parseExpiryToMs,
  calculateTokenExpiry,
} from '../utils/tokenManager';

/**
 * Custom hook to monitor session lifecycle:
 * - Checks access token expiration on mount and on AppState resume.
 * - Triggers silent token refresh when access token expires.
 * - Invokes centralized performLogout only if refresh token has expired or is revoked.
 */
export const useAuthSession = () => {
  const dispatch = useDispatch();
  const { token, refreshToken, expiresAt, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isRefreshingRef = useRef<boolean>(false);

  const checkAndHandleExpiry = async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    if (isTokenExpired(token, expiresAt) && !isRefreshingRef.current) {
      isRefreshingRef.current = true;
      try {
        const refreshResponse = await authApi.refreshToken(refreshToken);
        if (refreshResponse?.jwtToken) {
          const newJwtToken = refreshResponse.jwtToken;
          const newRefreshToken = refreshResponse.refreshToken;
          const newExpireAt = refreshResponse.expireAt;
          const expiresAtMs =
            parseExpiryToMs(newExpireAt) ?? calculateTokenExpiry(newJwtToken);

          await setStoredTokens(newJwtToken, newRefreshToken);
          dispatch(
            updateTokens({
              token: newJwtToken,
              refreshToken: newRefreshToken,
              expiresAt: expiresAtMs,
            })
          );
        }
      } catch {
        // Refresh token invalid, expired, or revoked on backend
        await performLogout(dispatch);
      } finally {
        isRefreshingRef.current = false;
      }
    }
  };

  useEffect(() => {
    // 1. Immediate check on mount / state change
    checkAndHandleExpiry();

    if (!isAuthenticated || !token) {
      return;
    }

    // 2. React Native AppState listener (fires when app comes back to foreground)
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          checkAndHandleExpiry();
        }
        appState.current = nextAppState;
      }
    );

    // 3. Exact timeout for token expiry
    let timerId: ReturnType<typeof setTimeout> | null = null;
    if (expiresAt) {
      const msUntilExpiry = expiresAt - Date.now();
      if (msUntilExpiry > 0) {
        timerId = setTimeout(() => {
          checkAndHandleExpiry();
        }, msUntilExpiry);
      } else {
        checkAndHandleExpiry();
      }
    }

    // 4. Periodic background sanity interval check (every 30 seconds)
    const intervalId = setInterval(() => {
      checkAndHandleExpiry();
    }, 30 * 1000);

    return () => {
      subscription.remove();
      if (timerId) clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, [isAuthenticated, token, refreshToken, expiresAt, dispatch]);
};
