/**
 * Settings Screen
 * User preferences, notification settings, and account management
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SKATE } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthStore } from '@/store/authStore';
import { removeFCMToken } from '@/services/notifications/fcmService';
import { clearAllPendingUploads } from '@/services/upload/uploadPersistence';
import { clearNotificationHistory } from '@/services/notifications/notificationHandler';
import { captureMessage } from '@/lib/errorTracking';

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { preferences, updatePreferences, clearToken } = useNotifications();
  const signOut = useAuthStore((s) => s.signOut);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle logout with full cleanup
  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your local data will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              captureMessage('User logging out', { userId: user?.uid });

              // Clear FCM token
              await clearToken();

              // Clear pending uploads
              await clearAllPendingUploads();

              // Clear notification history
              await clearNotificationHistory();

              // Clear any cached data
              const keys = await AsyncStorage.getAllKeys();
              const keysToRemove = keys.filter(
                (key) =>
                  key.startsWith('@skatehubba/') &&
                  !key.includes('device_id') // Keep device ID for analytics
              );
              if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
              }

              // Sign out from Firebase
              await signOut();

              // Navigate to auth screen
              router.replace('/auth/sign-in');
            } catch (error) {
              console.error('[Settings] Logout failed:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  }, [user, signOut, clearToken, router]);

  // Handle notification toggle
  const handleNotificationToggle = useCallback(
    async (key: string, value: boolean) => {
      await updatePreferences({ [key]: value });
    },
    [updatePreferences]
  );

  // Build settings sections
  const sections: SettingsSection[] = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'enabled',
          label: 'Push Notifications',
          icon: 'notifications',
          type: 'toggle',
          value: preferences?.enabled ?? true,
          onToggle: (v) => handleNotificationToggle('enabled', v),
        },
        {
          id: 'challengeReceived',
          label: 'New Challenges',
          icon: 'videocam',
          type: 'toggle',
          value: preferences?.challengeReceived ?? true,
          onToggle: (v) => handleNotificationToggle('challengeReceived', v),
        },
        {
          id: 'opponentUploaded',
          label: 'Opponent Responses',
          icon: 'play-circle',
          type: 'toggle',
          value: preferences?.opponentUploaded ?? true,
          onToggle: (v) => handleNotificationToggle('opponentUploaded', v),
        },
        {
          id: 'resultPosted',
          label: 'Challenge Results',
          icon: 'trophy',
          type: 'toggle',
          value: preferences?.resultPosted ?? true,
          onToggle: (v) => handleNotificationToggle('resultPosted', v),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Edit Profile',
          icon: 'person',
          type: 'navigation',
          onPress: () => router.push(`/profile/${user?.uid}` as never),
        },
        {
          id: 'privacy',
          label: 'Privacy Policy',
          icon: 'shield-checkmark',
          type: 'navigation',
          onPress: () => router.push('/settings/privacy-policy'),
        },
        {
          id: 'terms',
          label: 'Terms of Service',
          icon: 'document-text',
          type: 'navigation',
          onPress: () => router.push('/settings/terms'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          label: 'Help & FAQ',
          icon: 'help-circle',
          type: 'navigation',
          onPress: () => Alert.alert('Coming Soon', 'Help center is coming soon!'),
        },
        {
          id: 'feedback',
          label: 'Send Feedback',
          icon: 'chatbubble-ellipses',
          type: 'navigation',
          onPress: () => Alert.alert('Feedback', 'Email us at support@skatehubba.com'),
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          id: 'logout',
          label: 'Sign Out',
          icon: 'log-out',
          type: 'action',
          danger: true,
          onPress: handleLogout,
        },
      ],
    },
  ];

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please sign in to access settings.</Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push('/auth/sign-in')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.displayName || 'Skater'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Settings Sections */}
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingsItem,
                  index === section.items.length - 1 && styles.settingsItemLast,
                ]}
                onPress={item.type !== 'toggle' ? item.onPress : undefined}
                disabled={item.type === 'toggle' || isLoggingOut}
                accessible
                accessibilityRole={item.type === 'toggle' ? 'switch' : 'button'}
                accessibilityLabel={item.label}
              >
                <View style={styles.settingsItemLeft}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={item.danger ? SKATE.colors.blood : SKATE.colors.orange}
                  />
                  <Text
                    style={[
                      styles.settingsItemLabel,
                      item.danger && styles.dangerText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>

                {item.type === 'toggle' && (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: SKATE.colors.gray, true: SKATE.colors.orange }}
                    thumbColor={SKATE.colors.white}
                  />
                )}

                {item.type === 'navigation' && (
                  <Ionicons name="chevron-forward" size={20} color={SKATE.colors.gray} />
                )}

                {item.type === 'action' && item.id === 'logout' && isLoggingOut && (
                  <Text style={styles.loadingText}>Signing out...</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* App Version */}
      <Text style={styles.version}>SkateHubba v0.0.1</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SKATE.colors.ink,
  },
  content: {
    padding: SKATE.spacing.lg,
    paddingBottom: 40,
  },
  message: {
    color: SKATE.colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  signInButton: {
    backgroundColor: SKATE.colors.orange,
    paddingVertical: SKATE.spacing.md,
    paddingHorizontal: SKATE.spacing.xxl,
    borderRadius: SKATE.borderRadius.md,
    alignSelf: 'center',
    marginTop: SKATE.spacing.xl,
    minHeight: SKATE.accessibility.minimumTouchTarget,
  },
  signInButtonText: {
    color: SKATE.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SKATE.spacing.xl,
    paddingBottom: SKATE.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: SKATE.colors.grime,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: SKATE.colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: SKATE.colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: SKATE.spacing.lg,
    flex: 1,
  },
  userName: {
    color: SKATE.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    color: SKATE.colors.gray,
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginBottom: SKATE.spacing.xl,
  },
  sectionTitle: {
    color: SKATE.colors.orange,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SKATE.spacing.sm,
    marginLeft: SKATE.spacing.sm,
  },
  sectionContent: {
    backgroundColor: SKATE.colors.grime,
    borderRadius: SKATE.borderRadius.md,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SKATE.spacing.md,
    paddingHorizontal: SKATE.spacing.lg,
    minHeight: SKATE.accessibility.minimumTouchTarget,
    borderBottomWidth: 1,
    borderBottomColor: SKATE.colors.ink,
  },
  settingsItemLast: {
    borderBottomWidth: 0,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemLabel: {
    color: SKATE.colors.white,
    fontSize: 16,
    marginLeft: SKATE.spacing.md,
  },
  dangerText: {
    color: SKATE.colors.blood,
  },
  loadingText: {
    color: SKATE.colors.gray,
    fontSize: 14,
  },
  version: {
    color: SKATE.colors.gray,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SKATE.spacing.xl,
  },
});
