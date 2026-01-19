import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, CardSkeleton, EmptyState } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { LeaderboardItem } from '@/components/ui/leaderboard-item';
import { EcoColors } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';
import { useLeaderboard } from '@/hooks/use-supabase';

type TimeFilter = 'weekly' | 'monthly' | 'all-time';

const timeFilters: { key: TimeFilter; label: string; icon: string }[] = [
  { key: 'weekly', label: 'This Week', icon: 'calendar' },
  { key: 'monthly', label: 'This Month', icon: 'calendar-outline' },
  { key: 'all-time', label: 'All Time', icon: 'infinite' },
];

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('all-time');
  const { leaderboard, loading, refetch } = useLeaderboard(activeFilter);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#FFB800', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <Text style={styles.subtitle}>{`See who's making the biggest impact`}</Text>
        </View>

        {/* Time Filters */}
        <View style={styles.filtersContainer}>
          {timeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Ionicons
                name={filter.icon as any}
                size={14}
                color={activeFilter === filter.key ? '#FF8C00' : 'rgba(255,255,255,0.7)'}
              />
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <View style={styles.podiumContainer}>
          {/* 2nd Place */}
          <View style={[styles.podiumItem, styles.podiumSecond]}>
            <View style={[styles.podiumPedestal, styles.pedestalSecond]}>
              <Avatar
                name={topThree[1]?.user?.name || 'Anonymous'}
                size={52}
                badge="🥈"
              />
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[1]?.user?.name || 'Anonymous'}
              </Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.podiumPoints}>{topThree[1]?.total_points ?? 0}</Text>
              </View>
              <Text style={styles.rankNumber}>2</Text>
            </View>
          </View>

          {/* 1st Place */}
          <View style={[styles.podiumItem, styles.podiumFirst]}>
            <View style={styles.crownContainer}>
              <Text style={styles.crown}>👑</Text>
            </View>
            <View style={[styles.podiumPedestal, styles.pedestalFirst]}>
              <Avatar
                name={topThree[0]?.user?.name || 'Anonymous'}
                size={68}
                badge="🥇"
              />
              <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
                {topThree[0]?.user?.name || 'Anonymous'}
              </Text>
              <View style={[styles.pointsBadge, styles.pointsBadgeFirst]}>
                <Text style={[styles.podiumPoints, styles.podiumPointsFirst]}>
                  {topThree[0]?.total_points ?? 0}
                </Text>
              </View>
              <Text style={[styles.rankNumber, styles.rankNumberFirst]}>1</Text>
            </View>
          </View>

          {/* 3rd Place */}
          <View style={[styles.podiumItem, styles.podiumThird]}>
            <View style={[styles.podiumPedestal, styles.pedestalThird]}>
              <Avatar
                name={topThree[2]?.user?.name || 'Anonymous'}
                size={48}
                badge="🥉"
              />
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[2]?.user?.name || 'Anonymous'}
              </Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.podiumPoints}>{topThree[2]?.total_points ?? 0}</Text>
              </View>
              <Text style={styles.rankNumber}>3</Text>
            </View>
          </View>
        </View>
      )}

      {/* Stats Banner */}
      <Card variant="elevated" style={styles.statsBanner}>
        <LinearGradient
          colors={[EcoColors.primary, EcoColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.statsGradient}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statValue}>{leaderboard.length}</Text>
              <Text style={styles.statLabel}>Eco Heroes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="star" size={24} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statValue}>
                {leaderboard.reduce((sum, item) => sum + item.total_points, 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
          </View>
        </LinearGradient>
      </Card>

      {/* Leaderboard List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={restOfList}
          keyExtractor={(item, index) => item.user?.id || `user-${index}`}
          renderItem={({ item, index }) => (
            <LeaderboardItem
              rank={index + 4}
              user={item.user}
              points={item.total_points}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <EmptyState
              icon="🏆"
              title="No more rankings"
              description="Be active to climb the leaderboard!"
            />
          )}
          ListHeaderComponent={() => (
            <View style={styles.listHeaderContainer}>
              <Text style={[styles.listHeader, { color: colors.text }]}>Other Rankings</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
            </View>
          )}
        />
      )}
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: EcoColors.white,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: EcoColors.white,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: EcoColors.white,
  },
  filterTextActive: {
    color: '#FF8C00',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: -10,
    marginBottom: 16,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumFirst: {
    zIndex: 10,
  },
  podiumSecond: {},
  podiumThird: {},
  podiumPedestal: {
    alignItems: 'center',
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pedestalFirst: {
    paddingVertical: 20,
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  pedestalSecond: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 24,
  },
  pedestalThird: {
    backgroundColor: '#FDF5ED',
    borderWidth: 1,
    borderColor: '#E8D4C0',
    marginTop: 32,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: EcoColors.gray800,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 80,
  },
  podiumNameFirst: {
    fontSize: 14,
    maxWidth: 100,
  },
  pointsBadge: {
    backgroundColor: EcoColors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  pointsBadgeFirst: {
    backgroundColor: '#FFD700',
  },
  podiumPoints: {
    fontSize: 12,
    color: EcoColors.gray700,
    fontWeight: '700',
  },
  podiumPointsFirst: {
    fontSize: 14,
    color: '#7A5F00',
  },
  rankNumber: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    fontSize: 24,
    fontWeight: 'bold',
    color: EcoColors.gray200,
  },
  rankNumberFirst: {
    color: 'rgba(255, 215, 0, 0.3)',
    fontSize: 28,
  },
  crownContainer: {
    position: 'absolute',
    top: -24,
  },
  crown: {
    fontSize: 28,
  },
  statsBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 16,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: EcoColors.white,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  loadingContainer: {
    paddingTop: 8,
  },
  listHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray700,
  },
  listContent: {
    paddingBottom: 100,
  },
});
