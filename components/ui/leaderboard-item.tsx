import { EcoColors } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';
import { User } from '@/types/database';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './card';

interface LeaderboardItemProps {
  rank: number;
  user: User;
  points: number;
}

export function LeaderboardItem({ rank, user, points }: LeaderboardItemProps) {
  const { colors } = useTheme();
  
  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const medal = getMedalEmoji(rank);

  return (
    <Card 
      variant={rank <= 3 ? 'elevated' : 'outlined'} 
      style={[styles.card, rank <= 3 && styles.topThree]}
    >
      <View style={[styles.rankContainer, { backgroundColor: rank <= 3 ? colors.surface : 'transparent' }]}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.rank, { color: colors.textTertiary }]}>#{rank}</Text>
        )}
      </View>

      <Image
        source={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
        style={[styles.avatar, { backgroundColor: colors.surface }]}
        contentFit="cover"
      />

      <View style={styles.userInfo}>
        <Text style={[styles.name, { color: colors.text }]}>{user.name || 'Anonymous'}</Text>
        <View style={[styles.roleContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.role, { color: colors.textSecondary }]}>{user.role}</Text>
        </View>
      </View>

      <View style={styles.pointsContainer}>
        <Text style={[styles.points, { color: colors.primary }]}>{points.toLocaleString()}</Text>
        <Text style={[styles.pointsLabel, { color: colors.textTertiary }]}>points</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  topThree: {
    borderLeftWidth: 4,
    borderLeftColor: EcoColors.accent,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: {
    fontSize: 26,
  },
  rank: {
    fontSize: 15,
    fontWeight: '700',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 10,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  role: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
