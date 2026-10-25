import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeColors } from '../theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'database-off-outline',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon as any} size={64} color={themeColors.textMuted} style={styles.icon} />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.button} buttonColor={themeColors.primary}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'transparent',
  },
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  title: {
    color: themeColors.text,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: themeColors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    borderRadius: 8,
    alignSelf: 'center',
    paddingHorizontal: 20,
    minWidth: 160,
  },
});

export default EmptyState;
