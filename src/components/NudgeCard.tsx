/**
 * Best-night nudge — surfaces the best upcoming night. Especially important on
 * SKIP nights: it keeps the door open ("Skip tonight — but Thursday looks
 * perfect") instead of just saying no. Computed from the next ~14 nights in a
 * later step; mock-driven for now.
 */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { radii, space, ThemedText, ThemedView } from '@/lib/theme';
import { NightData } from '@/lib/types';

export function NudgeCard({ night }: { night: NightData }) {
  if (!night.bestNight) return null;
  const { dayLabel, summary } = night.bestNight;
  const isTonight = dayLabel.toLowerCase() === 'tonight';

  return (
    <ThemedView
      tone="accentDim"
      border="accent"
      style={{ borderRadius: radii.lg, padding: space.lg, flexDirection: 'row', gap: space.md }}
    >
      <View style={{ paddingTop: 2 }}>
        <Icon name="moon" size={18} tone="accent" fill />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <ThemedText variant="label" tone="accent">
          {isTonight ? 'Best night this week' : 'Your best upcoming night'}
        </ThemedText>
        <ThemedText variant="bodyStrong" tone="text">
          {dayLabel} {summary}
        </ThemedText>
      </View>
    </ThemedView>
  );
}
