/**
 * "Why tonight" — progressive disclosure. A single-line tappable pill that
 * expands a scorecard of the six factors, each with a value line and a thin
 * bar. Height and chevron animate smoothly; collapsed by default. Matches the
 * mock: the pill is bordered, the factors expand flush beneath it.
 */
import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import { ColorKey, radii, ThemedText, ThemedView } from '@/lib/theme';
import { Factor } from '@/lib/types';

function toneForScore(score: number): ColorKey {
  if (score >= 0.66) return 'accent';
  if (score >= 0.4) return 'amber';
  return 'skip';
}

function FactorRow({ factor, last }: { factor: Factor; last: boolean }) {
  return (
    <ThemedView
      border={last ? undefined : 'hairline'}
      style={{
        paddingVertical: 15,
        paddingHorizontal: 4,
        gap: 9,
        borderWidth: 0,
        borderBottomWidth: last ? 0 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText variant="fname" tone="text">
          {factor.label}
        </ThemedText>
        <ThemedText variant="fval" tone="muted">
          {factor.value}
        </ThemedText>
      </View>
      <ThemedView tone="hairlineStrong" style={{ height: 4, borderRadius: 4, overflow: 'hidden' }}>
        <ThemedView
          tone={toneForScore(factor.score)}
          style={{ height: 4, borderRadius: 4, width: `${Math.round(factor.score * 100)}%` }}
        />
      </ThemedView>
    </ThemedView>
  );
}

function FactorList({ factors }: { factors: Factor[] }) {
  return (
    <View style={{ paddingHorizontal: 4, paddingTop: 8 }}>
      {factors.map((f, i) => (
        <FactorRow key={f.key} factor={f} last={i === factors.length - 1} />
      ))}
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
    progress.value = withTiming(next ? 1 : 0, { duration: 420 });
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
    <View>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <ThemedView
          tone="panel"
          border
          style={{
            borderRadius: radii.md,
            paddingVertical: 17,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <Icon name="info" size={18} tone="accent" />
            <ThemedText variant="toggle" tone="text">
              Why tonight
            </ThemedText>
          </View>
          <Animated.View style={chevronStyle}>
            <Icon name="chevron" size={18} tone="muted" />
          </Animated.View>
        </ThemedView>
      </Pressable>

      {/* Animated viewport */}
      <Animated.View style={[{ overflow: 'hidden' }, containerStyle]}>
        <View style={{ position: 'absolute', left: 0, right: 0 }}>
          <FactorList factors={factors} />
        </View>
      </Animated.View>

      {/* Hidden measurement copy (sets contentH once, no flicker). */}
      <View
        style={{ position: 'absolute', opacity: 0, left: 0, right: 0 }}
        pointerEvents="none"
        onLayout={onContentLayout}
      >
        <FactorList factors={factors} />
      </View>
    </View>
  );
}
