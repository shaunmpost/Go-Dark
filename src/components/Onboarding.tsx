/**
 * First-run onboarding. Three plain screens whose entire job is to make it
 * unmistakable: Go Dark is an astrophotography forecast. Shown once (gated by
 * the store's `hasOnboarded`), then never again.
 */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { useStore } from '@/lib/store';
import { ColorKey, radii, space, ThemedText, ThemedView } from '@/lib/theme';

type Verdict = { tone: ColorKey; label: string; body: string };

const STEPS: {
  icon: IconName;
  fill?: boolean;
  title: string;
  tagline?: string;
  body: string;
  verdicts?: Verdict[];
}[] = [
  {
    icon: 'moon',
    fill: true,
    title: 'Go Dark',
    tagline: 'The astrophotography forecast',
    body: 'Open the app and instantly know whether tonight is worth heading out to shoot the night sky — without reading a single chart.',
  },
  {
    icon: 'check',
    title: 'One clear verdict',
    body: 'No charts to decode. Just one call — scored from darkness, clouds, the moon, and where the Milky Way core sits.',
    verdicts: [
      { tone: 'accent', label: 'Go', body: 'Clear, dark, moonless — get out and shoot.' },
      { tone: 'amber', label: 'Maybe', body: 'Workable, but there’s a catch.' },
      { tone: 'skip', label: 'Skip', body: 'Not tonight — and here’s your next good night.' },
    ],
  },
  {
    icon: 'pin',
    title: 'Tonight, where you are',
    body: 'Go Dark computes tonight’s sky for your exact spot — twilight, the moon, the galactic core, and the weather. It all runs on your device and never leaves your phone.',
  },
];

export function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  const next = () => (last ? completeOnboarding() : setStep((i) => i + 1));

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, paddingHorizontal: 28 }}>
          {/* Skip */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', height: 44, alignItems: 'center' }}>
            {!last ? (
              <Pressable onPress={completeOnboarding} hitSlop={10}>
                <ThemedText variant="toggle" tone="muted">
                  Skip
                </ThemedText>
              </Pressable>
            ) : null}
          </View>

          {/* Content */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedView
              tone="accentDim"
              style={{ width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}
            >
              <Icon name={s.icon} size={34} tone="accent" fill={s.fill} />
            </ThemedView>

            {s.tagline ? (
              <ThemedText variant="eyebrow" tone="accent" style={{ marginBottom: 12, letterSpacing: 2 }}>
                {s.tagline}
              </ThemedText>
            ) : null}

            <ThemedText
              tone="text"
              style={{ fontSize: 30, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center', lineHeight: 36 }}
            >
              {s.title}
            </ThemedText>

            <ThemedText
              variant="sentence"
              tone="muted"
              style={{ textAlign: 'center', marginTop: 14, maxWidth: 320 }}
            >
              {s.body}
            </ThemedText>

            {s.verdicts ? (
              <View style={{ marginTop: 26, gap: 14, alignSelf: 'stretch', paddingHorizontal: 8 }}>
                {s.verdicts.map((v) => (
                  <View key={v.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <ThemedView tone={v.tone} style={{ width: 12, height: 12, borderRadius: 6 }} />
                    <ThemedText variant="nudgeTitle" tone="text" style={{ width: 58 }}>
                      {v.label}
                    </ThemedText>
                    <ThemedText variant="fval" tone="muted" style={{ flex: 1 }}>
                      {v.body}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* Dots + button */}
          <View style={{ paddingBottom: space.lg, gap: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
              {STEPS.map((_, i) => (
                <ThemedView
                  key={i}
                  tone={i === step ? 'accent' : 'hairlineStrong'}
                  style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4 }}
                />
              ))}
            </View>

            <Pressable onPress={next}>
              <ThemedView
                tone="accent"
                style={{ borderRadius: radii.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <ThemedText variant="toggle" tone="bg">
                  {last ? 'Get started' : 'Next'}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
