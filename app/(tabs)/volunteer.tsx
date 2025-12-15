import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
  const { user } = useAuth();
  const { colors } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

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
      const { error } = await supabase
        .from('reports')
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
    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      uploadProofPhotos(result.assets);
    }
  };

  const uploadProofPhotos = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const asset of assets) {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = decode(Buffer.from(arrayBuffer).toString('base64'));

        const fileName = `proof_${user?.id}_${Date.now()}_${Math.random()}.jpg`;
        const { data, error } = await supabase.storage
          .from('report-photos')
          .upload(fileName, base64, {
            contentType: 'image/jpeg',
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('report-photos')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      setProofPhotos([...proofPhotos, ...uploadedUrls]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const submitWork = async () => {
    if (!selectedReport) return;

    if (proofPhotos.length === 0) {
      Alert.alert('Error', 'Please upload at least one proof photo');
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: 'cleaned',
          volunteer_proof_photos: proofPhotos,
          volunteer_notes: notes,
          volunteer_completed_at: new Date().toISOString(),
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      const pointsEarned = (selectedReport.severity || 1) * 10;
      Alert.alert(
        'Success! 🎉',
        `Work submitted successfully! You earned ${pointsEarned} points!`,
        [
          {
            text: 'OK',
            onPress: () => {
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
        <ActivityIndicator size="large" color={EcoColors.primary} />
      </View>
    );
  }

  if (selectedReport) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setSelectedReport(null);
                setProofPhotos([]);
                setNotes('');
              }}
            >
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Complete Work</Text>
          </View>

          <Card style={styles.card}>
            <View style={styles.reportDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{selectedReport.lake_name || 'Unknown'}</Text>
                  <Text style={styles.coordinates}>
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

              <View style={styles.divider} />

              <Text style={styles.detailSectionTitle}>Problem Description</Text>
              <Text style={styles.description}>{selectedReport.description}</Text>
            
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <>
                  <Text style={styles.detailSectionTitle}>Photos from Reporter</Text>
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

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Severity:</Text>
                <Text style={styles.value}>{'⭐'.repeat(selectedReport.severity || 1)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Category:</Text>
                <Text style={styles.value}>{selectedReport.category || 'Other'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Points to earn:</Text>
                <Text style={styles.pointsValue}>{(selectedReport.severity || 1) * 10} pts 🎯</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Upload Proof Photos</Text>
            <Text style={styles.subtitle}>Show before/after photos of your cleanup work</Text>

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
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes about the cleanup work..."
              placeholderTextColor={EcoColors.gray400}
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
                          await supabase
                            .from('reports')
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
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Volunteer Work</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Claim reports and earn points! 🌟</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Points Display */}
        <Card style={[styles.card, styles.pointsCard]}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsDisplay}>{user?.points || 0}</Text>
          <Text style={styles.pointsSubtext}>Keep cleaning to earn more!</Text>
        </Card>

        {/* How it Works Guide */}
        {myReports.length === 0 && (
          <Card style={styles.card}>
            <Text style={styles.guideTitle}>🚀 How It Works</Text>
            <View style={styles.guideSteps}>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Claim a Report</Text>
                  <Text style={styles.stepDescription}>Browse available reports and tap "Claim Report"</Text>
                </View>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Clean the Lake</Text>
                  <Text style={styles.stepDescription}>Visit the location and clean up the pollution</Text>
                </View>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Upload Proof</Text>
                  <Text style={styles.stepDescription}>Take photos showing the cleaned area</Text>
                </View>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Earn Points!</Text>
                  <Text style={styles.stepDescription}>Get 10-50 points based on severity level</Text>
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
        <Text style={styles.pointsBadge}>+{(report.severity || 1) * 10} pts</Text>
      </View>

      {report.photos && report.photos.length > 0 && (
        <Image source={{ uri: report.photos[0] }} style={styles.reportImage} />
      )}

      <Text style={[styles.reportDescription, { color: colors.textSecondary }]} numberOfLines={2}>
        {report.description}
      </Text>

      <View style={styles.reportInfo}>
        <Text style={[styles.reportCategory, { color: colors.textSecondary }]}>📍 {report.lake_name || 'Unknown Location'}</Text>
        <Text style={styles.reportSeverity}>{'⭐'.repeat(report.severity || 1)}</Text>
      </View>

      <Button title={buttonTitle} onPress={onPress} size="sm" />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.gray50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: EcoColors.gray50,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: EcoColors.white,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray200,
  },
  backButton: {
    fontSize: 16,
    color: EcoColors.primary,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: EcoColors.gray900,
  },
  headerSubtitle: {
    fontSize: 14,
    color: EcoColors.gray600,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: EcoColors.gray900,
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
    backgroundColor: EcoColors.primary,
    marginTop: 20,
  },
  pointsLabel: {
    fontSize: 14,
    color: EcoColors.white,
    opacity: 0.9,
  },
  pointsDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: EcoColors.white,
    marginVertical: 8,
  },
  pointsSubtext: {
    fontSize: 12,
    color: EcoColors.white,
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
    color: EcoColors.success,
  },
  reportImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  reportDescription: {
    fontSize: 14,
    color: EcoColors.gray700,
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
    color: EcoColors.gray600,
  },
  reportSeverity: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: EcoColors.gray600,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: EcoColors.gray500,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: EcoColors.gray600,
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
    color: EcoColors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray900,
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: EcoColors.gray600,
    fontFamily: 'monospace',
  },
  mapButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: EcoColors.primary,
    borderRadius: 8,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: EcoColors.white,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.gray700,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: EcoColors.gray200,
    marginVertical: 8,
  },
  description: {
    fontSize: 14,
    color: EcoColors.gray700,
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
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: EcoColors.gray600,
  },
  value: {
    fontSize: 14,
    color: EcoColors.gray900,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.success,
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
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: EcoColors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: EcoColors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: EcoColors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: EcoColors.gray900,
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
    color: EcoColors.gray900,
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
    backgroundColor: EcoColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: EcoColors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: EcoColors.gray800,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: EcoColors.gray600,
    lineHeight: 18,
  },
});
