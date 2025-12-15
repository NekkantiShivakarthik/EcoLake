import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    SlideInDown,
    SlideOutDown
} from 'react-native-reanimated';

import { EcoColors } from '@/constants/colors';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const toastConfig: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle', color: EcoColors.success, bg: '#dcfce7' },
  error: { icon: 'close-circle', color: EcoColors.error, bg: '#fee2e2' },
  warning: { icon: 'warning', color: EcoColors.warning, bg: '#fef3c7' },
  info: { icon: 'information-circle', color: EcoColors.info, bg: '#dbeafe' },
};

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
  action,
}: ToastProps) {
  const config = toastConfig[type];

  React.useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onHide?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(15)}
      exiting={SlideOutDown}
      style={[styles.container, { backgroundColor: config.bg }]}
    >
      <Ionicons name={config.icon} size={24} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
          <Text style={[styles.actionText, { color: config.color }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onHide} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={config.color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Toast context and provider for global toasts
interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    duration: number;
  }>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToast({ visible: true, message, type, duration });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <View style={styles.toastWrapper}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={hideToast}
        />
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});
