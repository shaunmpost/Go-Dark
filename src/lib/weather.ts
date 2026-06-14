/**
 * Weather — free sources only, fetched on demand and cached per location+day.
 * Never polled in the background. See `config/data-sources.ts` for endpoints.
 *
 * Step 5 implements the fetchers (Open-Meteo primary; NWS + 7Timer! cross-
 * checks). Stubbed for Steps 1–3 so the UI runs on `mock-data`.
 */
import { Geo } from './astro';

export type CloudCover = {
  /** 0..1 fractions at a given hour. */
  low: number;
  mid: number;
  high: number;
};

export type WeatherForecast = {
  fetchedAt: number;
  /** Hourly cloud cover across the night. */
  cloudByHour: CloudCover[];
  /** Seeing / transparency indices, if available (7Timer!). */
  seeing?: number;
  transparency?: number;
};

// TODO(step 5): fetchOpenMeteo(geo, date) using DATA_SOURCES.openMeteoBaseUrl
// TODO(step 5): fetchNws(geo, date) cross-check
// TODO(step 5): fetchSevenTimer(geo) seeing/transparency
export async function fetchWeather(_geo: Geo, _date: Date): Promise<WeatherForecast | null> {
  // Stub: real implementation lands in Step 5.
  return null;
}
