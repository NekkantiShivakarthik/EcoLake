import { EcoColors } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';
import { Badge } from '@/types/database';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BadgeItemProps {
  badge: Badge;
  earned?: boolean;
  awardedAt?: string;
}

export function BadgeItem({ badge, earned = true, awardedAt }: BadgeItemProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, !earned && styles.unearned]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }, earned && styles.earnedIcon]}>
        {badge.icon_url ? (
          <Image source={badge.icon_url} style={styles.icon} contentFit="cover" />
        ) : (
          <Text style={styles.defaultIcon}>🏆</Text>
        )}
      </View>
      <Text style={[styles.name, { color: colors.text }, !earned && { color: colors.textTertiary }]} numberOfLines={1}>
        {badge.name}
      </Text>
      {earned && awardedAt && (
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {new Date(awardedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
    padding: 8,
  },
  unearned: {
    opacity: 0.4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: EcoColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  earnedIcon: {
    backgroundColor: EcoColors.accentLight,
    borderWidth: 2,
    borderColor: EcoColors.accent,
  },
  icon: {
    width: 32,
    height: 32,
  },
  defaultIcon: {
    fontSize: 28,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: EcoColors.gray700,
    textAlign: 'center',
  },
  unearnedText: {
    color: EcoColors.gray400,
  },
  date: {
    fontSize: 9,
    color: EcoColors.gray400,
    marginTop: 2,
  },
});
