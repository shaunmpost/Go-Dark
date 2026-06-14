/**
 * DEV ONLY — a segmented control to preview states while the data pipeline is
 * still being built. GO / MAYBE / SKIP are the mock-exact reference nights;
 * LIVE is the real on-device astronomy for the hardcoded location. Remove (or
 * hide behind __DEV__) once the verdict is computed end-to-end in Step 5.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { radii, space, ThemedText, ThemedView } from '@/lib/theme';

export function DevStateSwitcher<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <ThemedText
        variant="foot"
        tone="faint"
        style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.4 }}
      >
        Dev · preview state
      </ThemedText>
      <ThemedView
        tone="panel"
        border
        style={{ flexDirection: 'row', borderRadius: radii.pill, padding: 4 }}
      >
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={{ flex: 1 }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <ThemedView
                tone={active ? 'accentDim' : undefined}
                style={{ paddingVertical: space.sm, borderRadius: radii.pill, alignItems: 'center' }}
              >
                <ThemedText variant="conf" tone={active ? 'accent' : 'muted'}>
                  {opt}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </View>
  );
}
