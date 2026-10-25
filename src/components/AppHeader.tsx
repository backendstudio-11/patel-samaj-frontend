import React from 'react';
import { Appbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { themeColors } from '../theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightActionIcon?: string;
  onRightAction?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightActionIcon,
  onRightAction,
}) => {
  return (
    <Appbar.Header style={styles.header} statusBarHeight={0}>
      {showBack && (
        <Appbar.BackAction
          color="#FFFFFF"
          onPress={onBack}
        />
      )}
      <Appbar.Content
        title={title}
        subtitle={subtitle}
        titleStyle={styles.title}
        subtitleStyle={styles.subtitle}
      />
      {rightActionIcon && onRightAction && (
        <Appbar.Action
          icon={rightActionIcon}
          color="#FFFFFF"
          onPress={onRightAction}
        />
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: themeColors.secondary, // Dark Navy
    elevation: 4,
    height: 56,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  subtitle: {
    color: themeColors.saffronLight,
    fontSize: 12,
  },
});

export default AppHeader;
