import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { EcoColors } from '@/constants/colors';
import { Badge } from '@/types/database';

interface BadgeNotificationProps {
  badge: Badge | null;
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function BadgeNotification({ badge, visible, onClose }: BadgeNotificationProps) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const sparkle = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      rotation.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withRepeat(withSequence(
          withTiming(10, { duration: 200 }),
          withTiming(-10, { duration: 200 })
        ), 2),
        withTiming(0, { duration: 100 })
      );
      sparkle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 500 })
        ),
        -1
      );
    } else {
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
  }));

  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.container}
        >
          {/* Sparkles Background */}
          <Animated.View style={[styles.sparklesContainer, sparkleAnimatedStyle]}>
            {[...Array(12)].map((_, i) => (
              <Text
                key={i}
                style={[
                  styles.sparkle,
                  {
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`,
                    fontSize: 16 + Math.random() * 12,
                  }
                ]}
              >
                ✨
              </Text>
            ))}
          </Animated.View>

          {/* Confetti Emojis */}
          <View style={styles.confettiContainer}>
            <Text style={[styles.confetti, styles.confettiLeft]}>🎊</Text>
            <Text style={[styles.confetti, styles.confettiRight]}>🎉</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.congratsText}>🏆 CONGRATULATIONS! 🏆</Text>
            <Text style={styles.subTitle}>You've earned a new badge!</Text>
          </View>

          {/* Badge */}
          <Animated.View style={[styles.badgeContainer, badgeAnimatedStyle]}>
            <View style={styles.badgeGlow} />
            <View style={styles.badgeInner}>
              {badge.icon_url ? (
                <Image
                  source={{ uri: badge.icon_url }}
                  style={styles.badgeIcon}
                  contentFit="contain"
                />
              ) : (
                <Text style={styles.badgeEmoji}>🏅</Text>
              )}
            </View>
          </Animated.View>

          {/* Badge Info */}
          <View style={styles.badgeInfo}>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
          </View>

          {/* Stars */}
          <View style={styles.starsContainer}>
            <Text style={styles.star}>⭐</Text>
            <Text style={[styles.star, styles.starCenter]}>⭐</Text>
            <Text style={styles.star}>⭐</Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Awesome! 🎯</Text>
          </TouchableOpacity>

          {/* X Button */}
          <TouchableOpacity style={styles.xButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={EcoColors.gray400} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Badge notification queue manager
interface BadgeQueueItem {
  badge: Badge;
  id: string;
}

interface BadgeNotificationManagerProps {
  children: React.ReactNode;
}

interface BadgeNotificationContextType {
  showBadgeNotification: (badge: Badge) => void;
}

export const BadgeNotificationContext = React.createContext<BadgeNotificationContextType | null>(null);

export function BadgeNotificationProvider({ children }: BadgeNotificationManagerProps) {
  const [queue, setQueue] = useState<BadgeQueueItem[]>([]);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [visible, setVisible] = useState(false);

  const showBadgeNotification = (badge: Badge) => {
    const id = `${badge.id}-${Date.now()}`;
    setQueue(prev => [...prev, { badge, id }]);
  };

  useEffect(() => {
    if (!visible && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentBadge(next.badge);
      setVisible(true);
      setQueue(rest);
    }
  }, [visible, queue]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setCurrentBadge(null);
    }, 300);
  };

  return (
    <BadgeNotificationContext.Provider value={{ showBadgeNotification }}>
      {children}
      <BadgeNotification
        badge={currentBadge}
        visible={visible}
        onClose={handleClose}
      />
    </BadgeNotificationContext.Provider>
  );
}

export function useBadgeNotification() {
  const context = React.useContext(BadgeNotificationContext);
  if (!context) {
    throw new Error('useBadgeNotification must be used within BadgeNotificationProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: width - 48,
    maxWidth: 360,
    alignItems: 'center',
    overflow: 'hidden',
  },
  sparklesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  sparkle: {
    position: 'absolute',
  },
  confettiContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  confetti: {
    fontSize: 32,
  },
  confettiLeft: {
    transform: [{ rotate: '-15deg' }],
  },
  confettiRight: {
    transform: [{ rotate: '15deg' }],
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  congratsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: EcoColors.primary,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    color: EcoColors.gray600,
  },
  badgeContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  badgeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 70,
    backgroundColor: EcoColors.warning,
    opacity: 0.2,
    transform: [{ scale: 1.2 }],
  },
  badgeInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: EcoColors.warning,
    shadowColor: EcoColors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeIcon: {
    width: 64,
    height: 64,
  },
  badgeEmoji: {
    fontSize: 56,
  },
  badgeInfo: {
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: EcoColors.gray900,
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 14,
    color: EcoColors.gray600,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    zIndex: 1,
  },
  star: {
    fontSize: 24,
    marginHorizontal: 4,
  },
  starCenter: {
    fontSize: 32,
    marginTop: -8,
  },
  closeButton: {
    backgroundColor: EcoColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  xButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
});
