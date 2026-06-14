/**
 * The verdict — a transparent, weighted score over the six factors.
 *
 * Tuning lives entirely in `config/verdict-weights.ts`. This module is pure:
 * given factor scores (0..1) plus a couple of hard-gate inputs, it returns a
 * state, a 0..1 score, and a confidence. Step 5 wires the real factor inputs;
 * the math here does not change.
 */
import { FACTOR_WEIGHTS, HARD_GATES, VERDICT_THRESHOLDS } from '@/config/verdict-weights';
import { Confidence, Factor, VerdictState } from './types';

export type VerdictResult = {
  state: VerdictState;
  /** Weighted score, 0..1. */
  score: number;
};

export type GateInputs = {
  /** Length of the astronomical-dark window, minutes. */
  darkMinutes: number;
  /** Cloud quality during the window, 0 (overcast) .. 1 (clear). */
  cloudScore: number;
};

/** Weighted average of factor scores using the configured weights. */
export function weightedScore(factors: Factor[]): number {
  let sum = 0;
  let weight = 0;
  for (const f of factors) {
    const w = FACTOR_WEIGHTS[f.key] ?? 0;
    sum += w * f.score;
    weight += w;
  }
  return weight === 0 ? 0 : sum / weight;
}

export function computeVerdict(factors: Factor[], gates: GateInputs): VerdictResult {
  const score = weightedScore(factors);

  // Hard gates force a SKIP no matter how good the average looks.
  if (gates.darkMinutes < HARD_GATES.minDarkMinutes || gates.cloudScore < HARD_GATES.minCloudScore) {
    return { state: 'SKIP', score };
  }

  if (score >= VERDICT_THRESHOLDS.GO) return { state: 'GO', score };
  if (score >= VERDICT_THRESHOLDS.MAYBE) return { state: 'MAYBE', score };
  return { state: 'SKIP', score };
}

/**
 * Confidence from forecast lead time and source agreement. Closer night plus
 * agreeing models = higher confidence. Shown honestly to the user.
 */
export function computeConfidence(leadTimeHours: number, sourceAgreement: number): Confidence {
  if (leadTimeHours <= 18 && sourceAgreement >= 0.75) return 'High';
  if (leadTimeHours <= 60 && sourceAgreement >= 0.5) return 'Medium';
  return 'Low';
}

/** Human-facing copy for each state, used as a fallback when no headline. */
export const STATE_COPY: Record<VerdictState, { word: string }> = {
  GO: { word: 'Go' },
  MAYBE: { word: 'Maybe' },
  SKIP: { word: 'Skip' },
};
