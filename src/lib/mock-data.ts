/**
 * Hardcoded mock nights for Step 1–3 (static UI + the three verdict states).
 *
 * These stand in for the computed `astronomy-engine` + weather pipeline that
 * arrives in later steps. Shapes match `NightData` exactly so swapping in real
 * data is a drop-in replacement.
 */
import { NightData, RibbonSample } from './types';

const RIBBON_START_HOUR = 18; // 6 PM
const RIBBON_MINUTES = 720; // through 6 AM
const STEP = 10;

function coreDirAt(min: number): string {
  if (min < 420) return 'SE';
  if (min < 600) return 'S';
  return 'SW';
}

/** Smooth parabolic arc for the galactic core: rises, transits, descends. */
function coreAltAt(min: number, rise: number, transit: number, peak: number): number {
  const halfArc = transit - rise;
  const k = peak / (halfArc * halfArc);
  const alt = peak - k * (min - transit) * (min - transit);
  return Math.round(alt * 10) / 10;
}

type SampleOpts = {
  coreRise: number;
  coreTransit: number;
  corePeak: number;
  darkStart: number;
  darkEnd: number;
  moonUpUntil: number; // moon above horizon for min < this
  moonUpFrom: number; // ...and for min >= this (set high to disable)
  cloudAt: (min: number) => number;
};

function buildSamples(o: SampleOpts): RibbonSample[] {
  const out: RibbonSample[] = [];
  for (let min = 0; min <= RIBBON_MINUTES; min += STEP) {
    const coreAlt = coreAltAt(min, o.coreRise, o.coreTransit, o.corePeak);
    const moonUp = min < o.moonUpUntil || min >= o.moonUpFrom;
    const cloud = Math.max(0, Math.min(1, o.cloudAt(min)));
    const inDark = min >= o.darkStart && min <= o.darkEnd;

    let sky: string;
    if (!inDark) sky = min < o.darkStart ? 'Twilight' : 'Dawn';
    else if (cloud > 0.55) sky = 'Astro dark · overcast';
    else if (cloud > 0.3) sky = 'Astro dark · clouds building';
    else if (moonUp) sky = 'Astro dark · moon up';
    else sky = 'Astro dark · clear';

    out.push({ minutes: min, coreAlt, coreDir: coreDirAt(min), cloud, moonUp, sky });
  }
  return out;
}

// --- GO: a long clear window, moon down early -------------------------------

export const GO_NIGHT: NightData = {
  locationLabel: 'Pine Ridge Overlook',
  dateLabel: 'Tonight',
  state: 'GO',
  confidence: 'High',
  headline: 'A long, dark, clear window with the core riding high in the south.',
  window: { start: 270, end: 600 }, // 10:30 PM -> 4:00 AM
  factors: [
    { key: 'darkness', label: 'Darkness', value: '5h 12m astronomical dark', score: 0.9 },
    { key: 'cloud', label: 'Cloud cover', value: '8% during the window', score: 0.88 },
    { key: 'moon', label: 'Moon', value: '12% · sets 8:10 PM', score: 0.92 },
    { key: 'transparency', label: 'Transparency', value: 'Above average', score: 0.7 },
    { key: 'seeing', label: 'Seeing', value: 'Average', score: 0.55 },
    { key: 'core', label: 'Core position', value: 'Peaks 31° in the south', score: 0.8 },
  ],
  darkBand: { start: 180, end: 660 },
  moonBands: [{ start: 0, end: 130 }],
  cloudBands: [{ start: 600, end: 660 }],
  coreRiseMinutes: 270,
  samples: buildSamples({
    coreRise: 270,
    coreTransit: 510,
    corePeak: 31,
    darkStart: 180,
    darkEnd: 660,
    moonUpUntil: 130,
    moonUpFrom: 9999,
    cloudAt: (m) => (m > 590 ? (m - 590) / 200 : 0.05),
  }),
  bestNight: {
    dayLabel: 'Tonight',
    summary: 'is already your best night this week — go.',
  },
  forecastNote: 'Forecast confidence is high and firms up further after sunset.',
};

// --- MAYBE: clear, but a bright moon washes out the core --------------------

export const MAYBE_NIGHT: NightData = {
  locationLabel: 'Pine Ridge Overlook',
  dateLabel: 'Tonight',
  state: 'MAYBE',
  confidence: 'Medium',
  headline: 'Clear skies, but the moon washes out the core until about 2 AM.',
  window: { start: 480, end: 640 }, // 2:00 AM -> 4:40 AM
  factors: [
    { key: 'darkness', label: 'Darkness', value: '5h 30m astronomical dark', score: 0.85 },
    { key: 'cloud', label: 'Cloud cover', value: '11% overnight', score: 0.84 },
    { key: 'moon', label: 'Moon', value: '78% · sets 2:00 AM', score: 0.32 },
    { key: 'transparency', label: 'Transparency', value: 'Good', score: 0.72 },
    { key: 'seeing', label: 'Seeing', value: 'Above average', score: 0.68 },
    { key: 'core', label: 'Core position', value: 'Peaks 29° in the south', score: 0.78 },
  ],
  darkBand: { start: 175, end: 665 },
  moonBands: [{ start: 0, end: 480 }],
  cloudBands: [],
  coreRiseMinutes: 280,
  samples: buildSamples({
    coreRise: 280,
    coreTransit: 520,
    corePeak: 29,
    darkStart: 175,
    darkEnd: 665,
    moonUpUntil: 480,
    moonUpFrom: 9999,
    cloudAt: () => 0.08,
  }),
  bestNight: {
    dayLabel: 'Thursday',
    summary: 'is your best night this month — new moon and a clear, transparent sky.',
  },
  forecastNote: 'Forecast confidence is medium; the moonset timing is reliable.',
};

// --- SKIP: clouded out, but the door stays open -----------------------------

export const SKIP_NIGHT: NightData = {
  locationLabel: 'Pine Ridge Overlook',
  dateLabel: 'Tonight',
  state: 'SKIP',
  confidence: 'High',
  headline: 'Thick cloud rolls in after dusk — no usable dark window tonight.',
  window: null,
  factors: [
    { key: 'darkness', label: 'Darkness', value: '5h 18m astronomical dark', score: 0.88 },
    { key: 'cloud', label: 'Cloud cover', value: '84% through the window', score: 0.12 },
    { key: 'moon', label: 'Moon', value: '34% · sets 11:20 PM', score: 0.7 },
    { key: 'transparency', label: 'Transparency', value: 'Poor', score: 0.2 },
    { key: 'seeing', label: 'Seeing', value: 'Below average', score: 0.35 },
    { key: 'core', label: 'Core position', value: 'Peaks 30° in the south', score: 0.8 },
  ],
  darkBand: { start: 180, end: 660 },
  moonBands: [{ start: 0, end: 320 }],
  cloudBands: [{ start: 60, end: 720 }],
  coreRiseMinutes: 275,
  samples: buildSamples({
    coreRise: 275,
    coreTransit: 515,
    corePeak: 30,
    darkStart: 180,
    darkEnd: 660,
    moonUpUntil: 320,
    moonUpFrom: 9999,
    cloudAt: (m) => (m < 60 ? 0.2 : 0.85),
  }),
  bestNight: {
    dayLabel: 'Thursday',
    summary: 'looks perfect — clear, new moon, core climbs to 31° in the south.',
  },
  forecastNote: 'Cloud forecast is in strong agreement across sources.',
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
