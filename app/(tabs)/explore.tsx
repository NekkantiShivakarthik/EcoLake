import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardSkeleton, EmptyState } from '@/components/ui';
import { ReportCard } from '@/components/ui/report-card';
import { EcoColors } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';
import { useReports } from '@/hooks/use-supabase';

type FilterType = 'all' | 'submitted' | 'verified' | 'assigned' | 'in_progress' | 'cleaned';

const filters: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'submitted', label: 'Submitted', icon: 'document-text' },
  { key: 'verified', label: 'Verified', icon: 'checkmark-circle' },
  { key: 'assigned', label: 'Assigned', icon: 'person' },
  { key: 'in_progress', label: 'In Progress', icon: 'hourglass' },
  { key: 'cleaned', label: 'Cleaned', icon: 'sparkles' },
];

export default function ExploreScreen() {
  const { reports, loading, error, refetch } = useReports();
  const { actualTheme, setTheme } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[EcoColors.primary, EcoColors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Explore Reports</Text>
              <Text style={styles.subtitle}>{reports.length} pollution reports in your area</Text>
            </View>
            <TouchableOpacity
              style={styles.themeToggle}
              onPress={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
            >
              <Ionicons
                name={actualTheme === 'dark' ? 'sunny' : 'moon'}
                size={22}
                color={EcoColors.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={EcoColors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by lake, category, or description..."
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
              <Ionicons
                name={item.icon as any}
                size={16}
                color={activeFilter === item.key ? EcoColors.white : EcoColors.gray600}
              />
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
          {filteredReports.length} {filteredReports.length === 1 ? 'result' : 'results'}
        </Text>
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
            <Animated.View
              style={{
                opacity: 1,
                transform: [{ translateY: 0 }],
              }}
            >
              <ReportCard report={item} />
            </Animated.View>
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
              title={`No Reports Found (${reports.length} total)`}
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: EcoColors.white,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
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
    borderWidth: 1.5,
    borderColor: EcoColors.gray200,
    marginRight: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: EcoColors.primary,
    borderColor: EcoColors.primary,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 13,
    color: EcoColors.gray500,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingTop: 8,
  },
  reportsList: {
    paddingBottom: 100,
  },
});
