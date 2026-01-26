/**
 * Settings Layout
 * Stack navigation for settings screens
 */

import { Stack } from 'expo-router';
import { SKATE } from '@/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: SKATE.colors.ink },
        headerTintColor: SKATE.colors.orange,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: SKATE.colors.ink },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{
          title: 'Privacy Policy',
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          title: 'Terms of Service',
        }}
      />
    </Stack>
  );
}
