/**
 * Top bar — "Tonight at / <location>" (tap to manage locations) + the
 * field-mode toggle.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { FieldModeToggle } from './FieldModeToggle';
import { Icon } from './Icon';
import { space, ThemedText } from '@/lib/theme';

export function TopBar({
  dateLabel,
  location,
  onPressLocation,
}: {
  dateLabel: string;
  location: string;
  onPressLocation?: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable
        onPress={onPressLocation}
        disabled={!onPressLocation}
        style={{ flex: 1, paddingRight: space.md }}
        accessibilityRole="button"
        accessibilityLabel="Change location"
      >
        <ThemedText variant="locLabel" tone="faint">
          {dateLabel} at
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Icon name="pin" size={13} tone="text" strokeWidth={2} opacity={0.7} />
          <ThemedText variant="locName" tone="text">
            {location}
          </ThemedText>
        </View>
      </Pressable>
      <FieldModeToggle />
    </View>
  );
}
