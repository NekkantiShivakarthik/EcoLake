import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { EcoColors } from '@/constants/colors';
import { BrandColors, CategoryGradients, getRewardLogo } from '@/constants/reward-logos';
import { useTheme } from '@/contexts/theme-context';

interface RewardCardProps {
  reward: {
    id: string;
    name: string;
    description?: string;
    category: string;
    points_required: number;
    value?: number;
    image_url?: string;
    stock_available: number;
  };
  userPoints: number;
  onRedeem: (rewardId: string) => void;
}

export function RewardCard({ reward, userPoints, onRedeem }: RewardCardProps) {
  const { colors } = useTheme();
  const canAfford = userPoints >= reward.points_required;
  const inStock = reward.stock_available > 0;
  const isAvailable = canAfford && inStock;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gift_card':
        return '🎁';
      case 'subscription':
        return '📺';
      case 'eco_action':
        return '🌱';
      case 'cash':
        return '💰';
      default:
        return '🎉';
    }
  };

  // Get logo for the reward
  const rewardLogo = reward.image_url || getRewardLogo(reward.name, reward.category);
  const isEmojiLogo = rewardLogo.length <= 4; // Emoji check
  const categoryGradient = CategoryGradients[reward.category] || CategoryGradients.default;

  // Get brand name for gift card template
  const getBrandName = (name: string) => {
    const lowerName = name.toLowerCase();
    for (const brand of Object.keys(BrandColors)) {
      if (lowerName.includes(brand)) {
        return brand;
      }
    }
    return 'default';
  };

  const brandName = getBrandName(reward.name);
  const brandColor = BrandColors[brandName] || BrandColors.default;
  const isGiftCard = reward.category === 'gift_card';

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isAvailable && styles.cardDisabled]}>
      {/* Gift Card Template or Regular Image */}
      {isGiftCard ? (
        <View style={styles.giftCardContainer}>
          <LinearGradient
            colors={[brandColor.primary, brandColor.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.giftCardGradient}
          >
            {/* Gift Card Design */}
            <View style={styles.giftCardContent}>
              {/* Logo */}
              <View style={styles.giftCardLogoContainer}>
                {isEmojiLogo ? (
                  <Text style={styles.giftCardEmoji}>{rewardLogo}</Text>
                ) : (
                  <Image 
                    source={{ uri: rewardLogo }} 
                    style={styles.giftCardLogo} 
                    contentFit="contain"
                    transition={200}
                  />
                )}
              </View>
              
              {/* Gift Card Label */}
              <View style={styles.giftCardLabel}>
                <Text style={[styles.giftCardLabelText, { color: brandColor.text }]}>
                  GIFT CARD
                </Text>
              </View>

              {/* Card Pattern/Decoration */}
              <View style={styles.cardPattern}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={[styles.patternDot, { opacity: 0.1 }]} />
                ))}
              </View>
            </View>
            
            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(reward.category)}</Text>
            </View>
          </LinearGradient>
        </View>
      ) : (
        <LinearGradient
          colors={categoryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.imageContainer}
        >
          {isEmojiLogo ? (
            <Text style={styles.emojiLogo}>{rewardLogo}</Text>
          ) : (
            <Image 
              source={{ uri: rewardLogo }} 
              style={styles.image} 
              contentFit="contain"
              transition={200}
            />
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(reward.category)}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {reward.name}
        </Text>
        {reward.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {reward.description}
          </Text>
        )}

        {/* Value */}
        {reward.value && (
          <View style={styles.valueContainer}>
            <View style={styles.valueRow}>
              <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Worth:</Text>
              <Text style={styles.valueAmount}>₹{Math.round(reward.value).toLocaleString('en-IN')}</Text>
            </View>
            {reward.category === 'gift_card' && (
              <Text style={styles.savingsText}>
                Save ₹{Math.round(reward.value - (reward.points_required * 0.1)).toLocaleString('en-IN')} 💰
              </Text>
            )}
          </View>
        )}

        {/* Points Required */}
        <View style={styles.pointsRow}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsIcon}>⭐</Text>
            <Text style={styles.pointsText}>{reward.points_required.toLocaleString()} pts</Text>
          </View>

          {/* Stock */}
          {reward.stock_available < 20 && (
            <Text style={styles.stockText}>
              {reward.stock_available > 0
                ? `${reward.stock_available} left`
                : 'Out of stock'}
            </Text>
          )}
        </View>

        {/* Redeem Button */}
        <TouchableOpacity
          style={[
            styles.redeemButton,
            !isAvailable && styles.redeemButtonDisabled,
          ]}
          onPress={() => onRedeem(reward.id)}
          disabled={!isAvailable}
        >
          <Text
            style={[
              styles.redeemButtonText,
              !isAvailable && styles.redeemButtonTextDisabled,
            ]}
          >
            {!inStock
              ? 'Out of Stock'
              : !canAfford
              ? `Need ${reward.points_required - userPoints} more pts`
              : 'Redeem'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: EcoColors.gray200,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '70%',
    height: '70%',
  },
  emojiLogo: {
    fontSize: 80,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: EcoColors.white,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 18,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: EcoColors.gray900,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: EcoColors.gray600,
    lineHeight: 20,
    marginBottom: 12,
  },
  valueContainer: {
    marginBottom: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 14,
    color: EcoColors.gray500,
    marginRight: 6,
  },
  valueAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: EcoColors.success,
  },
  savingsText: {
    fontSize: 12,
    color: EcoColors.accent,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  pointsIcon: {
    fontSize: 14,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.primary,
  },
  stockText: {
    fontSize: 12,
    color: EcoColors.warning,
    fontWeight: '500',
  },
  redeemButton: {
    backgroundColor: EcoColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: EcoColors.gray300,
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.white,
    letterSpacing: 0.5,
  },
  redeemButtonTextDisabled: {
    color: EcoColors.gray600,
    fontWeight: '700',
  },
  giftCardContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  giftCardGradient: {
    width: '100%',
    height: '100%',
    padding: 20,
  },
  giftCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  giftCardLogoContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  giftCardLogo: {
    width: 80,
    height: 40,
  },
  giftCardEmoji: {
    fontSize: 40,
  },
  giftCardLabel: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  giftCardLabelText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  cardPattern: {
    position: 'absolute',
    right: 10,
    top: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    gap: 6,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
