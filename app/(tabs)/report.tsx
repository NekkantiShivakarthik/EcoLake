import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBadgeNotification } from '@/components/ui/badge-notification';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useImagePicker, useLocation, usePhotoUpload } from '@/hooks/use-media';
import { useNearbyLakes, useSubmitReport, useUserProfile } from '@/hooks/use-supabase';

type Category = 'trash' | 'oil' | 'plastic' | 'vegetation' | 'animal' | 'other';

const categories: { key: Category; label: string; icon: string }[] = [
  { key: 'trash', label: 'Trash', icon: '🗑️' },
  { key: 'oil', label: 'Oil Spill', icon: '🛢️' },
  { key: 'plastic', label: 'Plastic', icon: '♻️' },
  { key: 'vegetation', label: 'Vegetation', icon: '🌿' },
  { key: 'animal', label: 'Animal', icon: '🐟' },
  { key: 'other', label: 'Other', icon: '⚠️' },
];

export default function ReportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { points } = useUserProfile(user?.id);
  const { showBadgeNotification } = useBadgeNotification();
  const { location, address, loading: locationLoading, getCurrentLocation, clearLocation } = useLocation();
  const { lakes: nearbyLakes, loading: lakesLoading } = useNearbyLakes(location, 25); // Search lakes within 25km
  const { submitReport, loading: submitting } = useSubmitReport();
  const { images, loading: imageLoading, pickFromCamera, pickFromGallery, removeImage, clearImages } = useImagePicker();
  const { uploading, progress, uploadPhotos } = usePhotoUpload();

  const [selectedLake, setSelectedLake] = useState<{ id: string; name: string; lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [severity, setSeverity] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-capture location on mount
  React.useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);
  
  // Filter lakes based on search query
  const filteredLakes = React.useMemo(() => {
    if (!searchQuery.trim()) return nearbyLakes;
    
    const query = searchQuery.toLowerCase();
    return nearbyLakes.filter(lake => 
      lake.name.toLowerCase().includes(query)
    );
  }, [nearbyLakes, searchQuery]);
  
  const hasNearbyLakes = nearbyLakes.length > 0;
  const hasFilteredLakes = filteredLakes.length > 0;
  const hasLocation = location !== null;

  // selectedLakeData removed (unused)

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickFromCamera();
          } else if (buttonIndex === 2) {
            pickFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Add Photo',
        'Choose how you want to add a photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: pickFromCamera },
          { text: 'Choose from Library', onPress: pickFromGallery },
        ]
      );
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to submit a report');
      return;
    }

    if (!selectedLake) {
      Alert.alert('Error', 'Please select a lake');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a pollution category');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    // Upload photos if any
    let photoUrls: string[] = [];
    if (images.length > 0) {
      photoUrls = await uploadPhotos(images);
    }

    // Use lake's location for the report
    const lat = selectedLake.lat;
    const lng = selectedLake.lng;

    const result = await submitReport({
      user_id: user.id,
      lake_id: null, // No database lake ID since these are dynamically searched
      lake_name: selectedLake.name, // Store the lake name instead
      category: selectedCategory,
      severity,
      description: description.trim(),
      lat,
      lng,
      photo_urls: photoUrls,
    });

    if (result.success) {
      const pointsEarned = result.pointsEarned || 0;
      const newBadges = result.newBadges || [];
      
      // Show success alert
      Alert.alert(
        '🎉 Report Submitted!', 
        `Thank you for helping keep our lakes clean!\n\n⭐ You earned ${pointsEarned} points!${newBadges.length > 0 ? `\n\n🏆 New badge${newBadges.length > 1 ? 's' : ''} earned!` : ''}`, 
        [
          {
            text: 'Awesome!',
            onPress: () => {
              // Show badge notifications
              newBadges.forEach((badge, index) => {
                setTimeout(() => {
                  showBadgeNotification(badge);
                }, index * 500); // Stagger badge notifications
              });
              
              // Reset form
              setSelectedLake(null);
              setSelectedCategory(null);
              setSeverity(3);
              setDescription('');
              clearImages();
              clearLocation();
              router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to submit report. Please try again.');
    }
  };

  const isSubmitting = submitting || uploading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.text }]}>Report Pollution</Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsIcon}>⭐</Text>
                <Text style={styles.pointsText}>{points}</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Help keep our lakes clean by reporting pollution
            </Text>
            <Text style={styles.pointsHint}>
              📝 Earn {10 + (severity * 2)} points for this report!
            </Text>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 Location</Text>
            <Card variant="outlined" style={styles.locationCard}>
              {location ? (
                <View style={styles.locationInfo}>
                  <View style={styles.locationHeader}>
                    <Text style={styles.locationIcon}>✅</Text>
                    <View style={styles.locationText}>
                      <Text style={styles.locationTitle}>Location Captured</Text>
                      <Text style={[styles.locationCoords, { color: colors.textSecondary }]}>
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </Text>
                      {address && (
                        <Text style={[styles.locationAddress, { color: colors.textSecondary }]} numberOfLines={2}>
                          {address}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.locationClearBtn, { backgroundColor: colors.surface }]} onPress={clearLocation}>
                    <Text style={[styles.locationClearText, { color: colors.textSecondary }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Text style={styles.locationButtonIcon}>🎯</Text>
                      <View>
                        <Text style={[styles.locationButtonText, { color: colors.text }]}>Get Current Location</Text>
                        <Text style={[styles.locationButtonSubtext, { color: colors.textSecondary }]}>
                          Add GPS coordinates to your report
                        </Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </Card>
          </View>

          {/* Lake Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Lake *</Text>
              {hasLocation && hasNearbyLakes && (
                <Text style={styles.nearbyLabel}>📍 {filteredLakes.length} of {nearbyLakes.length}</Text>
              )}
            </View>
            
            {/* Search Input */}
            {hasLocation && hasNearbyLakes && (
              <View style={styles.searchContainer}>
                <Card variant="outlined" style={styles.searchCard}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search for a lake..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity 
                      style={styles.clearSearchBtn}
                      onPress={() => setSearchQuery('')}
                    >
                      <Text style={[styles.clearSearchText, { color: colors.textTertiary }]}>✕</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              </View>
            )}
            
            {!hasLocation ? (
              <Card variant="outlined" style={styles.noLakesCard}>
                <Text style={styles.noLakesIcon}>📍</Text>
                <Text style={[styles.noLakesTitle, { color: colors.text }]}>Location Required</Text>
                <Text style={[styles.noLakesText, { color: colors.textSecondary }]}>
                  Please enable location to find nearby lakes
                </Text>
                <TouchableOpacity
                  style={styles.showAllButton}
                  onPress={getCurrentLocation}
                >
                  <Text style={styles.showAllButtonText}>Get Location</Text>
                </TouchableOpacity>
              </Card>
            ) : lakesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching for nearby lakes...</Text>
              </View>
            ) : !hasNearbyLakes ? (
              <Card variant="outlined" style={styles.noLakesCard}>
                <Text style={styles.noLakesIcon}>🔍</Text>
                <Text style={[styles.noLakesTitle, { color: colors.text }]}>No lakes found nearby</Text>
                <Text style={[styles.noLakesText, { color: colors.textSecondary }]}>
                  No lakes found within 25km of your location. Try moving closer to a lake or water body.
                </Text>
              </Card>
            ) : !hasFilteredLakes ? (
              <Card variant="outlined" style={styles.noLakesCard}>
                <Text style={styles.noLakesIcon}>🔍</Text>
                <Text style={[styles.noLakesTitle, { color: colors.text }]}>No matches found</Text>
                <Text style={[styles.noLakesText, { color: colors.textSecondary }]}>{`No lakes match "${searchQuery}". Try a different search term.`}</Text>
                <TouchableOpacity
                  style={styles.showAllButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.showAllButtonText}>Clear Search</Text>
                </TouchableOpacity>
              </Card>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.lakesContainer}
              >
                {filteredLakes.map((lake) => (
                  <TouchableOpacity
                    key={lake.id}
                    style={[
                      styles.lakeChip,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border },
                      selectedLake?.id === lake.id && styles.lakeChipActive,
                    ]}
                    onPress={() => setSelectedLake(lake)}
                  >
                    <Text style={styles.lakeIcon}>🏞️</Text>
                    <View style={styles.lakeChipContent}>
                      <Text
                        style={[
                          styles.lakeChipText,
                          { color: colors.text },
                          selectedLake?.id === lake.id && styles.lakeChipTextActive,
                        ]}
                        numberOfLines={2}
                      >
                        {lake.name}
                      </Text>
                      {lake.distance !== undefined && (
                        <Text style={[
                          styles.distanceBadge,
                          selectedLake?.id === lake.id && styles.distanceBadgeActive,
                        ]}>
                          {lake.distance < 1 
                            ? `${(lake.distance * 1000).toFixed(0)}m away`
                            : `${lake.distance.toFixed(1)}km away`
                          }
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pollution Category *</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    selectedCategory === category.key && styles.categoryCardActive,
                  ]}
                  onPress={() => setSelectedCategory(category.key)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: colors.textSecondary },
                      selectedCategory === category.key && styles.categoryLabelActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Severity Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Severity Level *</Text>
            <Card variant="outlined" style={styles.severityCard}>
              <View style={styles.severityRow}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.severityButton,
                      { backgroundColor: colors.surface },
                      severity === level && styles.severityButtonActive,
                      severity === level && { backgroundColor: getSeverityColor(level) },
                    ]}
                    onPress={() => setSeverity(level)}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        { color: colors.textSecondary },
                        severity === level && styles.severityTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.severityLabels}>
                <Text style={[styles.severityLabel, { color: colors.textTertiary }]}>Minor</Text>
                <Text style={[styles.severityLabel, { color: colors.textTertiary }]}>Critical</Text>
              </View>
            </Card>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description *</Text>
            <Card variant="outlined" style={styles.descriptionCard}>
              <TextInput
                style={[styles.descriptionInput, { color: colors.text }]}
                placeholder="Describe the pollution you observed..."
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Card>
          </View>

          {/* Photo Upload */}
          <View style={styles.section}>
            <View style={styles.photoHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📸 Photos</Text>
              <Text style={[styles.photoCount, { color: colors.textSecondary }]}>{images.length}/5</Text>
            </View>

            {/* Photo Grid */}
            {images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoGrid}
              >
                {images.map((image, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image
                      source={{ uri: image.uri }}
                      style={[styles.photoThumbnail, { backgroundColor: colors.surface }]}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Add Photo Button */}
            {images.length < 5 && (
              <TouchableOpacity
                style={[styles.photoUpload, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={showImagePickerOptions}
                disabled={imageLoading}
              >
                {imageLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Text style={styles.photoIcon}>📷</Text>
                    <Text style={[styles.photoText, { color: colors.textSecondary }]}>
                      {images.length > 0 ? 'Add More Photos' : 'Tap to Add Photos'}
                    </Text>
                    <Text style={[styles.photoSubtext, { color: colors.textTertiary }]}>
                      Camera or gallery • Max 5 photos
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Upload Progress */}
            {uploading && (
              <View style={styles.uploadProgress}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>Uploading photos... {Math.round(progress)}%</Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <Button
              title={isSubmitting ? 'Submitting...' : 'Submit Report'}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              size="lg"
              style={styles.submitButton}
            />
            <Text style={[styles.submitHint, { color: colors.textSecondary }]}>
              Your report will be reviewed and assigned to volunteers.
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getSeverityColor(level: number): string {
  const colors: { [key: number]: string } = {
    1: EcoColors.success,
    2: '#84cc16',
    3: EcoColors.warning,
    4: '#f97316',
    5: EcoColors.error,
  };
  return colors[level] || EcoColors.primary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  pointsIcon: {
    fontSize: 16,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.warning,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  pointsHint: {
    fontSize: 13,
    color: EcoColors.primary,
    marginTop: 8,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  // Location styles
  locationCard: {
    marginHorizontal: 20,
    padding: 0,
    overflow: 'hidden',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  locationButtonIcon: {
    fontSize: 28,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  locationButtonSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  locationInfo: {
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: EcoColors.success,
  },
  locationCoords: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
  locationAddress: {
    fontSize: 13,
    marginTop: 4,
  },
  locationClearBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  locationClearText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  nearbyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: EcoColors.success,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  noLakesCard: {
    marginHorizontal: 20,
    padding: 24,
    alignItems: 'center',
  },
  noLakesIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noLakesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noLakesText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  showAllButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: EcoColors.primary,
    borderRadius: 20,
  },
  showAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.white,
  },
  showNearbyButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  showNearbyButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  lakesContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  lakeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 10,
    gap: 10,
    minWidth: 140,
  },
  lakeChipActive: {
    backgroundColor: EcoColors.primary,
    borderColor: EcoColors.primary,
  },
  lakeIcon: {
    fontSize: 20,
  },
  lakeChipContent: {
    flex: 1,
    gap: 4,
  },
  lakeChipText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  lakeChipTextActive: {
    color: EcoColors.white,
  },
  distanceBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: EcoColors.success,
  },
  distanceBadgeActive: {
    color: EcoColors.white,
    opacity: 0.9,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryCardActive: {
    backgroundColor: EcoColors.primaryLight + '20',
    borderColor: EcoColors.primary,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: EcoColors.primary,
  },
  severityCard: {
    marginHorizontal: 20,
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  severityButtonActive: {
    backgroundColor: EcoColors.primary,
  },
  severityText: {
    fontSize: 16,
    fontWeight: '600',
  },
  severityTextActive: {
    color: EcoColors.white,
  },
  severityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityLabel: {
    fontSize: 12,
  },
  descriptionCard: {
    marginHorizontal: 20,
    padding: 0,
  },
  descriptionInput: {
    fontSize: 15,
    padding: 16,
    minHeight: 120,
  },
  photoUpload: {
    marginHorizontal: 20,
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
  },
  photoCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  photoGrid: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  photoItem: {
    position: 'relative',
    marginRight: 10,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: EcoColors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: EcoColors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  photoSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  submitButton: {
    width: '100%',
  },
  submitHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  uploadProgress: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: EcoColors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});
