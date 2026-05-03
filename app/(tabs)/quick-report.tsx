import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EditReportModal } from '@/components/ui/edit-report-modal';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useImagePicker, useLocation, usePhotoUpload } from '@/hooks/use-media';
import { useSubmitReport, useUpdateReport } from '@/hooks/use-supabase';
import { supabase } from '@/lib/supabase';
import { Report } from '@/types/database';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type QuickStatus = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

type Category = NonNullable<Report['category']>;

type WasteAnalysis = {
  waste_type?: string;
  severity_level?: number;
  estimated_cleanup_time_minutes?: number;
  recommended_tools?: string[];
  confidence?: number;
  description?: string;
};

export default function QuickReportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { images, pickFromCamera, pickFromGallery, removeImage, clearImages } = useImagePicker();
  const { location, address, loading: locationLoading, getCurrentLocation, clearLocation } = useLocation();
  const { uploading, uploadPhotos, progress } = usePhotoUpload();
  const { submitReport, loading: submitLoading } = useSubmitReport();
  const { updateReport, loading: updateLoading } = useUpdateReport();

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<WasteAnalysis | null>(null);
  const [status, setStatus] = useState<QuickStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [lakeName, setLakeName] = useState('');
  const [draftCategory, setDraftCategory] = useState<Category>('other');
  const [draftSeverity, setDraftSeverity] = useState(3);
  const [draftDescription, setDraftDescription] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);

  const formatWasteLabel = (value?: string) => {
    if (!value) return 'Unknown';
    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const severityLabel = (value?: number) => {
    switch (value) {
      case 1:
        return 'Minor';
      case 2:
        return 'Low';
      case 3:
        return 'Moderate';
      case 4:
        return 'High';
      case 5:
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  const severityChipColor = (value?: number) => {
    if (!value) return 'info';
    if (value <= 2) return 'success';
    if (value === 3) return 'warning';
    return 'error';
  };

  const mapWasteToCategory = (wasteType?: string): Category => {
    if (!wasteType) return 'other';
    if (wasteType.includes('plastic') || wasteType.includes('microplastics')) return 'plastic';
    if (wasteType.includes('oil')) return 'oil';
    if (wasteType.includes('vegetation') || wasteType.includes('algae')) return 'vegetation';
    if (wasteType.includes('animal')) return 'animal';
    if (wasteType.includes('glass') || wasteType.includes('metal') || wasteType.includes('construction')) return 'trash';
    if (wasteType.includes('mixed')) return 'trash';
    return 'other';
  };

  const statusInfo = useMemo(() => {
    switch (status) {
      case 'uploading':
        return { label: 'Uploading', bg: colors.surface, text: colors.text, border: colors.border };
      case 'analyzing':
        return { label: 'Analyzing', bg: colors.surface, text: colors.text, border: colors.border };
      case 'done':
        return { label: 'Done', bg: colors.successLight || colors.surface, text: colors.success || colors.text, border: colors.success || colors.border };
      case 'error':
        return { label: 'Error', bg: colors.surface, text: colors.error || colors.text, border: colors.error || colors.border };
      default:
        return { label: 'Ready', bg: colors.surface, text: colors.textSecondary, border: colors.border };
    }
  }, [status, colors]);

  const handleAnalyze = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to run AI analysis');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Add photo', 'Please add at least one photo to analyze');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setErrorMessage(null);
    setStatus('uploading');

    try {
      const uploaded = await uploadPhotos(images);

      if (uploaded.length === 0) {
        throw new Error('No photos uploaded. Please try again.');
      }

      setPhotoUrls(uploaded);

      setStatus('analyzing');

      const imageUrl = uploaded[0];
      const { data: fnData, error: fnError } = await supabase.functions.invoke('quick-report-vision', {
        body: { imageUrl },
      });

      if (fnError) throw fnError;

      const result = fnData?.analysis || fnData;
      if (!result) throw new Error('AI response was empty');

      const nextAnalysis = result as WasteAnalysis;
      setAnalysis(nextAnalysis);
      setDraftCategory(mapWasteToCategory(nextAnalysis.waste_type));
      setDraftSeverity(nextAnalysis.severity_level || 3);
      setDraftDescription(nextAnalysis.description || '');
      if (!lakeName.trim()) {
        setLakeName('Quick Report');
      }
      setCreatedReportId(null);
      setStatus('done');
      Alert.alert('Analysis Complete', 'AI analysis finished and displayed below');
    } catch (err) {
      console.error('Quick analysis failed', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(message);
      setStatus('error');
      Alert.alert('Analysis failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    clearImages();
    clearLocation();
    setPhotoUrls([]);
    setLakeName('');
    setAnalysis(null);
    setErrorMessage(null);
    setStatus('idle');
    setDraftCategory('other');
    setDraftSeverity(3);
    setDraftDescription('');
    setCreatedReportId(null);
  };

  const handleEditDraft = () => {
    if (!analysis) {
      Alert.alert('Analyze first', 'Run AI analysis before editing report details');
      return;
    }
    setEditModalVisible(true);
  };

  const handleDraftSave = async (data: { category: string; severity: number; description: string }) => {
    setDraftCategory(data.category as Category);
    setDraftSeverity(data.severity);
    setDraftDescription(data.description);

    if (createdReportId) {
      return updateReport(createdReportId, data);
    }

    return { success: true };
  };

  const handleSubmitReport = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to submit a report');
      return;
    }

    if (!analysis) {
      Alert.alert('Analyze first', 'Run AI analysis before submitting a report');
      return;
    }

    const trimmedLakeName = lakeName.trim();
    if (!trimmedLakeName) {
      Alert.alert('Lake name required', 'Please enter a lake name');
      return;
    }

    let coords = location;
    if (!coords) {
      coords = await getCurrentLocation();
    }

    if (!coords) {
      Alert.alert('Location required', 'Please allow location access to submit this report');
      return;
    }

    if (photoUrls.length === 0) {
      Alert.alert('Missing photos', 'Please run AI analysis to upload photos');
      return;
    }

    const description = (draftDescription || analysis.description || 'Quick report').trim();
    if (!description) {
      Alert.alert('Description required', 'Please add a short description');
      return;
    }

    const cityName = address?.split(',').pop()?.trim() || 'Unknown';
    const result = await submitReport({
      user_id: user.id,
      lake_id: null,
      lake_name: trimmedLakeName,
      category: draftCategory,
      severity: draftSeverity,
      description,
      lat: coords.latitude,
      lng: coords.longitude,
      city: cityName,
      photo_urls: photoUrls,
    });

    if (result.success) {
      setCreatedReportId(result.reportId || null);
      Alert.alert('Report Submitted', 'Your report was created successfully.');
      return;
    }

    Alert.alert('Report failed', result.error || 'Could not submit report');
  };

  const analyzeLabel = status === 'done' ? 'Analyze Again' : status === 'error' ? 'Retry' : 'Analyze with AI';
  const editSuccessMessage = createdReportId
    ? 'Report updated successfully!'
    : 'Details saved. Submit the report when ready.';
  const editTitle = createdReportId ? 'Edit Report' : 'Report Details';
  const editSaveLabel = createdReportId ? 'Save Changes' : 'Save Details';

  const draftReport: Report | null = useMemo(() => {
    if (!analysis) return null;
    return {
      id: createdReportId || 'draft',
      user_id: user?.id || null,
      lake_id: null,
      lake_name: lakeName || 'Quick Report',
      description: draftDescription || analysis.description || '',
      category: draftCategory,
      severity: draftSeverity,
      photos: photoUrls,
      video_url: null,
      lat: location?.latitude || 0,
      lng: location?.longitude || 0,
      status: 'submitted',
      priority_score: draftSeverity * 20,
      assigned_cleaner_id: null,
      volunteer_proof_photos: null,
      volunteer_completed_at: null,
      volunteer_notes: null,
      created_at: new Date().toISOString(),
    };
  }, [analysis, createdReportId, user?.id, lakeName, draftDescription, draftCategory, draftSeverity, photoUrls, location?.latitude, location?.longitude]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Quick Report</Text>
          <View style={[styles.statusChip, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}> 
            <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <Text style={[styles.helpText, { color: colors.textSecondary }]}>Upload a photo and run AI to identify waste type and severity. The first photo is used for analysis.</Text>

        <View style={styles.photosSection}>
          {images.length > 0 ? (
            images.map((img, i) => (
              <View key={i} style={styles.photoItem}>
                <Image source={{ uri: img.uri }} style={styles.photo} contentFit="cover" />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <TouchableOpacity style={[styles.addPhoto, { borderColor: colors.border }]} onPress={pickFromGallery}>
              <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>Tap to add photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={pickFromGallery}>
            <Text style={styles.buttonText}>Choose</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={pickFromCamera}>
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleClear}>
            <Text style={[styles.buttonSecondaryText, { color: colors.textSecondary }]}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.analyzeRow}>
          <TouchableOpacity
            style={[styles.analyzeBtn, { backgroundColor: colors.primary }]}
            onPress={handleAnalyze}
            disabled={loading || uploading}
          >
            {loading || uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeText}>{analyzeLabel}</Text>
            )}
          </TouchableOpacity>
        </View>

        {uploading && (
          <Text style={{ color: colors.textSecondary }}>Uploading photos... {Math.round(progress)}%</Text>
        )}

        {errorMessage && (
          <Text style={[styles.errorText, { color: colors.error || '#ff4d4f' }]}>{errorMessage}</Text>
        )}

        {analysis && (
          <Card variant="outlined" style={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>AI Analysis</Text>
            <View style={styles.chipRow}>
              <Chip label={formatWasteLabel(analysis.waste_type)} icon="🧪" variant="soft" color="info" size="sm" />
              <Chip
                label={`Severity ${analysis.severity_level ?? 'N/A'} · ${severityLabel(analysis.severity_level)}`}
                icon="⚠️"
                variant="soft"
                color={severityChipColor(analysis.severity_level)}
                size="sm"
              />
              {analysis.estimated_cleanup_time_minutes !== undefined && (
                <Chip
                  label={`${analysis.estimated_cleanup_time_minutes} mins`}
                  icon="⏱️"
                  variant="soft"
                  color="secondary"
                  size="sm"
                />
              )}
            </View>
            {analysis.recommended_tools?.length ? (
              <View style={styles.toolsRow}>
                {analysis.recommended_tools.map((tool) => (
                  <Chip key={tool} label={tool} variant="outlined" color="primary" size="sm" />
                ))}
              </View>
            ) : null}
            {analysis.confidence !== undefined && (
              <Text style={[styles.resultMeta, { color: colors.textSecondary }]}>Confidence: {(analysis.confidence * 100).toFixed(0)}%</Text>
            )}
            {analysis.description ? (
              <Text style={[styles.resultDesc, { color: colors.textSecondary }]}>{analysis.description}</Text>
            ) : null}
          </Card>
        )}

        {analysis && (
          <Card variant="outlined" style={styles.reportCard}>
            <Text style={[styles.reportTitle, { color: colors.text }]}>Create Report</Text>
            <Text style={[styles.reportSubtitle, { color: colors.textSecondary }]}>Review details and submit a full report.</Text>

            <Input
              label="Lake Name"
              value={lakeName}
              onChangeText={setLakeName}
              placeholder="Enter lake name"
              autoCapitalize="words"
            />

            <View style={styles.locationBlock}>
              <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Location</Text>
              {location ? (
                <View style={styles.locationRow}>
                  <Text style={[styles.locationValue, { color: colors.text }]}>
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </Text>
                  {address ? (
                    <Text style={[styles.locationHint, { color: colors.textSecondary }]}>{address}</Text>
                  ) : null}
                  <TouchableOpacity onPress={clearLocation} style={styles.locationClear}>
                    <Text style={[styles.locationClearText, { color: colors.textSecondary }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Button
                  title={locationLoading ? 'Locating...' : 'Use Current Location'}
                  variant="outline"
                  size="sm"
                  loading={locationLoading}
                  onPress={getCurrentLocation}
                />
              )}
            </View>

            <View style={styles.reportActions}>
              <Button
                title={createdReportId ? 'Edit Report' : 'Edit Details'}
                variant="outline"
                size="md"
                onPress={handleEditDraft}
              />
              <Button
                title={createdReportId ? 'Update Report' : 'Submit Report'}
                size="md"
                loading={submitLoading || updateLoading}
                onPress={handleSubmitReport}
              />
            </View>
          </Card>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <EditReportModal
        visible={editModalVisible}
        report={draftReport}
        onClose={() => setEditModalVisible(false)}
        onSave={handleDraftSave}
        loading={updateLoading}
        title={editTitle}
        successMessage={editSuccessMessage}
        saveLabel={editSaveLabel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  helpText: { fontSize: 14, marginBottom: 12 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },
  photosSection: { marginBottom: 12 },
  addPhoto: { height: 160, borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addPhotoText: { fontSize: 14 },
  photo: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
  photoItem: { position: 'relative', marginBottom: 8 },
  removeBtn: { position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#ff4d4f', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#fff', fontWeight: '700' },
  buttonsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  button: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  buttonSecondary: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  buttonSecondaryText: { fontWeight: '700' },
  analyzeRow: { marginTop: 8, marginBottom: 16 },
  analyzeBtn: { padding: 14, alignItems: 'center', borderRadius: 12 },
  analyzeText: { color: '#fff', fontWeight: '700' },
  errorText: { fontSize: 12, marginBottom: 8 },
  resultCard: { marginTop: 4 },
  resultTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  toolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  resultMeta: { fontSize: 12, marginBottom: 6 },
  resultDesc: { fontSize: 13, marginTop: 8 },
  reportCard: { marginTop: 16 },
  reportTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  reportSubtitle: { fontSize: 12, marginBottom: 12 },
  locationBlock: { marginBottom: 16 },
  locationLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  locationRow: { gap: 4 },
  locationValue: { fontSize: 13, fontWeight: '600' },
  locationHint: { fontSize: 12 },
  locationClear: { alignSelf: 'flex-start', marginTop: 6 },
  locationClearText: { fontSize: 12, fontWeight: '600' },
  reportActions: { flexDirection: 'row', gap: 12 },
});
