import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { themeColors } from '../theme';

interface LoadingSpinnerProps {
  color?: string;
  size?: 'small' | 'large' | number;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  color = themeColors.primary,
  size = 'large',
  fullScreen = true,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
});

export default LoadingSpinner;
