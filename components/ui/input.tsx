import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

import { EcoColors } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled' | 'outlined';
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);

  const containerStyle = [
    styles.container,
    variant === 'filled' && [styles.containerFilled, { backgroundColor: colors.inputBackground }],
    variant === 'outlined' && [styles.containerOutlined, { backgroundColor: colors.cardBackground, borderColor: colors.border }],
    isFocused && [styles.containerFocused, { borderColor: colors.primary }],
    error && styles.containerError,
  ];

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View style={containerStyle}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? colors.primary : colors.textTertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, { color: colors.text }, style]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.gray700,
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  containerFilled: {
    backgroundColor: EcoColors.gray100,
  },
  containerOutlined: {
    backgroundColor: EcoColors.white,
    borderWidth: 1.5,
    borderColor: EcoColors.gray200,
  },
  containerFocused: {
    borderColor: EcoColors.primary,
    borderWidth: 2,
  },
  containerError: {
    borderColor: EcoColors.error,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: EcoColors.gray800,
  },
  error: {
    fontSize: 12,
    color: EcoColors.error,
    marginTop: 6,
  },
});
