/**
 * Device location via expo-location. Foreground permission, current position,
 * and a friendly label via reverse geocoding (best-effort). The location's
 * timezone is taken from the device (the user is there), so the night anchors
 * correctly. Returns null if permission is denied or location is unavailable —
 * the app then falls back to the default location.
 */
import * as Location from 'expo-location';
import { Geo } from './types';

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
