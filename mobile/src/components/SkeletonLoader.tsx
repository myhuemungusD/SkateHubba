/**
 * Skeleton Loader Components
 * Loading placeholders for various content types
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { SKATE } from '@/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base animated skeleton component
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = SKATE.borderRadius.sm,
  style,
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton for list items (e.g., challenges, users)
 */
export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for card grid items
 */
export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <Skeleton width="70%" height={18} style={{ marginTop: 12 }} />
      <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
    </View>
  );
}

/**
 * Skeleton for user profile header
 */
export function ProfileHeaderSkeleton() {
  return (
    <View style={styles.profileHeader}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <Skeleton width={150} height={24} />
        <Skeleton width={200} height={14} style={{ marginTop: 8 }} />
        <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for stats row
 */
export function StatsSkeleton() {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Skeleton width={40} height={24} />
        <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width={40} height={24} />
        <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width={40} height={24} />
        <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for video player
 */
export function VideoSkeleton() {
  return (
    <View style={styles.videoContainer}>
      <Skeleton
        width="100%"
        height={200}
        borderRadius={SKATE.borderRadius.md}
      />
      <View style={styles.videoControls}>
        <Skeleton width={80} height={12} />
        <Skeleton width={40} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

/**
 * Skeleton for map marker list
 */
export function MapMarkerSkeleton() {
  return (
    <View style={styles.mapMarker}>
      <Skeleton width={12} height={12} borderRadius={6} />
      <Skeleton width={100} height={14} style={{ marginLeft: 8 }} />
    </View>
  );
}

/**
 * Generate multiple skeleton items
 */
export function SkeletonList({
  count = 3,
  ItemComponent = ListItemSkeleton,
}: {
  count?: number;
  ItemComponent?: React.ComponentType;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ItemComponent key={index} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: SKATE.colors.grime,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SKATE.spacing.md,
    backgroundColor: SKATE.colors.grime,
    borderRadius: SKATE.borderRadius.md,
    marginBottom: SKATE.spacing.sm,
  },
  listItemContent: {
    flex: 1,
    marginLeft: SKATE.spacing.md,
  },
  card: {
    width: '47%',
    backgroundColor: SKATE.colors.grime,
    borderRadius: SKATE.borderRadius.md,
    padding: SKATE.spacing.lg,
    alignItems: 'center',
    marginBottom: SKATE.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SKATE.spacing.lg,
  },
  profileInfo: {
    marginLeft: SKATE.spacing.lg,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SKATE.spacing.lg,
    backgroundColor: SKATE.colors.grime,
    borderRadius: SKATE.borderRadius.md,
    marginTop: SKATE.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  videoContainer: {
    marginBottom: SKATE.spacing.md,
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SKATE.spacing.sm,
  },
  mapMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SKATE.spacing.sm,
  },
});
