import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  // Show loading state while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={EcoColors.primary} />
      </View>
    );
  }

  // Redirect to home if already authenticated
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
