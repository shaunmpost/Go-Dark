/**
 * Best-night nudge — the home-screen hook for the paid planner.
 *
 * Free: a locked teaser — it reveals that a better night is coming (creating
 * the pull) but gates the details + the 14-night planner + alerts behind the
 * unlock. Paid: the full best-night detail. Especially important on SKIP
 * nights, where it turns "no" into "but here's when to go."
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from './Icon';
import { UNLOCK_PRICE } from '@/lib/purchases';
import { useStore } from '@/lib/store';
import { radii, ThemedText, ThemedView } from '@/lib/theme';
import { NightData } from '@/lib/types';

export function NudgeCard({ night }: { night: NightData }) {
  const router = useRouter();
  const isUnlocked = useStore((s) => s.isUnlocked);
  if (!night.bestNight) return null;
  const { title, body } = night.bestNight;

  if (!isUnlocked) {
    // Locked teaser — shows that a better night exists, gates the payoff.
    return (
      <Pressable onPress={() => router.push('/unlock')} accessibilityRole="button">
        <ThemedView tone="panel" border="hairline" style={{ borderRadius: radii.lg, padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <ThemedView
              tone="accentDim"
              style={{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="lock" size={18} tone="accent" />
            </ThemedView>
            <View style={{ flex: 1 }}>
              <ThemedText variant="nudgeTitle" tone="text">
                {title}
              </ThemedText>
              <ThemedText variant="nudgeBody" tone="muted" style={{ marginTop: 4 }}>
                Unlock the 14-night planner and get an alert when a great night is coming.
              </ThemedText>
            </View>
          </View>
          <ThemedView
            tone="accent"
            style={{ borderRadius: radii.md, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
          >
            <ThemedText variant="toggle" tone="bg">
              Unlock planning · {UNLOCK_PRICE}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </Pressable>
    );
  }

  // Unlocked — the full nudge, tappable through to the planner.
  return (
    <Pressable onPress={() => router.push('/planner')} accessibilityRole="button">
      <ThemedView tone="panel" border="hairline" style={{ borderRadius: radii.lg, padding: 18, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
          <ThemedView
            tone="accentDim"
            style={{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="bell" size={18} tone="accent" />
          </ThemedView>
          <View style={{ flex: 1, gap: 4 }}>
            <ThemedText variant="nudgeTitle" tone="text">
              {title}
            </ThemedText>
            <ThemedText variant="nudgeBody" tone="muted">
              {body}
            </ThemedText>
          </View>
        </View>
        <ThemedView tone="hairline" style={{ height: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText variant="toggle" tone="accent">
            See all 14 nights
          </ThemedText>
          <Icon name="next" size={18} tone="accent" strokeWidth={2} />
        </View>
      </ThemedView>
    </Pressable>
  );
}
