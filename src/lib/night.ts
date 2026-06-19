/**
 * Night orchestrator — combines on-device astronomy with the (free, on-demand)
 * weather layer into the final, fully-scored NightData, and attaches the
 * multi-day best-night nudge.
 *
 *   • liveNight(geo, now)            — instant, astronomy-only (confidence Low).
 *   • liveNightWithWeather(geo, now) — fetches Open-Meteo (+ 7Timer!/NWS),
 *                                      then produces the end-to-end verdict.
 *
 * The UI shows the instant astronomy night immediately, then upgrades it when
 * the forecast resolves — so the screen is never blank waiting on the network.
 */
import { assembleNight, buildRows } from './astro';
import { findBestNight } from './best-night';
import { getForecast } from './weather';
import { Geo, NightData } from './types';

export function liveNight(geo: Geo, now: Date = new Date()): NightData {
  const night = assembleNight(geo, buildRows(geo, now), null, now);
  return { ...night, bestNight: findBestNight(geo, null, now) };
}

export async function liveNightWithWeather(geo: Geo, now: Date = new Date()): Promise<NightData> {
  const forecast = await getForecast(geo, now);
  const night = assembleNight(geo, buildRows(geo, now), forecast, now);
  return { ...night, bestNight: findBestNight(geo, forecast, now) };
}
