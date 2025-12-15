import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { EcoColors } from '@/constants/colors';

interface ChipProps {
  label: string;
  icon?: string;
  variant?: 'filled' | 'outlined' | 'soft';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const colorMap = {
  primary: { bg: EcoColors.primary, text: EcoColors.white, soft: EcoColors.primaryLight + '30' },
  secondary: { bg: EcoColors.secondary, text: EcoColors.white, soft: EcoColors.secondaryLight + '30' },
  success: { bg: EcoColors.success, text: EcoColors.white, soft: '#dcfce7' },
  warning: { bg: EcoColors.warning, text: EcoColors.gray900, soft: '#fef3c7' },
  error: { bg: EcoColors.error, text: EcoColors.white, soft: '#fee2e2' },
  info: { bg: EcoColors.info, text: EcoColors.white, soft: '#dbeafe' },
};

const sizeMap = {
  sm: { paddingH: 8, paddingV: 4, fontSize: 11, iconSize: 12 },
  md: { paddingH: 12, paddingV: 6, fontSize: 13, iconSize: 14 },
  lg: { paddingH: 16, paddingV: 8, fontSize: 15, iconSize: 16 },
};

export function Chip({
  label,
  icon,
  variant = 'filled',
  color = 'primary',
  size = 'md',
  style,
}: ChipProps) {
  const colors = colorMap[color];
  const sizes = sizeMap[size];

  const chipStyle = [
    styles.chip,
    {
      paddingHorizontal: sizes.paddingH,
      paddingVertical: sizes.paddingV,
    },
    variant === 'filled' && { backgroundColor: colors.bg },
    variant === 'outlined' && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.bg },
    variant === 'soft' && { backgroundColor: colors.soft },
    style,
  ];

  const textColor =
    variant === 'filled' ? colors.text : variant === 'soft' ? colors.bg : colors.bg;

  return (
    <View style={chipStyle}>
      {icon && <Text style={[styles.icon, { fontSize: sizes.iconSize }]}>{icon}</Text>}
      <Text style={[styles.label, { fontSize: sizes.fontSize, color: textColor }]}>{label}</Text>
    </View>
  );
}

interface StatusChipProps {
  status: 'submitted' | 'verified' | 'assigned' | 'in_progress' | 'cleaned' | 'pending' | 'delivered' | 'cancelled' | 'closed' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { color: ChipProps['color']; icon: string; label: string }> = {
  submitted: { color: 'info', icon: '📝', label: 'Submitted' },
  verified: { color: 'primary', icon: '✓', label: 'Verified' },
  assigned: { color: 'warning', icon: '👤', label: 'Assigned' },
  in_progress: { color: 'secondary', icon: '🔄', label: 'In Progress' },
  cleaned: { color: 'success', icon: '✨', label: 'Cleaned' },
  pending: { color: 'warning', icon: '⏳', label: 'Pending' },
  delivered: { color: 'success', icon: '✅', label: 'Delivered' },
  cancelled: { color: 'error', icon: '✕', label: 'Cancelled' },
  closed: { color: 'info', icon: '🔒', label: 'Closed' },
  rejected: { color: 'error', icon: '❌', label: 'Rejected' },
};

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const config = statusConfig[status] || statusConfig.submitted;

  return (
    <Chip
      label={config.label}
      icon={config.icon}
      color={config.color}
      variant="soft"
      size={size}
    />
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 4,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    fontWeight: '600',
  },
});
