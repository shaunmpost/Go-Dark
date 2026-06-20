import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/lib/theme';
import { checkEntitlement, initPurchases } from '@/lib/purchases';
import { useStore } from '@/lib/store';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  // Re-grant the one-time unlock from the store on launch (e.g. after a
  // reinstall) without requiring a tap. Never revokes — only grants.
  useEffect(() => {
    (async () => {
      await initPurchases();
      if (await checkEntitlement()) useStore.getState().unlock();
    })();
  }, []);

  // Hold on a dark canvas until the type is ready, to avoid a font swap flash.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#06070e' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            {/* Secondary screens present as dismissable sheets (swipe down / close). */}
            <Stack.Screen name="locations" options={{ presentation: 'modal' }} />
            <Stack.Screen name="unlock" options={{ presentation: 'modal' }} />
            <Stack.Screen name="planner" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
