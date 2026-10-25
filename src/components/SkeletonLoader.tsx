import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { themeColors } from '../theme';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'profile';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'list',
  count = 3,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const renderSkeletonItem = (index: number) => {
    switch (type) {
      case 'card':
        return (
          <View key={index} style={styles.cardContainer}>
            <Animated.View style={[styles.skeleton, { opacity: pulseAnim, width: '40%', height: 20, marginBottom: 12 }]} />
            <Animated.View style={[styles.skeleton, { opacity: pulseAnim, width: '80%', height: 16, marginBottom: 8 }]} />
            <Animated.View style={[styles.skeleton, { opacity: pulseAnim, width: '60%', height: 16 }]} />
          </View>
        );
      case 'profile':
        return (
          <View key={index} style={styles.profileContainer}>
            <Animated.View style={[styles.avatarSkeleton, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeleton, { opacity: pulseAnim, width: '50%', height: 24, marginBottom: 8 }]} />
            <Animated.View style={[styles.skeleton, { opacity: pulseAnim, width: '30%', height: 16 }]} />
          </View>
        );
      case 'list':
      default:
        return (
          <View key={index} style={styles.listItem}>
            <View style={styles.listTextContainer}>
              <Animated.View style={[styles.skeleton, { opacity: pulseAnim, width: '60%', height: 18, marginBottom: 8 }]} />
              <Animated.View style={[styles.skeleton, { opacity: pulseAnim, width: '40%', height: 14 }]} />
            </View>
            <Animated.View style={[styles.skeletonCircle, { opacity: pulseAnim }]} />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, idx) => renderSkeletonItem(idx))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  skeleton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  cardContainer: {
    backgroundColor: themeColors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  listTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 24,
  },
  avatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
});

export default SkeletonLoader;
