/**
 * Tonight — the v1 screen. Open the app, get the verdict. Everything here is
 * driven by `NightData`; Step 1 feeds it from `mock-data`, later steps swap in
 * the computed astronomy + weather pipeline with no UI changes.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DevStateSwitcher } from '@/components/DevStateSwitcher';
import { NightRibbon } from '@/components/NightRibbon';
import { NudgeCard } from '@/components/NudgeCard';
import { Scorecard } from '@/components/Scorecard';
import { TopBar } from '@/components/TopBar';
import { Verdict } from '@/components/Verdict';
import { DEFAULT_LOCATION } from '@/config/data-sources';
import { computeNight } from '@/lib/astro';
import { MOCK_NIGHTS } from '@/lib/mock-data';
import { ThemedText, ThemedView } from '@/lib/theme';
import { NightData } from '@/lib/types';

const PREVIEW_OPTIONS = ['GO', 'MAYBE', 'SKIP', 'LIVE'] as const;
type PreviewKey = (typeof PREVIEW_OPTIONS)[number];

export default function TonightScreen() {
  const [sel, setSel] = useState<PreviewKey>('GO');

  // Real on-device astronomy for the hardcoded location (Step 4).
  const live = useMemo<NightData | null>(() => {
    try {
      return computeNight(DEFAULT_LOCATION, new Date());
    } catch {
      return null;
    }
  }, []);

  const night: NightData = sel === 'LIVE' ? live ?? MOCK_NIGHTS.GO : MOCK_NIGHTS[sel];

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 56 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 18, marginBottom: 30 }}>
            <TopBar dateLabel={night.dateLabel} location={night.locationLabel} />
          </View>

          <Verdict night={night} />

          <View style={{ marginTop: 36 }}>
            <NightRibbon night={night} />
          </View>

          <View style={{ marginTop: 28 }}>
            <Scorecard factors={night.factors} />
          </View>

          <View style={{ marginTop: 26 }}>
            <NudgeCard night={night} />
          </View>

          <ThemedText variant="foot" tone="faint" style={{ textAlign: 'center', marginTop: 30 }}>
            {night.forecastNote}
          </ThemedText>

          <View style={{ marginTop: 28 }}>
            <DevStateSwitcher value={sel} options={PREVIEW_OPTIONS} onChange={setSel} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
