/**
 * Hero verdict — the whole point of the app. Centered, matching the mock:
 * a soft radial glow, an eyebrow, a pulsing status dot beside the verdict word
 * (~74px), a confidence chip, one plain-language sentence, and the shooting
 * window with its duration. Color keys map to the verdict state and still fade
 * with the theme.
 */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Starfield } from './Starfield';
import {
  ColorKey,
  radii,
  ThemedText,
  useBgColor,
  useTheme,
} from '@/lib/theme';
import { NightData, VerdictState } from '@/lib/types';
import { formatDuration, minutesToClock } from '@/lib/mock-data';
import { STATE_COPY } from '@/lib/verdict';

const STATE_TONE: Record<VerdictState, ColorKey> = {
  GO: 'accent',
  MAYBE: 'amber',
  SKIP: 'skip',
};

/** A static status dot with a soft glow — matches the reference's
 * `size-3 ... shadow-[0_0_12px_var(--mint)]`. */
function StatusDot({ tone }: { tone: ColorKey }) {
  const coreColor = useBgColor(tone);
  const { palette } = useTheme();
  return (
    <View
      style={[
        {
          width: 12,
          height: 12,
          borderRadius: 6,
          shadowColor: palette[tone],
          shadowOpacity: 0.95,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        },
        coreColor,
      ]}
    />
  );
}

/** `#rrggbb` → `rgba(...)` for tone-tinted pill fills. */
function tint(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function ConfidenceChip({ confidence, tone }: { confidence: NightData['confidence']; tone: ColorKey }) {
  const { palette } = useTheme();
  const c = palette[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: tint(c, 0.3),
        backgroundColor: tint(c, 0.1),
      }}
    >
      <Icon name={confidence === 'High' ? 'check' : 'info'} size={14} tone={tone} strokeWidth={2.4} />
      <ThemedText variant="conf" tone={tone}>
        {confidence} confidence
      </ThemedText>
    </View>
  );
}

export function Verdict({ night }: { night: NightData }) {
  const tone = STATE_TONE[night.state];

  return (
    <View style={{ paddingTop: 30, paddingBottom: 24 }}>
      <Starfield />
      <View style={{ alignItems: 'center' }}>
        <ThemedText variant="eyebrow" tone="muted" style={{ marginBottom: 12 }}>
          Verdict · {night.dateLabel}
        </ThemedText>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <StatusDot tone={tone} />
          <ThemedText variant="hero" tone={tone}>
            {STATE_COPY[night.state].word}
          </ThemedText>
        </View>

        <View style={{ marginTop: 24 }}>
          <ConfidenceChip confidence={night.confidence} tone={tone} />
        </View>

        <ThemedText
          variant="sentence"
          tone="text"
          style={{ marginTop: 32, maxWidth: 290, textAlign: 'center', opacity: 0.9 }}
        >
          {night.headline}
        </ThemedText>

        {night.window ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 32 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText variant="eyebrow" tone="muted" style={{ letterSpacing: 2.4, marginBottom: 2 }}>
                  Start
                </ThemedText>
                <ThemedText variant="windowTime" tone="text">
                  {minutesToClock(night.window.start)}
                </ThemedText>
              </View>
              <Icon name="next" size={18} tone={tone} strokeWidth={2.2} />
              <View style={{ alignItems: 'flex-start' }}>
                <ThemedText variant="eyebrow" tone="muted" style={{ letterSpacing: 2.4, marginBottom: 2 }}>
                  End
                </ThemedText>
                <ThemedText variant="windowTime" tone="text">
                  {minutesToClock(night.window.end)}
                </ThemedText>
              </View>
            </View>
            <ThemedText variant="windowSub" tone="muted" style={{ marginTop: 8 }}>
              {formatDuration(night.window.end - night.window.start)} shooting window
            </ThemedText>
          </>
        ) : (
          <ThemedText variant="windowSub" tone="faint" style={{ marginTop: 28 }}>
            No usable window tonight
          </ThemedText>
        )}
      </View>
    </View>
  );
}
