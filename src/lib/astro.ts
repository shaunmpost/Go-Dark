/**
 * On-device celestial math via `astronomy-engine` — zero cost, no API.
 *
 * Step 4 fills these in: sun twilight events (-6 / -12 / -18°) -> the dark
 * window; moon illumination + rise/set + altitude track; and the Milky Way
 * galactic core (Sagittarius A*) alt/az across the night -> rise / peak / set.
 *
 * Stubbed for Steps 1–3 so the UI runs on `mock-data`. Signatures are stable
 * so wiring real data later is a drop-in.
 */
import { GALACTIC_CORE } from '@/config/data-sources';

export type Geo = { latitude: number; longitude: number; elevationM?: number };

export type CorePoint = { date: Date; altitudeDeg: number; azimuthDeg: number };

/** Placeholder until Step 4. Returns the fixed core coordinates we target. */
export function galacticCoreCoords() {
  return { raHours: GALACTIC_CORE.raHours, decDeg: GALACTIC_CORE.decDeg };
}

// TODO(step 4): twilightWindow(geo, date) -> { astroDark: {start,end}, ... }
// TODO(step 4): moonTrack(geo, date) -> { illumination, rise, set, altitudeAt }
// TODO(step 4): coreTrack(geo, date) -> CorePoint[] across the night
