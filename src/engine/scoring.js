/**
 * scoring.js — Pure scoring functions. No DOM, no side effects.
 *
 * All functions take plain state objects and return plain values.
 * This makes the logic trivially testable and reusable across
 * any future extension (e.g. scenario comparison, URL sharing).
 */

import { GO_FACTORS, STAY_FACTORS } from '../data/factors.js';

/**
 * Sum all Go factor scores from state.
 * @param {{ [key: string]: number }} state
 * @returns {number}
 */
export function calcGoScore(state) {
  return GO_FACTORS.reduce((sum, f) => sum + (state[f.key] ?? 0), 0);
}

/**
 * Sum all Stay factor scores from state.
 * @param {{ [key: string]: number }} state
 * @returns {number}
 */
export function calcStayScore(state) {
  return STAY_FACTORS.reduce((sum, f) => sum + (state[f.key] ?? 0), 0);
}

/**
 * Net delta: positive = Go leads, negative = Stay leads.
 * @param {number} goScore
 * @param {number} stayScore
 * @returns {number}
 */
export function calcDelta(goScore, stayScore) {
  return goScore - stayScore;
}

/**
 * Compute the verdict from scores.
 *
 * Threshold: |delta| <= 4 → tie. Otherwise the leading side wins.
 *
 * @param {number} goScore
 * @param {number} stayScore
 * @returns {{ outcome: 'go'|'stay'|'tie', icon: string, title: string, note: string }}
 */
export function calcVerdict(goScore, stayScore) {
  const delta = calcDelta(goScore, stayScore);
  const sign  = delta >= 0 ? '+' : '';

  if (Math.abs(delta) <= 4) {
    return {
      outcome: 'tie',
      icon:    '⚖️',
      title:   'Too Close to Call',
      note:    `Net delta of <strong>${sign + delta}</strong> sits within the ±4 threshold.
                Adjust the recruiting risk slider — that factor is binary and
                may single-handedly decide this.`,
    };
  }

  if (delta > 0) {
    return {
      outcome: 'go',
      icon:    '🛫',
      title:   'Go — Benefits outweigh costs',
      note:    `Go score leads by <strong>${delta} pts</strong>. But note:
                recruiting risk is <em>partially binary</em>. Jet lag during an OA
                or HireVue isn't just a score deduction — it can disqualify you at a
                specific firm regardless of this total.`,
    };
  }

  return {
    outcome: 'stay',
    icon:    '🏠',
    title:   'Stay — Costs outweigh benefits',
    note:    `Stay cost leads by <strong>${Math.abs(delta)} pts</strong>. Two HIGH RISK
              flags (recruiting window + Vanguard/OIE) make the true downside worse
              than the slider sum alone suggests.`,
  };
}

/**
 * Map flight slider value (0–10) to a rough round-trip dollar estimate.
 * Range: $600 (0) → $1,600 (10), midpoint ≈ $1,100 at 5.
 * @param {number} v Slider value 0–10
 * @returns {number}
 */
export function flightToDollars(v) {
  return Math.round(600 + (v / 10) * 1000);
}

/**
 * Map dollar amount to flight slider value (0–10).
 * Capped between 0 and 10.
 * @param {number} dollars Round trip ticket price
 * @returns {number}
 */
export function dollarsToFlightScore(dollars) {
  const score = ((dollars - 600) / 1000) * 10;
  return Math.max(0, Math.min(10, Math.round(score)));
}

