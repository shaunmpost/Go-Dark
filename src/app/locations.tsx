/**
 * Locations — manage where Go Dark plans for. The device's current location is
 * always available (free tier). Saved locations and switching between them are
 * part of the one-time unlock; locked users see the gate.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { DEFAULT_LOCATION } from '@/config/data-sources';
import { getDeviceLocation } from '@/lib/location';
import { purchaseUnlock, restorePurchases, UNLOCK_PRICE } from '@/lib/purchases';
import { useStore } from '@/lib/store';
import { radii, ThemedText, ThemedView, useTheme } from '@/lib/theme';
import { Geo } from '@/lib/types';

function coords(g: Geo) {
  return `${g.latitude.toFixed(2)}°, ${g.longitude.toFixed(2)}°`;
}

function LocationRow({
  label,
  sub,
  selected,
  onSelect,
  onRemove,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  return (
    <ThemedView
      tone="panel"
      border
      style={{
        borderRadius: radii.md,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Pressable onPress={onSelect} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <ThemedView
          tone={selected ? 'accentDim' : undefined}
          border={selected ? 'accent' : 'hairline'}
          style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          {selected ? <Icon name="check" size={14} tone="accent" strokeWidth={2.6} /> : null}
        </ThemedView>
        <View style={{ flex: 1 }}>
          <ThemedText variant="nudgeTitle" tone="text">
            {label}
          </ThemedText>
          <ThemedText variant="fval" tone="faint" style={{ marginTop: 2 }}>
            {sub}
          </ThemedText>
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${label}`}>
          <Icon name="trash" size={18} tone="muted" strokeWidth={1.8} />
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

export default function LocationsScreen() {
  const router = useRouter();
  const saved = useStore((s) => s.saved);
  const selectedId = useStore((s) => s.selectedId);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const addLocation = useStore((s) => s.addLocation);
  const removeLocation = useStore((s) => s.removeLocation);
  const selectLocation = useStore((s) => s.selectLocation);
  const unlock = useStore((s) => s.unlock);

  const [device, setDevice] = useState<Geo | null>(null);
  useEffect(() => {
    getDeviceLocation().then(setDevice).catch(() => {});
  }, []);

  const current = device ?? DEFAULT_LOCATION;
  const currentSaved = saved.some(
    (l) => Math.abs(l.latitude - current.latitude) < 0.02 && Math.abs(l.longitude - current.longitude) < 0.02,
  );

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 56, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginBottom: 18 }}>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
              <ThemedView
                tone="panel"
                border
                style={{ width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="back" size={20} tone="text" strokeWidth={2} />
              </ThemedView>
            </Pressable>
            <ThemedText variant="locName" tone="text" style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>
              Locations
            </ThemedText>
          </View>

          <ThemedText variant="sectionH" tone="muted" style={{ marginBottom: 4 }}>
            Current
          </ThemedText>
          <LocationRow
            label={current.label}
            sub={device ? coords(current) : `${coords(current)} · default`}
            selected={selectedId == null}
            onSelect={() => selectLocation(null)}
          />

          {isUnlocked ? (
            <>
              <ThemedText variant="sectionH" tone="muted" style={{ marginTop: 18, marginBottom: 4 }}>
                Saved
              </ThemedText>
              {saved.length === 0 ? (
                <ThemedText variant="fval" tone="faint" style={{ paddingVertical: 6 }}>
                  No saved locations yet.
                </ThemedText>
              ) : (
                saved.map((l) => (
                  <LocationRow
                    key={l.id}
                    label={l.label}
                    sub={coords(l)}
                    selected={selectedId === l.id}
                    onSelect={() => selectLocation(l.id)}
                    onRemove={() => removeLocation(l.id)}
                  />
                ))
              )}

              <Pressable
                onPress={() => !currentSaved && addLocation(current)}
                disabled={currentSaved}
                style={{ marginTop: 8, opacity: currentSaved ? 0.4 : 1 }}
              >
                <ThemedView
                  tone="accentDim"
                  border="accent"
                  style={{
                    borderRadius: radii.md,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Icon name="plus" size={18} tone="accent" strokeWidth={2.2} />
                  <ThemedText variant="toggle" tone="accent">
                    {currentSaved ? 'Current location saved' : 'Save current location'}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </>
          ) : (
            <Paywall onUnlocked={unlock} />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Paywall({ onUnlocked }: { onUnlocked: () => void }) {
  const { palette } = useTheme();
  const [busy, setBusy] = useState<'idle' | 'buy' | 'restore'>('idle');
  const [error, setError] = useState<string | null>(null);

  const run = async (which: 'buy' | 'restore') => {
    if (busy !== 'idle') return;
    setBusy(which);
    setError(null);
    const result = which === 'buy' ? await purchaseUnlock() : await restorePurchases();
    setBusy('idle');
    if (result.ok) onUnlocked();
    else if (!result.cancelled) setError(result.error ?? 'Something went wrong. Please try again.');
  };

  return (
    <ThemedView tone="panel" border style={{ borderRadius: radii.lg, padding: 20, marginTop: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <ThemedView
          tone="accentDim"
          style={{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="lock" size={18} tone="accent" />
        </ThemedView>
        <ThemedText variant="nudgeTitle" tone="text" style={{ flex: 1 }}>
          Saved locations are part of the one-time unlock
        </ThemedText>
      </View>

      <ThemedText variant="nudgeBody" tone="muted">
        Unlock unlimited saved locations, the multi-day best-night planner, and deep-sky
        planning — once. No subscription, ever.
      </ThemedText>

      <Pressable onPress={() => run('buy')} disabled={busy !== 'idle'}>
        <ThemedView
          tone="accent"
          style={{
            borderRadius: radii.md,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 50,
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

      <Pressable onPress={() => run('restore')} disabled={busy !== 'idle'} style={{ paddingVertical: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {busy === 'restore' ? <ActivityIndicator size="small" color={palette.muted} /> : null}
          <ThemedText variant="foot" tone="muted" style={{ textAlign: 'center' }}>
            Restore purchase
          </ThemedText>
        </View>
      </Pressable>

      <ThemedText variant="foot" tone="faint" style={{ textAlign: 'center' }}>
        {/* TODO(iap): see lib/purchases.ts — wire react-native-iap / RevenueCat. */}
        One-time purchase · stubbed for now
      </ThemedText>
    </ThemedView>
  );
}
