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
import { ColorKey, radii, ThemedText, ThemedView, useTheme } from '@/lib/theme';
import { Factor } from '@/lib/types';

function toneForScore(score: number): ColorKey {
  if (score >= 0.66) return 'accent';
  if (score >= 0.4) return 'amber';
  return 'skip';
}

function FactorRow({ factor, last }: { factor: Factor; last: boolean }) {
  const { palette } = useTheme();
  const pct = Math.max(5, Math.round(factor.score * 100));
  return (
    <View
      style={{
        paddingVertical: 10,
        gap: 8,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: palette.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <ThemedText variant="fname" tone="text" style={{ fontSize: 14.5 }}>
          {factor.label}
        </ThemedText>
        <ThemedText variant="fval" tone="muted" style={{ fontSize: 12.5, flexShrink: 1, textAlign: 'right' }}>
          {factor.value}
        </ThemedText>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: radii.pill,
          backgroundColor: 'rgba(0,0,0,0.28)',
          borderWidth: 1,
          borderColor: palette.hairline,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            borderRadius: radii.pill,
            backgroundColor: palette[toneForScore(factor.score)],
          }}
        />
      </View>
    </View>
  );
}

function FactorList({ factors }: { factors: Factor[] }) {
  return (
    <View style={{ paddingTop: 6 }}>
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
          border="hairline"
          style={{
            borderRadius: radii.md,
            paddingVertical: 16,
            paddingHorizontal: 16,
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
