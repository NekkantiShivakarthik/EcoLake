import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { EcoColors } from '@/constants/colors';
import { Lake } from '@/types/database';
import { Card } from './card';

interface LakeCardProps {
  lake: Lake;
  reportsCount?: number;
  onPress?: () => void;
}

export function LakeCard({ lake, reportsCount = 0, onPress }: LakeCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  
  return (
    <Wrapper onPress={onPress} activeOpacity={0.9}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={lake.photo_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'}
            style={styles.image}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageOverlay}
          />
          {reportsCount > 0 && (
            <View style={styles.reportsBadge}>
              <Ionicons name="document-text" size={10} color={EcoColors.white} />
              <Text style={styles.reportsText}>{reportsCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{lake.name}</Text>
          {lake.region && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={EcoColors.primary} />
              <Text style={styles.region} numberOfLines={1}>{lake.region}</Text>
            </View>
          )}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: EcoColors.success }]} />
            <Text style={styles.statusText}>Active monitoring</Text>
          </View>
        </View>
      </Card>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    marginRight: 12,
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 110,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: EcoColors.gray200,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  reportsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reportsText: {
    fontSize: 11,
    color: EcoColors.white,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: EcoColors.gray800,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  region: {
    fontSize: 12,
    color: EcoColors.gray500,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    color: EcoColors.gray400,
  },
});
