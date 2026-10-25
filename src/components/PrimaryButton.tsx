import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { themeColors } from '../theme';

interface PrimaryButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onPress,
  children,
  mode = 'contained',
  loading = false,
  disabled = false,
  icon,
  style,
  color = themeColors.primary,
}) => {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      buttonColor={mode === 'contained' ? color : undefined}
      textColor={mode === 'contained' ? '#FFFFFF' : color}
      style={[styles.button, style]}
      contentStyle={styles.content}
      labelStyle={styles.label}
    >
      {children}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    marginVertical: 12,
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 24,
    minWidth: 180,
  },
  content: {
    height: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrimaryButton;
