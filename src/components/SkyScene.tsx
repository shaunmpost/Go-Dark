/**
 * Live-sky hero — a full-bleed photographic sky behind the verdict (à la Apple
 * Weather's night view). One of five real images is chosen to match tonight's
 * conditions, with a scrim so the overlaid verdict text stays legible.
 */
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SkySnapshot } from '@/lib/types';

const CLEAR = require('../../assets/images/sky/clear.jpg');
const MOONLIT = require('../../assets/images/sky/moonlit.jpg');
const PARTLY = require('../../assets/images/sky/partly.jpg');
const OVERCAST = require('../../assets/images/sky/overcast.jpg');
const TWILIGHT = require('../../assets/images/sky/twilight.jpg');

/** Pick the sky image that best matches the snapshot. */
function pickSky(s: SkySnapshot): ImageSourcePropType {
  if (s.sunAlt > -12) return TWILIGHT; // still twilight / dusk
  if (s.cloud >= 0.65) return OVERCAST;
  if (s.cloud >= 0.3) return PARTLY;
  if (s.moonUp && s.moonIllum >= 0.5) return MOONLIT;
  return CLEAR;
}

export function SkyScene({ snapshot }: { snapshot: SkySnapshot }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={pickSky(snapshot)} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {/* Legibility scrim: darken top (location) + a touch in the middle
          (verdict), and fade into the page background at the bottom. */}
      <LinearGradient
        colors={['rgba(6,7,14,0.50)', 'rgba(6,7,14,0.26)', 'rgba(6,7,14,0.34)', 'rgba(6,7,14,0.95)']}
        locations={[0, 0.38, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}
