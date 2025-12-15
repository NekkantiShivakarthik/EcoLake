import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EcoColors } from '@/constants/colors';

interface ActivityItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  time: string;
  points?: number;
  status?: 'success' | 'pending' | 'failed';
}

export function ActivityItem({
  icon,
  title,
  description,
  time,
  points,
  status = 'success',
}: ActivityItemProps) {
  const statusColors = {
    success: EcoColors.success,
    pending: EcoColors.warning,
    failed: EcoColors.error,
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        <View style={[styles.iconContainer, { backgroundColor: statusColors[status] + '20' }]}>
          <Ionicons name={icon} size={20} color={statusColors[status]} />
        </View>
        <View style={styles.line} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {points !== undefined && (
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={12} color={EcoColors.accent} />
              <Text style={styles.pointsText}>+{points}</Text>
            </View>
          )}
        </View>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: EcoColors.gray300,
    minHeight: 20,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray800,
    flex: 1,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: EcoColors.accent,
  },
  description: {
    fontSize: 14,
    color: EcoColors.gray600,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: EcoColors.gray500,
  },
});
