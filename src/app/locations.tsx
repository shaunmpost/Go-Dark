/**
 * Locations — manage where Go Dark plans for. The device's current location is
 * always available (free tier). Saved locations and switching between them are
 * part of the one-time unlock; locked users see the gate.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloseButton } from '@/components/CloseButton';
import { Icon } from '@/components/Icon';
import { Paywall } from '@/components/Paywall';
import { DEFAULT_LOCATION } from '@/config/data-sources';
import {
  candidateToGeo,
  geocodePlace,
  getDeviceLocation,
  PlaceCandidate,
  searchPlaces,
} from '@/lib/location';
import { useStore } from '@/lib/store';
import { radii, ThemedText, ThemedView, useTheme } from '@/lib/theme';
import { Geo } from '@/lib/types';

function coords(g: Geo) {
  return `${g.latitude.toFixed(2)}°, ${g.longitude.toFixed(2)}°`;
}

/** A clean outlined location row with a radio, name + coords, optional delete. */
function LocationRow({
  label,
  sub,
  selected,
  onSelect,
  onRemove,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  const { palette } = useTheme();
  return (
    <ThemedView
      tone="panel"
      border={selected ? 'accent' : 'hairline'}
      style={{
        borderRadius: radii.md,
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Pressable onPress={onSelect} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: selected ? palette.accent : palette.hairlineStrong,
            backgroundColor: selected ? palette.accentDim : 'transparent',
          }}
        >
          {selected ? <Icon name="check" size={15} tone="accent" strokeWidth={2.6} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText variant="nudgeTitle" tone="text" style={{ fontSize: 19, fontWeight: '700', letterSpacing: -0.3 }}>
            {label}
          </ThemedText>
          <ThemedText variant="fval" tone="muted" style={{ fontSize: 13.5, marginTop: 3 }}>
            {sub}
          </ThemedText>
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${label}`}>
          <Icon name="trash" size={19} tone="muted" strokeWidth={1.8} />
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

export default function LocationsScreen() {
  const router = useRouter();
  const saved = useStore((s) => s.saved);
  const selectedId = useStore((s) => s.selectedId);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const addLocation = useStore((s) => s.addLocation);
  const removeLocation = useStore((s) => s.removeLocation);
  const selectLocation = useStore((s) => s.selectLocation);
  const { palette } = useTheme();

  const [device, setDevice] = useState<Geo | null>(null);
  useEffect(() => {
    getDeviceLocation().then(setDevice).catch(() => {});
  }, []);

  // Search-and-add any place by name (not just where you are).
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Live autocomplete: debounce typing, then fetch matching places.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setCandidates([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchError(null);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const found = await searchPlaces(q, ctrl.signal);
      setCandidates(found);
      setSearching(false);
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const pickCandidate = (c: PlaceCandidate) => {
    addLocation(candidateToGeo(c));
    setQuery('');
    setCandidates([]);
    setSearchError(null);
  };

  // Fallback when nothing is picked from the list (e.g. an exact zip/landmark).
  const onAddPlace = async () => {
    const q = query.trim();
    if (!q) return;
    if (candidates.length > 0) return pickCandidate(candidates[0]);
    setSearching(true);
    setSearchError(null);
    const place = await geocodePlace(q);
    setSearching(false);
    if (place) {
      addLocation(place);
      setQuery('');
    } else {
      setSearchError("Couldn't find that place — try a city, landmark, or zip.");
    }
  };

  const current = device ?? DEFAULT_LOCATION;
  const currentSaved = saved.some(
    (l) => Math.abs(l.latitude - current.latitude) < 0.02 && Math.abs(l.longitude - current.longitude) < 0.02,
  );

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
              marginBottom: 18,
            }}
          >
            <View style={{ flex: 1 }}>
              <ThemedText variant="locLabel" tone="faint">
                Where to shoot
              </ThemedText>
              <ThemedText
                variant="locName"
                tone="text"
                style={{ fontSize: 28, fontWeight: '700', letterSpacing: -0.6, marginTop: 3 }}
              >
                Locations
              </ThemedText>
            </View>
            <CloseButton onPress={() => router.back()} />
          </View>
        </View>
        <ThemedView tone="hairline" style={{ height: 1 }} />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 56, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText variant="sectionH" tone="muted" style={{ marginBottom: 4 }}>
            Current
          </ThemedText>
          <LocationRow
            label={current.label}
            sub={device ? coords(current) : `${coords(current)} · default`}
            selected={selectedId == null}
            onSelect={() => selectLocation(null)}
          />

          {isUnlocked ? (
            <>
              <ThemedText variant="sectionH" tone="muted" style={{ marginTop: 18, marginBottom: 4 }}>
                Saved
              </ThemedText>
              {saved.length === 0 ? (
                <ThemedText variant="fval" tone="faint" style={{ paddingVertical: 6 }}>
                  No saved locations yet.
                </ThemedText>
              ) : (
                saved.map((l) => (
                  <LocationRow
                    key={l.id}
                    label={l.label}
                    sub={coords(l)}
                    selected={selectedId === l.id}
                    onSelect={() => selectLocation(l.id)}
                    onRemove={() => removeLocation(l.id)}
                  />
                ))
              )}

              <ThemedText variant="sectionH" tone="muted" style={{ marginTop: 18, marginBottom: 4 }}>
                Add a place
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <ThemedView
                  tone="panel"
                  border="hairline"
                  style={{
                    flex: 1,
                    borderRadius: radii.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    gap: 8,
                    minHeight: 54,
                  }}
                >
                  <Icon name="pin" size={15} tone="muted" strokeWidth={2} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={onAddPlace}
                    placeholder="City, landmark, or zip — e.g. Joshua Tree"
                    placeholderTextColor={palette.faint}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="words"
                    style={{ flex: 1, color: palette.text, fontSize: 15, paddingVertical: 12 }}
                  />
                  {searching ? <ActivityIndicator size="small" color={palette.muted} /> : null}
                </ThemedView>
                <Pressable onPress={onAddPlace} disabled={!query.trim()} accessibilityLabel="Add place">
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: radii.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: palette.accent,
                      backgroundColor: palette.accentDim,
                      opacity: !query.trim() ? 0.4 : 1,
                    }}
                  >
                    <Icon name="plus" size={22} tone="accent" strokeWidth={2.2} />
                  </View>
                </Pressable>
              </View>

              {/* Autocomplete results */}
              {candidates.length > 0 ? (
                <ThemedView
                  tone="panel"
                  border="hairline"
                  style={{ borderRadius: radii.md, marginTop: 8, overflow: 'hidden' }}
                >
                  {candidates.map((c, i) => (
                    <Pressable
                      key={`${c.label}-${c.latitude}-${c.longitude}`}
                      onPress={() => pickCandidate(c)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 13,
                        paddingHorizontal: 16,
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: palette.hairline,
                      }}
                    >
                      <Icon name="pin" size={15} tone="muted" strokeWidth={2} />
                      <View style={{ flex: 1 }}>
                        <ThemedText variant="nudgeTitle" tone="text" style={{ fontSize: 15 }}>
                          {c.label}
                        </ThemedText>
                        {c.sublabel ? (
                          <ThemedText variant="fval" tone="muted" style={{ fontSize: 12.5, marginTop: 1 }}>
                            {c.sublabel}
                          </ThemedText>
                        ) : null}
                      </View>
                      <Icon name="plus" size={16} tone="accent" strokeWidth={2.2} />
                    </Pressable>
                  ))}
                </ThemedView>
              ) : null}
              {searchError ? (
                <ThemedText variant="fval" tone="skip" style={{ marginTop: 2 }}>
                  {searchError}
                </ThemedText>
              ) : null}

              <Pressable
                onPress={() => !currentSaved && addLocation(current)}
                disabled={currentSaved}
                style={{ marginTop: 4, opacity: currentSaved ? 0.5 : 1 }}
              >
                <ThemedView
                  tone="panel"
                  border="hairline"
                  style={{
                    borderRadius: radii.md,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Icon name="pin" size={17} tone="accent" strokeWidth={2} />
                  <ThemedText variant="nudgeTitle" tone="text" style={{ flex: 1, fontSize: 16 }}>
                    {currentSaved ? 'Current location saved' : 'Save current location'}
                  </ThemedText>
                  <ThemedText variant="locLabel" tone="faint">
                    GPS
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </>
          ) : (
            <Paywall />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
