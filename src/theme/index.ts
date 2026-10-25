import { MD3LightTheme, configureFonts } from 'react-native-paper';

export const themeColors = {
  primary: '#F97316',      // Saffron
  secondary: '#1E293B',    // Dark Navy
  background: '#F8FAFC',   // Off-white
  surface: '#FFFFFF',
  text: '#0F172A',         // Slate 900
  textMuted: '#64748B',    // Slate 500
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  border: '#E2E8F0',       // Slate 200
  cardShadow: 'rgba(0, 0, 0, 0.05)',
  saffronLight: '#FFEFE6', // Saffron background hint
  navyLight: '#F1F5F9',    // Navy background hint
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    background: themeColors.background,
    surface: themeColors.surface,
    error: themeColors.error,
    outline: themeColors.border,
  },
  roundness: 12,
};

export const shadows = {
  soft: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};
