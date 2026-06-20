/**
 * Unlock — the dedicated paywall screen. Reached from the home-screen planner
 * teaser and the Locations gate. Tonight's verdict stays free; this sells the
 * planning that catches the nights you'd otherwise miss.
 */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloseButton } from '@/components/CloseButton';
import { Icon } from '@/components/Icon';
import { Paywall } from '@/components/Paywall';
import { ThemedText, ThemedView } from '@/lib/theme';

export default function UnlockScreen() {
  const router = useRouter();
  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 56 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 }}>
            <CloseButton onPress={() => router.back()} />
          </View>

          <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 26 }}>
            <ThemedView
              tone="accentDim"
              style={{ width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
            >
              <Icon name="moon" size={30} tone="accent" fill />
            </ThemedView>
            <ThemedText
              variant="locName"
              tone="text"
              style={{ fontSize: 27, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center' }}
            >
              Plan your nights
            </ThemedText>
            <ThemedText
              variant="sentence"
              tone="muted"
              style={{ textAlign: 'center', marginTop: 10, maxWidth: 300 }}
            >
              Tonight&apos;s verdict is always free. Unlock the planning that catches the great nights you&apos;d
              otherwise miss.
            </ThemedText>
          </View>

          <Paywall onUnlocked={() => router.back()} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
