/**
 * monteCarlo.js — Simulation engine for recruiting risk.
 *
 * Pure functions only. No DOM, no side effects, no imports except data.
 * Box-Muller transform for Normal distribution sampling (no external deps).
 *
 * Architecture note: runSimulation() is intentionally separated from
 * calcStats() so callers can batch trials asynchronously and still compute
 * stats once at the end.
 *
 * The `tripWindow` parameter makes the engine independent of hardcoded dates —
 * pass any { start, end, jetlagEnd } object and the engine adapts. Defaults
 * to the constants in recruitingData.js for backward compatibility.
 */

import {
  FIRMS,
  TIER_ORDER,
  TRIP_START,
  TRIP_END,
  JETLAG_END,
} from '../data/recruitingData.js';

// ── Default trip window ────────────────────────────────────────────────────
// Used when callers don't pass an explicit window (backward compatible).
export const DEFAULT_WINDOW = {
  start:     TRIP_START,
  end:       TRIP_END,
  jetlagEnd: JETLAG_END,
};

// ── Random sampling ────────────────────────────────────────────────────────

/**
 * Box-Muller transform: sample from Normal(mean, stdDev).
 * Returns an integer (days are a discrete unit).
 */
function normalSample(mean, stdDev) {
  let u;
  do { u = Math.random(); } while (u === 0); // avoid log(0)
  const v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.round(mean + z * stdDev);
}

// ── Single trial ───────────────────────────────────────────────────────────

/**
 * Run one Monte Carlo trial for all firms against a given trip window.
 *
 * @param {object[]} firms
 * @param {{ start: number, end: number, jetlagEnd: number }} tripWindow
 * @returns {{ id: string, openDay: number, missed: boolean, impaired: boolean }[]}
 */
function runTrial(firms, tripWindow) {
  return firms.map(firm => {
    const openDay  = normalSample(firm.meanDay, firm.stdDev);
    const missed   = openDay >= tripWindow.start && openDay <= tripWindow.end;
    const impaired = !missed && openDay > tripWindow.end && openDay <= tripWindow.jetlagEnd;
    return { id: firm.id, openDay, missed, impaired };
  });
}

// ── Full simulation ────────────────────────────────────────────────────────

/**
 * Run N Monte Carlo trials synchronously.
 *
 * Intentionally synchronous — callers that want async behaviour should
 * call this in batches with await between them (see SimulationPanel.js).
 *
 * @param {number}   n          Trial count (e.g. 10_000)
 * @param {object[]} firms      Defaults to all FIRMS
 * @param {object}   tripWindow { start, end, jetlagEnd } — defaults to recruitingData constants
 * @returns {object[][]}        Array of N trial result arrays
 */
export function runSimulation(n = 10_000, firms = FIRMS, tripWindow = DEFAULT_WINDOW) {
  const results = new Array(n);
  for (let i = 0; i < n; i++) {
    results[i] = runTrial(firms, tripWindow);
  }
  return results;
}

// ── Statistics ─────────────────────────────────────────────────────────────

/**
 * Compute summary statistics from raw simulation results.
 *
 * Single-pass algorithm: O(n × firms) — fast even for 10k trials.
 *
 * @param {object[][]} results    Output from runSimulation()
 * @param {object[]}   firms      Same array passed to runSimulation()
 * @param {object}     tripWindow Same window passed to runSimulation()
 * @returns {SimStats}
 */
export function calcStats(results, firms = FIRMS, tripWindow = DEFAULT_WINDOW) {
  const n = results.length;

  // ── Initialise accumulators ─────────────────────────────────────────────
  const firmAcc = {};
  for (const f of firms) {
    firmAcc[f.id] = { missed: 0, impaired: 0, openDays: new Int32Array(n) };
  }

  const tierFirms = {};
  for (const f of firms) {
    if (!tierFirms[f.tier]) tierFirms[f.tier] = [];
    tierFirms[f.tier].push(f.id);
  }
  const tierAcc = {};
  for (const tier of Object.keys(tierFirms)) tierAcc[tier] = 0;

  const highPriIds   = new Set(firms.filter(f => f.highPriority).map(f => f.id));
  let highPriMissed  = 0;
  let highPriRisk    = 0;
  const firmsMissedPerTrial = new Int32Array(n);

  // ── Single pass ─────────────────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const trial = results[i];
    const trialById = {};
    for (const fr of trial) {
      trialById[fr.id]            = fr;
      firmAcc[fr.id].openDays[i]  = fr.openDay;
      if (fr.missed)   firmAcc[fr.id].missed++;
      if (fr.impaired) firmAcc[fr.id].impaired++;
    }

    for (const [tier, ids] of Object.entries(tierFirms)) {
      if (ids.some(id => trialById[id].missed)) tierAcc[tier]++;
    }

    let hpMissed = false, hpRisk = false;
    for (const id of highPriIds) {
      if (trialById[id].missed)                          hpMissed = true;
      if (trialById[id].missed || trialById[id].impaired) hpRisk  = true;
    }
    if (hpMissed) highPriMissed++;
    if (hpRisk)   highPriRisk++;

    firmsMissedPerTrial[i] = trial.reduce((s, fr) => s + (fr.missed ? 1 : 0), 0);
  }

  // ── Per-firm stats ──────────────────────────────────────────────────────
  const perFirm = firms.map(firm => {
    const acc    = firmAcc[firm.id];
    const sorted = [...acc.openDays].sort((a, b) => a - b);
    return {
      id:            firm.id,
      name:          firm.name,
      tier:          firm.tier,
      category:      firm.category,
      highPriority:  firm.highPriority,
      source:        firm.source,
      pMissed:       acc.missed   / n,
      pImpaired:     acc.impaired / n,
      pRisk:         (acc.missed + acc.impaired) / n,
      medianOpenDay: sorted[Math.floor(n / 2)],
    };
  });

  // ── Per-tier stats ──────────────────────────────────────────────────────
  const perTier = TIER_ORDER
    .filter(tier => tierFirms[tier])
    .map(tier => ({
      tier,
      category:       firms.find(f => f.tier === tier).category,
      pMissAtLeast1:  tierAcc[tier] / n,
      expectedMissed: perFirm.filter(f => f.tier === tier)
                             .reduce((s, f) => s + f.pMissed, 0),
      firmCount:      tierFirms[tier].length,
    }));

  // ── Histogram ───────────────────────────────────────────────────────────
  const histMap = {};
  let maxMissed  = 0;
  let totalMissed = 0;
  for (const c of firmsMissedPerTrial) {
    histMap[c] = (histMap[c] || 0) + 1;
    if (c > maxMissed) maxMissed = c;
    totalMissed += c;
  }
  const histogram = [];
  for (let k = 0; k <= maxMissed; k++) {
    histogram.push({
      count:     k,
      frequency: histMap[k] || 0,
      pct:       (histMap[k] || 0) / n,
    });
  }

  return {
    totalTrials:         n,
    tripWindow,                   // echo back so consumers can reference it
    perFirm,
    perTier,
    pMissHighPriority:   highPriMissed / n,
    pRiskHighPriority:   highPriRisk   / n,
    histogram,
    expectedFirmsMissed: totalMissed / n,
  };
}
