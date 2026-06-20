/**
 * Live-sky hero — a full-bleed photographic sky behind the verdict (à la Apple
 * Weather's night view). One of five real images is chosen to match tonight's
 * conditions, with a scrim so the overlaid verdict text stays legible and the
 * photo dissolves seamlessly into the page background at the bottom.
 */
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { SkySnapshot } from '@/lib/types';

const CLEAR = require('../../assets/images/sky/clear.jpg');
const MOONLIT = require('../../assets/images/sky/moonlit.jpg');
const PARTLY = require('../../assets/images/sky/partly.jpg');
const OVERCAST = require('../../assets/images/sky/overcast.jpg');
const TWILIGHT = require('../../assets/images/sky/twilight.jpg');

/** Pick the sky image that best matches the snapshot. */
export function pickSky(s: SkySnapshot): ImageSourcePropType {
  if (s.sunAlt > -12) return TWILIGHT; // still twilight / dusk
  if (s.cloud >= 0.65) return OVERCAST;
  if (s.cloud >= 0.3) return PARTLY;
  if (s.moonUp && s.moonIllum >= 0.5) return MOONLIT;
  return CLEAR;
}

/** `#rrggbb` → `rgba(r,g,b,a)` so the scrim can match the live theme bg. */
function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function SkyScene({ snapshot }: { snapshot: SkySnapshot }) {
  const { palette } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={pickSky(snapshot)} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {/* Legibility scrim: darken top (location) + a touch in the middle
          (verdict), then fade fully into the page background so the photo
          dissolves into black with no visible seam. */}
      <LinearGradient
        colors={[
          rgba(palette.bg, 0.5),
          rgba(palette.bg, 0.26),
          rgba(palette.bg, 0.34),
          rgba(palette.bg, 0.85),
          rgba(palette.bg, 1),
        ]}
        locations={[0, 0.36, 0.64, 0.9, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}
