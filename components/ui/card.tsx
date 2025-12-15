import { useTheme } from '@/contexts/theme-context';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: number;
}

export function Card({ style, variant = 'default', padding = 16, children, ...props }: CardProps) {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
    },
    elevated: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    outlined: {
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        { padding },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
