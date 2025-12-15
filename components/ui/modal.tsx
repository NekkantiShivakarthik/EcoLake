import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInUp,
    SlideOutDown,
} from 'react-native-reanimated';

import { EcoColors } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeMap = {
  sm: 0.3,
  md: 0.5,
  lg: 0.7,
  full: 0.9,
};

export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  size = 'md',
}: ModalProps) {
  const { colors } = useTheme();
  
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View
        entering={SlideInUp.springify().damping(15)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.content, { maxHeight: SCREEN_HEIGHT * sizeMap[size], backgroundColor: colors.surface }]}
      >
        {(title || showCloseButton) && (
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {showCloseButton && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </View>
  );
}

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  const { colors } = useTheme();
  
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View
        entering={SlideInUp.springify().damping(15)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.confirmContent, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.confirmTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>{message}</Text>
        <View style={styles.confirmButtons}>
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.inputBackground }]} onPress={onClose} disabled={loading}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              variant === 'danger' && styles.confirmButtonDanger,
            ]}
            onPress={onConfirm}
            disabled={loading}
          >
            <Text style={styles.confirmButtonText}>
              {loading ? 'Loading...' : confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  content: {
    backgroundColor: EcoColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray100,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: EcoColors.gray900,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  confirmContent: {
    backgroundColor: EcoColors.white,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 24,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: EcoColors.gray900,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    color: EcoColors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: EcoColors.gray100,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray700,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: EcoColors.primary,
    alignItems: 'center',
  },
  confirmButtonDanger: {
    backgroundColor: EcoColors.error,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.white,
  },
});
