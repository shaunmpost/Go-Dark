import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/lib/theme';
import { checkEntitlement, initPurchases } from '@/lib/purchases';
import { useStore } from '@/lib/store';

export default function RootLayout() {
  // Re-grant the one-time unlock from the store on launch (e.g. after a
  // reinstall) without requiring a tap. Never revokes — only grants.
  useEffect(() => {
    (async () => {
      await initPurchases();
      if (await checkEntitlement()) useStore.getState().unlock();
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              // Transparent so each screen's animated background shows through.
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'fade',
            }}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
