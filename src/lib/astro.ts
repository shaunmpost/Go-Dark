/**
 * On-device celestial math via `astronomy-engine` — zero cost, no API.
 *
 *   • Sun altitude through the night -> astronomical dark window (sun ≤ -18°).
 *   • Moon altitude + illumination -> moon-up bands and the moon factor.
 *   • The Milky Way galactic core (Sagittarius A*), defined as a custom star,
 *     -> alt/az across the night, rise, peak altitude and compass direction.
 *
 * `buildRows` does the pure astronomy (sync). `assembleNight` turns it into a
 * `NightData`, folding in an optional weather forecast for the cloud /
 * transparency / seeing factors and the final verdict. With no forecast the
 * verdict is preliminary and confidence is Low.
 */
import * as Astronomy from 'astronomy-engine';
import { GALACTIC_CORE } from '@/config/data-sources';
import { formatDuration, minutesToClock, RIBBON } from './mock-data';
import { Factor, Geo, NightData, RibbonSample, SkySnapshot, TimeBand, VerdictState } from './types';
import { computeConfidence, computeVerdict } from './verdict';
import {
  astroAt,
  cloudFractionAt,
  indexToScore,
  seeingWord,
  transparencyWord,
  WeatherForecast,
} from './weather';

const STEP = RIBBON.step;
const TOTAL = RIBBON.totalMinutes;
const MIN_CORE_ALT = 10; // degrees the core must clear to count as "up enough"
const CLOUD_LIMIT = 0.5; // fraction above which the sky is "clouded" for the window

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

type Row = { min: number; sun: number; moonAlt: number; moonAz: number; coreAlt: number; coreAz: number };

export type NightModel = { rows: Row[]; ribbonStart: Date };

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

/** All contiguous runs where `ok(row)` holds. */
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

function skyState(sun: number, moonUp: boolean, coreAlt: number, cloud: number): string {
  if (sun > 0) return 'Daylight';
  if (sun > -6) return 'Civil twilight';
  if (sun > -12) return 'Nautical twilight';
  if (sun > -18) return 'Astro twilight';
  if (cloud > 0.7) return 'Overcast';
  if (cloud > 0.4) return 'Dark · clouds';
  if (moonUp) return 'Dark · moon up';
  if (coreAlt >= MIN_CORE_ALT) return 'Dark · core up';
  return 'Dark · clear';
}

/** Pure astronomy: dense alt/az samples across the night for a location. */
export function buildRows(geo: Geo, now: Date): NightModel {
  const observer = new Astronomy.Observer(geo.latitude, geo.longitude, geo.elevationM ?? 0);
  const offMs = geo.utcOffsetHours * 3600000;

  // The location's local calendar date, so "tonight" is the location's tonight.
  const local = new Date(now.getTime() + offMs);
  const ribbonStart = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), RIBBON.startHour, 0, 0, 0) - offMs,
  );

  const rows: Row[] = [];
  for (let min = 0; min <= TOTAL; min += STEP) {
    const d = new Date(ribbonStart.getTime() + min * 60000);
    const sun = altAz(Astronomy.Body.Sun, observer, d).alt;
    const moon = altAz(Astronomy.Body.Moon, observer, d);
    const core = altAz(CORE, observer, d);
    rows.push({ min, sun, moonAlt: moon.alt, moonAz: moon.az, coreAlt: core.alt, coreAz: core.az });
  }
  return { rows, ribbonStart };
}

function makeHeadline(
  state: VerdictState,
  darkMinutes: number,
  darkBand: TimeBand,
  hasWindow: boolean,
  peakAlt: number,
  peakDir: string,
  avgCloud: number,
  illum: number,
  hasWeather: boolean,
  moonUpInDark: number,
): string {
  if (darkMinutes <= 0) return 'No astronomical darkness tonight at this latitude.';
  const dir = dirWord(peakDir);
  const range = `${minutesToClock(darkBand.start)} to ${minutesToClock(darkBand.end)}`;
  if (state === 'SKIP') {
    if (hasWeather && avgCloud > 0.6) return 'Overcast through the dark window — no usable sky tonight.';
    return `Dark from ${range}, but the core stays low${illum > 0.5 ? ' and the moon is bright' : ''}.`;
  }
  if (state === 'MAYBE') {
    if (hasWeather && avgCloud > 0.3)
      return `Mostly clear, but cloud builds during the window — the core peaks ${peakAlt}° in the ${dir}.`;
    if (moonUpInDark > 0.4 && illum > 0.4)
      return `Clear, but the moon brightens the sky for part of the window. The core peaks ${peakAlt}° in the ${dir}.`;
    return `A workable window — the core peaks ${peakAlt}° in the ${dir}.`;
  }
  const clarity = hasWeather ? (avgCloud < 0.1 ? 'Clear and dark' : 'Mostly clear') : 'Dark';
  return `${clarity} from ${range}; the core peaks ${peakAlt}° in the ${dir}.`;
}

/** Turn the astronomy model (+ optional forecast) into the final NightData. */
export function assembleNight(
  geo: Geo,
  model: NightModel,
  forecast: WeatherForecast | null,
  now: Date,
): NightData {
  const { rows, ribbonStart } = model;
  const msOf = (min: number) => ribbonStart.getTime() + min * 60000;
  const cloudOf = (min: number) => (forecast ? cloudFractionAt(forecast, msOf(min)) ?? 0 : 0);

  const samples: RibbonSample[] = rows.map((r) => {
    const cloud = cloudOf(r.min);
    return {
      minutes: r.min,
      coreAlt: Math.round(r.coreAlt),
      coreDir: azToCompass(r.coreAz),
      moonUp: r.moonAlt > 0,
      cloud,
      sky: skyState(r.sun, r.moonAlt > 0, r.coreAlt, cloud),
    };
  });

  const darkBand: TimeBand = longestRun(rows, (r) => r.sun <= -18) ?? { start: 0, end: 0 };
  const darkMinutes = darkBand.end - darkBand.start;
  const moonBands = allRuns(rows, (r) => r.moonAlt > 0);
  const coreRiseMinutes = crossing(rows, (r) => r.coreAlt, 0, true);

  // Cloud bands (from the forecast-driven samples) and the best window.
  const cloudBands: TimeBand[] = forecast
    ? allRuns(rows, (r) => cloudOf(r.min) >= CLOUD_LIMIT)
    : [];
  const window = longestRun(
    rows,
    (r) => r.sun <= -18 && r.coreAlt >= MIN_CORE_ALT && r.moonAlt <= 0 && (!forecast || cloudOf(r.min) < CLOUD_LIMIT),
  );

  // Core peak.
  let peak = rows[0];
  for (const r of rows) if (r.coreAlt > peak.coreAlt) peak = r;
  const peakDir = azToCompass(peak.coreAz);
  const peakAlt = Math.round(peak.coreAlt);

  // Moon.
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, Astronomy.MakeTime(ribbonStart)).phase_fraction;
  const darkRows = rows.filter((r) => r.min >= darkBand.start && r.min <= darkBand.end);
  const moonUpInDark = darkRows.length ? darkRows.filter((r) => r.moonAlt > 0).length / darkRows.length : 0;
  const moonSet = crossing(rows, (r) => r.moonAlt, 0, false);

  // Cloud factor over the window (or dark band).
  const span = window ?? (darkMinutes > 0 ? darkBand : null);
  let cloudScore = 0.75;
  let cloudValue = 'Awaiting forecast';
  let avgCloud = 0;
  if (forecast) {
    const inSpan = span
      ? samples.filter((s) => s.minutes >= span.start && s.minutes <= span.end)
      : samples;
    avgCloud = inSpan.length ? inSpan.reduce((a, s) => a + s.cloud, 0) / inSpan.length : 0;
    cloudScore = 1 - avgCloud;
    cloudValue = `${Math.round(avgCloud * 100)}% ${span ? 'during the window' : 'overnight'}`;
  }

  // Transparency + seeing from 7Timer! at the window centre.
  const centerMs = msOf(span ? (span.start + span.end) / 2 : 360);
  const a = forecast ? astroAt(forecast, centerMs) : null;
  const transScore = a ? indexToScore(a.transparency) : 0.7;
  const seeingScore = a ? indexToScore(a.seeing) : 0.6;

  // Sky snapshot for the live-sky hero — a representative moment (the window
  // midpoint, else the core's peak, else local midnight).
  const snapMin = span ? Math.round((span.start + span.end) / 2) : peak.coreAlt > 0 ? peak.min : 360;
  const snapRow = rows.reduce(
    (best, r) => (Math.abs(r.min - snapMin) < Math.abs(best.min - snapMin) ? r : best),
    rows[0],
  );
  const snapCloud = cloudOf(snapRow.min);
  const darknessF = snapRow.sun <= -18 ? 1 : snapRow.sun <= -12 ? 0.5 : snapRow.sun <= -6 ? 0.2 : 0.05;
  const moonWash = snapRow.moonAlt > 0 ? 0.55 * illum : 0;
  const sky: SkySnapshot = {
    atMinutes: snapRow.min,
    sunAlt: snapRow.sun,
    moonUp: snapRow.moonAlt > 0,
    moonAlt: snapRow.moonAlt,
    moonAz: snapRow.moonAz,
    moonIllum: illum,
    coreUp: snapRow.coreAlt > 0,
    coreAlt: snapRow.coreAlt,
    coreAz: snapRow.coreAz,
    cloud: snapCloud,
    starScore: Math.max(0, Math.min(1, darknessF * (1 - snapCloud) * transScore * (1 - moonWash))),
  };

  const factors: Factor[] = [
    {
      key: 'darkness',
      label: 'Darkness',
      value: darkMinutes > 0 ? `${formatDuration(darkMinutes)} astronomical dark` : 'No astronomical dark',
      score: Math.max(0, Math.min(1, darkMinutes / 360)),
    },
    { key: 'cloud', label: 'Cloud cover', value: cloudValue, score: cloudScore },
    {
      key: 'moon',
      label: 'Moon',
      value:
        `${Math.round(illum * 100)}% lit` +
        (moonSet != null ? ` · sets ${minutesToClock(moonSet)}` : moonUpInDark > 0.5 ? ' · up most of night' : ' · down'),
      score: Math.max(0, Math.min(1, (1 - illum) * 0.5 + (1 - moonUpInDark) * 0.5)),
    },
    {
      key: 'transparency',
      label: 'Transparency',
      value: a ? transparencyWord(a.transparency) : 'Awaiting forecast',
      score: transScore,
    },
    {
      key: 'seeing',
      label: 'Seeing',
      value: a ? seeingWord(a.seeing) : 'Awaiting forecast',
      score: seeingScore,
    },
    {
      key: 'core',
      label: 'Core position',
      value:
        coreRiseMinutes != null
          ? `Rises ${minutesToClock(coreRiseMinutes)} · peaks ${peakAlt}° ${peakDir}`
          : `Peaks ${peakAlt}° ${peakDir}`,
      score: Math.max(0, Math.min(1, peakAlt / 40)),
    },
  ];

  const { state } = computeVerdict(factors, { darkMinutes, cloudScore });

  let confidence: NightData['confidence'] = 'Low';
  if (forecast) {
    const startMin = window ? window.start : darkBand.start;
    const leadHours = Math.max(0, (msOf(startMin) - now.getTime()) / 3600000);
    confidence = computeConfidence(leadHours, forecast.agreement);
  }

  return {
    locationLabel: geo.label,
    dateLabel: 'Tonight',
    state,
    confidence,
    headline: makeHeadline(state, darkMinutes, darkBand, !!window, peakAlt, peakDir, avgCloud, illum, !!forecast, moonUpInDark),
    window,
    factors,
    darkBand,
    moonBands,
    cloudBands,
    coreRiseMinutes,
    samples,
    sky,
    bestNight: null,
    forecastNote: forecast
      ? `Cloud from ${forecast.sources.join(' · ')} · fetched on open, cached`
      : 'Live on-device astronomy · weather unavailable (offline)',
  };
}

/** Convenience: astronomy-only night (no weather). */
export function computeNight(geo: Geo, now: Date): NightData {
  return assembleNight(geo, buildRows(geo, now), null, now);
}
