/**
 * useOffline Hook
 * Manages offline mode with React Query persistence
 */

import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { captureMessage } from '@/lib/errorTracking';

const CACHE_KEY_PREFIX = '@skatehubba/cache/';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData<T> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * Hook to manage offline data caching
 */
export function useOfflineCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    onError?: (error: Error) => void;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
  const staleTime = options.staleTime ?? CACHE_EXPIRY_MS;

  // Load from cache
  const loadFromCache = useCallback(async (): Promise<T | null> => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed: CachedData<T> = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;

        if (age < CACHE_EXPIRY_MS) {
          setIsStale(age > staleTime);
          return parsed.data;
        }
      }
    } catch {
      // Cache read failed, continue to fetch
    }
    return null;
  }, [cacheKey, staleTime]);

  // Save to cache
  const saveToCache = useCallback(
    async (newData: T) => {
      try {
        const cacheEntry: CachedData<T> = {
          data: newData,
          timestamp: Date.now(),
          key,
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch {
        // Cache write failed, ignore
      }
    },
    [cacheKey, key]
  );

  // Fetch fresh data
  const fetchData = useCallback(async () => {
    if (options.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to load from cache first
      const cachedData = await loadFromCache();
      if (cachedData) {
        setData(cachedData);
        setIsLoading(false);
      }

      // Check if online
      const netState = await NetInfo.fetch();
      setIsOffline(!netState.isConnected);

      if (!netState.isConnected) {
        if (!cachedData) {
          setError(new Error('Offline and no cached data available'));
        }
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetchFn();
      setData(freshData);
      setIsStale(false);
      await saveToCache(freshData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);

      // If fetch failed but we have cache, use it
      const cachedData = await loadFromCache();
      if (cachedData && !data) {
        setData(cachedData);
        setIsStale(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, loadFromCache, saveToCache, options, data]);

  // Refetch function
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = isOffline;
      setIsOffline(!state.isConnected);

      // Refetch when coming back online
      if (wasOffline && state.isConnected) {
        captureMessage('Back online, refetching data', { key });
        refetch();
      }
    });

    return () => unsubscribe();
  }, [isOffline, refetch, key]);

  return {
    data,
    isLoading,
    isStale,
    error,
    isOffline,
    refetch,
  };
}

/**
 * Clear all cached data
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      captureMessage('Offline cache cleared', { count: cacheKeys.length });
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  itemCount: number;
  totalSize: number;
  oldestItem: number | null;
}> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));

    let totalSize = 0;
    let oldestItem: number | null = null;

    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
        const parsed = JSON.parse(value) as CachedData<unknown>;
        if (oldestItem === null || parsed.timestamp < oldestItem) {
          oldestItem = parsed.timestamp;
        }
      }
    }

    return {
      itemCount: cacheKeys.length,
      totalSize,
      oldestItem,
    };
  } catch {
    return { itemCount: 0, totalSize: 0, oldestItem: null };
  }
}
