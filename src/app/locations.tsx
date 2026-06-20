/**
 * Locations — manage where Go Dark plans for. The device's current location is
 * always available (free tier). Saved locations and switching between them are
 * part of the one-time unlock; locked users see the gate.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Paywall } from '@/components/Paywall';
import { pickSky } from '@/components/SkyScene';
import { DEFAULT_LOCATION } from '@/config/data-sources';
import { geocodePlace, getDeviceLocation } from '@/lib/location';
import { snapshotFor } from '@/lib/night';
import { useStore } from '@/lib/store';
import { radii, ThemedText, ThemedView, useTheme } from '@/lib/theme';
import { Geo } from '@/lib/types';

function coords(g: Geo) {
  return `${g.latitude.toFixed(2)}°, ${g.longitude.toFixed(2)}°`;
}

/** A location card showing that place's own sky (à la Apple Weather's city list). */
function LocationRow({
  geo,
  label,
  sub,
  selected,
  onSelect,
  onRemove,
}: {
  geo: Geo;
  label: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  const { palette } = useTheme();
  const img = useMemo(() => pickSky(snapshotFor(geo)), [geo.latitude, geo.longitude, geo.utcOffsetHours]);

  return (
    <View
      style={{
        borderRadius: radii.md,
        overflow: 'hidden',
        height: 78,
        borderWidth: 1,
        borderColor: selected ? palette.accent : palette.hairline,
      }}
    >
      <Image source={img} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(6,7,14,0.30)', 'rgba(6,7,14,0.72)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }}>
        <Pressable onPress={onSelect} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: selected ? palette.accent : 'rgba(255,255,255,0.5)',
              backgroundColor: selected ? palette.accentDim : 'transparent',
            }}
          >
            {selected ? <Icon name="check" size={14} tone="accent" strokeWidth={2.6} /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText variant="nudgeTitle" tone="text">
              {label}
            </ThemedText>
            <ThemedText variant="fval" tone="text" style={{ marginTop: 2, opacity: 0.7 }}>
              {sub}
            </ThemedText>
          </View>
        </Pressable>
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${label}`}>
            <Icon name="trash" size={18} tone="text" strokeWidth={1.8} opacity={0.7} />
          </Pressable>
        ) : null}
      </View>
    </View>
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
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const onAddPlace = async () => {
    if (searching || !query.trim()) return;
    setSearching(true);
    setSearchError(null);
    const place = await geocodePlace(query);
    setSearching(false);
    if (place) {
      addLocation(place);
      setQuery('');
    } else {
      setSearchError("Couldn't find that place — try a city or landmark name.");
    }
  };

  const current = device ?? DEFAULT_LOCATION;
  const currentSaved = saved.some(
    (l) => Math.abs(l.latitude - current.latitude) < 0.02 && Math.abs(l.longitude - current.longitude) < 0.02,
  );

  return (
    <ThemedView tone="bg" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 56, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 18 }}>
            <ThemedText variant="locName" tone="text" style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>
              Locations
            </ThemedText>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
              <Glass
                interactive
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radii.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Icon name="close" size={18} tone="muted" strokeWidth={2} />
              </Glass>
            </Pressable>
          </View>

          <ThemedText variant="sectionH" tone="muted" style={{ marginBottom: 4 }}>
            Current
          </ThemedText>
          <LocationRow
            geo={current}
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
                    geo={l}
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
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Glass
                  style={{
                    flex: 1,
                    borderRadius: radii.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    gap: 8,
                    minHeight: 48,
                    overflow: 'hidden',
                  }}
                >
                  <Icon name="pin" size={15} tone="muted" strokeWidth={2} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={onAddPlace}
                    placeholder="City or landmark — e.g. Joshua Tree"
                    placeholderTextColor={palette.faint}
                    returnKeyType="search"
                    autoCorrect={false}
                    style={{ flex: 1, color: palette.text, fontSize: 15, paddingVertical: 12 }}
                  />
                </Glass>
                <Pressable onPress={onAddPlace} disabled={searching || !query.trim()} accessibilityLabel="Add place">
                  <ThemedView
                    tone="accentDim"
                    border="accent"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: radii.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: searching || !query.trim() ? 0.4 : 1,
                    }}
                  >
                    {searching ? (
                      <ActivityIndicator size="small" color={palette.accent} />
                    ) : (
                      <Icon name="plus" size={20} tone="accent" strokeWidth={2.2} />
                    )}
                  </ThemedView>
                </Pressable>
              </View>
              {searchError ? (
                <ThemedText variant="fval" tone="skip" style={{ marginTop: 2 }}>
                  {searchError}
                </ThemedText>
              ) : null}

              <Pressable
                onPress={() => !currentSaved && addLocation(current)}
                disabled={currentSaved}
                style={{ marginTop: 10, opacity: currentSaved ? 0.4 : 1 }}
              >
                <ThemedView
                  tone="panel"
                  border
                  style={{
                    borderRadius: radii.md,
                    paddingVertical: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Icon name="pin" size={16} tone="muted" strokeWidth={2} />
                  <ThemedText variant="toggle" tone="muted">
                    {currentSaved ? 'Current location saved' : 'Save current location'}
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
