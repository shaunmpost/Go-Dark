/**
 * Night ribbon — the signature element.
 *
 * A horizontal dusk -> dawn track (6 PM -> 6 AM) with stacked layers:
 *   • sky gradient (bright twilight at the edges, darkest mid-night)
 *   • hatched moon-up band(s)
 *   • translucent cloud band(s)
 *   • the glowing "best window" band with a label
 *   • a "core ↑" rise marker
 * A draggable handle scrubs it (Reanimated + gesture-handler, runs on the UI
 * thread); a live readout in the section header shows time, core altitude/
 * direction, and sky state at the handle. Tap-to-jump is supported too.
 */
import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { radii, ThemedText, ThemedView, useColorValue } from '@/lib/theme';
import { NightData, TimeBand } from '@/lib/types';
import { minutesToClock, RIBBON } from '@/lib/mock-data';

const TRACK_H = 112;
const TOTAL = RIBBON.totalMinutes;

const HOUR_TICKS = ['6 PM', '9 PM', '12 AM', '3 AM', '6 AM'];

const ABSOLUTE_FILL = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };

function clamp(v: number, lo: number, hi: number) {
  'worklet';
  return Math.min(Math.max(v, lo), hi);
}

/** `#rrggbb` → `rgba(...)` for the mint best-window box. */
function tint(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

export function NightRibbon({ night }: { night: NightData }) {
  const [w, setW] = useState(0);
  const initialMin = night.window ? (night.window.start + night.window.end) / 2 : 360;
  const [readoutIdx, setReadoutIdx] = useState(() => Math.round(initialMin / RIBBON.step));

  const trackW = useSharedValue(0);
  const handleMin = useSharedValue(initialMin);

  const hatchA = useColorValue('ribbonEdge');
  const hatchB = useColorValue('ribbonCenter');

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setW(width);
    trackW.value = width;
  };

  const xOf = (min: number) => (w === 0 ? 0 : (min / TOTAL) * w);

  useAnimatedReaction(
    () => Math.round(handleMin.value / RIBBON.step),
    (idx, prev) => {
      if (idx !== prev) {
        runOnJS(setReadoutIdx)(Math.min(Math.max(idx, 0), night.samples.length - 1));
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
    <View>
      {/* Section header with live readout */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 16,
        }}
      >
        <ThemedText variant="sectionH" tone="muted">
          The night
        </ThemedText>
        <ThemedText variant="readout" tone="text" style={{ flexShrink: 1, textAlign: 'right' }}>
          <ThemedText variant="readout" tone="accent">
            {minutesToClock(sample.minutes)}
          </ThemedText>
          {`  ·  ${coreText}  ·  ${sample.sky}`}
        </ThemedText>
      </View>

      {/* Track */}
      <GestureDetector gesture={gesture}>
        <ThemedView
          border
          onLayout={onLayout}
          style={{ height: TRACK_H, borderRadius: radii.lg, overflow: 'hidden' }}
        >
          <ThemedView tone="ribbonCenter" style={ABSOLUTE_FILL} />

          {w > 0 && (
            <>
              {/* Flat diagonal hatch across the whole track. */}
              <Svg width={w} height={TRACK_H} style={ABSOLUTE_FILL}>
                <Defs>
                  <Pattern
                    id="hatch"
                    patternUnits="userSpaceOnUse"
                    width={12}
                    height={12}
                    patternTransform="rotate(135)"
                  >
                    <Rect x={0} y={0} width={6} height={12} fill={hatchA} />
                    <Rect x={6} y={0} width={6} height={12} fill={hatchB} />
                  </Pattern>
                </Defs>
                <Rect x={0} y={0} width={w} height={TRACK_H} fill="url(#hatch)" opacity={0.55} />
              </Svg>

              {/* Best-window glow band */}
              {night.window && (
                <BestWindowBand
                  left={xOf(night.window.start)}
                  width={xOf(night.window.end) - xOf(night.window.start)}
                />
              )}

              {/* Core rise marker */}
              {night.coreRiseMinutes != null && <CoreMarker left={xOf(night.coreRiseMinutes)} />}

              {/* Scrub handle */}
              <Animated.View
                style={[{ position: 'absolute', top: -4, bottom: -4, width: 2, marginLeft: -1 }, handleStyle]}
                pointerEvents="none"
              >
                <ThemedView tone="text" style={{ flex: 1 }} />
                <View style={{ position: 'absolute', top: -5, left: -5, width: 11, height: 11 }}>
                  <ThemedView tone="text" style={{ flex: 1, borderRadius: 6 }} />
                </View>
              </Animated.View>
            </>
          )}
        </ThemedView>
      </GestureDetector>

      {/* Hour ticks */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, marginTop: 9 }}>
        {HOUR_TICKS.map((label) => (
          <ThemedText key={label} variant="tick" tone="faint">
            {label}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

/** The recommended shooting window — a rounded, glowing mint box. */
function BestWindowBand({ left, width }: { left: number; width: number }) {
  const accent = useColorValue('accent');
  return (
    <View
      style={{
        position: 'absolute',
        top: 8,
        bottom: 8,
        left,
        width,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: tint(accent, 0.6),
        backgroundColor: tint(accent, 0.15),
        shadowColor: accent,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      }}
      pointerEvents="none"
    >
      {width >= 64 ? (
        <ThemedText
          numberOfLines={1}
          variant="eyebrow"
          tone="accent"
          style={{ position: 'absolute', top: 5, left: 7, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' }}
        >
          Best window
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Core-rise marker — a faint vertical line. */
function CoreMarker({ left }: { left: number }) {
  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left }} pointerEvents="none">
      <ThemedView tone="text" style={{ width: 1, flex: 1, opacity: 0.35 }} />
    </View>
  );
}
