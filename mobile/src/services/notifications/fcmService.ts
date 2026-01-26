/**
 * FCM Service
 * Manages Firebase Cloud Messaging token collection and refresh
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, arrayUnion, arrayRemove, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase.config';
import { captureError, captureMessage } from '@/lib/errorTracking';
import { FCMToken, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from './types';

const FCM_TOKEN_KEY = '@skatehubba/fcm_token';
const DEVICE_ID_KEY = '@skatehubba/device_id';
const NOTIFICATION_PREFS_KEY = '@skatehubba/notification_prefs';

/**
 * Generate or retrieve a unique device ID
 */
async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Configure notification handling behavior
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Check if running on a physical device
  if (!Device.isDevice) {
    console.log('[FCM] Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[FCM] Notification permissions not granted');
    return false;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('challenges', {
      name: 'Challenges',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff6600',
    });

    await Notifications.setNotificationChannelAsync('activity', {
      name: 'Activity',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return true;
}

/**
 * Get the Expo push token (or FCM token on Android)
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the Expo push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '682cb6d2-cf8f-407c-a7f1-1069c45156dd', // From app.config.js
    });

    return token.data;
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      context: 'getExpoPushToken',
    });
    return null;
  }
}

/**
 * Register the FCM token with Firestore
 */
export async function registerFCMToken(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    console.log('[FCM] No authenticated user, skipping token registration');
    return false;
  }

  try {
    const token = await getExpoPushToken();
    if (!token) {
      console.log('[FCM] Could not get push token');
      return false;
    }

    const deviceId = await getDeviceId();
    const platform = Platform.OS as 'ios' | 'android';

    // Check if token has changed
    const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (storedToken === token) {
      console.log('[FCM] Token unchanged, skipping registration');
      return true;
    }

    // Prepare token document
    const tokenData: FCMToken = {
      token,
      platform,
      deviceId,
      createdAt: new Date(),
      lastRefreshed: new Date(),
    };

    // Save to Firestore
    const userRef = doc(db, 'users', user.uid);

    // First, remove any old token from this device
    if (storedToken) {
      try {
        await updateDoc(userRef, {
          fcmTokens: arrayRemove({ token: storedToken, deviceId }),
        });
      } catch {
        // Ignore if user doc doesn't exist yet
      }
    }

    // Add the new token
    await setDoc(
      userRef,
      {
        fcmTokens: arrayUnion(tokenData),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // Store locally
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

    captureMessage('FCM token registered', { deviceId, platform });
    console.log('[FCM] Token registered successfully');

    return true;
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      context: 'registerFCMToken',
    });
    return false;
  }
}

/**
 * Refresh the FCM token (call on app launch and periodically)
 */
export async function refreshFCMToken(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const token = await getExpoPushToken();
    if (!token) return;

    const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    const deviceId = await getDeviceId();

    // If token changed, re-register
    if (token !== storedToken) {
      await registerFCMToken();
      return;
    }

    // Update lastRefreshed timestamp
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const tokens = userData.fcmTokens || [];
      const updatedTokens = tokens.map((t: FCMToken) =>
        t.deviceId === deviceId ? { ...t, lastRefreshed: new Date() } : t
      );

      await updateDoc(userRef, {
        fcmTokens: updatedTokens,
      });
    }
  } catch (error) {
    // Silent fail for refresh
    console.log('[FCM] Token refresh failed:', error);
  }
}

/**
 * Remove FCM token on logout
 */
export async function removeFCMToken(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    const deviceId = await getDeviceId();

    if (storedToken) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove({ token: storedToken, deviceId }),
      });
    }

    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    console.log('[FCM] Token removed');
  } catch (error) {
    // Silent fail
    console.log('[FCM] Token removal failed:', error);
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) };
    }
    return DEFAULT_NOTIFICATION_PREFERENCES;
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const current = await getNotificationPreferences();
  const updated = { ...current, ...prefs };

  await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));

  // Also sync to Firestore for server-side filtering
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        notificationPreferences: updated,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }
}
