import { EcoColors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Card } from './card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  variant?: 'default' | 'gradient';
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  color = EcoColors.primary, 
  subtitle, 
  trend,
  variant = 'default',
}: StatCardProps) {
  if (variant === 'gradient') {
    return (
      <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.gradientWrapper}>
        <LinearGradient
          colors={[color, `${color}DD`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          <View style={styles.gradientDecoration} />
          <View style={styles.gradientHeader}>
            <View style={styles.gradientIconContainer}>
              <Text style={styles.gradientIcon}>{icon}</Text>
            </View>
            {trend && (
              <View style={styles.gradientTrendBadge}>
                <Text style={styles.gradientTrendText}>
                  {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.gradientValue}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
          <Text style={styles.gradientTitle}>{title}</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

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
    padding: 18,
    minWidth: 100,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  trendPositive: {
    backgroundColor: '#dcfce7',
  },
  trendNegative: {
    backgroundColor: '#fee2e2',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trendTextPositive: {
    color: EcoColors.success,
  },
  trendTextNegative: {
    color: EcoColors.error,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -1,
  },
  title: {
    fontSize: 13,
    color: EcoColors.gray500,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 11,
    color: EcoColors.gray400,
    marginTop: 2,
  },
  // Gradient variant styles
  gradientWrapper: {
    flex: 1,
    minWidth: 100,
  },
  gradientCard: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  gradientIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientIcon: {
    fontSize: 24,
  },
  gradientTrendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  gradientTrendText: {
    fontSize: 11,
    fontWeight: '700',
    color: EcoColors.white,
  },
  gradientValue: {
    fontSize: 32,
    fontWeight: '800',
    color: EcoColors.white,
    marginBottom: 4,
    letterSpacing: -1,
  },
  gradientTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
});
