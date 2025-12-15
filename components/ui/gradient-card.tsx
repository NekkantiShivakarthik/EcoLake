import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { EcoColors } from '@/constants/colors';

interface GradientCardProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  colors?: readonly [string, string, ...string[]];
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
}

const gradientPresets: Record<string, readonly [string, string, ...string[]]> = {
  primary: [EcoColors.primary, '#059669'] as const,
  secondary: [EcoColors.secondary, '#0d9488'] as const,
  success: ['#22c55e', '#16a34a'] as const,
  warning: ['#f59e0b', '#d97706'] as const,
  info: ['#3b82f6', '#2563eb'] as const,
};

export function GradientCard({
  title,
  subtitle,
  icon,
  colors,
  children,
  onPress,
  style,
  variant = 'primary',
}: GradientCardProps) {
  const gradientColors = colors || gradientPresets[variant];

  const content = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  icon: {
    fontSize: 48,
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: EcoColors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: EcoColors.white,
    opacity: 0.9,
    lineHeight: 20,
  },
});
