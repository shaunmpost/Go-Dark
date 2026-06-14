/**
 * Tonight — the v1 screen. Open the app, get the verdict. Everything here is
 * driven by `NightData`; GO / MAYBE / SKIP are mock-exact reference nights and
 * LIVE is the real, end-to-end computed night (astronomy + weather) for the
 * hardcoded location.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DevStateSwitcher } from '@/components/DevStateSwitcher';
import { NightRibbon } from '@/components/NightRibbon';
import { NudgeCard } from '@/components/NudgeCard';
import { Scorecard } from '@/components/Scorecard';
import { TopBar } from '@/components/TopBar';
import { Verdict } from '@/components/Verdict';
import { DEFAULT_LOCATION } from '@/config/data-sources';
import { liveNight, liveNightWithWeather } from '@/lib/night';
import { MOCK_NIGHTS } from '@/lib/mock-data';
import { ThemedText, ThemedView, useTheme } from '@/lib/theme';
import { NightData } from '@/lib/types';

const PREVIEW_OPTIONS = ['GO', 'MAYBE', 'SKIP', 'LIVE'] as const;
type PreviewKey = (typeof PREVIEW_OPTIONS)[number];

export default function TonightScreen() {
  const { palette } = useTheme();
  const [sel, setSel] = useState<PreviewKey>('GO');

  // Instant astronomy-only night (never blank while the forecast loads).
  const liveBase = useMemo<NightData | null>(() => {
    try {
      return liveNight(DEFAULT_LOCATION);
    } catch {
      return null;
    }
  }, []);

  const [liveFull, setLiveFull] = useState<NightData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // On-demand weather fetch (cached). Runs once on open, plus pull-to-refresh.
  const refreshLive = useCallback(async () => {
    setRefreshing(true);
    try {
      setLiveFull(await liveNightWithWeather(DEFAULT_LOCATION));
    } catch {
      // Leave the astronomy-only night in place on failure.
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshLive();
  }, [refreshLive]);

  const night: NightData =
    sel === 'LIVE' ? liveFull ?? liveBase ?? MOCK_NIGHTS.GO : MOCK_NIGHTS[sel];

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 56 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            sel === 'LIVE' ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshLive}
                tintColor={palette.muted}
                colors={[palette.accent]}
                progressBackgroundColor={palette.bg}
              />
            ) : undefined
          }
        >
          <View style={{ marginTop: 18, marginBottom: 30 }}>
            <TopBar dateLabel={night.dateLabel} location={night.locationLabel} />
          </View>

          <Verdict night={night} />

          <View style={{ marginTop: 36 }}>
            <NightRibbon key={sel} night={night} />
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
