import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityItem } from '@/components/ui/activity-item';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useReports, useUserProfile } from '@/hooks/use-supabase';

export default function ActivityHistoryScreen() {
  const { user: authUser } = useAuth();
  const { colors } = useTheme();
  const { user } = useUserProfile(authUser?.id);
  const { reports, loading: reportsLoading, refetch } = useReports();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'reports' | 'points' | 'rewards'>('all');

  const userReports = reports.filter((r) => r.user?.id === user?.id);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Generate activity timeline from user data
  const getActivities = () => {
    const activities: Array<{
      id: string;
      icon: keyof typeof Ionicons.glyphMap;
      title: string;
      description: string;
      time: string;
      points?: number;
      status: 'success' | 'pending' | 'failed';
      date: Date;
    }> = [];

    // Add report activities
    userReports.forEach((report) => {
      const date = new Date(report.created_at || '');
      
      // Report submission
      activities.push({
        id: `report-${report.id}`,
        icon: 'document-text',
        title: 'Report Submitted',
        description: `Reported ${report.category} pollution at ${report.lake?.name || 'Unknown Lake'}`,
        time: formatRelativeTime(date),
        points: 50,
        status: 'success',
        date,
      });

      // Report status updates
      if (report.status === 'verified') {
        activities.push({
          id: `verified-${report.id}`,
          icon: 'checkmark-circle',
          title: 'Report Verified',
          description: `Your report at ${report.lake?.name || 'Unknown Lake'} was verified`,
          time: formatRelativeTime(date),
          points: 100,
          status: 'success',
          date,
        });
      } else if (report.status === 'cleaned') {
        activities.push({
          id: `cleaned-${report.id}`,
          icon: 'checkmark-done-circle',
          title: 'Lake Cleaned',
          description: `Cleanup completed at ${report.lake?.name || 'Unknown Lake'}`,
          time: formatRelativeTime(new Date(report.volunteer_completed_at || date)),
          points: 200,
          status: 'success',
          date: new Date(report.volunteer_completed_at || date),
        });
      } else if (report.status === 'rejected') {
        activities.push({
          id: `rejected-${report.id}`,
          icon: 'close-circle',
          title: 'Report Rejected',
          description: `Your report at ${report.lake?.name || 'Unknown Lake'} was rejected`,
          time: formatRelativeTime(date),
          status: 'failed',
          date,
        });
      }
    });

    // Sort by date descending
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const activities = getActivities();
  const totalPoints = activities.reduce((sum, act) => sum + (act.points || 0), 0);

  const filterButtons = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'reports', label: 'Reports', icon: 'document-text' },
    { key: 'points', label: 'Points', icon: 'star' },
    { key: 'rewards', label: 'Rewards', icon: 'gift' },
  ];

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    if (filter === 'reports') return activity.icon === 'document-text';
    if (filter === 'points') return activity.points !== undefined;
    if (filter === 'rewards') return activity.icon === 'gift';
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[EcoColors.primary, EcoColors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={EcoColors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Activity History</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activities.length}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userReports.length}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filterButtons.map((btn) => (
          <TouchableOpacity
            key={btn.key}
            style={[
              styles.filterButton,
              filter === btn.key && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(btn.key as typeof filter)}
          >
            <Ionicons
              name={btn.icon as any}
              size={16}
              color={filter === btn.key ? EcoColors.white : EcoColors.gray600}
            />
            <Text
              style={[
                styles.filterButtonText,
                filter === btn.key && styles.filterButtonTextActive,
              ]}
            >
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Activity Timeline */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredActivities.length > 0 ? (
          <Card variant="outlined" style={styles.timelineCard}>
            {filteredActivities.map((activity, index) => (
              <View key={activity.id}>
                <ActivityItem
                  icon={activity.icon}
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                  points={activity.points}
                  status={activity.status}
                />
                {index < filteredActivities.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState
            icon="time"
            title="No Activity Yet"
            description="Start reporting pollution to see your activity here"
            actionLabel="Report Pollution"
            onAction={() => router.push('/(tabs)/report')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.gray50,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: EcoColors.white,
  },
  placeholder: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: EcoColors.white,
  },
  statLabel: {
    fontSize: 12,
    color: EcoColors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: EcoColors.white,
    opacity: 0.3,
  },
  filterScroll: {
    maxHeight: 60,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: EcoColors.gray200,
    gap: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: EcoColors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.gray600,
  },
  filterButtonTextActive: {
    color: EcoColors.white,
  },
  timelineCard: {
    margin: 16,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: EcoColors.gray200,
    marginLeft: 68,
  },
});
