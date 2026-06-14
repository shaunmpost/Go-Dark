/**
 * Hero verdict — the whole point of the app. A pulsing status dot, the verdict
 * word at ~74px, a confidence chip, one plain-language sentence, and the
 * shooting window with its duration. Color keys map to the verdict state and
 * still fade with the theme.
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
import { ColorKey, radii, space, ThemedText, ThemedView, useBgColor } from '@/lib/theme';
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
      withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [pulse]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.7 }],
    opacity: 0.45 * (1 - pulse.value),
  }));
  const ringColor = useBgColor(tone);
  const coreColor = useBgColor(tone);

  return (
    <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
          ringColor,
          ring,
        ]}
      />
      <Animated.View style={[{ width: 10, height: 10, borderRadius: 5 }, coreColor]} />
    </View>
  );
}

function ConfidenceChip({ confidence }: { confidence: NightData['confidence'] }) {
  return (
    <ThemedView
      tone="panel"
      border
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: radii.pill,
      }}
    >
      <ThemedText variant="chip" tone="muted">
        {confidence} confidence
      </ThemedText>
    </ThemedView>
  );
}

export function Verdict({ night }: { night: NightData }) {
  const tone = STATE_TONE[night.state];

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PulsingDot tone={tone} />
        <ThemedText variant="label" tone="faint">
          Verdict
        </ThemedText>
      </View>

      <View style={{ gap: space.md }}>
        <ThemedText variant="hero" tone={tone}>
          {STATE_COPY[night.state].word}
        </ThemedText>
        <View style={{ flexDirection: 'row' }}>
          <ConfidenceChip confidence={night.confidence} />
        </View>
      </View>

      <ThemedText variant="body" tone="muted" style={{ maxWidth: 360 }}>
        {night.headline}
      </ThemedText>

      {night.window ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.lg, marginTop: 4 }}>
          <View>
            <ThemedText variant="label" tone="faint">
              Shooting window
            </ThemedText>
            <ThemedText variant="monoLarge" tone="text" style={{ marginTop: 6 }}>
              {minutesToClock(night.window.start)} → {minutesToClock(night.window.end)}
            </ThemedText>
          </View>
          <View>
            <ThemedText variant="label" tone="faint">
              Duration
            </ThemedText>
            <ThemedText variant="monoLarge" tone={tone} style={{ marginTop: 6 }}>
              {formatDuration(night.window.end - night.window.start)}
            </ThemedText>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 4 }}>
          <ThemedText variant="label" tone="faint">
            Shooting window
          </ThemedText>
          <ThemedText variant="monoLarge" tone="muted" style={{ marginTop: 6 }}>
            None tonight
          </ThemedText>
        </View>
      )}
    </View>
  );
}
