/**
 * Hardcoded mock nights for Step 1–3 (static UI + the three verdict states).
 *
 * The GO night reproduces `verdict-night-sky-mock.html` exactly — same window,
 * bands, factor copy, and the same coreAlt/dir/sky formulas behind the live
 * ribbon readout. MAYBE and SKIP are designed variants in the same shape.
 * Shapes match `NightData`, so the computed pipeline drops in unchanged later.
 */
import { NightData, RibbonSample } from './types';

const RIBBON_START_HOUR = 18; // 6 PM
const RIBBON_MINUTES = 720; // through 6 AM
const STEP = 10;

type SampleFns = {
  /** Core altitude in degrees as a function of phase p (0..1); <0 = below horizon. */
  alt: (p: number) => number;
  dir: (p: number) => string;
  moonUp: (p: number) => boolean;
  cloud: (p: number) => number;
  sky: (p: number) => string;
};

function makeSamples(fns: SampleFns): RibbonSample[] {
  const out: RibbonSample[] = [];
  for (let min = 0; min <= RIBBON_MINUTES; min += STEP) {
    const p = min / RIBBON_MINUTES;
    out.push({
      minutes: min,
      coreAlt: fns.alt(p),
      coreDir: fns.dir(p),
      moonUp: fns.moonUp(p),
      cloud: Math.max(0, Math.min(1, fns.cloud(p))),
      sky: fns.sky(p),
    });
  }
  return out;
}

/** Sinusoidal core arc between rise and set phases (matches the mock). */
function sinAlt(riseP: number, setP: number, peak: number) {
  return (p: number) => {
    if (p < riseP || p > setP) return -1;
    return Math.round(peak * Math.sin(Math.PI * ((p - riseP) / (setP - riseP))));
  };
}

/** Shared SE -> S -> SW sweep used across the night. */
const sweepDir = (p: number) => (p < 0.55 ? 'SE' : p < 0.7 ? 'S' : 'SW');

// --- GO: a long clear window, moon down early (mirrors the mock) ------------

export const GO_NIGHT: NightData = {
  locationLabel: 'Pine Ridge Overlook',
  dateLabel: 'Tonight',
  state: 'GO',
  confidence: 'High',
  headline: 'Clear and moonless. The Milky Way core clears the ridge around midnight.',
  window: { start: 342, end: 571 }, // 11:42 PM -> 3:31 AM
  factors: [
    { key: 'darkness', label: 'Darkness', value: 'Astronomical · excellent', score: 0.96 },
    { key: 'cloud', label: 'Cloud cover', value: '4% · clear', score: 0.94 },
    { key: 'moon', label: 'Moon', value: 'Sets 9:30 PM · down all window', score: 0.98 },
    { key: 'transparency', label: 'Transparency', value: 'Above average', score: 0.78 },
    { key: 'seeing', label: 'Seeing', value: 'Fair · some high-altitude turbulence', score: 0.52 },
    { key: 'core', label: 'Core position', value: 'Rises 11:42 · peaks 2:10 SE', score: 0.88 },
  ],
  darkBand: { start: 180, end: 660 },
  moonBands: [{ start: 0, end: 209 }],
  cloudBands: [{ start: 634, end: 720 }],
  coreRiseMinutes: 342,
  nowMinutes: 155,
  sky: { atMinutes: 456, sunAlt: -30, moonUp: false, moonAlt: -12, moonAz: 250, moonIllum: 0.12, coreUp: true, coreAlt: 31, coreAz: 175, cloud: 0.04, starScore: 0.92 },
  samples: makeSamples({
    alt: sinAlt(0.475, 0.96, 33),
    dir: sweepDir,
    moonUp: (p) => p < 0.29,
    cloud: (p) => (p > 0.88 ? 0.45 : 0.04),
    sky: (p) => (p < 0.29 ? 'Moon up · washed out' : p > 0.88 ? 'Clouds moving in' : 'Clear'),
  }),
  bestNight: {
    title: 'Thursday is your best night this month',
    body: 'New moon, clear skies forecast, and the core stays up until nearly 4 AM.',
  },
  forecastNote: 'Forecast firms up over the next 48 hours',
};

// --- MAYBE: clear, but a bright moon washes out the core --------------------

export const MAYBE_NIGHT: NightData = {
  locationLabel: 'Pine Ridge Overlook',
  dateLabel: 'Tonight',
  state: 'MAYBE',
  confidence: 'Medium',
  headline: 'Clear, but the moon washes out the core until about 2 AM.',
  window: { start: 480, end: 640 }, // 2:00 AM -> 4:40 AM
  factors: [
    { key: 'darkness', label: 'Darkness', value: 'Astronomical · excellent', score: 0.85 },
    { key: 'cloud', label: 'Cloud cover', value: '9% · clear', score: 0.86 },
    { key: 'moon', label: 'Moon', value: '78% · sets 2:00 AM', score: 0.3 },
    { key: 'transparency', label: 'Transparency', value: 'Good', score: 0.74 },
    { key: 'seeing', label: 'Seeing', value: 'Average', score: 0.66 },
    { key: 'core', label: 'Core position', value: 'Rises 9:40 · peaks 3:10 S', score: 0.8 },
  ],
  darkBand: { start: 175, end: 665 },
  moonBands: [{ start: 0, end: 480 }],
  cloudBands: [],
  coreRiseMinutes: 280,
  nowMinutes: 155,
  sky: { atMinutes: 480, sunAlt: -30, moonUp: true, moonAlt: 34, moonAz: 150, moonIllum: 0.78, coreUp: true, coreAlt: 22, coreAz: 165, cloud: 0.08, starScore: 0.38 },
  samples: makeSamples({
    alt: sinAlt(0.389, 0.97, 30),
    dir: sweepDir,
    moonUp: (p) => p < 0.667,
    cloud: () => 0.08,
    sky: (p) => (p < 0.667 ? 'Moon up · core washed' : 'Clear'),
  }),
  bestNight: {
    title: 'Thursday is still your best night',
    body: 'New moon and a darker, more transparent sky than tonight.',
  },
  forecastNote: 'Forecast firms up over the next 48 hours',
};

// --- SKIP: clouded out, but the door stays open -----------------------------

export const SKIP_NIGHT: NightData = {
  locationLabel: 'Pine Ridge Overlook',
  dateLabel: 'Tonight',
  state: 'SKIP',
  confidence: 'High',
  headline: 'Thick cloud rolls in after dusk — no usable window tonight.',
  window: null,
  factors: [
    { key: 'darkness', label: 'Darkness', value: 'Astronomical · excellent', score: 0.88 },
    { key: 'cloud', label: 'Cloud cover', value: '86% · overcast', score: 0.1 },
    { key: 'moon', label: 'Moon', value: '34% · sets 11:20 PM', score: 0.7 },
    { key: 'transparency', label: 'Transparency', value: 'Poor', score: 0.18 },
    { key: 'seeing', label: 'Seeing', value: 'Below average', score: 0.34 },
    { key: 'core', label: 'Core position', value: 'Rises 11:35 · peaks 2:05 S', score: 0.8 },
  ],
  darkBand: { start: 180, end: 660 },
  moonBands: [{ start: 0, end: 320 }],
  cloudBands: [{ start: 60, end: 720 }],
  coreRiseMinutes: 275,
  nowMinutes: 155,
  sky: { atMinutes: 420, sunAlt: -30, moonUp: true, moonAlt: 26, moonAz: 200, moonIllum: 0.34, coreUp: true, coreAlt: 28, coreAz: 175, cloud: 0.85, starScore: 0.08 },
  samples: makeSamples({
    alt: sinAlt(0.382, 0.96, 31),
    dir: sweepDir,
    moonUp: (p) => p < 0.444,
    cloud: (p) => (p < 0.083 ? 0.25 : 0.86),
    sky: (p) => (p < 0.083 ? 'Clearing edge' : 'Overcast'),
  }),
  bestNight: {
    title: 'Thursday looks perfect',
    body: 'Clear skies, new moon, and the core climbs to 31° in the south.',
  },
  forecastNote: 'Cloud forecast is in strong agreement across sources',
};

export const MOCK_NIGHTS = {
  GO: GO_NIGHT,
  MAYBE: MAYBE_NIGHT,
  SKIP: SKIP_NIGHT,
} as const;

/** Convert minutes-since-18:00 to a wall-clock label like "10:30 PM". */
export function minutesToClock(min: number): string {
  const total = (RIBBON_START_HOUR * 60 + min) % (24 * 60);
  let h = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Format a minutes duration like "5h 30m". */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export const RIBBON = { startHour: RIBBON_START_HOUR, totalMinutes: RIBBON_MINUTES, step: STEP };
