/**
 * Go Dark design system.
 *
 * Two palettes (Night default, Field night-vision red), swapped instantly via
 * React state when the moon toggle flips `fieldMode`. (An earlier version
 * cross-faded every color on the UI thread with Reanimated worklets; that was
 * the cause of a release-build crash, so colors now switch directly. A smooth
 * transition can be reintroduced later with a safer, coarse-grained technique.)
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Text, TextProps, TextStyle, View, ViewProps } from 'react-native';

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
  accent: '#73ffb8',
  accentDim: 'rgba(115,255,184,0.12)',
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
  /** Resolved palette for the current mode. */
  palette: Palette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [fieldMode, setFieldMode] = useState(false);
  const toggleFieldMode = useCallback(() => setFieldMode((prev) => !prev), []);

  const value = useMemo<ThemeContextValue>(
    () => ({ fieldMode, toggleFieldMode, palette: fieldMode ? fieldPalette : nightPalette }),
    [fieldMode, toggleFieldMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// Color helpers — return plain style objects for the current palette.
export function useBgColor(key: ColorKey) {
  const { palette } = useTheme();
  return { backgroundColor: palette[key] };
}
export function useTextColor(key: ColorKey) {
  const { palette } = useTheme();
  return { color: palette[key] };
}
export function useBorderColor(key: ColorKey) {
  const { palette } = useTheme();
  return { borderColor: palette[key] };
}

/** Resolve a token's literal value for the current mode (icons, gradients, etc.). */
export function useColorValue(key: ColorKey): string {
  const { palette } = useTheme();
  return palette[key];
}

// --- Typography -------------------------------------------------------------

// Font families (loaded in app/_layout.tsx). Space Grotesk is the display face
// for the verdict word and the times; Inter is the body face everywhere else.
export const fontFamily = {
  displayMedium: 'SpaceGrotesk_500Medium',
  displaySemibold: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const type = {
  hero: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 80,
    fontWeight: '500',
    letterSpacing: 4,
    lineHeight: 82,
    textTransform: 'uppercase',
  } as TextStyle,
  eyebrow: { fontFamily: fontFamily.semibold, fontSize: 10.5, fontWeight: '600', letterSpacing: 3.2, textTransform: 'uppercase' } as TextStyle,
  conf: { fontFamily: fontFamily.semibold, fontSize: 12.5, fontWeight: '600', letterSpacing: 0.2 } as TextStyle,
  sentence: { fontFamily: fontFamily.regular, fontSize: 16, fontWeight: '400', lineHeight: 26 } as TextStyle,
  windowTime: { fontFamily: fontFamily.displaySemibold, fontSize: 24, fontWeight: '600', letterSpacing: 0.2, fontVariant: ['tabular-nums'] } as TextStyle,
  sectionH: { fontFamily: fontFamily.semibold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' } as TextStyle,
  readout: { fontFamily: fontFamily.medium, fontSize: 12.5, fontWeight: '500', letterSpacing: 0.2, fontVariant: ['tabular-nums'] } as TextStyle,
  tick: { fontFamily: fontFamily.medium, fontSize: 10.5, fontWeight: '500', letterSpacing: 0.4, fontVariant: ['tabular-nums'] } as TextStyle,
  toggle: { fontFamily: fontFamily.semibold, fontSize: 15, fontWeight: '600', letterSpacing: -0.1 } as TextStyle,
  fname: { fontFamily: fontFamily.medium, fontSize: 14.5, fontWeight: '500', letterSpacing: -0.1 } as TextStyle,
  fval: { fontFamily: fontFamily.medium, fontSize: 12.5, fontWeight: '500', letterSpacing: 0.1 } as TextStyle,
  locLabel: { fontFamily: fontFamily.semibold, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' } as TextStyle,
  locName: { fontFamily: fontFamily.semibold, fontSize: 16, fontWeight: '600', letterSpacing: -0.2 } as TextStyle,
  nudgeTitle: { fontFamily: fontFamily.semibold, fontSize: 14.5, fontWeight: '600', letterSpacing: -0.1 } as TextStyle,
  nudgeBody: { fontFamily: fontFamily.regular, fontSize: 13, fontWeight: '400', lineHeight: 18.9 } as TextStyle,
  foot: { fontFamily: fontFamily.medium, fontSize: 11, fontWeight: '500', letterSpacing: 0.4 } as TextStyle,
  // generic helpers
  body: { fontFamily: fontFamily.regular, fontSize: 15, fontWeight: '400', lineHeight: 22, letterSpacing: -0.1 } as TextStyle,
  windowSub: { fontFamily: fontFamily.medium, fontSize: 12, fontWeight: '500', letterSpacing: 0.4 } as TextStyle,
};

export const radii = { sm: 10, md: 16, lg: 18, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// --- Themed primitives ------------------------------------------------------

type ThemedTextProps = TextProps & {
  tone?: ColorKey;
  variant?: keyof typeof type;
};

export function ThemedText({ tone = 'text', variant = 'body', style, ...rest }: ThemedTextProps) {
  const { palette } = useTheme();
  return <Text {...rest} style={[type[variant], { color: palette[tone] }, style]} />;
}

type ThemedViewProps = ViewProps & {
  tone?: ColorKey;
  border?: ColorKey | boolean;
};

export function ThemedView({ tone, border, style, ...rest }: ThemedViewProps) {
  const { palette } = useTheme();
  const borderKey: ColorKey = border === true ? 'hairline' : (border as ColorKey) || 'hairline';
  return (
    <View
      {...rest}
      style={[
        tone ? { backgroundColor: palette[tone] } : null,
        border ? { borderWidth: 1, borderColor: palette[borderKey] } : null,
        style,
      ]}
    />
  );
}
