import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { EcoColors } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';

interface AvatarProps {
  source?: string;
  imageUrl?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showBadge?: boolean;
  badge?: string;
  badgeColor?: string;
  style?: ViewStyle;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 80,
};

const fontSizeMap = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

export function Avatar({
  source,
  imageUrl,
  name,
  size = 'md',
  showBadge = false,
  badge,
  badgeColor = EcoColors.success,
  style,
}: AvatarProps) {
  const { colors } = useTheme();
  const dimensions = typeof size === 'number' ? size : sizeMap[size];
  const fontSize = typeof size === 'number' ? size * 0.35 : fontSizeMap[size];
  const badgeSize = dimensions * 0.3;
  const avatarSource = source || imageUrl;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarStyle = {
    width: dimensions,
    height: dimensions,
    borderRadius: dimensions / 2,
  };

  return (
    <View style={[styles.container, style]}>
      {avatarSource ? (
        <Image source={{ uri: avatarSource }} style={avatarStyle} contentFit="cover" />
      ) : (
        <View style={[styles.placeholder, avatarStyle, { backgroundColor: colors.primary }]}>
          <Text style={[styles.initials, { fontSize }]}>
            {name ? getInitials(name) : '?'}
          </Text>
        </View>
      )}
      {badge && (
        <View style={[styles.badgeContainer, { right: -2, bottom: -2, backgroundColor: colors.cardBackground }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {showBadge && !badge && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: badgeColor,
              right: 0,
              bottom: 0,
              borderColor: colors.cardBackground,
            },
          ]}
        />
      )}
    </View>
  );
}

interface AvatarGroupProps {
  avatars: { source?: string; name?: string }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarGroup({ avatars, max = 4, size = 'sm' }: AvatarGroupProps) {
  const dimensions = sizeMap[size];
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <View style={styles.group}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            { marginLeft: index > 0 ? -dimensions * 0.3 : 0, zIndex: max - index },
          ]}
        >
          <Avatar source={avatar.source} name={avatar.name} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.groupItem,
            styles.remainingBadge,
            {
              width: dimensions,
              height: dimensions,
              borderRadius: dimensions / 2,
              marginLeft: -dimensions * 0.3,
            },
          ]}
        >
          <Text style={styles.remainingText}>+{remaining}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholder: {
    backgroundColor: EcoColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: EcoColors.white,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: EcoColors.white,
  },
  badgeContainer: {
    position: 'absolute',
    backgroundColor: EcoColors.white,
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    fontSize: 14,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItem: {
    borderWidth: 2,
    borderColor: EcoColors.white,
    borderRadius: 100,
  },
  remainingBadge: {
    backgroundColor: EcoColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
    color: EcoColors.gray600,
  },
});
