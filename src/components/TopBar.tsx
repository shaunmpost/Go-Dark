/**
 * Top bar — "Tonight at / <location>" (tap to manage locations) + the
 * field-mode toggle.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { FieldModeToggle } from './FieldModeToggle';
import { Icon } from './Icon';
import { radii, space, ThemedText, useTheme } from '@/lib/theme';

export function TopBar({
  dateLabel,
  location,
  onPressLocation,
}: {
  dateLabel: string;
  location: string;
  onPressLocation?: () => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable
        onPress={onPressLocation}
        disabled={!onPressLocation}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingRight: space.md }}
        accessibilityRole="button"
        accessibilityLabel="Change location"
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radii.pill,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.accentDim,
            backgroundColor: palette.panel,
          }}
        >
          <Icon name="pin" size={19} tone="accent" strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText variant="locLabel" tone="faint" style={{ fontSize: 10, letterSpacing: 2.2 }}>
            {dateLabel} at
          </ThemedText>
          <ThemedText
            variant="locName"
            tone="text"
            numberOfLines={1}
            style={{ fontSize: 16, fontWeight: '600', letterSpacing: -0.2, marginTop: 3 }}
          >
            {location}
          </ThemedText>
        </View>
      </Pressable>
      <FieldModeToggle />
    </View>
  );
}
