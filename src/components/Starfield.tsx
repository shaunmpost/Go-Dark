/**
 * Starfield — the faint scatter of stars behind the hero verdict, matching the
 * mock's twelve hand-placed points. Each gently twinkles (opacity only, on the
 * UI thread) so the hero feels alive without distracting from the verdict.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';

type Star = { top: string; left: string; size: number; delay: number; dur: number };

const STARS: Star[] = [
  { top: '8%', left: '12%', size: 2, delay: 0, dur: 4000 },
  { top: '15%', left: '78%', size: 2.6, delay: 1200, dur: 5000 },
  { top: '22%', left: '32%', size: 2, delay: 600, dur: 4500 },
  { top: '30%', left: '88%', size: 2, delay: 2000, dur: 6000 },
  { top: '44%', left: '8%', size: 2.6, delay: 300, dur: 3800 },
  { top: '52%', left: '94%', size: 2, delay: 1800, dur: 5400 },
  { top: '62%', left: '20%', size: 2, delay: 2400, dur: 4200 },
  { top: '70%', left: '62%', size: 2.6, delay: 900, dur: 5000 },
  { top: '78%', left: '40%', size: 2, delay: 1500, dur: 4700 },
  { top: '85%', left: '82%', size: 2, delay: 400, dur: 5600 },
  { top: '12%', left: '55%', size: 2, delay: 2200, dur: 4400 },
  { top: '38%', left: '48%', size: 2, delay: 1000, dur: 5200 },
];

function TwinkleStar({ star, color }: { star: Star; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      star.delay,
      withRepeat(withTiming(1, { duration: star.dur, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [t, star.delay, star.dur]);

  const style = useAnimatedStyle(() => ({ opacity: 0.25 + t.value * 0.55 }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: star.top as `${number}%`,
          left: star.left as `${number}%`,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function Starfield() {
  const { palette } = useTheme();
  // Stars are white in Night, the red hue in Field — reuse the text color.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map((s, i) => (
        <TwinkleStar key={i} star={s} color={palette.text} />
      ))}
    </View>
  );
}
