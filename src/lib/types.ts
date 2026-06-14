/** Shared domain types for Go Dark. */

export type VerdictState = 'GO' | 'MAYBE' | 'SKIP';
export type Confidence = 'High' | 'Medium' | 'Low';

/** The six factors that feed the weighted verdict score. */
export type FactorKey =
  | 'darkness'
  | 'cloud'
  | 'moon'
  | 'transparency'
  | 'seeing'
  | 'core';

export type Factor = {
  key: FactorKey;
  label: string;
  /** Plain-language value line, e.g. "5h 12m astronomical dark". */
  value: string;
  /** Normalised 0..1 quality used for the bar fill and scoring. */
  score: number;
};

/** A single tick along the dusk -> dawn ribbon (one per ~10 min). */
export type RibbonSample = {
  /** Minutes since 18:00 (6 PM). 0..720 covers 6 PM -> 6 AM. */
  minutes: number;
  /** Galactic-core altitude in degrees (negative = below horizon). */
  coreAlt: number;
  /** Compass direction of the core, e.g. "SE". */
  coreDir: string;
  /** 0..1 cloud cover at this time. */
  cloud: number;
  /** Is the moon above the horizon at this time. */
  moonUp: boolean;
  /** Sky-state summary for the live readout, e.g. "Astro dark · clear". */
  sky: string;
};

export type TimeBand = {
  /** Minutes since 18:00. */
  start: number;
  end: number;
};

export type NightData = {
  locationLabel: string;
  /** Human date label for the night, e.g. "Tonight". */
  dateLabel: string;

  state: VerdictState;
  confidence: Confidence;
  /** One plain-language sentence shown under the verdict word. */
  headline: string;

  /** The recommended shooting window (minutes since 18:00). Null if none. */
  window: TimeBand | null;

  factors: Factor[];

  // Ribbon layers (all in minutes since 18:00).
  darkBand: TimeBand; // astronomical dark
  moonBands: TimeBand[]; // moon above horizon
  cloudBands: TimeBand[]; // meaningful cloud cover
  coreRiseMinutes: number | null; // when the core clears the horizon
  samples: RibbonSample[];

  /** Best upcoming night nudge. */
  bestNight: {
    dayLabel: string; // "Thursday"
    summary: string; // "clear, new moon, core climbs to 28°"
  } | null;

  /** Footer note about forecast confidence. */
  forecastNote: string;
};
