/**
 * Tonight — the v1 screen. Open the app, get the verdict. Everything here is
 * driven by `NightData`; GO / MAYBE / SKIP are mock-exact reference nights and
 * LIVE is the real, end-to-end computed night (astronomy + weather) for the
 * active location (device, or a selected saved location).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DevStateSwitcher } from '@/components/DevStateSwitcher';
import { NightRibbon } from '@/components/NightRibbon';
import { NudgeCard } from '@/components/NudgeCard';
import { Onboarding } from '@/components/Onboarding';
import { Scorecard } from '@/components/Scorecard';
import { TopBar } from '@/components/TopBar';
import { Verdict } from '@/components/Verdict';
import { liveNight, liveNightWithWeather } from '@/lib/night';
import { MOCK_NIGHTS } from '@/lib/mock-data';
import { useStore } from '@/lib/store';
import { useActiveLocation } from '@/lib/use-active-location';
import { ThemedText, ThemedView, useTheme } from '@/lib/theme';
import { NightData } from '@/lib/types';

const PREVIEW_OPTIONS = ['GO', 'MAYBE', 'SKIP', 'LIVE'] as const;
type PreviewKey = (typeof PREVIEW_OPTIONS)[number];

/** Web-only `?demo=GO|MAYBE|SKIP` deep link — renders a populated reference
 * night (handy for sharing a live preview and for marketing screenshots). */
function demoState(): PreviewKey | null {
  if (typeof window === 'undefined') return null;
  const d = new URLSearchParams(window.location.search).get('demo')?.toUpperCase();
  return d === 'GO' || d === 'MAYBE' || d === 'SKIP' ? d : null;
}

export default function TonightScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Production shows the real, computed night. The GO/MAYBE/SKIP mock-exact
  // reference states stay available in dev via the switcher below, or via the
  // `?demo=` deep link on web.
  const demo = demoState();
  const [sel, setSel] = useState<PreviewKey>(demo ?? 'LIVE');

  // Active location (device, or a selected saved location when unlocked).
  const activeLocation = useActiveLocation();
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const hydrated = useStore((s) => s._hydrated);

  // Instant astronomy-only night (never blank while the forecast loads).
  const liveBase = useMemo<NightData | null>(() => {
    try {
      return liveNight(activeLocation);
    } catch {
      return null;
    }
  }, [activeLocation]);

  const [liveFull, setLiveFull] = useState<NightData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // On-demand weather fetch (cached). Runs on open + on location change + pull.
  const refreshLive = useCallback(async () => {
    setRefreshing(true);
    try {
      setLiveFull(await liveNightWithWeather(activeLocation));
    } catch {
      // Leave the astronomy-only night in place on failure.
    } finally {
      setRefreshing(false);
    }
  }, [activeLocation]);

  useEffect(() => {
    setLiveFull(null);
    refreshLive();
  }, [refreshLive]);

  const night: NightData =
    sel === 'LIVE' ? liveFull ?? liveBase ?? MOCK_NIGHTS.GO : MOCK_NIGHTS[sel];

  // Wait for persisted state, then show onboarding once before the app.
  if (!hydrated) return <ThemedView tone="bg" style={{ flex: 1 }} />;
  if (!hasOnboarded && !demo) return <Onboarding />;

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      {/* Sticky header — stays pinned while the page scrolls. */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 24,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.hairline,
          backgroundColor: palette.bg,
          zIndex: 10,
        }}
      >
        <TopBar
          dateLabel={night.dateLabel}
          location={night.locationLabel}
          onPressLocation={() => router.push('/locations')}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 56 }}
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
        {/* Hero — a clean dark sky with the verdict front and center. */}
        <View style={{ position: 'relative' }}>
          <LinearGradient
            colors={[palette.panel, 'transparent']}
            locations={[0, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 280 }}
            pointerEvents="none"
          />
          <View style={{ paddingHorizontal: 24 }}>
            <Verdict night={night} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ marginTop: 28 }}>
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

          {__DEV__ ? (
            <View style={{ marginTop: 28 }}>
              <DevStateSwitcher value={sel} options={PREVIEW_OPTIONS} onChange={setSel} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
