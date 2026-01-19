import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Link, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Role = 'reporter' | 'cleaner' | 'ngo_admin';

const roles: { key: Role; label: string; icon: string; description: string }[] = [
  { key: 'reporter', label: 'Reporter', icon: '📸', description: 'Report pollution & track progress' },
  { key: 'cleaner', label: 'Volunteer', icon: '🦸', description: 'Join cleanup efforts & earn points' },
  { key: 'ngo_admin', label: 'NGO Admin', icon: '🏛️', description: 'Manage cleanups & verify reports' },
];

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('reporter');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim(), selectedRole);
    setLoading(false);

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else {
      Alert.alert(
        'Welcome to EcoLake! 🌊',
        'Your account has been created successfully. You can now sign in and start making an impact!',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: EcoColors.primary,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      paddingTop: 40,
      paddingBottom: 24,
    },
    logoContainer: {
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: EcoColors.white,
    },
    subtitle: {
      fontSize: 14,
      color: EcoColors.white,
      opacity: 0.9,
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      padding: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
    },
    rolesContainer: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 24,
    },
    roleCard: {
      flex: 1,
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    roleCardActive: {
      borderColor: EcoColors.primary,
      backgroundColor: EcoColors.primaryLight + '20',
    },
    roleIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    roleLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    roleLabelActive: {
      color: EcoColors.primary,
    },
    roleDescription: {
      fontSize: 9,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 2,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    signUpButton: {
      width: '100%',
      marginTop: 8,
    },
    termsText: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 18,
    },
    termsLink: {
      color: EcoColors.primary,
      fontWeight: '500',
    },
    signInContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    signInText: {
      fontSize: 14,
      color: EcoColors.white,
      opacity: 0.9,
    },
    signInLink: {
      fontSize: 14,
      fontWeight: 'bold',
      color: EcoColors.white,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Logo size="medium" showText={false} />
            </View>
            <Text style={styles.title}>Join EcoLake</Text>
            <Text style={styles.subtitle}>Start making an impact today</Text>
          </View>

          {/* Signup Card */}
          <Card variant="elevated" style={styles.card}>
            {/* Role Selection */}
            <Text style={styles.sectionTitle}>I want to...</Text>
            <View style={styles.rolesContainer}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.key}
                  style={[
                    styles.roleCard,
                    selectedRole === role.key && styles.roleCardActive,
                  ]}
                  onPress={() => setSelectedRole(role.key)}
                >
                  <Text style={styles.roleIcon}>{role.icon}</Text>
                  <Text
                    style={[
                      styles.roleLabel,
                      selectedRole === role.key && styles.roleLabelActive,
                    ]}
                  >
                    {role.label}
                  </Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Form Fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              size="lg"
              style={styles.signUpButton}
            />

            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Card>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
