import { CategoryIcons, EcoColors, getSeverityColor } from '@/constants/colors';
import { useTheme } from '@/contexts/theme-context';
import { Lake, Report, User } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from './card';
import { StatusChip } from './chip';

interface ReportCardProps {
  report: Report & { lake?: Lake | null; user?: User | null };
  onPress?: () => void;
  onDelete?: (reportId: string) => void;
  showDelete?: boolean;
}

export function ReportCard({ report, onPress, onDelete, showDelete = true }: ReportCardProps) {
  const { colors } = useTheme();
  const severityColor = getSeverityColor(report.severity || 1);
  const categoryIcon = CategoryIcons[report.category || 'other'];
  const hasPhotos = report.photos && report.photos.length > 0;

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" style={styles.card}>
        {/* Photo Preview */}
        {hasPhotos && (
          <View style={[styles.photoContainer, { backgroundColor: colors.surface }]}>
            <Image
              source={{ uri: report.photos![0] }}
              style={styles.photo}
              contentFit="cover"
            />
            {report.photos!.length > 1 && (
              <View style={styles.photoCount}>
                <Text style={styles.photoCountText}>+{report.photos!.length - 1}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.surface }]}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
              <Text style={[styles.categoryText, { color: colors.textSecondary }]}>{report.category || 'Other'}</Text>
            </View>
            <View style={styles.headerRight}>
              <StatusChip status={report.status || 'submitted'} size="sm" />
              {showDelete && onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert(
                      'Delete Report',
                      'Are you sure you want to delete this report? This action cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => onDelete(report.id),
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={EcoColors.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
            {report.description || 'No description provided'}
          </Text>

          {(report.lake || report.lake_name) && (
            <View style={[styles.locationRow, { backgroundColor: colors.surface }]}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>{report.lake?.name || report.lake_name}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.severityContainer}>
              <Text style={[styles.severityLabel, { color: colors.textTertiary }]}>Severity</Text>
              <View style={[styles.severityBar, { backgroundColor: colors.surface }]}>
                <View
                  style={[
                    styles.severityFill,
                    {
                      width: `${((report.severity || 1) / 5) * 100}%`,
                      backgroundColor: severityColor,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.dateText, { color: colors.textTertiary }]}>{formatDate(report.created_at)}</Text>
          </View>
        </View>
      </Card>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 0,
    overflow: 'hidden',
  },
  photoContainer: {
    position: 'relative',
    height: 160,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCountText: {
    color: EcoColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: EcoColors.white,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityContainer: {
    flex: 1,
    marginRight: 16,
  },
  severityLabel: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '500',
  },
  severityBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  severityFill: {
    height: '100%',
    borderRadius: 3,
  },
  severityDots: {
    flexDirection: 'row',
    gap: 4,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
