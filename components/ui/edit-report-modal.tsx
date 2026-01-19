import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EcoColors, getSeverityColor } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';
import { Report } from '@/types/database';
import { Card } from './card';

type Category = 'trash' | 'oil' | 'plastic' | 'vegetation' | 'animal' | 'other';

const categories: { key: Category; label: string; icon: string }[] = [
  { key: 'trash', label: 'Trash', icon: '🗑️' },
  { key: 'oil', label: 'Oil Spill', icon: '🛢️' },
  { key: 'plastic', label: 'Plastic', icon: '♻️' },
  { key: 'vegetation', label: 'Vegetation', icon: '🌿' },
  { key: 'animal', label: 'Animal', icon: '🐟' },
  { key: 'other', label: 'Other', icon: '⚠️' },
];

interface EditReportModalProps {
  visible: boolean;
  report: Report | null;
  onClose: () => void;
  onSave: (updatedData: {
    category: string;
    severity: number;
    description: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function EditReportModal({
  visible,
  report,
  onClose,
  onSave,
  loading = false,
}: EditReportModalProps) {
  const { colors } = useTheme();
  const [category, setCategory] = useState<Category>('other');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (report) {
      setCategory((report.category as Category) || 'other');
      setSeverity(report.severity || 3);
      setDescription(report.description || '');
    }
  }, [report]);

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    setSaving(true);
    const result = await onSave({
      category,
      severity,
      description: description.trim(),
    });
    setSaving(false);

    if (result.success) {
      Alert.alert('Success', 'Report updated successfully!', [
        { text: 'OK', onPress: onClose },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update report');
    }
  };

  const hasPhotos = report?.photos && report.photos.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <LinearGradient
          colors={[EcoColors.primary, EcoColors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={EcoColors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Report</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Photo Preview (Read-only) */}
          {hasPhotos && (
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>📸 Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.photosRow}>
                    {report?.photos?.map((photo, index) => (
                      <View key={index} style={styles.photoWrapper}>
                        <Image
                          source={{ uri: photo }}
                          style={styles.photo}
                          contentFit="cover"
                        />
                      </View>
                    ))}
                  </View>
                </ScrollView>
                                <Text style={[styles.photoHint, { color: colors.textTertiary }]}>Photos cannot be edited</Text>
              </View>
            </Animated.View>
          )}

          {/* Location (Read-only) */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 Location</Text>
              <Card variant="outlined" style={styles.locationCard}>
                <View style={styles.locationContent}>
                  <Text style={styles.locationIcon}>🏞️</Text>
                  <View style={styles.locationInfo}>
                    <Text style={[styles.locationName, { color: colors.text }]}>
                      {report?.lake_name || 'Unknown Lake'}
                    </Text>
                    {report?.lat && report?.lng && (
                      <Text style={[styles.locationCoords, { color: colors.textSecondary }]}>
                        {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
              <Text style={[styles.photoHint, { color: colors.textTertiary }]}>Location cannot be changed</Text>
            </View>
          </Animated.View>

          {/* Category Selection */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pollution Category *</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryChip,
                      category === cat.key && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === cat.key && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {category === cat.key && (
                      <View style={styles.categoryCheck}>
                        <Ionicons name="checkmark" size={14} color={EcoColors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Severity Slider */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Severity Level *</Text>
              <Card variant="outlined" style={styles.severityCard}>
                <View style={styles.severityHeader}>
                  <Text style={styles.severityValue}>{severity}</Text>
                  <Text style={[styles.severityLabel, { color: getSeverityColor(severity) }]}>
                    {severity === 1 && 'Minor'}
                    {severity === 2 && 'Low'}
                    {severity === 3 && 'Moderate'}
                    {severity === 4 && 'High'}
                    {severity === 5 && 'Critical'}
                  </Text>
                </View>
                <View style={styles.severityButtons}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.severityButton,
                        severity === level && {
                          backgroundColor: getSeverityColor(level),
                          borderColor: getSeverityColor(level),
                        },
                      ]}
                      onPress={() => setSeverity(level)}
                    >
                      <Text
                        style={[
                          styles.severityButtonText,
                          severity === level && styles.severityButtonTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.severityScale}>
                  <Text style={styles.scaleText}>Minor</Text>
                  <Text style={styles.scaleText}>Critical</Text>
                </View>
              </Card>
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description *</Text>
              <Card variant="outlined" style={styles.descriptionCard}>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Describe the pollution you observed..."
                  placeholderTextColor={EcoColors.gray400}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                <View style={styles.charCount}>
                  <Text style={styles.charCountText}>
                    {description.length} characters
                  </Text>
                </View>
              </Card>
            </View>
          </Animated.View>

          {/* Save Button */}
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <LinearGradient
                  colors={[EcoColors.primary, EcoColors.primaryDark]}
                  style={styles.saveButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator color={EcoColors.white} size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={EcoColors.white} />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.gray50,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: EcoColors.white,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.gray800,
    marginBottom: 12,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  photo: {
    width: 120,
    height: 100,
    borderRadius: 16,
  },
  photoHint: {
    fontSize: 12,
    color: EcoColors.gray400,
    marginTop: 8,
    fontStyle: 'italic',
  },
  locationCard: {
    padding: 16,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIcon: {
    fontSize: 32,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray800,
  },
  locationCoords: {
    fontSize: 13,
    color: EcoColors.gray500,
    marginTop: 2,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: EcoColors.gray200,
    gap: 8,
    minWidth: '30%',
  },
  categoryChipActive: {
    backgroundColor: EcoColors.primary + '10',
    borderColor: EcoColors.primary,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: EcoColors.gray600,
  },
  categoryLabelActive: {
    color: EcoColors.primary,
    fontWeight: '600',
  },
  categoryCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: EcoColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityCard: {
    padding: 20,
  },
  severityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  severityValue: {
    fontSize: 36,
    fontWeight: '700',
    color: EcoColors.gray800,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  severityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  severityButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: EcoColors.gray200,
    backgroundColor: EcoColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: EcoColors.gray500,
  },
  severityButtonTextActive: {
    color: EcoColors.white,
  },
  severityScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  scaleText: {
    fontSize: 12,
    color: EcoColors.gray400,
  },
  descriptionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  descriptionInput: {
    fontSize: 15,
    color: EcoColors.gray800,
    minHeight: 140,
    padding: 16,
    lineHeight: 22,
  },
  charCount: {
    borderTopWidth: 1,
    borderTopColor: EcoColors.gray100,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: EcoColors.gray50,
  },
  charCountText: {
    fontSize: 12,
    color: EcoColors.gray400,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: EcoColors.gray100,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray600,
  },
  saveButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.white,
  },
  bottomSpacing: {
    height: 40,
  },
});
