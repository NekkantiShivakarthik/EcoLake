import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ReportCard } from '@/components/ui/report-card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useReports, useStats, useUserProfile } from '@/hooks/use-supabase';

export default function HomeScreen() {
  const { user: authUser } = useAuth();
  const { theme, actualTheme, setTheme, colors } = useTheme();
  const { stats, loading: statsLoading } = useStats(authUser?.id);
  const { reports, loading: reportsLoading, refetch } = useReports();
  const { user, points } = useUserProfile(authUser?.id);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const recentReports = reports.slice(0, 5);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={EcoColors.primary} />
        }
      >
        {/* Header */}
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
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <Link href="/(tabs)/redeem" asChild>
              <TouchableOpacity style={styles.pointsBadge}>
                <Text style={styles.pointsIcon}>⭐</Text>
                <Text style={[styles.pointsText, { color: colors.text }]}>{points}</Text>
              </TouchableOpacity>
            </Link>
            <Avatar
              source={user?.avatar_url}
              name={user?.name || 'User'}
              size="md"
              showBadge
              badgeColor={EcoColors.success}
            />
          </View>
        </View>

        {/* Hero Banner with Gradient */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <LinearGradient
            colors={[EcoColors.primary, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Protect Our Lakes 🌿</Text>
              <Text style={styles.heroSubtitle}>
                Report pollution, join cleanups, and earn rewards for making a difference.
              </Text>
              <View style={styles.heroButtons}>
                <Link href="/(tabs)/report" asChild>
                  <TouchableOpacity style={styles.heroButton}>
                    <Ionicons name="camera" size={18} color={EcoColors.primary} />
                    <Text style={styles.heroButtonText}>Report</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/(tabs)/redeem" asChild>
                  <TouchableOpacity style={[styles.heroButton, styles.heroButtonSecondary]}>
                    <Ionicons name="gift" size={18} color={EcoColors.white} />
                    <Text style={[styles.heroButtonText, styles.heroButtonTextSecondary]}>Redeem</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
            <Text style={styles.heroEmoji}>🌊</Text>
          </LinearGradient>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Impact Dashboard</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Reports</Text>
            <Link href="/(tabs)/explore" asChild>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>View All</Text>
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
            <Animated.View key={report.id} entering={FadeInDown.delay(300 + index * 100).springify()}>
              <ReportCard report={report} />
            </Animated.View>
          ))
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    gap: 12,
  },
  greeting: {
    fontSize: 14,
    color: EcoColors.gray500,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: EcoColors.gray900,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
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
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: EcoColors.gray200,
  },
  heroBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: EcoColors.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: EcoColors.white,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: EcoColors.white,
    opacity: 0.9,
    lineHeight: 18,
    marginBottom: 12,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  heroButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: EcoColors.white,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
