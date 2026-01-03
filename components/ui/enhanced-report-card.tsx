import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

import { CategoryIcons, EcoColors, getSeverityColor } from '@/constants/colors';
import { Lake, Report, User } from '@/types/database';
import { Card } from './card';
import { StatusChip } from './chip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EnhancedReportCardProps {
  report: Report & { lake?: Lake | null; user?: User | null };
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
}

export function EnhancedReportCard({ 
  report, 
  onPress, 
  onEdit,
  onDelete,
  isOwner = false,
  variant = 'default',
  index = 0,
}: EnhancedReportCardProps) {
  const severityColor = getSeverityColor(report.severity || 1);
  const categoryIcon = CategoryIcons[report.category || 'other'];
  const hasPhotos = report.photos && report.photos.length > 0;
  const [showActions, setShowActions] = useState(false);
  
  const scale = useSharedValue(1);

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeDate = (date: string | null) => {
    if (!date) return '';
    const now = new Date();
    const reportDate = new Date(date);
    const diffMs = now.getTime() - reportDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const handleLongPress = () => {
    if (isOwner) {
      setShowActions(true);
    }
  };

  const handleEdit = () => {
    setShowActions(false);
    onEdit?.();
  };

  const handleDelete = () => {
    setShowActions(false);
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete?.()
        },
      ]
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 1: return 'Minor';
      case 2: return 'Low';
      case 3: return 'Moderate';
      case 4: return 'High';
      case 5: return 'Critical';
      default: return 'Unknown';
    }
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  if (variant === 'compact') {
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <CardWrapper 
          onPress={onPress} 
          onLongPress={handleLongPress}
          activeOpacity={0.8}
        >
          <Card variant="elevated" style={styles.compactCard}>
            <View style={styles.compactContent}>
              {/* Thumbnail */}
              {hasPhotos ? (
                <Image
                  source={{ uri: report.photos![0] }}
                  style={styles.compactPhoto}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.compactPhoto, styles.compactPhotoPlaceholder]}>
                  <Text style={styles.compactPhotoIcon}>{categoryIcon}</Text>
                </View>
              )}

              {/* Info */}
              <View style={styles.compactInfo}>
                <View style={styles.compactHeader}>
                  <Text style={styles.compactCategory}>{categoryIcon} {report.category}</Text>
                  <StatusChip status={report.status || 'submitted'} size="sm" />
                </View>
                <Text style={styles.compactDescription} numberOfLines={1}>
                  {report.description || 'No description'}
                </Text>
                <View style={styles.compactFooter}>
                  <Text style={styles.compactLocation}>
                    📍 {report.lake?.name || report.lake_name || 'Unknown'}
                  </Text>
                  <Text style={styles.compactDate}>{formatRelativeDate(report.created_at)}</Text>
                </View>
              </View>

              {/* Owner Actions */}
              {isOwner && (
                <TouchableOpacity 
                  style={styles.compactActions}
                  onPress={() => setShowActions(!showActions)}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color={EcoColors.gray400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Severity Indicator */}
            <View style={[styles.compactSeverityBar, { backgroundColor: severityColor }]} />
          </Card>
        </CardWrapper>

        {/* Action Menu */}
        {showActions && isOwner && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.actionMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={handleEdit}>
              <Ionicons name="pencil" size={18} color={EcoColors.primary} />
              <Text style={styles.actionText}>Edit Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name="trash" size={18} color={EcoColors.error} />
              <Text style={[styles.actionText, { color: EcoColors.error }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionItem, styles.actionCancel]} 
              onPress={() => setShowActions(false)}
            >
              <Text style={styles.actionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    );
  }

  if (variant === 'featured') {
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).springify()}
        style={[animatedStyle, styles.featuredContainer]}
      >
        <CardWrapper 
          onPress={onPress}
          onLongPress={handleLongPress}
          activeOpacity={0.9}
        >
          <Card variant="elevated" style={styles.featuredCard}>
            {/* Full-width Photo */}
            {hasPhotos ? (
              <View style={styles.featuredPhotoContainer}>
                <Image
                  source={{ uri: report.photos![0] }}
                  style={styles.featuredPhoto}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.featuredGradient}
                />
                
                {/* Photo Count Badge */}
                {report.photos!.length > 1 && (
                  <View style={styles.featuredPhotoCount}>
                    <Ionicons name="images" size={12} color={EcoColors.white} />
                    <Text style={styles.featuredPhotoCountText}>{report.photos!.length}</Text>
                  </View>
                )}

                {/* Category Badge on Image */}
                <View style={styles.featuredCategoryBadge}>
                  <LinearGradient
                    colors={[EcoColors.primary, EcoColors.primaryDark]}
                    style={styles.featuredCategoryGradient}
                  >
                    <Text style={styles.featuredCategoryIcon}>{categoryIcon}</Text>
                    <Text style={styles.featuredCategoryText}>{report.category}</Text>
                  </LinearGradient>
                </View>

                {/* Status on Image */}
                <View style={styles.featuredStatus}>
                  <StatusChip status={report.status || 'submitted'} size="sm" />
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={[severityColor, EcoColors.gray200]}
                style={styles.featuredNoPhoto}
              >
                <Text style={styles.featuredNoPhotoIcon}>{categoryIcon}</Text>
                <View style={styles.featuredCategoryBadge}>
                  <View style={[styles.featuredCategoryGradient, { backgroundColor: EcoColors.white }]}>
                    <Text style={styles.featuredCategoryIcon}>{categoryIcon}</Text>
                    <Text style={[styles.featuredCategoryText, { color: EcoColors.gray800 }]}>{report.category}</Text>
                  </View>
                </View>
                <View style={styles.featuredStatus}>
                  <StatusChip status={report.status || 'submitted'} size="sm" />
                </View>
              </LinearGradient>
            )}

            {/* Content */}
            <View style={styles.featuredContent}>
              <Text style={styles.featuredDescription} numberOfLines={2}>
                {report.description || 'No description provided'}
              </Text>

              {/* Location Row */}
              <View style={styles.featuredLocationRow}>
                <View style={styles.featuredLocationBadge}>
                  <Text style={styles.featuredLocationIcon}>📍</Text>
                  <Text style={styles.featuredLocationText}>
                    {report.lake?.name || report.lake_name || 'Unknown Lake'}
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.featuredFooter}>
                {/* Severity */}
                <View style={styles.featuredSeverity}>
                  <Text style={styles.featuredSeverityLabel}>Severity</Text>
                  <View style={styles.featuredSeverityPills}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.severityPill,
                          {
                            backgroundColor: level <= (report.severity || 1) 
                              ? getSeverityColor(level) 
                              : EcoColors.gray200,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.severityText, { color: severityColor }]}>
                    {getSeverityLabel(report.severity || 1)}
                  </Text>
                </View>

                {/* Date & Actions */}
                <View style={styles.featuredDateActions}>
                  <Text style={styles.featuredDate}>{formatRelativeDate(report.created_at)}</Text>
                  {isOwner && (
                    <TouchableOpacity 
                      style={styles.featuredEditBtn}
                      onPress={() => setShowActions(!showActions)}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color={EcoColors.gray500} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Card>
        </CardWrapper>

        {/* Action Menu */}
        {showActions && isOwner && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.actionMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={handleEdit}>
              <Ionicons name="pencil" size={18} color={EcoColors.primary} />
              <Text style={styles.actionText}>Edit Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name="trash" size={18} color={EcoColors.error} />
              <Text style={[styles.actionText, { color: EcoColors.error }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionItem, styles.actionCancel]} 
              onPress={() => setShowActions(false)}
            >
              <Text style={styles.actionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    );
  }

  // Default variant
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <CardWrapper 
        onPress={onPress}
        onLongPress={handleLongPress}
        activeOpacity={0.85}
      >
        <Card variant="elevated" style={styles.card}>
          {/* Photo Preview */}
          {hasPhotos && (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: report.photos![0] }}
                style={styles.photo}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)']}
                style={styles.photoGradient}
              />
              {report.photos!.length > 1 && (
                <View style={styles.photoCount}>
                  <Ionicons name="images" size={12} color={EcoColors.white} />
                  <Text style={styles.photoCountText}>{report.photos!.length}</Text>
                </View>
              )}
              
              {/* Floating Category Badge */}
              <View style={styles.floatingCategory}>
                <Text style={styles.floatingCategoryIcon}>{categoryIcon}</Text>
              </View>
            </View>
          )}

          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryIcon}>{categoryIcon}</Text>
                <Text style={styles.categoryText}>{report.category || 'Other'}</Text>
              </View>
              <View style={styles.headerRight}>
                <StatusChip status={report.status || 'submitted'} size="sm" />
                {isOwner && (
                  <TouchableOpacity 
                    style={styles.moreBtn}
                    onPress={() => setShowActions(!showActions)}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color={EcoColors.gray400} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
              {report.description || 'No description provided'}
            </Text>

            {/* Location */}
            {(report.lake || report.lake_name) && (
              <View style={styles.locationRow}>
                <LinearGradient
                  colors={[EcoColors.primary + '15', EcoColors.primaryLight + '10']}
                  style={styles.locationBadge}
                >
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{report.lake?.name || report.lake_name}</Text>
                </LinearGradient>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              {/* Severity Indicator */}
              <View style={styles.severityContainer}>
                <Text style={styles.severityLabel}>Severity</Text>
                <View style={styles.severityVisual}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.severityDot,
                        {
                          backgroundColor: level <= (report.severity || 1) 
                            ? getSeverityColor(level) 
                            : EcoColors.gray200,
                          width: level <= (report.severity || 1) ? 10 : 8,
                          height: level <= (report.severity || 1) ? 10 : 8,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.dateText}>{formatRelativeDate(report.created_at)}</Text>
            </View>
          </View>
        </Card>
      </CardWrapper>

      {/* Action Menu */}
      {showActions && isOwner && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.actionMenu}>
          <TouchableOpacity style={styles.actionItem} onPress={handleEdit}>
            <Ionicons name="pencil" size={18} color={EcoColors.primary} />
            <Text style={styles.actionText}>Edit Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
            <Ionicons name="trash" size={18} color={EcoColors.error} />
            <Text style={[styles.actionText, { color: EcoColors.error }]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionItem, styles.actionCancel]} 
            onPress={() => setShowActions(false)}
          >
            <Text style={styles.actionCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Default Card Styles
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 20,
  },
  photoContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: EcoColors.gray200,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  photoCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  photoCountText: {
    color: EcoColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  floatingCategory: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: EcoColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: EcoColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingCategoryIcon: {
    fontSize: 22,
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
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: EcoColors.gray700,
    textTransform: 'capitalize',
  },
  moreBtn: {
    padding: 4,
  },
  description: {
    fontSize: 15,
    color: EcoColors.gray800,
    lineHeight: 22,
    marginBottom: 12,
  },
  locationRow: {
    marginBottom: 14,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 14,
    color: EcoColors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityLabel: {
    fontSize: 12,
    color: EcoColors.gray500,
    fontWeight: '500',
  },
  severityVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  severityDot: {
    borderRadius: 6,
  },
  dateText: {
    fontSize: 12,
    color: EcoColors.gray400,
    fontWeight: '500',
  },

  // Compact Card Styles
  compactCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  compactPhoto: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  compactPhotoPlaceholder: {
    backgroundColor: EcoColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactPhotoIcon: {
    fontSize: 28,
  },
  compactInfo: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: EcoColors.gray700,
    textTransform: 'capitalize',
  },
  compactDescription: {
    fontSize: 14,
    color: EcoColors.gray600,
    marginBottom: 6,
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLocation: {
    fontSize: 12,
    color: EcoColors.gray500,
  },
  compactDate: {
    fontSize: 11,
    color: EcoColors.gray400,
  },
  compactActions: {
    padding: 8,
  },
  compactSeverityBar: {
    height: 3,
    width: '100%',
  },

  // Featured Card Styles
  featuredContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  featuredCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 24,
  },
  featuredPhotoContainer: {
    position: 'relative',
    height: 220,
    backgroundColor: EcoColors.gray200,
  },
  featuredPhoto: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  featuredNoPhoto: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredNoPhotoIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  featuredPhotoCount: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  featuredPhotoCountText: {
    color: EcoColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  featuredCategoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  featuredCategoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  featuredCategoryIcon: {
    fontSize: 16,
  },
  featuredCategoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: EcoColors.white,
    textTransform: 'capitalize',
  },
  featuredStatus: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  featuredContent: {
    padding: 20,
  },
  featuredDescription: {
    fontSize: 16,
    color: EcoColors.gray800,
    lineHeight: 24,
    marginBottom: 14,
    fontWeight: '500',
  },
  featuredLocationRow: {
    marginBottom: 16,
  },
  featuredLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.gray50,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    alignSelf: 'flex-start',
  },
  featuredLocationIcon: {
    fontSize: 16,
  },
  featuredLocationText: {
    fontSize: 14,
    color: EcoColors.gray700,
    fontWeight: '600',
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredSeverity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featuredSeverityLabel: {
    fontSize: 13,
    color: EcoColors.gray500,
    fontWeight: '500',
  },
  featuredSeverityPills: {
    flexDirection: 'row',
    gap: 4,
  },
  severityPill: {
    width: 20,
    height: 8,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredDateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featuredDate: {
    fontSize: 13,
    color: EcoColors.gray400,
    fontWeight: '500',
  },
  featuredEditBtn: {
    padding: 6,
    backgroundColor: EcoColors.gray100,
    borderRadius: 8,
  },

  // Action Menu Styles
  actionMenu: {
    position: 'absolute',
    top: '100%',
    right: 16,
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    shadowColor: EcoColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    marginTop: -40,
    minWidth: 180,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray100,
  },
  actionText: {
    fontSize: 15,
    color: EcoColors.gray700,
    fontWeight: '500',
  },
  actionCancel: {
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  actionCancelText: {
    fontSize: 15,
    color: EcoColors.gray500,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
});
