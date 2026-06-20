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
import { Glass } from './Glass';
import { Icon } from './Icon';
import { radii, useTheme } from '@/lib/theme';

export function FieldModeToggle() {
  const { toggleFieldMode, fieldMode } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={toggleFieldMode}
        onPressIn={() => (scale.value = withTiming(0.92, { duration: 120 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 160 }))}
        accessibilityRole="switch"
        accessibilityState={{ checked: fieldMode }}
        accessibilityLabel="Field mode (night-vision red)"
        hitSlop={10}
      >
        <Glass
          interactive
          style={{
            width: 42,
            height: 42,
            borderRadius: radii.pill,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Icon name="moon" size={19} tone="text" strokeWidth={2} />
        </Glass>
      </Pressable>
    </Animated.View>
  );
}
