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
