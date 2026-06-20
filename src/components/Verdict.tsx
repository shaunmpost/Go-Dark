/**
 * Hero verdict — the whole point of the app. Centered, matching the mock:
 * a soft radial glow, an eyebrow, a pulsing status dot beside the verdict word
 * (~74px), a confidence chip, one plain-language sentence, and the shooting
 * window with its duration. Color keys map to the verdict state and still fade
 * with the theme.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import {
  ColorKey,
  radii,
  ThemedText,
  useBgColor,
  useTheme,
} from '@/lib/theme';
import { NightData, VerdictState } from '@/lib/types';
import { formatDuration, minutesToClock } from '@/lib/mock-data';
import { STATE_COPY } from '@/lib/verdict';

const STATE_TONE: Record<VerdictState, ColorKey> = {
  GO: 'accent',
  MAYBE: 'amber',
  SKIP: 'skip',
};

function PulsingDot({ tone }: { tone: ColorKey }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const halo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.3 }],
    opacity: 0.35 * (1 - pulse.value) + 0.1,
  }));
  const haloColor = useBgColor(tone);
  const coreColor = useBgColor(tone);

  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[{ position: 'absolute', width: 14, height: 14, borderRadius: 7 }, haloColor, halo]}
      />
      <Animated.View style={[{ width: 14, height: 14, borderRadius: 7 }, coreColor]} />
    </View>
  );
}

/** `#rrggbb` → `rgba(...)` for tone-tinted pill fills. */
function tint(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function ConfidenceChip({ confidence, tone }: { confidence: NightData['confidence']; tone: ColorKey }) {
  const { palette } = useTheme();
  const c = palette[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: tint(c, 0.45),
        backgroundColor: tint(c, 0.12),
      }}
    >
      <Icon name={confidence === 'High' ? 'check' : 'info'} size={14} tone={tone} strokeWidth={2.4} />
      <ThemedText variant="conf" tone={tone}>
        {confidence} confidence
      </ThemedText>
    </View>
  );
}

export function Verdict({ night }: { night: NightData }) {
  const tone = STATE_TONE[night.state];

  return (
    <View style={{ alignItems: 'center', paddingTop: 30, paddingBottom: 30 }}>
      <ThemedText variant="eyebrow" tone="muted" style={{ marginBottom: 22 }}>
        Verdict · {night.dateLabel}
      </ThemedText>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <PulsingDot tone={tone} />
        <ThemedText variant="hero" tone="text">
          {STATE_COPY[night.state].word}
        </ThemedText>
      </View>

      <View style={{ marginTop: 18 }}>
        <ConfidenceChip confidence={night.confidence} tone={tone} />
      </View>

      <ThemedText
        variant="sentence"
        tone="text"
        style={{ marginTop: 24, maxWidth: 280, textAlign: 'center', opacity: 0.92 }}
      >
        {night.headline}
      </ThemedText>

      {night.window ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22 }}>
            <ThemedText variant="windowTime" tone="text">
              {minutesToClock(night.window.start)}
            </ThemedText>
            <ThemedText variant="windowTime" tone="faint">
              →
            </ThemedText>
            <ThemedText variant="windowTime" tone="text">
              {minutesToClock(night.window.end)}
            </ThemedText>
          </View>
          <ThemedText variant="windowSub" tone="faint" style={{ marginTop: 6 }}>
            {formatDuration(night.window.end - night.window.start)} shooting window
          </ThemedText>
        </>
      ) : (
        <ThemedText variant="windowSub" tone="faint" style={{ marginTop: 22 }}>
          No usable window tonight
        </ThemedText>
      )}
    </View>
  );
}
