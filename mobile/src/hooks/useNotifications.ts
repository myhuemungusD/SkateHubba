/**
 * useNotifications Hook
 * Manages push notification setup, permissions, and state
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  configureNotificationHandler,
  registerFCMToken,
  refreshFCMToken,
  removeFCMToken,
  getNotificationPreferences,
  saveNotificationPreferences,
} from '@/services/notifications/fcmService';
import {
  setupNotificationListeners,
  getLastNotificationResponse,
  getUnreadNotificationCount,
  getNotificationHistory,
  markAllNotificationsRead,
  navigateToNotification,
} from '@/services/notifications/notificationHandler';
import {
  NotificationPreferences,
  ReceivedNotification,
  NotificationData,
} from '@/services/notifications/types';
import { useAuth } from './useAuth';

export interface UseNotificationsState {
  isInitialized: boolean;
  hasPermission: boolean;
  unreadCount: number;
  preferences: NotificationPreferences | null;
  history: ReceivedNotification[];
}

export interface UseNotificationsActions {
  requestPermissions: () => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  clearToken: () => Promise<void>;
}

export type UseNotificationsReturn = UseNotificationsState & UseNotificationsActions;

/**
 * Hook to manage push notifications
 */
export function useNotifications(): UseNotificationsReturn {
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [history, setHistory] = useState<ReceivedNotification[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize notifications
  useEffect(() => {
    async function init() {
      // Configure notification handler
      configureNotificationHandler();

      // Load preferences
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);

      // Load history and unread count
      const notifHistory = await getNotificationHistory();
      setHistory(notifHistory);
      setUnreadCount(notifHistory.filter((n) => !n.read).length);

      // Set up listeners
      cleanupRef.current = setupNotificationListeners();

      // Handle notification that launched the app
      const lastResponse = await getLastNotificationResponse();
      if (lastResponse) {
        // Small delay to ensure navigation is ready
        setTimeout(() => navigateToNotification(lastResponse), 500);
      }

      setIsInitialized(true);
    }

    init();

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  // Register token when user authenticates
  useEffect(() => {
    async function registerToken() {
      if (isAuthenticated && user) {
        const success = await registerFCMToken();
        setHasPermission(success);
      }
    }

    registerToken();
  }, [isAuthenticated, user]);

  // Refresh token when app comes to foreground
  useEffect(() => {
    function handleAppStateChange(nextAppState: AppStateStatus) {
      if (nextAppState === 'active' && isAuthenticated) {
        refreshFCMToken();
        // Also refresh unread count
        getUnreadNotificationCount().then(setUnreadCount);
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated]);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    const success = await registerFCMToken();
    setHasPermission(success);
    return success;
  }, [isAuthenticated]);

  // Update preferences
  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>): Promise<void> => {
      await saveNotificationPreferences(prefs);
      const updated = await getNotificationPreferences();
      setPreferences(updated);
    },
    []
  );

  // Mark all as read
  const markAllRead = useCallback(async (): Promise<void> => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    const updated = await getNotificationHistory();
    setHistory(updated);
  }, []);

  // Refresh history
  const refreshHistory = useCallback(async (): Promise<void> => {
    const notifHistory = await getNotificationHistory();
    setHistory(notifHistory);
    setUnreadCount(notifHistory.filter((n) => !n.read).length);
  }, []);

  // Clear token (for logout)
  const clearToken = useCallback(async (): Promise<void> => {
    await removeFCMToken();
    setHasPermission(false);
  }, []);

  return {
    isInitialized,
    hasPermission,
    unreadCount,
    preferences,
    history,
    requestPermissions,
    updatePreferences,
    markAllRead,
    refreshHistory,
    clearToken,
  };
}

/**
 * Simple hook to just get unread count (for badge display)
 */
export function useUnreadNotificationCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getUnreadNotificationCount().then(setCount);

    // Refresh on app focus
    function handleAppStateChange(nextAppState: AppStateStatus) {
      if (nextAppState === 'active') {
        getUnreadNotificationCount().then(setCount);
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return count;
}
