/**
 * Tonight — the v1 screen. Open the app, get the verdict. Everything here is
 * driven by `NightData`; Step 1 feeds it from `mock-data`, later steps swap in
 * the computed astronomy + weather pipeline with no UI changes.
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DevStateSwitcher } from '@/components/DevStateSwitcher';
import { NightRibbon } from '@/components/NightRibbon';
import { NudgeCard } from '@/components/NudgeCard';
import { Scorecard } from '@/components/Scorecard';
import { TopBar } from '@/components/TopBar';
import { Verdict } from '@/components/Verdict';
import { MOCK_NIGHTS } from '@/lib/mock-data';
import { space, ThemedText, ThemedView } from '@/lib/theme';
import { VerdictState } from '@/lib/types';

export default function TonightScreen() {
  const [state, setState] = useState<VerdictState>('GO');
  const night = MOCK_NIGHTS[state];

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.xl,
            paddingTop: space.md,
            paddingBottom: space.xxl * 2,
            gap: space.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <TopBar dateLabel={night.dateLabel} location={night.locationLabel} />

          <View style={{ marginTop: space.sm }}>
            <Verdict night={night} />
          </View>

          <NightRibbon night={night} />

          <Scorecard factors={night.factors} />

          <NudgeCard night={night} />

          <ThemedText variant="mono" tone="faint" style={{ textAlign: 'center', marginTop: space.xs }}>
            {night.forecastNote}
          </ThemedText>

          <DevStateSwitcher value={state} onChange={setState} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
