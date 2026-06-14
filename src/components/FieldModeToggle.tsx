/**
 * Field-mode toggle — the moon icon, top-right. Swaps the whole app into
 * night-vision red (and back) with a ~0.5s color transition handled by the
 * theme. Subtle press scale for feedback.
 */
import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import { radii, ThemedView, useTheme } from '@/lib/theme';

export function FieldModeToggle() {
  const { toggleFieldMode, fieldMode } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={toggleFieldMode}
        onPressIn={() => (scale.value = withTiming(0.9, { duration: 120 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 160 }))}
        accessibilityRole="switch"
        accessibilityState={{ checked: fieldMode }}
        accessibilityLabel="Field mode (night-vision red)"
        hitSlop={10}
      >
        <ThemedView
          tone="panel"
          border
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.pill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="moon" size={20} tone={fieldMode ? 'accent' : 'muted'} />
        </ThemedView>
      </Pressable>
    </Animated.View>
  );
}
