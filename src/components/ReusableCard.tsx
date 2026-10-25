import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { themeColors, shadows } from '../theme';

interface ReusableCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accentColor?: string; // Optional left accent bar color
}

export const ReusableCard: React.FC<ReusableCardProps> = ({
  children,
  style,
  onPress,
  accentColor,
}) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      style={[
        styles.card,
        accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    ...shadows.soft,
  },
  content: {
    padding: 16,
  },
});

export default ReusableCard;
