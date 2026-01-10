import { EcoColors } from '@/constants/colors';
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
  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const medal = getMedalEmoji(rank);

  // Handle null/undefined user
  const userName = user?.name || 'Anonymous';
  const userRole = user?.role || 'reporter';
  const userAvatar = user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

  return (
    <Card 
      variant={rank <= 3 ? 'elevated' : 'outlined'} 
      style={[styles.card, rank <= 3 && styles.topThree]}
    >
      <View style={styles.rankContainer}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={styles.rank}>#{rank}</Text>
        )}
      </View>

      <Image
        source={userAvatar}
        style={styles.avatar}
        contentFit="cover"
      />

      <View style={styles.userInfo}>
        <Text style={styles.name}>{userName}</Text>
        <View style={styles.roleContainer}>
          <Text style={styles.role}>{userRole}</Text>
        </View>
      </View>

      <View style={styles.pointsContainer}>
        <Text style={styles.points}>{points ?? 0}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
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
    padding: 12,
  },
  topThree: {
    borderLeftWidth: 3,
    borderLeftColor: EcoColors.accent,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  medal: {
    fontSize: 24,
  },
  rank: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray500,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: EcoColors.gray200,
    marginLeft: 8,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: EcoColors.gray800,
  },
  roleContainer: {
    marginTop: 2,
  },
  role: {
    fontSize: 12,
    color: EcoColors.gray500,
    textTransform: 'capitalize',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 20,
    fontWeight: 'bold',
    color: EcoColors.primary,
  },
  pointsLabel: {
    fontSize: 11,
    color: EcoColors.gray400,
  },
});
