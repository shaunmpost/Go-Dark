/**
 * Verdict scoring weights — the single tunable config for the verdict.
 *
 * The verdict is a transparent, weighted sum over the six normalised factor
 * scores (0..1). Keeping the weights here means the "personality" of the app
 * lives in one file. Weights are relative; they need not sum to 1 (the scorer
 * normalises).
 */
import { FactorKey, VerdictState } from '@/lib/types';

export const FACTOR_WEIGHTS: Record<FactorKey, number> = {
  // A usable dark window is the precondition for everything else.
  darkness: 0.28,
  // Clouds during the window are the single most common deal-breaker.
  cloud: 0.26,
  // A bright high moon washes out the core even on clear nights.
  moon: 0.18,
  // Transparency gates faint nebulosity / Milky Way contrast.
  transparency: 0.12,
  // Seeing matters more for planetary than wide-field, so weighted lighter.
  seeing: 0.06,
  // Where the core sits drives whether the night is "worth it" for MW work.
  core: 0.1,
};

/** Score thresholds (0..1 weighted score) that map to the three states. */
export const VERDICT_THRESHOLDS: Record<Exclude<VerdictState, 'SKIP'>, number> = {
  GO: 0.7,
  MAYBE: 0.45,
};

/**
 * Hard gates that force a SKIP regardless of the weighted score. Even a high
 * average is meaningless if there is simply no dark sky, or it is clouded out
 * for the whole window.
 */
export const HARD_GATES = {
  /** Minimum astronomical-dark window, in minutes, to consider going out. */
  minDarkMinutes: 45,
  /** Cloud score (0 = overcast, 1 = clear) below which the window is unusable. */
  minCloudScore: 0.25,
};
