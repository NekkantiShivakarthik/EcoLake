import { CategoryIcons, EcoColors, getSeverityColor } from '@/constants/colors';
import { Lake, Report, User } from '@/types/database';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from './card';
import { StatusChip } from './chip';

interface ReportCardProps {
  report: Report & { lake?: Lake | null; user?: User | null };
  onPress?: () => void;
}

export function ReportCard({ report, onPress }: ReportCardProps) {
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
          <View style={styles.photoContainer}>
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
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
              <Text style={styles.categoryText}>{report.category || 'Other'}</Text>
            </View>
            <StatusChip status={report.status || 'submitted'} size="sm" />
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {report.description || 'No description provided'}
          </Text>

          {(report.lake || report.lake_name) && (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{report.lake?.name || report.lake_name}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.severityContainer}>
              <Text style={styles.severityLabel}>Severity</Text>
              <View style={styles.severityBar}>
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
            <Text style={styles.dateText}>{formatDate(report.created_at)}</Text>
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
    backgroundColor: EcoColors.gray200,
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
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.gray100,
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
    color: EcoColors.gray700,
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
    color: EcoColors.gray800,
    lineHeight: 22,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: EcoColors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 13,
    color: EcoColors.gray600,
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
    color: EcoColors.gray500,
    marginBottom: 4,
    fontWeight: '500',
  },
  severityBar: {
    height: 6,
    backgroundColor: EcoColors.gray200,
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
    color: EcoColors.gray400,
    fontWeight: '500',
  },
});
