import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logoutAction } from '../store/authSlice';
import { isTokenExpired, clearStoredToken } from '../utils/tokenManager';

/**
 * Custom hook to monitor token expiration lifecycle:
 * - Checks expiration immediately on mount / rehydration.
 * - Checks expiration on AppState transition to 'active' (app resume / foreground).
 * - Schedules a real-time timer while active to automatically log out when 24h expires.
 */
export const useAuthSession = () => {
  const dispatch = useDispatch();
  const { token, expiresAt, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const checkAndHandleExpiry = () => {
    if (isAuthenticated || token) {
      if (isTokenExpired(token, expiresAt)) {
        clearStoredToken();
        dispatch(logoutAction());
      }
    }
  };

  useEffect(() => {
    // 1. Immediate check on mount / state change
    checkAndHandleExpiry();

    if (!isAuthenticated || !token || !expiresAt) {
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
    const msUntilExpiry = expiresAt - Date.now();
    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (msUntilExpiry > 0) {
      timerId = setTimeout(() => {
        checkAndHandleExpiry();
      }, msUntilExpiry);
    } else {
      checkAndHandleExpiry();
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
  }, [isAuthenticated, token, expiresAt, dispatch]);
};
