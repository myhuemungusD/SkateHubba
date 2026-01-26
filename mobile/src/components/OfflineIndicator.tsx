/**
 * Offline Indicator Component
 * Shows network status and offline mode banner
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { SKATE } from '@/theme';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
}

export function OfflineIndicator({ showWhenOnline = false }: OfflineIndicatorProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);

      // Animate in/out
      Animated.spring(animatedValue, {
        toValue: !state.isConnected || state.isInternetReachable === false ? 1 : 0,
        useNativeDriver: true,
      }).start();
    });

    return () => unsubscribe();
  }, [animatedValue]);

  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline && !showWhenOnline) {
    return null;
  }

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        isOffline ? styles.offline : styles.online,
        { transform: [{ translateY }] },
      ]}
    >
      <Ionicons
        name={isOffline ? 'cloud-offline' : 'cloud-done'}
        size={16}
        color={SKATE.colors.white}
      />
      <Text style={styles.text}>
        {isOffline
          ? 'You are offline. Some features may be limited.'
          : 'Back online'}
      </Text>
    </Animated.View>
  );
}

/**
 * Hook to check network status
 */
export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<{
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string | null;
  }>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return {
    ...networkState,
    isOffline: !networkState.isConnected || networkState.isInternetReachable === false,
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SKATE.spacing.sm,
    paddingHorizontal: SKATE.spacing.md,
    gap: SKATE.spacing.sm,
  },
  offline: {
    backgroundColor: SKATE.colors.blood,
  },
  online: {
    backgroundColor: SKATE.colors.neon,
  },
  text: {
    color: SKATE.colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
});
