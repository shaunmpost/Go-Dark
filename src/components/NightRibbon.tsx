/**
 * Night ribbon — the signature element.
 *
 * A horizontal dusk -> dawn track (6 PM -> 6 AM) with stacked layers:
 *   • sky gradient (bright twilight at the edges, darkest mid-night)
 *   • hatched moon-up band(s)
 *   • translucent cloud band(s)
 *   • the glowing "best window" band
 *   • a "core ↑" rise marker
 * A draggable handle scrubs it (Reanimated + gesture-handler, runs on the UI
 * thread); a live readout above shows time, core altitude/direction, and sky
 * state at the handle. Tap-to-jump is supported too.
 */
import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import {
  fieldPalette,
  nightPalette,
  radii,
  space,
  ThemedText,
  ThemedView,
  useColorValue,
  useTheme,
} from '@/lib/theme';
import { NightData, TimeBand } from '@/lib/types';
import { minutesToClock, RIBBON } from '@/lib/mock-data';

const TRACK_H = 96;
const TOTAL = RIBBON.totalMinutes;

const HOUR_TICKS = [
  { min: 0, label: '6 PM' },
  { min: 180, label: '9 PM' },
  { min: 360, label: '12 AM' },
  { min: 540, label: '3 AM' },
  { min: 720, label: '6 AM' },
];

function clamp(v: number, lo: number, hi: number) {
  'worklet';
  return Math.min(Math.max(v, lo), hi);
}

/** Crossfading sky gradient (night palette under, field palette over). */
function SkyGradient() {
  const { t } = useTheme();
  const fieldStyle = useAnimatedStyle(() => ({ opacity: t.value }));
  return (
    <View style={{ ...StyleSheetAbsolute }}>
      <LinearGradient
        colors={[nightPalette.ribbonEdge, nightPalette.ribbonCenter, nightPalette.ribbonEdge]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheetAbsolute}
      />
      <Animated.View style={[StyleSheetAbsolute, fieldStyle]}>
        <LinearGradient
          colors={[fieldPalette.ribbonEdge, fieldPalette.ribbonCenter, fieldPalette.ribbonEdge]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheetAbsolute}
        />
      </Animated.View>
    </View>
  );
}

const StyleSheetAbsolute = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

export function NightRibbon({ night }: { night: NightData }) {
  const [w, setW] = useState(0);
  const [readoutIdx, setReadoutIdx] = useState(() =>
    Math.round((night.window ? (night.window.start + night.window.end) / 2 : 360) / RIBBON.step),
  );

  const trackW = useSharedValue(0);
  const initialMin = night.window ? (night.window.start + night.window.end) / 2 : 360;
  const handleMin = useSharedValue(initialMin);

  const moonHatch = useColorValue('moonBand');
  const cloudColor = useColorValue('cloudBand');

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setW(width);
    trackW.value = width;
  };

  const xOf = (min: number) => (w === 0 ? 0 : (min / TOTAL) * w);

  // Push the snapped sample index to JS only when it actually changes.
  useAnimatedReaction(
    () => Math.round(handleMin.value / RIBBON.step),
    (idx, prev) => {
      if (idx !== prev) {
        const clamped = Math.min(Math.max(idx, 0), night.samples.length - 1);
        runOnJS(setReadoutIdx)(clamped);
      }
    },
  );

  const pan = Gesture.Pan()
    .onBegin((e) => {
      handleMin.value = clamp((e.x / trackW.value) * TOTAL, 0, TOTAL);
    })
    .onUpdate((e) => {
      handleMin.value = clamp((e.x / trackW.value) * TOTAL, 0, TOTAL);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    handleMin.value = withTiming(clamp((e.x / trackW.value) * TOTAL, 0, TOTAL), { duration: 220 });
  });

  const gesture = Gesture.Race(pan, tap);

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (handleMin.value / TOTAL) * trackW.value }],
  }));

  const sample = night.samples[readoutIdx] ?? night.samples[0];
  const coreText =
    sample.coreAlt > 0 ? `Core ${Math.round(sample.coreAlt)}° ${sample.coreDir}` : 'Core below horizon';

  return (
    <View style={{ gap: space.md }}>
      {/* Live readout */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.md }}>
        <ThemedText variant="monoLarge" tone="text">
          {minutesToClock(sample.minutes)}
        </ThemedText>
        <ThemedText variant="mono" tone="muted">
          {coreText}
        </ThemedText>
        <ThemedText variant="mono" tone="faint" style={{ marginLeft: 'auto' }}>
          {sample.sky}
        </ThemedText>
      </View>

      {/* Track */}
      <GestureDetector gesture={gesture}>
        <View
          onLayout={onLayout}
          style={{
            height: TRACK_H,
            borderRadius: radii.md,
            overflow: 'hidden',
            justifyContent: 'center',
          }}
        >
          <SkyGradient />

          {w > 0 && (
            <>
              {/* Hatched moon bands + cloud bands via SVG */}
              <Svg width={w} height={TRACK_H} style={StyleSheetAbsolute}>
                <Defs>
                  <Pattern
                    id="moonHatch"
                    patternUnits="userSpaceOnUse"
                    width={7}
                    height={7}
                    patternTransform="rotate(45)"
                  >
                    <Line x1={0} y1={0} x2={0} y2={7} stroke={moonHatch} strokeWidth={1.2} />
                  </Pattern>
                </Defs>
                {night.moonBands.map((b: TimeBand, i: number) => (
                  <Rect
                    key={`moon-${i}`}
                    x={xOf(b.start)}
                    y={0}
                    width={xOf(b.end) - xOf(b.start)}
                    height={TRACK_H}
                    fill="url(#moonHatch)"
                  />
                ))}
                {night.cloudBands.map((b: TimeBand, i: number) => (
                  <Rect
                    key={`cloud-${i}`}
                    x={xOf(b.start)}
                    y={0}
                    width={xOf(b.end) - xOf(b.start)}
                    height={TRACK_H}
                    fill={cloudColor}
                  />
                ))}
              </Svg>

              {/* Best-window glow band */}
              {night.window && (
                <BestWindowBand left={xOf(night.window.start)} width={xOf(night.window.end) - xOf(night.window.start)} />
              )}

              {/* Core rise marker */}
              {night.coreRiseMinutes != null && (
                <CoreMarker left={xOf(night.coreRiseMinutes)} />
              )}

              {/* Scrub handle */}
              <Animated.View
                style={[
                  { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1 },
                  handleStyle,
                ]}
                pointerEvents="none"
              >
                <ThemedView tone="text" style={{ flex: 1, opacity: 0.9 }} />
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    left: -6,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                  }}
                >
                  <ThemedView
                    tone="text"
                    border="bg"
                    style={{ flex: 1, borderRadius: 7, borderWidth: 2 }}
                  />
                </View>
              </Animated.View>
            </>
          )}
        </View>
      </GestureDetector>

      {/* Hour ticks */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {HOUR_TICKS.map((tick) => (
          <ThemedText key={tick.min} variant="label" tone="faint" style={{ fontSize: 10 }}>
            {tick.label}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

/** Glowing accent band marking the recommended shooting window. */
function BestWindowBand({ left, width }: { left: number; width: number }) {
  return (
    <View
      style={{ position: 'absolute', top: 0, bottom: 0, left, width }}
      pointerEvents="none"
    >
      <ThemedView tone="accentDim" style={{ flex: 1 }} />
      <ThemedView tone="accent" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, opacity: 0.9 }} />
      <ThemedView tone="accent" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, opacity: 0.9 }} />
      <ThemedView tone="glow" style={{ position: 'absolute', left: -1, top: 0, bottom: 0, width: 2 }} />
      <ThemedView tone="glow" style={{ position: 'absolute', right: -1, top: 0, bottom: 0, width: 2 }} />
    </View>
  );
}

/** "core ↑" rise marker — a thin vertical line with a small label. */
function CoreMarker({ left }: { left: number }) {
  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left }} pointerEvents="none">
      <ThemedView tone="muted" style={{ width: 1, flex: 1, opacity: 0.5 }} />
      <View style={{ position: 'absolute', top: 4, left: 4, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <ThemedText variant="label" tone="muted" style={{ fontSize: 9 }}>
          core ↑
        </ThemedText>
      </View>
    </View>
  );
}
