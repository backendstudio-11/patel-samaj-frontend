import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeColors } from '../theme';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global event dispatcher for non-React code (e.g. Axios interceptors)
type ToastListener = (options: ToastOptions) => void;
const listeners: Set<ToastListener> = new Set();

export const showGlobalToast = (options: ToastOptions | string) => {
  const normalized: ToastOptions =
    typeof options === 'string' ? { message: options, type: 'info' } : options;
  listeners.forEach((listener) => listener(normalized));
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [duration, setDuration] = useState(3500);
  const [actionLabel, setActionLabel] = useState<string>('OK');
  const [actionCallback, setActionCallback] = useState<(() => void) | undefined>(undefined);

  const showToast = (options: ToastOptions | string) => {
    const opts: ToastOptions =
      typeof options === 'string' ? { message: options, type: 'info' } : options;

    if (!opts.message || !opts.message.trim()) return;

    setMessage(opts.message.trim());
    setType(opts.type || 'info');
    setDuration(opts.duration || 3500);
    setActionLabel(opts.actionLabel || 'OK');
    setActionCallback(() => opts.onAction);
    setVisible(true);
  };

  const showSuccess = (msg: string) => showToast({ message: msg, type: 'success' });
  const showError = (msg: string) => showToast({ message: msg, type: 'error' });
  const showInfo = (msg: string) => showToast({ message: msg, type: 'info' });
  const hideToast = () => setVisible(false);

  useEffect(() => {
    const listener: ToastListener = (opts) => {
      showToast(opts);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return themeColors.success;
      case 'error':
        return themeColors.error;
      case 'info':
      default:
        return themeColors.secondary;
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'check-circle-outline';
      case 'error':
        return 'alert-circle-outline';
      case 'info':
      default:
        return 'information-outline';
    }
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        hideToast,
      }}
    >
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hideToast}
        duration={duration}
        style={[
          styles.snackbar,
          { backgroundColor: getBackgroundColor() },
        ]}
        action={{
          label: actionLabel,
          textColor: '#FFFFFF',
          onPress: () => {
            if (actionCallback) actionCallback();
            hideToast();
          },
        }}
      >
        <View style={styles.contentRow}>
          <MaterialCommunityIcons
            name={getIconName() as any}
            size={22}
            color="#FFFFFF"
            style={styles.icon}
          />
          <Text style={styles.messageText} numberOfLines={4}>
            {message}
          </Text>
        </View>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: showGlobalToast,
      showSuccess: (msg: string) => showGlobalToast({ message: msg, type: 'success' }),
      showError: (msg: string) => showGlobalToast({ message: msg, type: 'error' }),
      showInfo: (msg: string) => showGlobalToast({ message: msg, type: 'info' }),
      hideToast: () => {},
    };
  }
  return context;
};

const styles = StyleSheet.create({
  snackbar: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 32 : 20,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    alignSelf: 'center',
    maxWidth: 500,
    width: '92%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 10,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
});
