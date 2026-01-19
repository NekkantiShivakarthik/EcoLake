import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardSkeleton, EditReportModal, EmptyState } from '@/components/ui';
import { EnhancedReportCard } from '@/components/ui/enhanced-report-card';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useDeleteReport, useReports, useUpdateReport } from '@/hooks/use-supabase';
import { Report } from '@/types/database';

type FilterType = 'all' | 'submitted' | 'verified' | 'assigned' | 'in_progress' | 'cleaned';

const filters: { key: FilterType; label: string; icon: string; emoji: string }[] = [
  { key: 'all', label: 'All', icon: 'apps', emoji: '📋' },
  { key: 'submitted', label: 'New', icon: 'document-text', emoji: '📝' },
  { key: 'verified', label: 'Verified', icon: 'checkmark-circle', emoji: '✅' },
  { key: 'assigned', label: 'Assigned', icon: 'person', emoji: '👤' },
  { key: 'in_progress', label: 'Active', icon: 'hourglass', emoji: '🔄' },
  { key: 'cleaned', label: 'Done', icon: 'sparkles', emoji: '✨' },
];

export default function ExploreScreen() {
  const { user: authUser } = useAuth();
  const { reports, loading, error, refetch } = useReports();
  const { actualTheme, setTheme, colors } = useTheme();
  const { updateReport } = useUpdateReport();
  const { deleteReport } = useDeleteReport();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEditReport = (report: Report) => {
    setSelectedReport(report);
    setEditModalVisible(true);
  };

  const handleSaveReport = async (data: { category: string; severity: number; description: string }) => {
    if (!selectedReport) return { success: false, error: 'No report selected' };
    
    const result = await updateReport(selectedReport.id, data);
    if (result.success) {
      await refetch();
    }
    return result;
  };

  const handleDeleteReport = async (reportId: string) => {
    const result = await deleteReport(reportId);
    if (result.success) {
      Alert.alert('Success', 'Report deleted successfully');
      await refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to delete report');
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesFilter = activeFilter === 'all' || report.status === activeFilter;
    const matchesSearch =
      searchQuery === '' ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.lake_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.lake?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#0E7490', '#0891B2', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Background decorations */}
        <View style={styles.headerDecoration1} />
        <View style={styles.headerDecoration2} />
        
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Explore Reports 🔍</Text>
              <Text style={styles.subtitle}>{reports.length} pollution reports in your area</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.viewModeToggle}
                onPress={() => setViewMode(viewMode === 'list' ? 'compact' : 'list')}
              >
                <Ionicons
                  name={viewMode === 'list' ? 'grid' : 'list'}
                  size={20}
                  color={EcoColors.white}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.themeToggle}
                onPress={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
              >
                <Ionicons
                  name={actualTheme === 'dark' ? 'sunny' : 'moon'}
                  size={20}
                  color={EcoColors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={EcoColors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lakes, categories..."
            placeholderTextColor={EcoColors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={EcoColors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text style={styles.filterEmoji}>{item.emoji}</Text>
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredReports.length} {filteredReports.length === 1 ? 'report found' : 'reports found'}
        </Text>
        {activeFilter !== 'all' && (
          <TouchableOpacity onPress={() => setActiveFilter('all')} style={styles.clearFilter}>
            <Text style={styles.clearFilterText}>Clear filter</Text>
            <Ionicons name="close" size={14} color={EcoColors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Reports List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Error Loading Reports"
          description={error}
        />
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <EnhancedReportCard
              report={item}
              index={index}
              variant={viewMode === 'compact' ? 'compact' : 'default'}
              isOwner={item.user?.id === authUser?.id}
              onEdit={() => handleEditReport(item)}
              onDelete={() => handleDeleteReport(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.reportsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={EcoColors.primary}
              colors={[EcoColors.primary]}
            />
          }
          ListEmptyComponent={() => (
            <EmptyState
              icon="🔍"
              title={`No Reports Found`}
              description={
                error
                  ? error
                  : searchQuery
                  ? 'Try adjusting your search or filter criteria'
                  : activeFilter === 'all'
                  ? 'Be the first to report pollution!'
                  : `No reports with status: ${activeFilter}`
              }
            />
          )}
        />
      )}

      {/* Edit Report Modal */}
      <EditReportModal
        visible={editModalVisible}
        report={selectedReport}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedReport(null);
        }}
        onSave={handleSaveReport}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.gray50,
  },
  headerGradient: {
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerDecoration1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerDecoration2: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  viewModeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: EcoColors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.white,
    marginHorizontal: 20,
    borderRadius: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 52,
    fontSize: 15,
    color: EcoColors.gray800,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: EcoColors.white,
    borderWidth: 2,
    borderColor: EcoColors.gray100,
    marginRight: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  filterChipActive: {
    backgroundColor: EcoColors.primary,
    borderColor: EcoColors.primary,
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: EcoColors.gray600,
  },
  filterChipTextActive: {
    color: EcoColors.white,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: EcoColors.gray500,
    fontWeight: '600',
  },
  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: EcoColors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFilterText: {
    fontSize: 12,
    color: EcoColors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingTop: 8,
  },
  reportsList: {
    paddingBottom: 100,
  },
});
