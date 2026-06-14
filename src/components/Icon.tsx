/**
 * Tiny cross-platform icon set drawn with react-native-svg so it renders
 * identically on iOS, Android, and web (no SF Symbols dependency). Stroke
 * color fades smoothly with the theme via reanimated animated props.
 */
import React from 'react';
import Animated, {
  interpolateColor,
  useAnimatedProps,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { ColorKey, fieldPalette, nightPalette, useTheme } from '@/lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const PATHS = {
  // Crescent moon (field-mode toggle)
  moon: 'M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8z',
  // Chevron down
  chevron: 'M6 9l6 6 6-6',
  // Map pin with dot (location)
  pin: 'M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z M12 10m-2.4 0a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0',
  // Check (confidence chip)
  check: 'M20 6 9 17l-5-5',
  // Info circle (Why tonight)
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 16v-4 M12 8h.01',
  // Bell (best-night nudge)
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 22,
  tone = 'text',
  strokeWidth = 1.8,
  fill = false,
}: {
  name: IconName;
  size?: number;
  tone?: ColorKey;
  strokeWidth?: number;
  fill?: boolean;
}) {
  const { t } = useTheme();
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const c = interpolateColor(t.value, [0, 1], [nightPalette[tone], fieldPalette[tone]]);
    return { stroke: c, fill: fill ? c : 'none' };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <AnimatedPath
        d={PATHS[name]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={animatedProps}
      />
    </Svg>
  );
}
