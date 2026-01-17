import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EcoColors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'ecolake://reset-password',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>📧</Text>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successText}>{`We've sent a password reset link to:`}</Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.successSubtext}>{`Click the link in the email to reset your password. If you don't see it, check your spam folder.`}</Text>
          
          <Button
            title="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            size="lg"
            style={styles.backButton}
          />

          <TouchableOpacity 
            style={styles.resendButton}
            onPress={() => {
              setEmailSent(false);
              handleResetPassword();
            }}
          >
            <Text style={styles.resendText}>Resend Email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity 
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>← Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.icon}>🔐</Text>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>{`No worries! Enter your email and we'll send you a reset link.`}</Text>
          </View>

          {/* Reset Card */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={EcoColors.gray400}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
            </View>

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              size="lg"
              style={styles.resetButton}
            />
          </Card>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Remember your password?{' '}
              <Link href="/(auth)/login" asChild>
                <Text style={styles.infoLink}>Sign In</Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  backLink: {
    marginTop: 20,
    marginBottom: 20,
  },
  backLinkText: {
    fontSize: 15,
    color: EcoColors.white,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: EcoColors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: EcoColors.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: EcoColors.white,
    borderRadius: 24,
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.gray700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: EcoColors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: EcoColors.gray800,
    borderWidth: 1,
    borderColor: EcoColors.gray200,
  },
  resetButton: {
    width: '100%',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: EcoColors.white,
    opacity: 0.9,
  },
  infoLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: EcoColors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: EcoColors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 17,
    fontWeight: '600',
    color: EcoColors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: EcoColors.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  backButton: {
    width: '100%',
    marginBottom: 16,
  },
  resendButton: {
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 15,
    color: EcoColors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
