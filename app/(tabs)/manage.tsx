import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { EcoColors } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/lib/supabase';

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
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
}

export default function ManageScreen() {
  const { user } = useAuth();
  const { actualTheme, setTheme } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'verified' | 'assigned' | 'in_progress'>('all');

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Fetch reports
      let reportsQuery = supabase
        .from('reports')
        .select(`
          *,
          user:users!reports_user_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        reportsQuery = reportsQuery.eq('status', filter);
      } else {
        reportsQuery = reportsQuery.in('status', ['submitted', 'verified', 'assigned', 'in_progress']);
      }

      const { data: reportsData, error: reportsError } = await reportsQuery;
      if (reportsError) throw reportsError;

      // Fetch volunteers
      const { data: volunteersData, error: volunteersError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'cleaner')
        .order('name', { ascending: true });

      if (volunteersError) throw volunteersError;

      setReports((reportsData as any) || []);
      setVolunteers(volunteersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const assignToVolunteer = async (volunteerId: string) => {
    if (!selectedReport) return;

    try {
      const { error } = await (supabase
        .from('reports') as any)
        .update({
          assigned_cleaner_id: volunteerId,
          status: 'assigned',
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      Alert.alert('Success', 'Report assigned to volunteer successfully!');
      setShowVolunteerModal(false);
      setSelectedReport(null);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedReport) return;

    try {
      const updates: any = { status: newStatus };

      // If verifying, keep the current status or mark as verified
      if (newStatus === 'verified') {
        updates.status = 'verified';
      }

      const { error } = await (supabase
        .from('reports') as any)
        .update(updates)
        .eq('id', selectedReport.id);

      if (error) throw error;

      Alert.alert('Success', `Report status updated to ${newStatus}!`);
      setShowStatusModal(false);
      setSelectedReport(null);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: reports.length },
    { key: 'submitted', label: 'Submitted', count: reports.filter(r => r.status === 'submitted').length },
    { key: 'verified', label: 'Verified', count: reports.filter(r => r.status === 'verified').length },
    { key: 'assigned', label: 'Assigned', count: reports.filter(r => r.status === 'assigned').length },
    { key: 'in_progress', label: 'In Progress', count: reports.filter(r => r.status === 'in_progress').length },
  ];

  const statusOptions = [
    { value: 'submitted', label: 'Submitted', icon: '📝', color: EcoColors.info },
    { value: 'verified', label: 'Verified', icon: '✅', color: EcoColors.primary },
    { value: 'assigned', label: 'Assigned', icon: '👤', color: EcoColors.accent },
    { value: 'rejected', label: 'Rejected', icon: '❌', color: EcoColors.error },
  ];

  // Check if user is admin
  if (user?.role !== 'ngo_admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.noAccessText}>⚠️</Text>
          <Text style={styles.noAccessTitle}>Access Denied</Text>
          <Text style={styles.noAccessMessage}>Only NGO Admins can access this section</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[EcoColors.primary, EcoColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.titleEmoji}>🎯</Text>
            <Text style={styles.title}>Manage Reports</Text>
            <Text style={styles.subtitle}>Admin Dashboard</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}>
              <Ionicons name={actualTheme === 'dark' ? 'sunny' : 'moon'} size={22} color={EcoColors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={22} color={EcoColors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>📊</Text>
            </View>
            <Text style={styles.statValue}>{reports.length}</Text>
            <Text style={styles.statLabel}>Active Reports</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>👥</Text>
            </View>
            <Text style={styles.statValue}>{volunteers.length}</Text>
            <Text style={styles.statLabel}>Volunteers</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>🆕</Text>
            </View>
            <Text style={styles.statValue}>{reports.filter(r => r.status === 'submitted').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filterButtons.map((btn) => (
          <TouchableOpacity
            key={btn.key}
            style={[
              styles.filterButton,
              filter === btn.key && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(btn.key as typeof filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === btn.key && styles.filterButtonTextActive,
              ]}
            >
              {btn.label}
            </Text>
            <View style={[
              styles.filterBadge,
              filter === btn.key && styles.filterBadgeActive,
            ]}>
              <Text style={[
                styles.filterBadgeText,
                filter === btn.key && styles.filterBadgeTextActive,
              ]}>
                {btn.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reports List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={EcoColors.primary} />
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Reports</Text>
            <Text style={styles.emptyMessage}>No reports match the selected filter</Text>
          </View>
        ) : (
          reports.map((report) => (
            <Card key={report.id} style={styles.reportCard} variant="elevated">
              <View style={styles.reportHeader}>
                <View style={styles.reportHeaderLeft}>
                  <StatusChip status={report.status as any} />
                  <View style={styles.reportDateContainer}>
                    <Ionicons name="time-outline" size={12} color={EcoColors.gray500} />
                    <Text style={styles.reportDate}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.reportIdBadge}>
                  <Text style={styles.reportId}>#{report.id.slice(0, 8)}</Text>
                </View>
              </View>

              <View style={styles.reportContent}>
                <View style={styles.reportInfo}>
                  <View style={styles.reportLocationRow}>
                    <Ionicons name="location" size={16} color={EcoColors.primary} />
                    <Text style={styles.reportLocation}>
                      {report.lake_name || 'Unknown Location'}
                    </Text>
                  </View>
                  <View style={styles.reportMetaRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.reportCategory}>{report.category}</Text>
                    </View>
                    <View style={styles.severityBadge}>
                      <Text style={styles.severityText}>{'⭐'.repeat(report.severity)}</Text>
                    </View>
                  </View>
                  <Text style={styles.reportDescription} numberOfLines={2}>
                    {report.description}
                  </Text>
                  {report.user && (
                    <View style={styles.reportUserRow}>
                      <Ionicons name="person-circle-outline" size={14} color={EcoColors.gray500} />
                      <Text style={styles.reportUser}>
                        {report.user.name}
                      </Text>
                    </View>
                  )}
                </View>

                {report.photos && report.photos.length > 0 && (
                  <Image
                    source={{ uri: report.photos[0] }}
                    style={styles.reportThumbnail}
                  />
                )}
              </View>

              <View style={styles.reportActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.statusButton]}
                  onPress={() => {
                    setSelectedReport(report);
                    setShowStatusModal(true);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color={EcoColors.primary} />
                  <Text style={styles.statusButtonText}>Update Status</Text>
                </TouchableOpacity>

                {(report.status === 'verified' || report.status === 'submitted') && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.assignButton]}
                    onPress={() => {
                      setSelectedReport(report);
                      setShowVolunteerModal(true);
                    }}
                  >
                    <Ionicons name="person-add-outline" size={16} color={EcoColors.white} />
                    <Text style={styles.assignButtonText}>Assign</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Volunteer Selection Modal */}
      <Modal
        visible={showVolunteerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVolunteerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign to Volunteer</Text>
              <TouchableOpacity onPress={() => setShowVolunteerModal(false)}>
                <Ionicons name="close" size={24} color={EcoColors.gray600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {volunteers.length === 0 ? (
                <Text style={styles.noVolunteersText}>No volunteers available</Text>
              ) : (
                volunteers.map((volunteer) => (
                  <TouchableOpacity
                    key={volunteer.id}
                    style={styles.volunteerItem}
                    onPress={() => assignToVolunteer(volunteer.id)}
                  >
                    <View style={styles.volunteerAvatar}>
                      <Text style={styles.volunteerAvatarText}>
                        {volunteer.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.volunteerInfo}>
                      <Text style={styles.volunteerName}>{volunteer.name}</Text>
                      <Text style={styles.volunteerEmail}>{volunteer.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={EcoColors.gray400} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color={EcoColors.gray600} />
              </TouchableOpacity>
            </View>

            <View style={styles.statusOptions}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    selectedReport?.status === option.value && styles.statusOptionActive,
                  ]}
                  onPress={() => updateStatus(option.value)}
                >
                  <Text style={styles.statusOptionIcon}>{option.icon}</Text>
                  <Text style={styles.statusOptionLabel}>{option.label}</Text>
                  {selectedReport?.status === option.value && (
                    <Ionicons name="checkmark-circle" size={20} color={option.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    padding: 20,
  },
  noAccessText: {
    fontSize: 64,
    marginBottom: 16,
  },
  noAccessTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: EcoColors.gray800,
    marginBottom: 8,
  },
  noAccessMessage: {
    fontSize: 16,
    color: EcoColors.gray600,
    textAlign: 'center',
  },
  headerGradient: {
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  titleEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: EcoColors.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: EcoColors.white,
    opacity: 0.85,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: EcoColors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: EcoColors.white,
    opacity: 0.9,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterScroll: {
    maxHeight: 60,
    backgroundColor: EcoColors.white,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray200,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: EcoColors.gray100,
    gap: 8,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: EcoColors.primary,
    borderColor: EcoColors.primaryDark,
    shadowColor: EcoColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.gray700,
  },
  filterButtonTextActive: {
    color: EcoColors.white,
  },
  filterBadge: {
    backgroundColor: EcoColors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: EcoColors.white,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: EcoColors.gray700,
  },
  filterBadgeTextActive: {
    color: EcoColors.primary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: EcoColors.gray800,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: EcoColors.gray600,
    textAlign: 'center',
  },
  reportCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: EcoColors.gray200,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportDate: {
    fontSize: 12,
    color: EcoColors.gray500,
    fontWeight: '500',
  },
  reportIdBadge: {
    backgroundColor: EcoColors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportId: {
    fontSize: 11,
    color: EcoColors.gray600,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  reportContent: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reportLocation: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.gray900,
    flex: 1,
  },
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: EcoColors.primaryLight + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reportCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: EcoColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  severityBadge: {
    backgroundColor: EcoColors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
  },
  reportDescription: {
    fontSize: 14,
    color: EcoColors.gray700,
    marginBottom: 8,
  },
  reportUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportUser: {
    fontSize: 12,
    color: EcoColors.gray600,
    fontWeight: '500',
  },
  reportThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  statusButton: {
    flex: 1,
    backgroundColor: EcoColors.primaryLight + '40',
    borderWidth: 1.5,
    borderColor: EcoColors.primary,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: EcoColors.primary,
  },
  assignButton: {
    flex: 1,
    backgroundColor: EcoColors.primary,
    shadowColor: EcoColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  assignButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: EcoColors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: EcoColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: EcoColors.gray800,
  },
  modalScroll: {
    padding: 16,
  },
  noVolunteersText: {
    textAlign: 'center',
    color: EcoColors.gray600,
    padding: 20,
  },
  volunteerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: EcoColors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  volunteerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: EcoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: EcoColors.primaryLight,
  },
  volunteerAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: EcoColors.white,
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray800,
    marginBottom: 2,
  },
  volunteerEmail: {
    fontSize: 14,
    color: EcoColors.gray600,
  },
  volunteerPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  volunteerPointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: EcoColors.accent,
  },
  statusOptions: {
    padding: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: EcoColors.gray50,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  statusOptionActive: {
    backgroundColor: EcoColors.primaryLight,
    borderWidth: 2,
    borderColor: EcoColors.primary,
  },
  statusOptionIcon: {
    fontSize: 24,
  },
  statusOptionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: EcoColors.gray800,
  },
});
