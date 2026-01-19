import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { EditReportModal } from '@/components/ui/edit-report-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { EnhancedReportCard } from '@/components/ui/enhanced-report-card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useDeleteReport, useReports, useStats, useUpdateReport, useUserProfile } from '@/hooks/use-supabase';
import { Report } from '@/types/database';

export default function HomeScreen() {
  const { user: authUser } = useAuth();
  const { actualTheme, setTheme } = useTheme();
  const { stats } = useStats(authUser?.id);
  const { reports, refetch, loading: reportsLoading } = useReports();
  const { user, points } = useUserProfile(authUser?.id);
  const { updateReport } = useUpdateReport();
  const { deleteReport } = useDeleteReport();

  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEditReport = (report: Report) => {
    setSelectedReport(report);
    setEditModalVisible(true);
  };

  const handleSaveReport = async (data: { category: string; severity: number; description: string }) => {
    if (!selectedReport) return { success: false, error: 'No report selected' };
    
    const result = await updateReport(selectedReport.id, data);
    if (result.success) {
      await refetch();
    }
    return result;
  };

  const handleDeleteReport = async (reportId: string) => {
    const result = await deleteReport(reportId);
    if (result.success) {
      Alert.alert('Success', 'Report deleted successfully');
      await refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to delete report');
    }
  };

  const recentReports = reports.slice(0, 5);

  // Calculate level info
  const currentLevel = Math.floor((user?.points || points) / 500) + 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Eco Hero'} 👋</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.themeToggle, { backgroundColor: colors.surface }]}
                onPress={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
              >
                <Ionicons
                  name={actualTheme === 'dark' ? 'sunny' : 'moon'}
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
              <Link href="/(tabs)/redeem" asChild>
                <TouchableOpacity style={styles.pointsBadge}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.pointsGradient}
                  >
                    <Text style={styles.pointsIcon}>⭐</Text>
                    <Text style={styles.pointsText}>{points.toLocaleString()}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
              <View style={styles.avatarContainer}>
                <Avatar
                  source={user?.avatar_url || undefined}
                  name={user?.name || 'User'}
                  size="md"
                  showBadge
                  badgeColor={EcoColors.success}
                />
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{currentLevel}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Hero Banner with Gradient */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <LinearGradient
            colors={['#0E7490', '#059669', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            {/* Background decorative elements */}
            <View style={styles.heroDecoration1} />
            <View style={styles.heroDecoration2} />
            
            <View style={styles.heroContent}>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroTitle}>Protect Our Lakes</Text>
                <Text style={styles.heroTitleEmoji}>🌊</Text>
              </View>
              <Text style={styles.heroSubtitle}>
                Report pollution, join cleanups, and earn rewards for making a difference.
              </Text>
              <View style={styles.heroButtons}>
                <Link href="/(tabs)/report" asChild>
                  <TouchableOpacity style={styles.heroButton}>
                    <Ionicons name="camera" size={18} color={EcoColors.primary} />
                    <Text style={styles.heroButtonText}>Report Now</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/(tabs)/volunteer" asChild>
                  <TouchableOpacity style={[styles.heroButton, styles.heroButtonSecondary]}>
                    <Ionicons name="hand-left" size={18} color={EcoColors.white} />
                    <Text style={[styles.heroButtonText, styles.heroButtonTextSecondary]}>Volunteer</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInRight.delay(150).springify()} style={styles.quickActions}>
          <Link href="/(tabs)/explore" asChild>
            <TouchableOpacity style={styles.quickAction}>
              <LinearGradient colors={[EcoColors.info + '20', EcoColors.info + '10']} style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>🔍</Text>
              </LinearGradient>
              <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Explore</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/leaderboard" asChild>
            <TouchableOpacity style={styles.quickAction}>
              <LinearGradient colors={[EcoColors.accent + '20', EcoColors.accent + '10']} style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>🏆</Text>
              </LinearGradient>
              <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Leaders</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/redeem" asChild>
            <TouchableOpacity style={styles.quickAction}>
              <LinearGradient colors={[EcoColors.secondary + '20', EcoColors.secondary + '10']} style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>🎁</Text>
              </LinearGradient>
              <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Rewards</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/activity" asChild>
            <TouchableOpacity style={styles.quickAction}>
              <LinearGradient colors={[EcoColors.primary + '20', EcoColors.primary + '10']} style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>📊</Text>
              </LinearGradient>
              <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Activity</Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Impact Dashboard</Text>
          <View style={styles.statsRow}>
            <StatCard
              title="Total Reports"
              value={stats.totalReports}
              icon="📋"
              color={EcoColors.primary}
            />
            <StatCard
              title="Lakes Cleaned"
              value={stats.cleanedReports}
              icon="✨"
              color={EcoColors.secondary}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="Active Lakes"
              value={stats.totalLakes}
              icon="🏞️"
              color={EcoColors.info}
            />
            <StatCard
              title="Volunteers"
              value={stats.totalCleaners}
              icon="🦸"
              color={EcoColors.accent}
            />
          </View>
        </Animated.View>

        {/* Recent Reports Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Recent Reports</Text>
            <Link href="/(tabs)/explore" asChild>
              <TouchableOpacity style={styles.seeAllBtn}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>View All</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {reportsLoading ? (
          <View style={styles.skeletonContainer}>
            <CardSkeleton variant="report" />
            <CardSkeleton variant="report" />
          </View>
        ) : recentReports.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No Reports Yet"
            description="Be the first to report pollution in your area!"
          />
        ) : (
          recentReports.map((report, index) => (
            <EnhancedReportCard
              key={report.id}
              report={report}
              index={index}
              isOwner={report.user?.id === authUser?.id}
              variant={index === 0 ? 'featured' : 'default'}
              onEdit={() => handleEditReport(report)}
              onDelete={() => handleDeleteReport(report.id)}
            />
          ))
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Report Modal */}
      <EditReportModal
        visible={editModalVisible}
        report={selectedReport}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedReport(null);
        }}
        onSave={handleSaveReport}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.gray50,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 14,
    color: EcoColors.gray500,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: EcoColors.gray900,
    letterSpacing: -0.5,
  },
  pointsBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  pointsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  pointsIcon: {
    fontSize: 14,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: EcoColors.gray800,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: EcoColors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: EcoColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: EcoColors.white,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: EcoColors.white,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: EcoColors.gray200,
  },
  heroBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    minHeight: 180,
  },
  heroDecoration1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroDecoration2: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroContent: {
    flex: 1,
    zIndex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: EcoColors.white,
    letterSpacing: -0.5,
  },
  heroTitleEmoji: {
    fontSize: 28,
  },
  heroSubtitle: {
    fontSize: 14,
    color: EcoColors.white,
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: '90%',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.white,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: EcoColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: EcoColors.primary,
  },
  heroButtonTextSecondary: {
    color: EcoColors.white,
  },
  heroButtonIcon: {
    fontSize: 16,
  },
  heroEmoji: {
    fontSize: 64,
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionEmoji: {
    fontSize: 26,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: EcoColors.gray600,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: EcoColors.gray800,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: EcoColors.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  lakesListContent: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: EcoColors.gray500,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: EcoColors.gray700,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: EcoColors.gray500,
    textAlign: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});
