/**
 * Weather — free sources only, fetched on demand and cached per location+day.
 * Never polled in the background (that's what keeps a one-time purchase viable).
 *
 *   • Open-Meteo   — primary: hourly cloud cover (total + low/mid/high).
 *   • 7Timer!      — seeing + transparency indices (3-hourly).
 *   • NWS          — US cross-check (total sky cover) used only to gauge source
 *                    agreement -> confidence.
 *
 * Every fetch is best-effort and defensively parsed: if a source is blocked or
 * offline, it's skipped and the night degrades gracefully (Open-Meteo failing
 * just means no weather, and the caller falls back to astronomy-only).
 */
import { CACHE, DATA_SOURCES } from '@/config/data-sources';
import { Geo } from './types';

const HOUR = 3600;

export type CloudHour = { hour: number; total: number; low: number; mid: number; high: number };
export type AstroHour = { hour: number; cloudIdx: number; seeing: number; transparency: number };

export type WeatherForecast = {
  fetchedAt: number;
  /** Open-Meteo hourly cloud cover. `hour` = unix seconds (UTC, top of hour). */
  clouds: CloudHour[];
  /** 7Timer! astro series (3-hourly). Empty if unavailable. */
  astro: AstroHour[];
  /** Whether the NWS cross-check contributed. */
  usedNws: boolean;
  /** Source agreement 0..1, for confidence. */
  agreement: number;
  sources: string[];
};

// --- Fetchers ---------------------------------------------------------------

async function fetchOpenMeteo(geo: Geo): Promise<CloudHour[]> {
  const url =
    `${DATA_SOURCES.openMeteoBaseUrl}?latitude=${geo.latitude}&longitude=${geo.longitude}` +
    `&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high` +
    `&forecast_days=16&timeformat=unixtime&timezone=UTC`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const j: any = await res.json();
  const h = j?.hourly;
  if (!h?.time?.length) throw new Error('open-meteo: no hourly data');
  return h.time.map((t: number, i: number) => ({
    hour: t,
    total: h.cloud_cover?.[i] ?? 0,
    low: h.cloud_cover_low?.[i] ?? 0,
    mid: h.cloud_cover_mid?.[i] ?? 0,
    high: h.cloud_cover_high?.[i] ?? 0,
  }));
}

async function fetchSevenTimer(geo: Geo): Promise<AstroHour[]> {
  const url =
    `${DATA_SOURCES.sevenTimerBaseUrl}?lon=${geo.longitude}&lat=${geo.latitude}` +
    `&ac=0&unit=metric&output=json&tzshift=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`7timer ${res.status}`);
  const j: any = await res.json();
  const init: string = j?.init;
  const series: any[] = j?.dataseries;
  if (!init || !Array.isArray(series)) throw new Error('7timer: bad shape');
  const initMs = Date.UTC(
    +init.slice(0, 4),
    +init.slice(4, 6) - 1,
    +init.slice(6, 8),
    +init.slice(8, 10),
  );
  return series.map((d) => ({
    hour: Math.floor((initMs + d.timepoint * HOUR * 1000) / 1000),
    cloudIdx: d.cloudcover,
    seeing: d.seeing,
    transparency: d.transparency,
  }));
}

/** NWS total sky cover (US only). Two-step; best-effort. */
async function fetchNws(geo: Geo): Promise<CloudHour[]> {
  const headers = { 'User-Agent': DATA_SOURCES.nwsUserAgent, Accept: 'application/geo+json' };
  const pRes = await fetch(`${DATA_SOURCES.nwsBaseUrl}/points/${geo.latitude},${geo.longitude}`, { headers });
  if (!pRes.ok) throw new Error(`nws points ${pRes.status}`);
  const grid = (await pRes.json())?.properties?.forecastGridData;
  if (!grid) throw new Error('nws: no grid url');
  const gRes = await fetch(grid, { headers });
  if (!gRes.ok) throw new Error(`nws grid ${gRes.status}`);
  const values: any[] = (await gRes.json())?.properties?.skyCover?.values ?? [];
  return values.map((v) => {
    const start = String(v.validTime).split('/')[0];
    return { hour: Math.floor(Date.parse(start) / 1000 / HOUR) * HOUR, total: v.value ?? 0, low: 0, mid: 0, high: 0 };
  });
}

// --- Orchestration + cache --------------------------------------------------

const cache = new Map<string, WeatherForecast>();

function cacheKey(geo: Geo, now: Date): string {
  const local = new Date(now.getTime() + geo.utcOffsetHours * 3600000);
  const day = `${local.getUTCFullYear()}-${local.getUTCMonth()}-${local.getUTCDate()}`;
  return `${geo.latitude.toFixed(3)},${geo.longitude.toFixed(3)}:${day}`;
}

function avg(arr: CloudHour[], fromMs: number, toMs: number): number | null {
  const xs = arr.filter((c) => c.hour * 1000 >= fromMs && c.hour * 1000 <= toMs).map((c) => c.total);
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length / 100;
}

/**
 * Fetch (or return cached) forecast for a location+day. Open-Meteo is required;
 * 7Timer! and NWS are best-effort. Returns null only if Open-Meteo fails.
 */
export async function getForecast(geo: Geo, now: Date): Promise<WeatherForecast | null> {
  const key = cacheKey(geo, now);
  const cached = cache.get(key);
  if (cached && now.getTime() - cached.fetchedAt < CACHE.staleAfterMs) return cached;

  let clouds: CloudHour[];
  try {
    clouds = await fetchOpenMeteo(geo);
  } catch {
    return null; // no primary cloud data -> astronomy-only
  }

  const [astroRes, nwsRes] = await Promise.allSettled([fetchSevenTimer(geo), fetchNws(geo)]);
  const astro = astroRes.status === 'fulfilled' ? astroRes.value : [];
  const nws = nwsRes.status === 'fulfilled' ? nwsRes.value : [];

  const sources = ['Open-Meteo'];
  if (astro.length) sources.push('7Timer!');

  // Source agreement over the next 12h (Open-Meteo vs NWS total cloud).
  let agreement = 0.6; // single-source baseline
  if (nws.length) {
    const omAvg = avg(clouds, now.getTime(), now.getTime() + 12 * 3600000);
    const nwsAvg = avg(nws, now.getTime(), now.getTime() + 12 * 3600000);
    if (omAvg != null && nwsAvg != null) {
      agreement = Math.max(0, Math.min(1, 1 - Math.abs(omAvg - nwsAvg)));
      sources.push('NWS');
    }
  }

  const forecast: WeatherForecast = {
    fetchedAt: now.getTime(),
    clouds,
    astro,
    usedNws: nws.length > 0,
    agreement,
    sources,
  };
  cache.set(key, forecast);
  return forecast;
}

// --- Accessors --------------------------------------------------------------

/** Cloud fraction (0..1) nearest to an instant, or null if out of range. */
export function cloudFractionAt(fc: WeatherForecast, ms: number): number | null {
  const target = Math.floor(ms / 1000 / HOUR) * HOUR;
  let best: CloudHour | null = null;
  let bd = Infinity;
  for (const c of fc.clouds) {
    const d = Math.abs(c.hour - target);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best && bd <= 2 * HOUR ? best.total / 100 : null;
}

/** Nearest 7Timer! astro entry to an instant (within 3h), or null. */
export function astroAt(fc: WeatherForecast, ms: number): AstroHour | null {
  const target = Math.floor(ms / 1000);
  let best: AstroHour | null = null;
  let bd = Infinity;
  for (const a of fc.astro) {
    const d = Math.abs(a.hour - target);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best && bd <= 3 * HOUR ? best : null;
}

/** 7Timer! index (1 best .. 8 worst) -> 0..1 quality score. */
export function indexToScore(idx: number): number {
  return Math.max(0, Math.min(1, 1 - (idx - 1) / 7));
}

export function transparencyWord(idx: number): string {
  if (idx <= 2) return 'Excellent';
  if (idx === 3) return 'Good';
  if (idx <= 5) return 'Average';
  if (idx === 6) return 'Poor';
  return 'Very poor';
}

export function seeingWord(idx: number): string {
  if (idx <= 2) return 'Excellent';
  if (idx === 3) return 'Good';
  if (idx <= 5) return 'Average';
  if (idx === 6) return 'Below average';
  return 'Poor';
}
