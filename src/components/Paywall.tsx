/**
 * Paywall — the one-time unlock. Shown on the dedicated Unlock screen and the
 * Locations gate. Lists exactly what the purchase adds, then Buy + Restore.
 * Talks only to `lib/purchases` (the IAP seam) and the store's `unlock`.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Icon, IconName } from './Icon';
import { purchaseUnlock, restorePurchases, UNLOCK_PRICE } from '@/lib/purchases';
import { useStore } from '@/lib/store';
import { radii, ThemedText, ThemedView, useTheme } from '@/lib/theme';

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'bell', title: 'Best-night alerts', body: 'Get a heads-up when a clear, moonless night is coming.' },
  { icon: 'check', title: 'The 14-night planner', body: 'See the verdict for every night ahead — not just tonight.' },
  { icon: 'pin', title: 'Unlimited saved locations', body: 'Compare your dark-sky spots at a glance.' },
  { icon: 'moon', title: 'Deep-sky target planning', body: "Know what's well-placed before you pack the car." },
];

export function Paywall({ onUnlocked }: { onUnlocked?: () => void }) {
  const { palette } = useTheme();
  const unlock = useStore((s) => s.unlock);
  const [busy, setBusy] = useState<'idle' | 'buy' | 'restore'>('idle');
  const [error, setError] = useState<string | null>(null);

  const run = async (which: 'buy' | 'restore') => {
    if (busy !== 'idle') return;
    setBusy(which);
    setError(null);
    const result = which === 'buy' ? await purchaseUnlock() : await restorePurchases();
    setBusy('idle');
    if (result.ok) {
      unlock();
      onUnlocked?.();
    } else if (!result.cancelled) {
      setError(result.error ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 16 }}>
        {FEATURES.map((f) => (
          <View key={f.title} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <ThemedView
              tone="accentDim"
              style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={f.icon} size={16} tone="accent" />
            </ThemedView>
            <View style={{ flex: 1 }}>
              <ThemedText variant="nudgeTitle" tone="text">
                {f.title}
              </ThemedText>
              <ThemedText variant="nudgeBody" tone="muted" style={{ marginTop: 2 }}>
                {f.body}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      <Pressable onPress={() => run('buy')} disabled={busy !== 'idle'}>
        <ThemedView
          tone="accent"
          style={{
            borderRadius: radii.md,
            paddingVertical: 15,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 52,
            opacity: busy === 'buy' ? 0.85 : 1,
          }}
        >
          {busy === 'buy' ? (
            <ActivityIndicator color={palette.bg} />
          ) : (
            // Dark text for contrast against the accent fill.
            <ThemedText variant="toggle" tone="bg">
              Unlock everything · {UNLOCK_PRICE}
            </ThemedText>
          )}
        </ThemedView>
      </Pressable>

      {error ? (
        <ThemedText variant="fval" tone="skip" style={{ textAlign: 'center' }}>
          {error}
        </ThemedText>
      ) : null}

      <Pressable onPress={() => run('restore')} disabled={busy !== 'idle'} style={{ paddingVertical: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {busy === 'restore' ? <ActivityIndicator size="small" color={palette.muted} /> : null}
          <ThemedText variant="foot" tone="muted" style={{ textAlign: 'center' }}>
            Restore purchase
          </ThemedText>
        </View>
      </Pressable>

      <ThemedText variant="foot" tone="faint" style={{ textAlign: 'center' }}>
        {/* TODO(iap): see lib/purchases.ts — wire react-native-iap / RevenueCat. */}
        One-time purchase · no subscription, ever · stubbed for now
      </ThemedText>
    </View>
  );
}
