/**
 * Live-sky hero — a full-bleed depiction of tonight's sky for the location,
 * sitting behind the verdict (à la Apple Weather's night view). Driven by the
 * computed `SkySnapshot`: a twilight-aware gradient, stars whose density tracks
 * darkness/clarity, the moon at its real phase + position, drifting clouds by
 * cover, and a soft Milky Way core glow when the core is up. Pure SVG +
 * gradients — no worklets.
 */
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, RadialGradient, Stop } from 'react-native-svg';
import { SkySnapshot } from '@/lib/types';

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const rng = mulberry32(11);
  return Array.from({ length: 150 }, () => ({ x: rng(), y: rng(), b: rng() }));
})();

const CLOUDS = (() => {
  const rng = mulberry32(7);
  return Array.from({ length: 8 }, () => ({ x: rng(), y: 0.05 + rng() * 0.5, s: 0.75 + rng() * 0.7 }));
})();

/** Sky gradient by how far the sun is below the horizon (twilight → night). */
function skyGradient(sunAlt: number): [string, string, string] {
  if (sunAlt <= -18) return ['#05060e', '#090f20', '#101a33'];
  if (sunAlt <= -12) return ['#070c1c', '#101a3c', '#21345f'];
  if (sunAlt <= -6) return ['#0e1430', '#26386a', '#43538f'];
  if (sunAlt <= 0) return ['#1a1a3c', '#473365', '#7e5f82'];
  return ['#234a86', '#3f6db0', '#7aa8d8'];
}

export function SkyScene({ snapshot }: { snapshot: SkySnapshot }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;
  const grad = skyGradient(snapshot.sunAlt);

  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  // Azimuth (centred on south) → x, altitude → y.
  const xOf = (az: number) => Math.max(12, Math.min(w - 12, w / 2 + ((az - 180) / 110) * (w * 0.5)));
  const yOf = (alt: number) => Math.max(10, Math.min(h - 10, h * 0.88 - (Math.max(0, Math.min(60, alt)) / 60) * (h * 0.74)));

  const star = snapshot.starScore;
  const moonR = Math.max(13, Math.min(22, h * 0.075));
  const mx = xOf(snapshot.moonAz);
  const my = yOf(Math.max(snapshot.moonAlt, 6));
  // Shadow circle offset that yields ~illuminated fraction (lit on the right).
  const shadowCx = mx - 2 * moonR * snapshot.moonIllum;

  const stars = useMemo(() => STARS, []);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <LinearGradient colors={grad} locations={[0, 0.62, 1]} style={StyleSheet.absoluteFill} />

      {w > 0 && h > 0 ? (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="core" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#e6e9f7" stopOpacity={0.5} />
              <Stop offset="45%" stopColor="#cdd6ef" stopOpacity={0.18} />
              <Stop offset="100%" stopColor="#cdd6ef" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#f4f6ff" stopOpacity={0.45} />
              <Stop offset="100%" stopColor="#f4f6ff" stopOpacity={0} />
            </RadialGradient>
            <ClipPath id="moonClip">
              <Circle cx={mx} cy={my} r={moonR} />
            </ClipPath>
          </Defs>

          {/* Milky Way core glow */}
          {snapshot.coreUp && star > 0.15 ? (
            <Ellipse
              cx={xOf(snapshot.coreAz)}
              cy={yOf(snapshot.coreAlt)}
              rx={w * 0.3}
              ry={h * 0.22}
              fill="url(#core)"
              opacity={0.35 + 0.5 * star}
            />
          ) : null}

          {/* Stars */}
          {star > 0.04
            ? stars.map((s, i) => (
                <Circle
                  key={i}
                  cx={s.x * w}
                  cy={s.y * h * 0.9}
                  r={0.5 + s.b * 1.3}
                  fill="#ffffff"
                  opacity={(0.2 + 0.8 * s.b) * star}
                />
              ))
            : null}

          {/* Moon */}
          {snapshot.moonUp ? (
            <G>
              <Circle cx={mx} cy={my} r={moonR * 2.3} fill="url(#moonGlow)" />
              <G clipPath="url(#moonClip)">
                <Circle cx={mx} cy={my} r={moonR} fill="#eef1fa" />
                <Circle cx={shadowCx} cy={my} r={moonR} fill={grad[1]} />
              </G>
            </G>
          ) : null}

          {/* Clouds */}
          {snapshot.cloud > 0.05
            ? CLOUDS.slice(0, Math.max(1, Math.round(snapshot.cloud * CLOUDS.length))).map((c, i) => (
                <Ellipse
                  key={`c${i}`}
                  cx={c.x * w}
                  cy={c.y * h}
                  rx={w * 0.26 * c.s}
                  ry={h * 0.1 * c.s}
                  fill="#9aa6c4"
                  opacity={0.12 + 0.4 * snapshot.cloud}
                />
              ))
            : null}
        </Svg>
      ) : null}

      {/* Scrim for text legibility over the scene */}
      <LinearGradient
        colors={['rgba(5,6,12,0.18)', 'rgba(5,6,12,0.34)', 'rgba(5,6,12,0.10)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}
