import React from 'react';
import { Stack } from 'expo-router';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="savings" options={{ presentation: 'modal' }} />
              <Stack.Screen name="inflation" options={{ presentation: 'modal' }} />
              <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
              <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
            <Stack.Screen name="admin" options={{ presentation: 'modal' }} />
            </Stack>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}
