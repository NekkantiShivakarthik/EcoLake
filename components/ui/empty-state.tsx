import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { EcoColors } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({ icon = '📭', title, description, action, style }: EmptyStateProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description && <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading. Please try again.',
  action,
  style,
}: ErrorStateProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>😕</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export function LoadingState({ message = 'Loading...', style }: LoadingStateProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.loadingIcon}>⏳</Text>
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

interface SuccessStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function SuccessState({
  title = 'Success!',
  description,
  action,
  style,
}: SuccessStateProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.successIconContainer}>
        <Text style={styles.successIcon}>✓</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description && <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  action: {
    marginTop: 24,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: EcoColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
    color: EcoColors.white,
  },
});
