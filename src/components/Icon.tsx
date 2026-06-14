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
  // Feather "moon"
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  // Chevron down
  chevron: 'M6 9l6 6 6-6',
  // Map pin
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z',
  pinDot: 'M12 10.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0',
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
