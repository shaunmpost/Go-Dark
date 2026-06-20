/**
 * Tiny cross-platform icon set drawn with react-native-svg so it renders
 * identically on iOS, Android, and web (no SF Symbols dependency). Stroke color
 * comes straight from the current palette (switches with the theme).
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ColorKey, useTheme } from '@/lib/theme';

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
  // Chevron left (back)
  back: 'M15 18l-6-6 6-6',
  // Plus (add location)
  plus: 'M12 5v14 M5 12h14',
  // Lock (paywall)
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
  // Trash (remove saved location)
  trash: 'M3 6h18 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  // Close (dismiss modal)
  close: 'M18 6 6 18 M6 6l12 12',
  // Chevron right (row affordance)
  next: 'M9 6l6 6-6 6',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 22,
  tone = 'text',
  strokeWidth = 1.8,
  fill = false,
  opacity = 1,
}: {
  name: IconName;
  size?: number;
  tone?: ColorKey;
  strokeWidth?: number;
  fill?: boolean;
  opacity?: number;
}) {
  const { palette } = useTheme();
  const c = palette[tone];

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Path
        d={PATHS[name]}
        stroke={c}
        fill={fill ? c : 'none'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
