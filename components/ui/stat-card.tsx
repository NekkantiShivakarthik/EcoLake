import { EcoColors } from '@/constants/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Card } from './card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ title, value, icon, color = EcoColors.primary, subtitle, trend }: StatCardProps) {
  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        {trend && (
          <View style={[styles.trendBadge, trend.positive ? styles.trendPositive : styles.trendNegative]}>
            <Text style={[styles.trendText, trend.positive ? styles.trendTextPositive : styles.trendTextNegative]}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
      <Animated.Text entering={FadeIn.delay(200)} style={[styles.value, { color }]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Animated.Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    minWidth: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendPositive: {
    backgroundColor: '#dcfce7',
  },
  trendNegative: {
    backgroundColor: '#fee2e2',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  trendTextPositive: {
    color: EcoColors.success,
  },
  trendTextNegative: {
    color: EcoColors.error,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    color: EcoColors.gray500,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 11,
    color: EcoColors.gray400,
    marginTop: 2,
  },
});
