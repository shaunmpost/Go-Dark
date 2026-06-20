/**
 * Close button — the clean circular outlined control used to dismiss modal
 * screens. Matches the top bar's circular buttons (subtle border + panel fill)
 * so the whole app shares one language.
 */
import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from './Icon';
import { radii, useTheme } from '@/lib/theme';

export function CloseButton({ onPress }: { onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Close"
      style={{
        width: 38,
        height: 38,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.hairlineStrong,
        backgroundColor: palette.panel,
      }}
    >
      <Icon name="close" size={18} tone="muted" strokeWidth={2} />
    </Pressable>
  );
}
