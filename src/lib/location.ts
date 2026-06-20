/**
 * Device location via expo-location. Foreground permission, current position,
 * and a friendly label via reverse geocoding (best-effort). The location's
 * timezone is taken from the device (the user is there), so the night anchors
 * correctly. Returns null if permission is denied or location is unavailable —
 * the app then falls back to the default location.
 */
import * as Location from 'expo-location';
import { Geo } from './types';

/** A typeahead candidate from the geocoder — enough to show and to save. */
export type PlaceCandidate = {
  label: string; // "Joshua Tree"
  sublabel: string; // "California, US"
  latitude: number;
  longitude: number;
  elevationM: number;
  utcOffsetHours: number;
};

/** Build the saveable Geo for a chosen candidate. */
export function candidateToGeo(c: PlaceCandidate): Geo {
  return {
    latitude: c.latitude,
    longitude: c.longitude,
    elevationM: c.elevationM,
    label: c.label,
    utcOffsetHours: c.utcOffsetHours,
  };
}

/**
 * Live place search for the autocomplete. Uses Open-Meteo's free, key-less
 * geocoding API (same provider as the weather) so typing a city, landmark, or
 * zip surfaces matching places to pick from. Returns [] on any failure so the
 * UI can quietly fall back to the on-device geocoder.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const url =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}` +
      `&count=6&language=en&format=json`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const results: any[] = Array.isArray(data?.results) ? data.results : [];
    return results.map((r) => ({
      label: r.name as string,
      sublabel: [r.admin1, r.country_code || r.country].filter(Boolean).join(', '),
      latitude: r.latitude as number,
      longitude: r.longitude as number,
      elevationM: typeof r.elevation === 'number' ? r.elevation : 0,
      // Coarse offset from longitude (good to ~1h — enough to pick the night).
      utcOffsetHours: Math.round((r.longitude as number) / 15),
    }));
  } catch {
    return [];
  }
}

export async function getDeviceLocation(): Promise<Geo | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude, altitude } = pos.coords;

    let label = 'Current location';
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        label = place.city || place.subregion || place.region || place.name || label;
      }
    } catch {
      // Reverse geocoding can fail (e.g. on web); the coordinates still work.
    }

    return {
      latitude,
      longitude,
      elevationM: altitude ?? 0,
      label,
      // Device offset == the location's local offset, since the user is here.
      utcOffsetHours: -new Date().getTimezoneOffset() / 60,
    };
  } catch {
    return null;
  }
}

/**
 * Forward-geocode a typed place name (e.g. "Joshua Tree") to a saveable
 * location. The timezone is estimated from longitude (good to ~1h — enough to
 * pick the right night; a proper tz lookup can refine it later).
 */
export async function geocodePlace(query: string): Promise<Geo | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const results = await Location.geocodeAsync(q);
    if (!results.length) return null;
    const { latitude, longitude } = results[0];

    let label = q;
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) label = place.city || place.subregion || place.region || place.name || q;
    } catch {
      // keep the typed query as the label
    }

    return {
      latitude,
      longitude,
      elevationM: 0,
      label,
      utcOffsetHours: Math.round(longitude / 15),
    };
  } catch {
    return null;
  }
}
