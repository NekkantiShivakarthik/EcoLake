import { useBadgeNotification } from '@/components/ui/badge-notification';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { checkAndAwardBadges, useUserProfile } from '@/hooks/use-supabase';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { File } from 'expo-file-system/next';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Report {
  id: string;
  description: string;
  category: string;
  severity: number;
  photos: string[];
  status: string;
  lat: number;
  lng: number;
  lake_name: string | null;
  assigned_cleaner_id: string | null;
  volunteer_proof_photos: string[] | null;
  volunteer_notes: string | null;
  created_at: string;
}

export default function VolunteerWorkScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { points } = useUserProfile(user?.id);
  const { showBadgeNotification } = useBadgeNotification();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchReports = async () => {
    try {
      // Fetch reports available for volunteers or assigned to current user
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .in('status', ['verified', 'assigned', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const claimReport = async (reportId: string) => {
    try {
      const { error } = await (supabase
        .from('reports') as any)
        .update({
          assigned_cleaner_id: user?.id,
          status: 'in_progress',
        })
        .eq('id', reportId);

      if (error) throw error;

      // Refresh the reports list first
      await fetchReports();

      // Then show success message and open the claimed report
      Alert.alert(
        '✅ Report Claimed!',
        'Great! Now:\n\n1️⃣ Visit the location\n2️⃣ Clean up the pollution\n3️⃣ Take proof photos\n4️⃣ Submit your work',
        [
          {
            text: 'Start Now',
            onPress: () => {
              // Find the just-claimed report and open it
              const claimedReport = reports.find(r => r.id === reportId);
              if (claimedReport) {
                setSelectedReport(claimedReport);
              }
            },
          },
          {
            text: 'Later',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload proof photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        uploadProofPhotos(result.assets);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  const uploadProofPhotos = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const asset of assets) {
        const fileExt = asset.fileName?.split('.').pop() || 'jpg';
        const fileName = `proof_${user?.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        let uploadError = null;
        let uploadData = null;

        if (Platform.OS === 'web') {
          // Web: Use fetch to get blob and upload directly
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          
          const result = await supabase.storage
            .from('report-photos')
            .upload(filePath, blob, {
              contentType: asset.mimeType || 'image/jpeg',
              upsert: false,
            });
          uploadError = result.error;
          uploadData = result.data;
        } else {
          // Mobile: Use new expo-file-system File API to read as base64
          const file = new File(asset.uri);
          const base64 = await file.base64();
          const arrayBuffer = decode(base64);
          
          const result = await supabase.storage
            .from('report-photos')
            .upload(filePath, arrayBuffer, {
              contentType: asset.mimeType || 'image/jpeg',
              upsert: false,
            });
          uploadError = result.error;
          uploadData = result.data;
        }

        if (uploadError) throw uploadError;

        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('report-photos')
            .getPublicUrl(uploadData.path);

          uploadedUrls.push(urlData.publicUrl);
        }
      }

      setProofPhotos([...proofPhotos, ...uploadedUrls]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const submitWork = async () => {
    if (!selectedReport || !user) return;

    if (proofPhotos.length === 0) {
      Alert.alert('Error', 'Please upload at least one proof photo');
      return;
    }

    try {
      const { error } = await (supabase
        .from('reports') as any)
        .update({
          status: 'cleaned',
          volunteer_proof_photos: proofPhotos,
          volunteer_notes: notes,
          volunteer_completed_at: new Date().toISOString(),
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      // Award points for cleanup
      const pointsEarned = (selectedReport.severity || 1) * 10;
      
      // Get current balance and add points
      const { data: currentPoints } = await supabase
        .from('points_log')
        .select('balance_snapshot')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const currentBalance = (currentPoints as any)?.[0]?.balance_snapshot || 0;
      const newBalance = currentBalance + pointsEarned;

      await (supabase.from('points_log') as any).insert({
        user_id: user.id,
        change: pointsEarned,
        reason: `Cleanup completed: ${selectedReport.lake_name || 'Unknown Lake'}`,
        balance_snapshot: newBalance,
      });

      // Check for new badges
      const newBadges = await checkAndAwardBadges(user.id);

      Alert.alert(
        'Success! 🎉',
        `Work submitted successfully! You earned ${pointsEarned} points!${newBadges.length > 0 ? `\n\n🏆 New badge${newBadges.length > 1 ? 's' : ''} earned!` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Show badge notifications
              newBadges.forEach((badge, index) => {
                setTimeout(() => {
                  showBadgeNotification(badge);
                }, index * 500);
              });
              
              setSelectedReport(null);
              setProofPhotos([]);
              setNotes('');
              fetchReports();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (selectedReport) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={styles.scrollView}>
          <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                setSelectedReport(null);
                setProofPhotos([]);
                setNotes('');
              }}
            >
              <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Complete Work</Text>
          </View>

          <Card style={styles.card}>
            <View style={styles.reportDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Location</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedReport.lake_name || 'Unknown'}</Text>
                  <Text style={[styles.coordinates, { color: colors.textSecondary }]}>
                    {selectedReport.lat.toFixed(6)}, {selectedReport.lng.toFixed(6)}
                  </Text>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${selectedReport.lat},${selectedReport.lng}`;
                      Alert.alert(
                        'Open in Maps',
                        'Navigate to this location?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Open Maps', onPress: () => {
                            // You can use Linking.openURL(url) here
                            console.log('Open maps:', url);
                          }},
                        ]
                      );
                    }}
                  >
                    <Text style={styles.mapButtonText}>🗺️ Open in Maps</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <Text style={[styles.detailSectionTitle, { color: colors.textSecondary }]}>Problem Description</Text>
              <Text style={[styles.description, { color: colors.text }]}>{selectedReport.description}</Text>
            
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <>
                  <Text style={[styles.detailSectionTitle, { color: colors.textSecondary }]}>Photos from Reporter</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photosContainer}
                  >
                    {selectedReport.photos.map((photo, index) => (
                      <Image key={index} source={{ uri: photo }} style={styles.photo} />
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Severity:</Text>
                <Text style={[styles.value, { color: colors.text }]}>{'⭐'.repeat(selectedReport.severity || 1)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Category:</Text>
                <Text style={[styles.value, { color: colors.text }]}>{selectedReport.category || 'Other'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Points to earn:</Text>
                <Text style={[styles.pointsValue, { color: colors.success }]}>{(selectedReport.severity || 1) * 10} pts 🎯</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upload Proof Photos</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Show before/after photos of your cleanup work</Text>

            <Button
              title={uploading ? 'Uploading...' : '📷 Add Photos'}
              onPress={pickImage}
              disabled={uploading}
              variant="outline"
              style={styles.uploadButton}
            />

            {proofPhotos.length > 0 && (
              <View style={styles.proofPhotosContainer}>
                {proofPhotos.map((photo, index) => (
                  <View key={index} style={styles.proofPhotoWrapper}>
                    <Image source={{ uri: photo }} style={styles.proofPhoto} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setProofPhotos(proofPhotos.filter((_, i) => i !== index))}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.notesInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground }]}
              placeholder="Add any notes about the cleanup work..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </Card>

          <View style={styles.actionButtons}>
            <Button
              title="Mark as Complete"
              onPress={submitWork}
              disabled={proofPhotos.length === 0}
              style={styles.submitButton}
            />
            
            <Button
              title="Cancel Work"
              onPress={() => {
                Alert.alert(
                  'Cancel Work',
                  'Are you sure you want to unclaim this report?',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Yes',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await (supabase
                            .from('reports') as any)
                            .update({
                              assigned_cleaner_id: null,
                              status: 'verified',
                            })
                            .eq('id', selectedReport.id);
                          
                          setSelectedReport(null);
                          setProofPhotos([]);
                          setNotes('');
                          fetchReports();
                          Alert.alert('Success', 'Report unclaimed successfully');
                        } catch (error: any) {
                          Alert.alert('Error', error.message);
                        }
                      },
                    },
                  ]
                );
              }}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const availableReports = reports.filter(r => r.status === 'verified' || (r.status === 'assigned' && !r.assigned_cleaner_id));
  const myReports = reports.filter(r => r.assigned_cleaner_id === user?.id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Volunteer Work</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Claim reports and earn points! 🌟</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Points Display */}
        <Card style={[styles.card, styles.pointsCard]}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsDisplay}>{points}</Text>
          <Text style={styles.pointsSubtext}>Keep cleaning to earn more!</Text>
        </Card>

        {/* How it Works Guide */}
        {myReports.length === 0 && (
          <Card style={styles.card}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>🚀 How It Works</Text>
            <View style={styles.guideSteps}>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Claim a Report</Text>
                  <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{`Browse available reports and tap "Claim Report"`}</Text>
                </View>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Clean the Lake</Text>
                  <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>Visit the location and clean up the pollution</Text>
                </View>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Upload Proof</Text>
                  <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>Take photos showing the cleaned area</Text>
                </View>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Earn Points!</Text>
                  <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>Get 10-50 points based on severity level</Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* My Active Work */}
        {myReports.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>My Active Work</Text>
            {myReports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                onPress={() => setSelectedReport(report)}
                buttonTitle="Complete Work"
              />
            ))}
          </>
        )}

        {/* Available Reports */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Available Reports</Text>
        {availableReports.length === 0 ? (
          <Card style={styles.card}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reports available right now</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Check back later for new cleanup opportunities!</Text>
          </Card>
        ) : (
          availableReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() => claimReport(report.id)}
              buttonTitle="Claim Report"
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ReportCardProps {
  report: Report;
  onPress: () => void;
  buttonTitle: string;
}

function ReportCard({ report, onPress, buttonTitle }: ReportCardProps) {
  const { colors } = useTheme();
  return (
    <Card style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <StatusChip status={report.status as any} />
        {(report as any).ai_analysis_status === 'processing' && (
          <Text style={[styles.analyzingStatus, { color: '#FFA500' }]}>🤔 Analyzing...</Text>
        )}
        <Text style={[styles.pointsBadge, { color: colors.success }]}>+{((report as any).ai_severity_level || report.severity || 1) * 10} pts</Text>
      </View>

      {report.photos && report.photos.length > 0 && (
        <Image source={{ uri: report.photos[0] }} style={styles.reportImage} />
      )}

      <Text style={[styles.reportDescription, { color: colors.textSecondary }]} numberOfLines={2}>
        {(report as any).ai_summary || report.description}
      </Text>

      <View style={styles.reportInfo}>
        <Text style={[styles.reportCategory, { color: colors.textSecondary }]}>
          📍 {report.lake_name || 'Unknown Location'}
        </Text>
        {(report as any).ai_waste_type && (
          <Text style={[styles.aiWasteType, { color: colors.primary }]}>
            🤖 {(report as any).ai_waste_type.replace(/_/g, ' ')}
          </Text>
        )}
        <View style={styles.reportMeta}>
          <Text style={styles.reportSeverity}>{'⭐'.repeat((report as any).ai_severity_level || report.severity || 1)}</Text>
          {(report as any).ai_estimated_cleanup_time_minutes && (
            <Text style={[styles.cleanupTime, { color: colors.textSecondary }]}>
              ⏱️ {(report as any).ai_estimated_cleanup_time_minutes}min
            </Text>
          )}
          {(report as any).ai_confidence && (
            <Text style={[styles.confidence, { color: colors.primary }]}>
              ✓ {((report as any).ai_confidence * 100).toFixed(0)}%
            </Text>
          )}
        </View>
      </View>

      <Button title={buttonTitle} onPress={onPress} size="sm" />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  pointsCard: {
    alignItems: 'center',
    backgroundColor: '#0E7490',
    marginTop: 20,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  pointsDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  pointsSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  reportCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  reportImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 12,
  },
  reportDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  reportInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportCategory: {
    fontSize: 12,
  },
  reportSeverity: {
    fontSize: 14,
  },
  analyzingStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  aiWasteType: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  cleanupTime: {
    fontSize: 11,
  },
  confidence: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  reportDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    fontSize: 24,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  mapButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0E7490',
    borderRadius: 10,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    marginBottom: 16,
  },
  proofPhotosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  proofPhotoWrapper: {
    position: 'relative',
  },
  proofPhoto: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  submitButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  guideSteps: {
    gap: 16,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0E7490',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
