import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/lib/supabase';

type ThemeOption = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const { user: authUser, refreshUser, signOut } = useAuth();
  const { theme, setTheme, colors } = useTheme();
  const [name, setName] = useState(authUser?.name || '');
  const [email, setEmail] = useState(authUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleUpdateProfile = async () => {
    if (!authUser?.id) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          email: email.trim(),
        })
        .eq('id', authUser.id);

      if (error) throw error;

      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to change your avatar');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!authUser?.id) return;

    setUploadingAvatar(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const fileExt = uri.split('.').pop();
      const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('report-photos')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('report-photos')
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', authUser.id);

      if (updateError) throw updateError;

      await refreshUser();
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your email',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            if (!authUser?.email) return;
            
            const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
              redirectTo: 'ecolake://reset-password',
            });

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Success', 'Password reset link sent to your email');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available soon');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={EcoColors.gray800} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <Card variant="elevated" style={styles.avatarCard}>
            <View style={styles.avatarSection}>
              <Avatar
                name={authUser?.name || 'User'}
                size={100}
                imageUrl={authUser?.avatar_url || undefined}
              />
              {uploadingAvatar && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={EcoColors.primary} />
                </View>
              )}
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={handlePickAvatar}
                disabled={uploadingAvatar}
              >
                <Ionicons name="camera" size={20} color={EcoColors.primary} />
                <Text style={styles.avatarButtonText}>Change Avatar</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Profile Information */}
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Profile Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={EcoColors.gray400}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={EcoColors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleChip}>
                <Ionicons name="shield-checkmark" size={16} color={EcoColors.primary} />
                <Text style={styles.roleChipText}>{authUser?.role || 'Reporter'}</Text>
              </View>
            </View>

            <Button
              title="Save Changes"
              onPress={handleUpdateProfile}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
            />
          </Card>

          {/* Appearance */}
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Appearance</Text>
            <Text style={styles.cardSubtitle}>Choose your preferred theme</Text>

            {[
              { value: 'light' as ThemeOption, label: 'Light', icon: 'sunny', description: 'Always use light theme' },
              { value: 'dark' as ThemeOption, label: 'Dark', icon: 'moon', description: 'Always use dark theme' },
              { value: 'system' as ThemeOption, label: 'System', icon: 'phone-portrait', description: 'Follow system settings' },
            ].map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeOption,
                  index > 0 && styles.themeOptionBorder,
                  theme === option.value && styles.themeOptionActive,
                ]}
                onPress={() => setTheme(option.value)}
              >
                <View style={[
                  styles.themeIconContainer,
                  theme === option.value && styles.themeIconContainerActive,
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={theme === option.value ? EcoColors.white : EcoColors.gray600} 
                  />
                </View>
                <View style={styles.themeContent}>
                  <Text style={styles.themeLabel}>{option.label}</Text>
                  <Text style={styles.themeDescription}>{option.description}</Text>
                </View>
                {theme === option.value && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={EcoColors.primary} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </Card>

          {/* Help & Support */}
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Help & Support</Text>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('FAQs', 'Frequently Asked Questions:\n\n1. How do I report pollution?\n- Go to the Report tab and submit details with photos\n\n2. How do I earn points?\n- Report pollution, participate in cleanups, and complete challenges\n\n3. How do I redeem rewards?\n- Visit the Redeem tab once you have enough points')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="help-circle-outline" size={22} color={EcoColors.primary} />
                <Text style={styles.menuItemText}>FAQs</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={EcoColors.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('Contact Support', 'Email: support@ecolake.com\nPhone: +91 1800-123-4567\n\nWe typically respond within 24 hours.')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="mail-outline" size={22} color={EcoColors.primary} />
                <Text style={styles.menuItemText}>Contact Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={EcoColors.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('Report a Bug', 'Please send bug reports to:\nbug-reports@ecolake.com\n\nInclude:\n- Device model\n- What you were doing\n- Screenshots if possible')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="bug-outline" size={22} color={EcoColors.primary} />
                <Text style={styles.menuItemText}>Report a Bug</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={EcoColors.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('Terms & Privacy', 'Terms of Service:\n- Use the app responsibly\n- Provide accurate information\n- Respect other users\n\nPrivacy Policy:\n- We protect your data\n- No data sold to third parties\n- Location used only for reports\n\nFull details: www.ecolake.com/terms')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="document-text-outline" size={22} color={EcoColors.primary} />
                <Text style={styles.menuItemText}>Terms & Privacy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={EcoColors.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('About EcoLake', 'Version 1.0.0\n\nA community-driven app to clean and protect our lakes.\n\n© 2025 EcoLake\nMade with 💚 for the environment')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="information-circle-outline" size={22} color={EcoColors.primary} />
                <Text style={styles.menuItemText}>About App</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={EcoColors.gray400} />
            </TouchableOpacity>
          </Card>

          {/* Account Settings */}
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Account Settings</Text>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleChangePassword}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="lock-closed-outline" size={22} color={EcoColors.gray600} />
                <Text style={styles.menuItemText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={EcoColors.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleDeleteAccount}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="trash-outline" size={22} color={EcoColors.error} />
                <Text style={[styles.menuItemText, { color: EcoColors.error }]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={EcoColors.gray400} />
            </TouchableOpacity>
          </Card>

          {/* Sign Out */}
          <Button
            title="Sign Out"
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/login');
            }}
            variant="outline"
            style={styles.signOutButton}
          />

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.gray50,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: EcoColors.white,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray200,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: EcoColors.gray800,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarCard: {
    marginBottom: 16,
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    position: 'relative',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: EcoColors.primaryLight,
    borderRadius: 20,
  },
  avatarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.primary,
  },
  card: {
    marginBottom: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: EcoColors.gray800,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: EcoColors.gray600,
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  themeOptionBorder: {
    borderTopWidth: 1,
    borderTopColor: EcoColors.gray200,
    marginTop: 12,
    paddingTop: 12,
  },
  themeOptionActive: {
    backgroundColor: EcoColors.primary + '08',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: EcoColors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  themeIconContainerActive: {
    backgroundColor: EcoColors.primary,
  },
  themeContent: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray800,
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 13,
    color: EcoColors.gray600,
  },
  inputContainer: {
    marginBottom: 16,
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
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: EcoColors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.primary,
    textTransform: 'capitalize',
  },
  saveButton: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: EcoColors.gray700,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: EcoColors.gray200,
  },
  signOutButton: {
    marginTop: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});
