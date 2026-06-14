/**
 * Night orchestrator — combines on-device astronomy with the (free, on-demand)
 * weather layer into the final, fully-scored NightData.
 *
 *   • liveNight(geo, now)            — instant, astronomy-only (confidence Low).
 *   • liveNightWithWeather(geo, now) — fetches Open-Meteo (+ 7Timer!/NWS),
 *                                      then produces the end-to-end verdict.
 *
 * The UI shows the instant astronomy night immediately, then upgrades it when
 * the forecast resolves — so the screen is never blank waiting on the network.
 */
import { assembleNight, buildRows } from './astro';
import { getForecast } from './weather';
import { Geo, NightData } from './types';

export function liveNight(geo: Geo, now: Date = new Date()): NightData {
  return assembleNight(geo, buildRows(geo, now), null, now);
}

export async function liveNightWithWeather(geo: Geo, now: Date = new Date()): Promise<NightData> {
  const model = buildRows(geo, now);
  const forecast = await getForecast(geo, now);
  return assembleNight(geo, model, forecast, now);
}
