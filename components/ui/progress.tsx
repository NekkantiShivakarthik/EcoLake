import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { EcoColors } from '@/constants/colors';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color = EcoColors.primary,
  backgroundColor = EcoColors.gray200,
  height = 8,
  showLabel = false,
  animated = true,
  style,
}: ProgressBarProps) {
  const animatedProgress = useSharedValue(0);

  React.useEffect(() => {
    animatedProgress.value = withTiming(Math.min(100, Math.max(0, progress)), {
      duration: animated ? 500 : 0,
    });
  }, [progress, animated, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  return (
    <View style={style}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{Math.round(progress)}%</Text>
        </View>
      )}
      <View style={[styles.container, { height, backgroundColor }]}>
        <Animated.View
          style={[
            styles.progress,
            { height, backgroundColor: color, borderRadius: height / 2 },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 8,
  color = EcoColors.primary,
  backgroundColor = EcoColors.gray200,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <View style={styles.svgContainer}>
        {/* Background circle - using View with border */}
        <View
          style={[
            styles.circleBackground,
            {
              width: size - strokeWidth,
              height: size - strokeWidth,
              borderRadius: (size - strokeWidth) / 2,
              borderWidth: strokeWidth,
              borderColor: backgroundColor,
            },
          ]}
        />
        {/* Progress indicator using conic gradient simulation */}
        <View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderRightColor: 'transparent',
              borderBottomColor: progress > 50 ? color : 'transparent',
              transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }],
            },
          ]}
        />
      </View>
      <View style={styles.circularContent}>{children}</View>
    </View>
  );
}

interface StepsProgressProps {
  steps: string[];
  currentStep: number;
  color?: string;
}

export function StepsProgress({
  steps,
  currentStep,
  color = EcoColors.primary,
}: StepsProgressProps) {
  return (
    <View style={styles.stepsContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                index <= currentStep && { backgroundColor: color, borderColor: color },
              ]}
            >
              {index < currentStep ? (
                <Text style={styles.stepCheckmark}>✓</Text>
              ) : (
                <Text
                  style={[styles.stepNumber, index <= currentStep && styles.stepNumberActive]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[styles.stepLabel, index <= currentStep && { color, fontWeight: '600' }]}
            >
              {step}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View
              style={[styles.stepLine, index < currentStep && { backgroundColor: color }]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  labelContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: EcoColors.gray600,
  },
  circularContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBackground: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
  circularContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: EcoColors.gray300,
    backgroundColor: EcoColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.gray400,
  },
  stepNumberActive: {
    color: EcoColors.white,
  },
  stepCheckmark: {
    fontSize: 14,
    color: EcoColors.white,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 12,
    color: EcoColors.gray500,
    textAlign: 'center',
    maxWidth: 80,
  },
  stepLine: {
    height: 2,
    width: 40,
    backgroundColor: EcoColors.gray300,
    marginHorizontal: 8,
    marginBottom: 24,
  },
});
