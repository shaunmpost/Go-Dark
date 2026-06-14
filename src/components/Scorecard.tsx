/**
 * "Why tonight" — progressive disclosure. A tappable row that expands a
 * scorecard of the six factors, each with a value line and a thin bar. Height
 * and chevron animate smoothly; collapsed by default.
 */
import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import { ColorKey, radii, space, ThemedText, ThemedView } from '@/lib/theme';
import { Factor } from '@/lib/types';

function toneForScore(score: number): ColorKey {
  if (score >= 0.66) return 'accent';
  if (score >= 0.4) return 'amber';
  return 'skip';
}

function FactorRow({ factor }: { factor: Factor }) {
  const fillTone = toneForScore(factor.score);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <ThemedText variant="bodyStrong" tone="text">
          {factor.label}
        </ThemedText>
        <ThemedText variant="mono" tone="muted">
          {factor.value}
        </ThemedText>
      </View>
      <ThemedView tone="hairline" style={{ height: 3, borderRadius: 2, overflow: 'hidden' }}>
        <ThemedView
          tone={fillTone}
          style={{ height: 3, borderRadius: 2, width: `${Math.round(factor.score * 100)}%` }}
        />
      </ThemedView>
    </View>
  );
}

export function Scorecard({ factors }: { factors: Factor[] }) {
  const [open, setOpen] = useState(false);
  const [contentH, setContentH] = useState(0);
  const progress = useSharedValue(0);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    progress.value = withTiming(next ? 1 : 0, { duration: 300 });
  };

  const containerStyle = useAnimatedStyle(() => ({
    height: progress.value * contentH,
    opacity: progress.value,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== contentH) setContentH(h);
  };

  return (
    <ThemedView
      tone="panel"
      border
      style={{ borderRadius: radii.lg, overflow: 'hidden' }}
    >
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.lg,
          paddingVertical: space.lg,
        }}
      >
        <View>
          <ThemedText variant="bodyStrong" tone="text">
            Why tonight
          </ThemedText>
          <ThemedText variant="mono" tone="faint" style={{ marginTop: 2 }}>
            {open ? 'The six factors' : 'Tap to see the six factors'}
          </ThemedText>
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron" size={20} tone="muted" />
        </Animated.View>
      </Pressable>

      {/* Animated viewport */}
      <Animated.View style={[{ overflow: 'hidden' }, containerStyle]}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            paddingHorizontal: space.lg,
            paddingBottom: space.lg,
            gap: space.lg,
          }}
        >
          {factors.map((f) => (
            <FactorRow key={f.key} factor={f} />
          ))}
        </View>
      </Animated.View>

      {/* Hidden measurement copy (no flicker; sets contentH once). */}
      <View
        style={{ position: 'absolute', opacity: 0, left: 0, right: 0 }}
        pointerEvents="none"
        onLayout={onContentLayout}
      >
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.lg }}>
          {factors.map((f) => (
            <FactorRow key={`measure-${f.key}`} factor={f} />
          ))}
        </View>
      </View>
    </ThemedView>
  );
}
