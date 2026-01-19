import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { EcoColors } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, backgroundColor: colors.border },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface CardSkeletonProps {
  variant?: 'report' | 'lake' | 'stat' | 'reward';
}

export function CardSkeleton({ variant = 'report' }: CardSkeletonProps) {
  const { colors } = useTheme();
  
  if (variant === 'stat') {
    return (
      <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width="60%" height={14} style={{ marginTop: 12 }} />
        <Skeleton width="40%" height={24} style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (variant === 'lake') {
    return (
      <View style={[styles.lakeCard, { backgroundColor: colors.cardBackground }]}>
        <Skeleton width="100%" height={120} borderRadius={12} />
        <Skeleton width="70%" height={16} style={{ marginTop: 12 }} />
        <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (variant === 'reward') {
    return (
      <View style={[styles.rewardCard, { backgroundColor: colors.cardBackground }]}>
        <Skeleton width="100%" height={180} borderRadius={16} />
        <View style={{ padding: 16 }}>
          <Skeleton width="80%" height={18} />
          <Skeleton width="100%" height={14} style={{ marginTop: 8 }} />
          <Skeleton width="40%" height={28} style={{ marginTop: 12 }} />
        </View>
      </View>
    );
  }

  // Default report card
  return (
    <View style={[styles.reportCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.reportHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <Skeleton width="100%" height={60} style={{ marginTop: 12 }} />
      <View style={styles.reportFooter}>
        <Skeleton width={80} height={20} borderRadius={10} />
        <Skeleton width={60} height={20} borderRadius={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: EcoColors.gray200,
  },
  statCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
  },
  lakeCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    width: 200,
    marginRight: 12,
    overflow: 'hidden',
    padding: 12,
  },
  rewardCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  reportCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
