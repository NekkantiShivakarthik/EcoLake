import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, ProgressBar } from '@/components/ui';
import { BadgeItem } from '@/components/ui/badge-item';
import { Card } from '@/components/ui/card';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useBadges, useReports, useUserProfile } from '@/hooks/use-supabase';

export default function ProfileScreen() {
  const { user: authUser, signOut } = useAuth();
  const { theme, actualTheme, setTheme } = useTheme();
  const { user, badges: earnedBadges, points, loading, refetch: refetchProfile } = useUserProfile(authUser?.id);
  const { badges: allBadges } = useBadges();
  const { reports, refetch: refetchReports } = useReports();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchReports()]);
    setRefreshing(false);
  };

  // Calculate stats
  const userReports = reports.filter((r) => r.user?.id === user?.id);
  const cleanedReports = userReports.filter((r) => r.status === 'cleaned').length;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const stats = [
    { label: 'Total Points', value: user?.points || points, icon: 'star', color: '#FFB800' },
    { label: 'Reports Made', value: userReports.length, icon: 'document-text', color: EcoColors.primary },
    { label: 'Lakes Helped', value: cleanedReports, icon: 'water', color: '#4FC3F7' },
    { label: 'Badges Earned', value: earnedBadges.length, icon: 'trophy', color: '#9C27B0' },
  ];

  const menuItems = [
    { icon: 'bar-chart', label: 'Activity History', action: () => router.push('/(tabs)/activity') },
    { icon: 'notifications', label: 'Notifications', action: () => Alert.alert('Coming Soon', 'Notifications will be available soon') },
    { icon: 'settings', label: 'Settings', action: () => router.push('/(tabs)/settings') },
    { icon: 'help-circle', label: 'Help & Support', action: () => {
      router.push('/(tabs)/settings');
      Alert.alert('Help & Support', 'Check the Help & Support section in Settings');
    }},
    { icon: 'document', label: 'Terms & Privacy', action: () => Alert.alert('Terms & Privacy', 'Terms of Service:\n- Use the app responsibly\n- Provide accurate information\n- Respect other users\n\nPrivacy Policy:\n- We protect your data\n- No data sold to third parties\n- Location used only for reports\n\nFull details: www.ecolake.com/terms') },
  ];

  // Calculate level progress
  const totalPoints = user?.points || points;
  const currentLevel = Math.floor(totalPoints / 500) + 1;
  const levelProgress = (totalPoints % 500) / 500;
  const pointsToNextLevel = 500 - (totalPoints % 500);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={EcoColors.primary} 
          />
        }
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={[EcoColors.primary, EcoColors.primaryDark]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
              >
                <Ionicons name={actualTheme === 'dark' ? 'sunny' : 'moon'} size={24} color={EcoColors.white} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <Ionicons name="settings-outline" size={24} color={EcoColors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileSection}>
            <Avatar
              name={user?.name || 'User'}
              size={80}
              imageUrl={user?.avatar_url || undefined}
              badge={currentLevel > 1 ? `${currentLevel}` : undefined}
            />
            <Text style={styles.userName}>{user?.name || 'Eco Hero'}</Text>
            <View style={styles.roleContainer}>
              <Ionicons name="shield-checkmark" size={14} color={EcoColors.white} />
              <Text style={styles.roleText}>{user?.role || 'Reporter'}</Text>
            </View>
            <Text style={styles.emailText}>{user?.email || 'user@example.com'}</Text>
          </View>
        </LinearGradient>

        {/* Level & Points Card */}
        <Card variant="elevated" style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Ionicons name="ribbon" size={20} color={EcoColors.accent} />
              <Text style={styles.levelText}>Level {currentLevel}</Text>
            </View>
            <Text style={styles.pointsText}>{points.toLocaleString()} pts</Text>
          </View>
          <View style={styles.levelProgress}>
            <ProgressBar progress={levelProgress} color={EcoColors.accent} />
            <Text style={styles.levelHint}>{pointsToNextLevel} pts to Level {currentLevel + 1}</Text>
          </View>
          <TouchableOpacity 
            style={styles.redeemButton}
            onPress={() => router.push('/(tabs)/redeem')}
          >
            <LinearGradient
              colors={[EcoColors.accent, '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.redeemGradient}
            >
              <Ionicons name="gift" size={18} color={EcoColors.white} />
              <Text style={styles.redeemText}>Redeem Rewards</Text>
              <Ionicons name="chevron-forward" size={18} color={EcoColors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} variant="elevated" style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesContainer}
          >
            {allBadges.map((badge) => (
              <BadgeItem
                key={badge.id}
                badge={badge}
                earned={earnedBadges.some((b) => b.id === badge.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card variant="outlined" style={styles.activityCard}>
            {userReports.slice(0, 3).length > 0 ? (
              userReports.slice(0, 3).map((report, index) => (
                <View key={report.id} style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      Reported {report.category} pollution
                    </Text>
                    <Text style={styles.activityDate}>
                      {report.lake?.name} •{' '}
                      {new Date(report.created_at || '').toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.activityStatus,
                      { backgroundColor: report.status === 'cleaned' ? EcoColors.success : EcoColors.info },
                    ]}
                  >
                    <Text style={styles.activityStatusText}>{report.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyActivity}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No recent activity</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Card variant="elevated" style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.action}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color={EcoColors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={EcoColors.gray400} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={EcoColors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

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
  headerGradient: {
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: EcoColors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: EcoColors.white,
    marginTop: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
    gap: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: EcoColors.white,
    textTransform: 'capitalize',
  },
  emailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  levelCard: {
    marginHorizontal: 20,
    marginTop: -24,
    padding: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.gray800,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: EcoColors.accent,
  },
  levelProgress: {
    marginBottom: 16,
  },
  levelHint: {
    fontSize: 12,
    color: EcoColors.gray500,
    marginTop: 6,
    textAlign: 'right',
  },
  redeemButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  redeemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  redeemText: {
    fontSize: 15,
    fontWeight: '600',
    color: EcoColors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  statCard: {
    width: '46%',
    margin: '2%',
    alignItems: 'center',
    padding: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: EcoColors.gray900,
  },
  statLabel: {
    fontSize: 12,
    color: EcoColors.gray500,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
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
  badgesContainer: {
    paddingHorizontal: 16,
  },
  activityCard: {
    marginHorizontal: 20,
    padding: 0,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray100,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: EcoColors.primary,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    color: EcoColors.gray800,
  },
  activityDate: {
    fontSize: 12,
    color: EcoColors.gray400,
    marginTop: 2,
  },
  activityStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activityStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: EcoColors.white,
    textTransform: 'capitalize',
  },
  emptyActivity: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: EcoColors.gray400,
  },
  menuCard: {
    marginHorizontal: 20,
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray100,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: EcoColors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: EcoColors.gray800,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 16,
    backgroundColor: EcoColors.error + '10',
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: EcoColors.error,
  },
  bottomSpacing: {
    height: 100,
  },
});
