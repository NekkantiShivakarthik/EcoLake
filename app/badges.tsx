import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BadgeItem } from '@/components/ui/badge-item';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useBadges, useUserProfile } from '@/hooks/use-supabase';

export default function BadgesScreen() {
  const { user: authUser } = useAuth();
  const { colors } = useTheme();
  const { badges: earnedBadges } = useUserProfile(authUser?.id);
  const { badges: allBadges } = useBadges();

  const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id));
  const earnedBadgesList = allBadges.filter((b) => earnedBadgeIds.has(b.id));
  const unearnedBadgesList = allBadges.filter((b) => !earnedBadgeIds.has(b.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Badges</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats */}
        <Card variant="elevated" style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{earnedBadgesList.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Earned</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{unearnedBadgesList.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{allBadges.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
          </View>
        </Card>

        {/* Earned Badges */}
        {earnedBadgesList.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🏆 Earned Badges ({earnedBadgesList.length})
            </Text>
            <View style={styles.badgesGrid}>
              {earnedBadgesList.map((badge) => (
                <View key={badge.id} style={styles.badgeWrapper}>
                  <BadgeItem badge={badge} earned={true} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Unearned Badges */}
        {unearnedBadgesList.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🔒 Badges to Unlock ({unearnedBadgesList.length})
            </Text>
            <View style={styles.badgesGrid}>
              {unearnedBadgesList.map((badge) => (
                <View key={badge.id} style={styles.badgeWrapper}>
                  <BadgeItem badge={badge} earned={false} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {allBadges.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎖️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Badges Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start reporting pollution to earn badges!
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
  },
  statsCard: {
    padding: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  badgeWrapper: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});
