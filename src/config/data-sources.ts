/**
 * External data sources. Free-only, US/Canada-first.
 *
 * Every base URL is a single config value so we can later point at a
 * self-hosted Open-Meteo / 7Timer! mirror for commercial use without touching
 * the fetch code. Nothing here is paid, keyed, or subscription-based.
 */

export const DATA_SOURCES = {
  /**
   * Open-Meteo — primary cloud cover (low/mid/high), free.
   * NOTE: the hosted tier is non-commercial. For commercial release, point
   * this at a self-hosted Open-Meteo instance.
   */
  openMeteoBaseUrl: 'https://api.open-meteo.com/v1/forecast',

  /** NWS — US cross-check for total sky cover. Free, no key. */
  nwsBaseUrl: 'https://api.weather.gov',

  /** 7Timer! — seeing & transparency. Free; self-mirror later for reliability. */
  sevenTimerBaseUrl: 'https://www.7timer.info/bin/astro.php',
} as const;

/** Galactic core (Sagittarius A*) — fixed celestial coordinates (J2000). */
export const GALACTIC_CORE = {
  raHours: 17 + 45 / 60 + 40 / 3600, // 17h 45m 40s
  decDeg: -(29 + 0 / 60 + 28 / 3600), // -29° 00' 28"
} as const;

/**
 * Hardcoded location for Step 4 (real on-device astronomy). Device + saved
 * locations arrive in Step 6. A dark, high site so the demo has real dark sky.
 */
export const DEFAULT_LOCATION = {
  label: 'Pine Ridge Overlook',
  latitude: 30.67,
  longitude: -104.02,
  elevationM: 2070,
  utcOffsetHours: -5, // US Central (CDT) — simple fixed offset for v1
} as const;

/** Cache policy: fetch on demand only, never poll in the background. */
export const CACHE = {
  /** Treat a cached forecast as fresh for this long (ms). */
  staleAfterMs: 1000 * 60 * 60 * 3, // 3 hours
} as const;
