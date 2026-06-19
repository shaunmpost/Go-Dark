/**
 * Best-night nudge — surfaces the best upcoming night. Especially important on
 * SKIP nights: it keeps the door open ("Skip tonight — but Thursday looks
 * perfect") instead of just saying no. Computed from the next ~14 nights in a
 * later step; mock-driven for now.
 */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { radii, ThemedText, ThemedView } from '@/lib/theme';
import { NightData } from '@/lib/types';

export function NudgeCard({ night }: { night: NightData }) {
  if (!night.bestNight) return null;
  const { title, body } = night.bestNight;

  return (
    <ThemedView
      tone="panel"
      border
      style={{
        borderRadius: radii.lg,
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
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
    </ThemedView>
  );
}
