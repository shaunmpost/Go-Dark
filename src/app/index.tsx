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
import { ThemedText, ThemedView } from '@/lib/theme';
import { VerdictState } from '@/lib/types';

export default function TonightScreen() {
  const [state, setState] = useState<VerdictState>('GO');
  const night = MOCK_NIGHTS[state];

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 56 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 10, marginBottom: 30 }}>
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
            <DevStateSwitcher value={state} onChange={setState} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
