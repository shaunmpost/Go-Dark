/**
 * Planner — the paid 14-night outlook. The headline benefit of the unlock:
 * tonight's verdict, every night ahead, so you can plan the drive. Uses the
 * exact same scoring as the Tonight screen, so they never disagree.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloseButton } from '@/components/CloseButton';
import { Icon } from '@/components/Icon';
import { planNights } from '@/lib/best-night';
import { minutesToClock } from '@/lib/mock-data';
import { useActiveLocation } from '@/lib/use-active-location';
import { ColorKey, fontFamily, radii, ThemedText, ThemedView } from '@/lib/theme';
import { VerdictState } from '@/lib/types';
import { weightedScore } from '@/lib/verdict';
import { getForecast, WeatherForecast } from '@/lib/weather';

const STATE_TONE: Record<VerdictState, ColorKey> = { GO: 'accent', MAYBE: 'amber', SKIP: 'skip' };
const STATE_LABEL: Record<VerdictState, string> = { GO: 'Go', MAYBE: 'Maybe', SKIP: 'Skip' };
const STATE_RANK: Record<VerdictState, number> = { GO: 2, MAYBE: 1, SKIP: 0 };

export default function PlannerScreen() {
  const router = useRouter();
  const geo = useActiveLocation();
  const now = useMemo(() => new Date(), []);

  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  useEffect(() => {
    getForecast(geo, now).then(setForecast).catch(() => {});
  }, [geo, now]);

  const nights = useMemo(() => planNights(geo, forecast, now), [geo, forecast, now]);
  const bestOffset = useMemo(() => {
    let bi = 0;
    let bk = -Infinity;
    for (const p of nights) {
      const k = STATE_RANK[p.night.state] + weightedScore(p.night.factors);
      if (k > bk) {
        bk = k;
        bi = p.offset;
      }
    }
    return bi;
  }, [nights]);

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="locLabel" tone="faint">
                Forecast
              </ThemedText>
              <ThemedText
                variant="locName"
                tone="text"
                style={{ fontFamily: fontFamily.bold, fontSize: 28, fontWeight: '700', letterSpacing: -0.6, marginTop: 3 }}
              >
                14-night planner
              </ThemedText>
            </View>
            <CloseButton onPress={() => router.back()} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 16 }}>
            <Icon name="pin" size={13} tone="muted" strokeWidth={2} opacity={0.7} />
            <ThemedText variant="fval" tone="muted">
              {geo.label}
            </ThemedText>
          </View>
        </View>
        <ThemedView tone="hairline" style={{ height: 1 }} />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 48, gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {nights.map((p) => {
            const { night } = p;
            const tone = STATE_TONE[night.state];
            const isBest = p.offset === bestOffset && night.state !== 'SKIP';
            return (
              <ThemedView
                key={p.offset}
                tone="panel"
                border={isBest ? 'accent' : 'hairline'}
                style={{
                  borderRadius: radii.md,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View style={{ width: 78 }}>
                  <ThemedText variant="nudgeTitle" tone="text" style={{ fontSize: 16 }}>
                    {p.dayLabel}
                  </ThemedText>
                  <ThemedText variant="fval" tone="faint" style={{ marginTop: 2 }}>
                    {p.dateLabel}
                  </ThemedText>
                </View>

                <View style={{ flex: 1 }}>
                  <ThemedText variant="readout" tone="muted" numberOfLines={1}>
                    {night.window
                      ? `${minutesToClock(night.window.start)} – ${minutesToClock(night.window.end)}`
                      : 'No usable window'}
                  </ThemedText>
                  {isBest ? (
                    <ThemedText variant="foot" tone="accent" style={{ marginTop: 2, letterSpacing: 1 }}>
                      BEST NIGHT
                    </ThemedText>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <ThemedView tone={tone} style={{ width: 9, height: 9, borderRadius: 5 }} />
                  <ThemedText variant="conf" tone={tone} style={{ width: 46 }}>
                    {STATE_LABEL[night.state]}
                  </ThemedText>
                </View>
              </ThemedView>
            );
          })}

          <ThemedText variant="foot" tone="faint" style={{ textAlign: 'center', marginTop: 14 }}>
            {forecast
              ? 'Cloud, transparency & seeing folded in where forecasts reach.'
              : 'Astronomy now · weather fills in when the forecast loads.'}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
