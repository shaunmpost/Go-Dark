/**
 * Top bar — "Tonight at / <location>" plus the field-mode toggle.
 */
import React from 'react';
import { View } from 'react-native';
import { FieldModeToggle } from './FieldModeToggle';
import { Icon } from './Icon';
import { space, ThemedText } from '@/lib/theme';

export function TopBar({ dateLabel, location }: { dateLabel: string; location: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, paddingRight: space.md }}>
        <ThemedText variant="label" tone="faint">
          {dateLabel} at
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Icon name="pin" size={15} tone="muted" strokeWidth={1.6} />
          <ThemedText variant="h2">{location}</ThemedText>
        </View>
      </View>
      <FieldModeToggle />
    </View>
  );
}
