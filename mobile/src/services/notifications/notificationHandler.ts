/**
 * Notification Handler
 * Handles incoming notifications and deep linking
 */

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationType,
  NotificationData,
  ReceivedNotification,
  NOTIFICATION_DEEP_LINKS,
} from './types';
import { getNotificationPreferences } from './fcmService';
import { captureError, addBreadcrumb } from '@/lib/errorTracking';

const NOTIFICATION_HISTORY_KEY = '@skatehubba/notification_history';
const MAX_NOTIFICATION_HISTORY = 50;

/**
 * Parse notification data from Expo notification
 */
function parseNotificationData(
  notification: Notifications.Notification
): NotificationData | null {
  try {
    const data = notification.request.content.data;
    if (!data || !data.type) {
      return null;
    }

    return {
      type: data.type as NotificationType,
      challengeId: data.challengeId as string | undefined,
      opponentId: data.opponentId as string | undefined,
      spotId: data.spotId as string | undefined,
      userId: data.userId as string | undefined,
      screen: data.screen as string | undefined,
      timestamp: data.timestamp as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Build deep link path from notification data
 */
function buildDeepLinkPath(data: NotificationData): string | null {
  const template = NOTIFICATION_DEEP_LINKS[data.type];
  if (!template) return null;

  let path = template;

  // Replace placeholders with actual values
  if (data.challengeId) {
    path = path.replace('[id]', data.challengeId);
  }
  if (data.userId) {
    path = path.replace('[uid]', data.userId);
  }
  if (data.spotId) {
    path = path.replace('[id]', data.spotId);
  }

  // If we still have placeholders, we can't navigate
  if (path.includes('[')) {
    return null;
  }

  return path;
}

/**
 * Navigate to screen based on notification
 */
export function navigateToNotification(data: NotificationData): void {
  addBreadcrumb({
    category: 'navigation',
    message: 'Navigating from notification',
    data: { type: data.type },
  });

  const path = buildDeepLinkPath(data);

  if (path) {
    // Use router.push for navigation
    router.push(path as never);
  } else {
    // Fallback to specific screens
    switch (data.type) {
      case 'challenge_received':
      case 'opponent_uploaded':
      case 'voting_requested':
      case 'result_posted':
        if (data.challengeId) {
          router.push(`/challenge/${data.challengeId}` as never);
        } else {
          router.push('/(tabs)/challenges' as never);
        }
        break;
      case 'new_follower':
        if (data.userId) {
          router.push(`/profile/${data.userId}` as never);
        } else {
          router.push('/(tabs)/' as never);
        }
        break;
      case 'spot_nearby':
        router.push('/(tabs)/map' as never);
        break;
      default:
        router.push('/(tabs)/' as never);
    }
  }
}

/**
 * Handle notification when app is in foreground
 */
export async function handleForegroundNotification(
  notification: Notifications.Notification
): Promise<void> {
  const data = parseNotificationData(notification);
  if (!data) return;

  // Check user preferences
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled) return;

  // Check specific preference
  const prefKey = data.type.replace(/_/g, '') as keyof typeof prefs;
  if (prefs[prefKey] === false) {
    return;
  }

  // Save to history
  await saveNotificationToHistory({
    id: notification.request.identifier,
    type: data.type,
    title: notification.request.content.title || '',
    body: notification.request.content.body || '',
    data,
    receivedAt: new Date(),
    read: false,
    tapped: false,
  });

  addBreadcrumb({
    category: 'notification',
    message: 'Foreground notification received',
    data: { type: data.type },
  });
}

/**
 * Handle notification response (user tapped)
 */
export async function handleNotificationResponse(
  response: Notifications.NotificationResponse
): Promise<void> {
  const data = parseNotificationData(response.notification);
  if (!data) return;

  addBreadcrumb({
    category: 'notification',
    message: 'Notification tapped',
    data: { type: data.type },
  });

  // Mark as tapped in history
  await markNotificationTapped(response.notification.request.identifier);

  // Navigate to appropriate screen
  navigateToNotification(data);
}

/**
 * Save notification to local history
 */
async function saveNotificationToHistory(
  notification: ReceivedNotification
): Promise<void> {
  try {
    const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    const history: ReceivedNotification[] = historyJson ? JSON.parse(historyJson) : [];

    // Add new notification at the beginning
    history.unshift(notification);

    // Keep only recent notifications
    const trimmed = history.slice(0, MAX_NOTIFICATION_HISTORY);

    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      context: 'saveNotificationToHistory',
    });
  }
}

/**
 * Mark notification as tapped
 */
async function markNotificationTapped(notificationId: string): Promise<void> {
  try {
    const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    if (!historyJson) return;

    const history: ReceivedNotification[] = JSON.parse(historyJson);
    const updated = history.map((n) =>
      n.id === notificationId ? { ...n, tapped: true, read: true } : n
    );

    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Silent fail
  }
}

/**
 * Get notification history
 */
export async function getNotificationHistory(): Promise<ReceivedNotification[]> {
  try {
    const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch {
    return [];
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    if (!historyJson) return;

    const history: ReceivedNotification[] = JSON.parse(historyJson);
    const updated = history.map((n) => ({ ...n, read: true }));

    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Silent fail
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const history = await getNotificationHistory();
    return history.filter((n) => !n.read).length;
  } catch {
    return 0;
  }
}

/**
 * Clear notification history
 */
export async function clearNotificationHistory(): Promise<void> {
  await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
}

/**
 * Set up notification listeners
 * Call this in app root/layout
 */
export function setupNotificationListeners(): () => void {
  // Handle notifications received while app is foregrounded
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    handleForegroundNotification
  );

  // Handle notification taps
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Get the last notification response (for cold start handling)
 */
export async function getLastNotificationResponse(): Promise<NotificationData | null> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      return parseNotificationData(response.notification);
    }
    return null;
  } catch {
    return null;
  }
}
