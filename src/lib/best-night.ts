/**
 * Best-night finder — evaluates the next ~14 nights for a location and returns
 * the standout, used by the nudge card. Reuses the exact same astronomy +
 * weather assembly as tonight, so the planner and the verdict can't disagree.
 *
 * Works with or without a forecast: with one it weighs cloud too; without it
 * (offline) it still surfaces the darkest, most moonless, best-core night.
 */
import { assembleNight, buildRows } from './astro';
import { Geo, NightData, VerdictState } from './types';
import { weightedScore } from './verdict';
import { WeatherForecast } from './weather';

const DAY_MS = 86400000;
const HORIZON_DAYS = 14;
const STATE_RANK: Record<VerdictState, number> = { GO: 2, MAYBE: 1, SKIP: 0 };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type PlannedNight = {
  /** Days from now (0 = tonight). */
  offset: number;
  /** e.g. "Tonight", "Fri". */
  dayLabel: string;
  /** e.g. "Jun 21". */
  dateLabel: string;
  night: NightData;
};

/** The next `days` nights, each fully scored — drives the paid planner. */
export function planNights(
  geo: Geo,
  forecast: WeatherForecast | null,
  now: Date,
  days: number = HORIZON_DAYS,
): PlannedNight[] {
  const out: PlannedNight[] = [];
  for (let d = 0; d < days; d++) {
    const when = new Date(now.getTime() + d * DAY_MS);
    const local = new Date(when.getTime() + geo.utcOffsetHours * 3600000);
    out.push({
      offset: d,
      dayLabel: d === 0 ? 'Tonight' : DAY_NAMES[local.getUTCDay()].slice(0, 3),
      dateLabel: `${MONTHS[local.getUTCMonth()]} ${local.getUTCDate()}`,
      night: assembleNight(geo, buildRows(geo, when), forecast, when),
    });
  }
  return out;
}

export function findBestNight(
  geo: Geo,
  forecast: WeatherForecast | null,
  now: Date,
): NightData['bestNight'] {
  let bestKey = -Infinity;
  let bestDay = 0;
  let bestNight: NightData | null = null;

  for (let d = 0; d < HORIZON_DAYS; d++) {
    const when = new Date(now.getTime() + d * DAY_MS);
    const night = assembleNight(geo, buildRows(geo, when), forecast, when);
    // State dominates; weighted score breaks ties within a state.
    const key = STATE_RANK[night.state] + weightedScore(night.factors);
    if (key > bestKey) {
      bestKey = key;
      bestDay = d;
      bestNight = night;
    }
  }

  if (!bestNight) return null;

  const nightDate = new Date(now.getTime() + bestDay * DAY_MS);
  const local = new Date(nightDate.getTime() + geo.utcOffsetHours * 3600000);
  const dayName = DAY_NAMES[local.getUTCDay()];
  const period = bestDay <= 7 ? 'this week' : 'in the next two weeks';

  const title =
    bestDay === 0
      ? `Tonight is already your best night ${period}`
      : bestNight.state === 'SKIP'
        ? `${dayName} is the best of a cloudy stretch`
        : `${dayName} is your best night ${period}`;

  return { title, body: bestNight.headline };
}
