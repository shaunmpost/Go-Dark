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
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Icon } from './Icon';
import {
  ColorKey,
  radii,
  ThemedText,
  ThemedView,
  useBgColor,
  useColorValue,
} from '@/lib/theme';
import { NightData, VerdictState } from '@/lib/types';
import { formatDuration, minutesToClock } from '@/lib/mock-data';
import { STATE_COPY } from '@/lib/verdict';

const STATE_TONE: Record<VerdictState, ColorKey> = {
  GO: 'accent',
  MAYBE: 'amber',
  SKIP: 'skip',
};

function HeroGlow({ tone }: { tone: ColorKey }) {
  const c = useColorValue(tone === 'accent' ? 'accentDim' : tone);
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: -30, left: '50%', marginLeft: -150, width: 300, height: 300 }}
    >
      <Svg width={300} height={300}>
        <Defs>
          <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={c} stopOpacity={tone === 'accent' ? 1 : 0.5} />
            <Stop offset="68%" stopColor={c} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={300} height={300} fill="url(#heroGlow)" />
      </Svg>
    </View>
  );
}

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

function ConfidenceChip({ confidence, tone }: { confidence: NightData['confidence']; tone: ColorKey }) {
  const isGo = tone === 'accent';
  return (
    <ThemedView
      tone={isGo ? 'accentDim' : 'panel'}
      border={isGo ? undefined : 'hairline'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 13,
        paddingVertical: 6,
        borderRadius: radii.pill,
      }}
    >
      <Icon name={confidence === 'High' ? 'check' : 'info'} size={13} tone={tone} strokeWidth={2.4} />
      <ThemedText variant="conf" tone={tone}>
        {confidence} confidence
      </ThemedText>
    </ThemedView>
  );
}

export function Verdict({ night }: { night: NightData }) {
  const tone = STATE_TONE[night.state];

  return (
    <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 30 }}>
      <HeroGlow tone={tone} />

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
