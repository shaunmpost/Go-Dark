/**
 * Go Dark design system.
 *
 * Two themes, swapped via a single animated `t` value (0 = Night, 1 = Field).
 * Tokens are transcribed directly from the mock; the Field (night-vision red)
 * palette is a full monochrome-red swap. All colored surfaces interpolate
 * between the two palettes over ~0.5s so the toggle feels like a dimmer, not
 * a hard cut.
 */
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type ColorKey =
  | 'bg'
  | 'panel'
  | 'panelStrong'
  | 'text'
  | 'muted'
  | 'faint'
  | 'hairline'
  | 'hairlineStrong'
  | 'accent'
  | 'accentDim'
  | 'amber'
  | 'skip'
  | 'ribbonEdge'
  | 'ribbonCenter'
  | 'moonBand'
  | 'cloudBand';

export type Palette = Record<ColorKey, string>;

/** Night — the default theme. Values lifted straight from the mock. */
export const nightPalette: Palette = {
  bg: '#06070e',
  panel: 'rgba(255,255,255,0.035)',
  panelStrong: 'rgba(255,255,255,0.055)',
  text: '#f2f5fc',
  muted: 'rgba(214,223,245,0.52)',
  faint: 'rgba(214,223,245,0.32)',
  hairline: 'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.14)',
  accent: '#74ecc0',
  accentDim: 'rgba(116,236,192,0.18)',
  amber: '#e8b15c',
  skip: '#e0735f',
  ribbonEdge: '#1a2a55',
  ribbonCenter: '#070912',
  moonBand: 'rgba(120,140,200,0.13)',
  cloudBand: 'rgba(150,165,200,0.30)',
};

/** Field mode — night-vision red. Everything collapses to a single hue. */
export const fieldPalette: Palette = {
  bg: '#0b0100',
  panel: 'rgba(255,60,40,0.05)',
  panelStrong: 'rgba(255,60,40,0.08)',
  text: '#ff5e44',
  muted: 'rgba(255,94,68,0.5)',
  faint: 'rgba(255,94,68,0.3)',
  hairline: 'rgba(255,80,55,0.14)',
  hairlineStrong: 'rgba(255,80,55,0.22)',
  accent: '#ff7a5e',
  accentDim: 'rgba(255,122,94,0.16)',
  amber: '#ff9b6e',
  skip: '#ff5e44',
  ribbonEdge: '#3a0a04',
  ribbonCenter: '#160200',
  moonBand: 'rgba(255,110,80,0.12)',
  cloudBand: 'rgba(255,120,90,0.22)',
};

type ThemeContextValue = {
  fieldMode: boolean;
  toggleFieldMode: () => void;
  /** 0 = night, 1 = field. Animated. */
  t: SharedValue<number>;
  /** Resolved palette for the current mode (non-animated reads). */
  palette: Palette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const t = useSharedValue(0);
  const [fieldMode, setFieldMode] = React.useState(false);

  const toggleFieldMode = useCallback(() => {
    setFieldMode((prev) => {
      const next = !prev;
      t.value = withTiming(next ? 1 : 0, { duration: 500 });
      return next;
    });
  }, [t]);

  const value = useMemo<ThemeContextValue>(
    () => ({ fieldMode, toggleFieldMode, t, palette: fieldMode ? fieldPalette : nightPalette }),
    [fieldMode, toggleFieldMode, t],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** Animated style that interpolates a single color token between the themes. */
function useTokenColor(key: ColorKey, prop: 'color' | 'backgroundColor' | 'borderColor') {
  const { t } = useTheme();
  return useAnimatedStyle(() => {
    'worklet';
    const c = interpolateColor(t.value, [0, 1], [nightPalette[key], fieldPalette[key]]);
    return { [prop]: c } as Record<string, string>;
  });
}

export function useBgColor(key: ColorKey) {
  return useTokenColor(key, 'backgroundColor');
}
export function useTextColor(key: ColorKey) {
  return useTokenColor(key, 'color');
}
export function useBorderColor(key: ColorKey) {
  return useTokenColor(key, 'borderColor');
}

/** Resolve a token's literal value for the current mode (icons, gradients, etc.). */
export function useColorValue(key: ColorKey): string {
  const { palette } = useTheme();
  return palette[key];
}

// --- Typography -------------------------------------------------------------

export const type = {
  hero: { fontSize: 74, fontWeight: '700', letterSpacing: -2, lineHeight: 67 } as TextStyle,
  eyebrow: { fontSize: 12, fontWeight: '600', letterSpacing: 2.4, textTransform: 'uppercase' } as TextStyle,
  conf: { fontSize: 12.5, fontWeight: '600', letterSpacing: 0.3 } as TextStyle,
  sentence: { fontSize: 17, fontWeight: '400', lineHeight: 25.5 } as TextStyle,
  windowTime: { fontSize: 21, fontWeight: '600', letterSpacing: 0.3, fontVariant: ['tabular-nums'] } as TextStyle,
  sectionH: { fontSize: 13, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' } as TextStyle,
  readout: { fontSize: 12.5, fontWeight: '500', letterSpacing: 0.2, fontVariant: ['tabular-nums'] } as TextStyle,
  tick: { fontSize: 10.5, fontWeight: '500', letterSpacing: 0.4, fontVariant: ['tabular-nums'] } as TextStyle,
  toggle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.1 } as TextStyle,
  fname: { fontSize: 14.5, fontWeight: '500', letterSpacing: -0.1 } as TextStyle,
  fval: { fontSize: 12.5, fontWeight: '500', letterSpacing: 0.1 } as TextStyle,
  locLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' } as TextStyle,
  locName: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 } as TextStyle,
  nudgeTitle: { fontSize: 14.5, fontWeight: '600', letterSpacing: -0.1 } as TextStyle,
  nudgeBody: { fontSize: 13, fontWeight: '400', lineHeight: 18.9 } as TextStyle,
  foot: { fontSize: 11, fontWeight: '500', letterSpacing: 0.4 } as TextStyle,
  // generic helpers
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22, letterSpacing: -0.1 } as TextStyle,
  windowSub: { fontSize: 12, fontWeight: '500', letterSpacing: 0.4 } as TextStyle,
};

export const radii = { sm: 10, md: 16, lg: 18, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// --- Themed primitives ------------------------------------------------------

type ThemedTextProps = React.ComponentProps<typeof Animated.Text> & {
  tone?: ColorKey;
  variant?: keyof typeof type;
};

export function ThemedText({ tone = 'text', variant = 'body', style, ...rest }: ThemedTextProps) {
  const colorStyle = useTextColor(tone);
  return <Animated.Text {...rest} style={[type[variant], colorStyle, style]} />;
}

type ThemedViewProps = React.ComponentProps<typeof Animated.View> & {
  tone?: ColorKey;
  border?: ColorKey | boolean;
};

export function ThemedView({ tone, border, style, ...rest }: ThemedViewProps) {
  const bgStyle = useBgColor(tone ?? 'bg');
  const borderKey: ColorKey = border === true ? 'hairline' : (border as ColorKey) || 'hairline';
  const borderStyle = useBorderColor(borderKey);
  return (
    <Animated.View
      {...rest}
      style={[tone ? bgStyle : null, border ? [{ borderWidth: 1 }, borderStyle] : null, style]}
    />
  );
}
