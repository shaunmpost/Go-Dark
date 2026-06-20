/**
 * Glass — a translucent surface that uses iOS 26's native Liquid Glass
 * (expo-glass-effect) when available, and falls back to a tasteful translucent
 * panel everywhere else (older iOS, Android, web, or Reduce Transparency).
 * Used for floating controls (toggles, close buttons, chips) so they read like
 * the system's glass over the photographic sky.
 */
import React from 'react';
import { View, ViewProps } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useTheme } from '@/lib/theme';

let HAS_GLASS = false;
try {
  HAS_GLASS = isLiquidGlassAvailable();
} catch {
  HAS_GLASS = false;
}

type GlassProps = ViewProps & {
  /** Optional tint over the glass. */
  tint?: string;
  /** Interactive (press) glass response. */
  interactive?: boolean;
};

export function Glass({ style, tint, interactive, children, ...rest }: GlassProps) {
  const { palette } = useTheme();

  if (HAS_GLASS) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        tintColor={tint}
        isInteractive={interactive}
        style={style}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[{ backgroundColor: 'rgba(14,16,26,0.55)', borderWidth: 1, borderColor: palette.hairline }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
