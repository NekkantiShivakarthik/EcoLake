import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RewardCard } from '@/components/ui/reward-card';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useRedeemReward, useRedemptions, useRewards, useUserProfile } from '@/hooks/use-supabase';

type CategoryType = 'all' | 'gift_card' | 'subscription' | 'eco_action' | 'cash';

const categories: { key: CategoryType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '🎯' },
  { key: 'gift_card', label: 'Gift Cards', icon: '🎁' },
  { key: 'subscription', label: 'Subscriptions', icon: '📺' },
  { key: 'eco_action', label: 'Eco Actions', icon: '🌱' },
  { key: 'cash', label: 'Cash', icon: '💰' },
];

export default function RedeemScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { points, refetch: refetchProfile } = useUserProfile(user?.id);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const { rewards, refetch: refetchRewards } = useRewards(
    activeCategory
  );
  const { redemptions, refetch: refetchRedemptions } = useRedemptions(
    user?.id
  );
  const { redeemReward } = useRedeemReward();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchRewards(), refetchRedemptions()]);
    setRefreshing(false);
  };

  const handleRedeem = async (rewardId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to redeem rewards');
      return;
    }

    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return;

    Alert.alert(
      'Confirm Redemption',
      `Redeem ${reward.name} for ${reward.points_required} points?\n\nYour balance: ${points} pts\nAfter redemption: ${points - reward.points_required} pts`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            const result = await redeemReward(user.id, rewardId, points);

            if (result.success) {
              Alert.alert(
                'Success! 🎉',
                `You've redeemed ${reward.name}!\n\nRedemption Code: ${result.redemptionCode}\n\nYour reward will be processed within 24-48 hours. Check your email for details.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      refetchProfile();
                      refetchRewards();
                      refetchRedemptions();
                      setActiveTab('history');
                    },
                  },
                ]
              );
            } else {
              Alert.alert('Error', result.error || 'Failed to redeem reward. Please try again.');
            }
          },
        },
      ]
    );
  };

  const filteredRewards = rewards.filter((reward) => {
    if (searchQuery === '') return true;
    return (
      reward.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderRewardItem = ({ item }: { item: any }) => (
    <RewardCard reward={item} userPoints={points} onRedeem={handleRedeem} />
  );

  const renderRedemptionItem = ({ item }: { item: any }) => (
    <View style={styles.redemptionCard}>
      <View style={styles.redemptionHeader}>
        <View style={styles.redemptionInfo}>
          <Text style={styles.redemptionName}>{item.reward?.name || 'Deleted Reward'}</Text>
          <Text style={styles.redemptionDate}>
            {new Date(item.redeemed_at).toLocaleDateString()}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.status === 'delivered' && styles.statusBadgeDelivered,
            item.status === 'cancelled' && styles.statusBadgeCancelled,
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.redemptionDetails}>
        <View style={styles.redemptionRow}>
          <Text style={styles.redemptionLabel}>Points Spent:</Text>
          <Text style={styles.redemptionValue}>-{item.points_spent} pts</Text>
        </View>
        {item.redemption_code && (
          <View style={styles.redemptionRow}>
            <Text style={styles.redemptionLabel}>Code:</Text>
            <Text style={styles.redemptionCode}>{item.redemption_code}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Redeem Points</Text>
        <View style={[styles.pointsBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={styles.pointsIcon}>⭐</Text>
          <Text style={[styles.pointsText, { color: colors.primary }]}>{points} pts</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'available' && { color: colors.primary }]}>
            Available Rewards
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'history' && { color: colors.primary }]}>
            My Redemptions
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'available' ? (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search rewards..."
              placeholderTextColor={EcoColors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryChip,
                  activeCategory === category.key && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(category.key)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === category.key && styles.categoryTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Rewards List */}
          <FlatList
            data={filteredRewards}
            renderItem={renderRewardItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.rewardsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyText}>No rewards available</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={EcoColors.primary}
              />
            }
          />
        </>
      ) : (
        <FlatList
          data={redemptions}
          renderItem={renderRedemptionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.redemptionsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No redemptions yet</Text>
              <Text style={styles.emptySubtext}>
                Start redeeming rewards to see your history here
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={EcoColors.primary}
            />
          }
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: EcoColors.gray900,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.primaryLight + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
  },
  pointsIcon: {
    fontSize: 18,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.primary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: EcoColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: EcoColors.gray500,
  },
  tabTextActive: {
    color: EcoColors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EcoColors.gray200,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: EcoColors.gray800,
  },
  clearIcon: {
    fontSize: 16,
    color: EcoColors.gray400,
    paddingHorizontal: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: EcoColors.white,
    borderWidth: 1,
    borderColor: EcoColors.gray200,
    marginRight: 10,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: EcoColors.primary,
    borderColor: EcoColors.primary,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: EcoColors.gray700,
  },
  categoryTextActive: {
    color: EcoColors.white,
  },
  rewardsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  redemptionsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  redemptionCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: EcoColors.gray200,
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  redemptionInfo: {
    flex: 1,
  },
  redemptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray900,
    marginBottom: 4,
  },
  redemptionDate: {
    fontSize: 13,
    color: EcoColors.gray500,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: EcoColors.warning + '20',
  },
  statusBadgeDelivered: {
    backgroundColor: EcoColors.success + '20',
  },
  statusBadgeCancelled: {
    backgroundColor: EcoColors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: EcoColors.warning,
    textTransform: 'capitalize',
  },
  redemptionDetails: {
    gap: 8,
  },
  redemptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redemptionLabel: {
    fontSize: 14,
    color: EcoColors.gray600,
  },
  redemptionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.gray900,
  },
  redemptionCode: {
    fontSize: 13,
    fontWeight: '600',
    color: EcoColors.primary,
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: EcoColors.gray700,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: EcoColors.gray500,
    textAlign: 'center',
  },
});
