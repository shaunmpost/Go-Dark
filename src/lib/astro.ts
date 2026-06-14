/**
 * On-device celestial math via `astronomy-engine` — zero cost, no API.
 *
 * Computes everything the ribbon and window need from a lat/long + date:
 *   • Sun altitude through the night -> astronomical dark window (sun ≤ -18°).
 *   • Moon altitude + illumination -> moon-up bands and the moon factor.
 *   • The Milky Way galactic core (Sagittarius A*), defined as a custom star,
 *     -> alt/az across the night, rise, peak altitude and compass direction.
 *
 * Cloud / transparency / seeing come from the (free) weather layer in Step 5;
 * here they are left as honest "awaiting forecast" placeholders so the verdict
 * is preliminary and the confidence reflects that.
 */
import * as Astronomy from 'astronomy-engine';
import { GALACTIC_CORE } from '@/config/data-sources';
import { formatDuration, minutesToClock, RIBBON } from './mock-data';
import { Factor, NightData, RibbonSample, TimeBand } from './types';
import { computeConfidence, computeVerdict } from './verdict';

export type Geo = {
  latitude: number;
  longitude: number;
  elevationM?: number;
  label: string;
  /** Location's UTC offset in hours (e.g. -6 for US Mountain in summer). The
   *  ribbon's 6 PM -> 6 AM is anchored to the location's local time, not the
   *  device's, so it works regardless of where the app runs. */
  utcOffsetHours: number;
};

const STEP = RIBBON.step;
const TOTAL = RIBBON.totalMinutes;
const MIN_CORE_ALT = 10; // degrees the core must clear to count as "up enough"

// Register the galactic core once as a user-defined star (J2000 RA/Dec).
Astronomy.DefineStar(Astronomy.Body.Star1, GALACTIC_CORE.raHours, GALACTIC_CORE.decDeg, 26000);
const CORE = Astronomy.Body.Star1;

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function azToCompass(az: number): string {
  return COMPASS[Math.round(az / 45) % 8];
}
function dirWord(dir: string): string {
  const map: Record<string, string> = {
    N: 'north', NE: 'northeast', E: 'east', SE: 'southeast',
    S: 'south', SW: 'southwest', W: 'west', NW: 'northwest',
  };
  return map[dir] ?? 'sky';
}

type Row = { min: number; sun: number; moonAlt: number; coreAlt: number; coreAz: number };

function altAz(body: Astronomy.Body, observer: Astronomy.Observer, date: Date) {
  const time = Astronomy.MakeTime(date);
  const eq = Astronomy.Equator(body, time, observer, true, true);
  const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, 'normal');
  return { alt: hor.altitude, az: hor.azimuth };
}

/** Linear-interpolated crossing minute where `value` passes `threshold`. */
function crossing(rows: Row[], value: (r: Row) => number, threshold: number, rising: boolean): number | null {
  for (let i = 1; i < rows.length; i++) {
    const a = value(rows[i - 1]);
    const b = value(rows[i]);
    if (rising ? a < threshold && b >= threshold : a >= threshold && b < threshold) {
      const f = (threshold - a) / (b - a);
      return Math.round(rows[i - 1].min + f * STEP);
    }
  }
  return null;
}

/** Longest contiguous run of minutes where `ok(row)` holds. */
function longestRun(rows: Row[], ok: (r: Row) => boolean): TimeBand | null {
  let best: TimeBand | null = null;
  let start: number | null = null;
  for (let i = 0; i < rows.length; i++) {
    if (ok(rows[i])) {
      if (start == null) start = rows[i].min;
    } else if (start != null) {
      const band = { start, end: rows[i - 1].min };
      if (!best || band.end - band.start > best.end - best.start) best = band;
      start = null;
    }
  }
  if (start != null) {
    const band = { start, end: rows[rows.length - 1].min };
    if (!best || band.end - band.start > best.end - best.start) best = band;
  }
  return best;
}

/** All contiguous runs where `ok(row)` holds (e.g. moon-up bands). */
function allRuns(rows: Row[], ok: (r: Row) => boolean): TimeBand[] {
  const out: TimeBand[] = [];
  let start: number | null = null;
  for (let i = 0; i < rows.length; i++) {
    if (ok(rows[i])) {
      if (start == null) start = rows[i].min;
    } else if (start != null) {
      out.push({ start, end: rows[i - 1].min });
      start = null;
    }
  }
  if (start != null) out.push({ start, end: rows[rows.length - 1].min });
  return out;
}

function skyState(sun: number, moonUp: boolean, coreAlt: number): string {
  if (sun > 0) return 'Daylight';
  if (sun > -6) return 'Civil twilight';
  if (sun > -12) return 'Nautical twilight';
  if (sun > -18) return 'Astro twilight';
  // Astronomical dark (no weather yet).
  if (moonUp) return 'Dark · moon up';
  if (coreAlt >= MIN_CORE_ALT) return 'Dark · core up';
  return 'Dark · clear';
}

export function computeNight(geo: Geo, now: Date): NightData {
  const observer = new Astronomy.Observer(geo.latitude, geo.longitude, geo.elevationM ?? 0);
  const offMs = geo.utcOffsetHours * 3600000;

  // The location's local calendar date (shift the instant into local time, then
  // read its UTC fields), so "tonight" is the location's tonight.
  const local = new Date(now.getTime() + offMs);
  const lY = local.getUTCFullYear();
  const lM = local.getUTCMonth();
  const lD = local.getUTCDate();

  // The actual UTC instant of 6 PM local at the location.
  const ribbonStart = new Date(Date.UTC(lY, lM, lD, RIBBON.startHour, 0, 0, 0) - offMs);

  // Dense sampling across the night.
  const rows: Row[] = [];
  for (let min = 0; min <= TOTAL; min += STEP) {
    const d = new Date(ribbonStart.getTime() + min * 60000);
    const sun = altAz(Astronomy.Body.Sun, observer, d).alt;
    const moon = altAz(Astronomy.Body.Moon, observer, d);
    const core = altAz(CORE, observer, d);
    rows.push({ min, sun, moonAlt: moon.alt, coreAlt: core.alt, coreAz: core.az });
  }

  const samples: RibbonSample[] = rows.map((r) => ({
    minutes: r.min,
    coreAlt: Math.round(r.coreAlt),
    coreDir: azToCompass(r.coreAz),
    moonUp: r.moonAlt > 0,
    cloud: 0,
    sky: skyState(r.sun, r.moonAlt > 0, r.coreAlt),
  }));

  // Astronomical dark window (largest run sun ≤ -18).
  const darkRun = longestRun(rows, (r) => r.sun <= -18);
  const darkBand: TimeBand = darkRun ?? { start: 0, end: 0 };
  const darkMinutes = darkBand.end - darkBand.start;

  const moonBands = allRuns(rows, (r) => r.moonAlt > 0);
  const coreRiseMinutes = crossing(rows, (r) => r.coreAlt, 0, true);

  // Best window: dark AND core ≥ MIN_CORE_ALT AND moon down.
  const window = longestRun(
    rows,
    (r) => r.sun <= -18 && r.coreAlt >= MIN_CORE_ALT && r.moonAlt <= 0,
  );

  // Core peak (max altitude) + its direction.
  let peak = rows[0];
  for (const r of rows) if (r.coreAlt > peak.coreAlt) peak = r;
  const peakDir = azToCompass(peak.coreAz);
  const peakAltRounded = Math.round(peak.coreAlt);

  // Moon illumination + how much of the dark window it intrudes on.
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, Astronomy.MakeTime(ribbonStart)).phase_fraction;
  const darkRows = rows.filter((r) => r.min >= darkBand.start && r.min <= darkBand.end);
  const moonUpInDark = darkRows.length
    ? darkRows.filter((r) => r.moonAlt > 0).length / darkRows.length
    : 0;
  const moonSet = crossing(rows, (r) => r.moonAlt, 0, false);

  const factors: Factor[] = [
    {
      key: 'darkness',
      label: 'Darkness',
      value: darkMinutes > 0 ? `${formatDuration(darkMinutes)} astronomical dark` : 'No astronomical dark',
      score: Math.max(0, Math.min(1, darkMinutes / 360)),
    },
    {
      key: 'cloud',
      label: 'Cloud cover',
      value: 'Awaiting forecast',
      score: 0.75,
    },
    {
      key: 'moon',
      label: 'Moon',
      value:
        `${Math.round(illum * 100)}% lit` +
        (moonSet != null ? ` · sets ${minutesToClock(moonSet)}` : moonUpInDark > 0.5 ? ' · up most of night' : ' · down'),
      score: Math.max(0, Math.min(1, (1 - illum) * 0.5 + (1 - moonUpInDark) * 0.5)),
    },
    { key: 'transparency', label: 'Transparency', value: 'Awaiting forecast', score: 0.7 },
    { key: 'seeing', label: 'Seeing', value: 'Awaiting forecast', score: 0.6 },
    {
      key: 'core',
      label: 'Core position',
      value:
        coreRiseMinutes != null
          ? `Rises ${minutesToClock(coreRiseMinutes)} · peaks ${peakAltRounded}° ${peakDir}`
          : `Peaks ${peakAltRounded}° ${peakDir}`,
      score: Math.max(0, Math.min(1, peakAltRounded / 40)),
    },
  ];

  const { state } = computeVerdict(factors, { darkMinutes, cloudScore: factors[1].score });
  // Weather not yet wired, so be honest: confidence stays low until Step 5.
  const confidence = computeConfidence(72, 0.4);

  const headline =
    darkMinutes <= 0
      ? 'No astronomical darkness tonight at this latitude.'
      : window
        ? `Astronomical dark from ${minutesToClock(darkBand.start)} to ${minutesToClock(darkBand.end)}; the core peaks ${peakAltRounded}° in the ${dirWord(peakDir)}.`
        : `Dark from ${minutesToClock(darkBand.start)} to ${minutesToClock(darkBand.end)}, but the core stays low and the moon is a factor.`;

  return {
    locationLabel: geo.label,
    dateLabel: 'Tonight',
    state,
    confidence,
    headline,
    window,
    factors,
    darkBand,
    moonBands,
    cloudBands: [],
    coreRiseMinutes,
    samples,
    bestNight: null,
    forecastNote: 'Live on-device astronomy · weather (clouds, transparency, seeing) lands next',
  };
}
