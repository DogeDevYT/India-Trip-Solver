/**
 * SimulationPanel.js
 *
 * Renders the Monte Carlo recruiting risk panel below the decision matrix.
 * Runs 10,000 trials async (in batches to keep the UI responsive).
 *
 * Now accepts a `tripStore` and auto-reruns whenever trip dates change.
 * Debounces changes by 450ms so rapid date picker drags don't flood the engine.
 *
 * Results displayed:
 *   - Headline probability stats (P miss ≥1 high-priority app)
 *   - Per-tier probability bars (finance + tech side-by-side)
 *   - Histogram: distribution of "# firms missed" across all trials
 *   - Firm-level breakdown table (high-priority firms only)
 *
 * @param {HTMLElement} container
 * @param {object}      tripStore   Reactive store with { tripStart, tripEnd, jetlagDays }
 */

import { FIRMS, formatDay } from '../data/recruitingData.js';
import { runSimulation, calcStats } from '../engine/monteCarlo.js';

const N_TRIALS   = 10_000;
const BATCH_SIZE = 1_000;    // trials per async chunk
const RERUN_DEBOUNCE_MS = 450;

// ── Mount ──────────────────────────────────────────────────────────────────

export function mountSimulationPanel(container, tripStore) {
  const el = document.createElement('section');
  el.className = 'sim-panel';
  el.id = 'simPanel';

  // Seed initial dates from store for the idle state text
  const initState = tripStore.get();

  el.innerHTML = `
    <div class="sim-header">
      <div class="sim-title-group">
        <div class="sim-eyebrow">Monte Carlo · ${FIRMS.length} firms · ${N_TRIALS.toLocaleString()} trials</div>
        <h2 class="sim-title">Recruiting Risk Simulation</h2>
        <div class="sim-subtitle" id="simSubtitle">
          Trip window: <strong id="simTripText">${formatDay(initState.tripStart)} – ${formatDay(initState.tripEnd)}</strong>
          &nbsp;·&nbsp; Jet-lag clears: <strong id="simJetlagText">${formatDay(initState.tripEnd + initState.jetlagDays)}</strong>
        </div>
      </div>
      <button class="sim-run-btn" id="simRunBtn">▶ Run Simulation</button>
    </div>

    <div class="sim-idle" id="simIdle">
      <p>
        Samples a random open date for each firm from a
        <strong>Normal distribution</strong> calibrated to 2022–2025 recruiting patterns.
        Each trial classifies apps as <em>missed</em> (opens during trip),
        <em>impaired</em> (opens in jet-lag zone), or <em>safe</em>.
        Repeat ${N_TRIALS.toLocaleString()} times → probability distribution.
        <strong>Simulation re-runs automatically when you change travel dates.</strong>
      </p>
      <div class="sim-firm-preview">
        ${FIRMS.slice(0, 5).map(f =>
          `<span class="sim-firm-chip ${f.category}">${f.name} <em>~${formatDay(f.meanDay)}</em></span>`
        ).join('')}
        <span class="sim-firm-chip faint">+ ${FIRMS.length - 5} more…</span>
      </div>
    </div>

    <div class="sim-stale-banner" id="simStaleBanner" style="display:none">
      ⟳ Dates changed — re-running simulation…
    </div>

    <div class="sim-progress-wrap" id="simProgressWrap" style="display:none">
      <div class="sim-progress-track">
        <div class="sim-progress-fill" id="simProgressFill"></div>
      </div>
      <div class="sim-progress-label" id="simProgressLabel">
        Running… 0 / ${N_TRIALS.toLocaleString()}
      </div>
    </div>

    <div id="simResults" style="display:none"></div>

    <div class="sim-provenance">
      <span>ℹ</span>
      Distributions are calibrated community estimates (2022–2025).
      Update means in <code>recruitingData.js</code> to sharpen accuracy.
    </div>
  `;

  container.appendChild(el);

  // ── Panel state ────────────────────────────────────────────────────────
  const panelState = {
    hasResults:    false,
    currentRunId:  0,
    debounceTimer: null,
  };

  // ── Wire run button ────────────────────────────────────────────────────
  el.querySelector('#simRunBtn').addEventListener('click', () => {
    runAsync(el, tripStore, panelState);
  });

  // ── Subscribe to tripStore for auto-rerun ─────────────────────────────
  tripStore.subscribe(state => {
    // Always update the subtitle dates
    const tripText   = el.querySelector('#simTripText');
    const jetlagText = el.querySelector('#simJetlagText');
    if (tripText)   tripText.textContent   = `${formatDay(state.tripStart)} – ${formatDay(state.tripEnd)}`;
    if (jetlagText) jetlagText.textContent = formatDay(state.tripEnd + state.jetlagDays);

    // Auto-rerun if results are already showing
    if (panelState.hasResults) {
      clearTimeout(panelState.debounceTimer);
      const staleBanner = el.querySelector('#simStaleBanner');
      if (staleBanner) staleBanner.style.display = 'block';
      panelState.debounceTimer = setTimeout(() => {
        runAsync(el, tripStore, panelState);
      }, RERUN_DEBOUNCE_MS);
    }
  });
}

// ── Async execution ────────────────────────────────────────────────────────

async function runAsync(el, tripStore, panelState) {
  const runId = ++panelState.currentRunId;

  const { tripStart, tripEnd, jetlagDays } = tripStore.get();
  const tripWindow = {
    start:     tripStart,
    end:       tripEnd,
    jetlagEnd: tripEnd + jetlagDays,
  };

  const runBtn       = el.querySelector('#simRunBtn');
  const idleEl       = el.querySelector('#simIdle');
  const staleBanner  = el.querySelector('#simStaleBanner');
  const progressWrap = el.querySelector('#simProgressWrap');
  const progressFill = el.querySelector('#simProgressFill');
  const progressLbl  = el.querySelector('#simProgressLabel');
  const resultsEl    = el.querySelector('#simResults');

  // Enter running state
  runBtn.disabled = true;
  runBtn.classList.add('running');
  runBtn.textContent = '⟳ Running…';
  idleEl.style.display       = 'none';
  if (staleBanner) staleBanner.style.display = 'none';
  resultsEl.style.display    = 'none';
  progressWrap.style.display = 'block';
  progressFill.style.width   = '0%';

  const allResults = [];
  let done = 0;

  while (done < N_TRIALS) {
    // Bail out if a newer run was requested
    if (panelState.currentRunId !== runId) return;

    const batch = Math.min(BATCH_SIZE, N_TRIALS - done);
    const chunk = runSimulation(batch, FIRMS, tripWindow);
    for (const r of chunk) allResults.push(r);
    done += batch;

    // Update progress bar
    progressFill.style.width = ((done / N_TRIALS) * 100) + '%';
    progressLbl.textContent  =
      `Running… ${done.toLocaleString()} / ${N_TRIALS.toLocaleString()} trials`;

    // Yield to browser for paint
    await new Promise(r => setTimeout(r, 0));
  }

  if (panelState.currentRunId !== runId) return;

  // Compute stats & render
  const stats = calcStats(allResults, FIRMS, tripWindow);
  progressWrap.style.display = 'none';
  resultsEl.innerHTML        = buildResultsHTML(stats);
  resultsEl.style.display    = 'block';

  panelState.hasResults = true;
  runBtn.disabled       = false;
  runBtn.classList.remove('running');
  runBtn.textContent    = '↺ Re-run';
}

// ── Results HTML ───────────────────────────────────────────────────────────

function buildResultsHTML(stats) {
  return `
    ${buildHeadline(stats)}
    ${buildTierBars(stats)}
    ${buildHistogram(stats)}
    ${buildFirmTable(stats)}
  `;
}

// ── Headline ──────────────────────────────────────────────────────────────

function buildHeadline(stats) {
  const missedPct = pct(stats.pMissHighPriority);
  const riskPct   = pct(stats.pRiskHighPriority);
  const expected  = stats.expectedFirmsMissed.toFixed(1);

  const { start, end, jetlagEnd } = stats.tripWindow;
  const riskLevel = p => p >= 0.80 ? 'danger' : p >= 0.50 ? 'warning' : 'ok';

  return `
    <div class="sim-section">
      <div class="sim-headline-grid">
        <div class="sim-stat-card ${riskLevel(stats.pMissHighPriority)}">
          <div class="sim-stat-value">${missedPct}%</div>
          <div class="sim-stat-label">P(miss ≥1 high-priority app)</div>
          <div class="sim-stat-sub">during trip · ${formatDay(start)}–${formatDay(end)}</div>
        </div>
        <div class="sim-stat-card ${riskLevel(stats.pRiskHighPriority)}">
          <div class="sim-stat-value">${riskPct}%</div>
          <div class="sim-stat-label">P(miss or impaired for ≥1 top app)</div>
          <div class="sim-stat-sub">includes jet-lag zone → ${formatDay(jetlagEnd)}</div>
        </div>
        <div class="sim-stat-card neutral">
          <div class="sim-stat-value">${expected}</div>
          <div class="sim-stat-label">Expected firms with apps opening during trip</div>
          <div class="sim-stat-sub">across ${stats.totalTrials.toLocaleString()} simulated cycles</div>
        </div>
      </div>
    </div>
  `;
}

// ── Tier probability bars ─────────────────────────────────────────────────

function buildTierBars(stats) {
  const tierRow = (tier, cls) => {
    const p = tier.pMissAtLeast1;
    const w = pct(p);
    return `
      <div class="sim-tier-row">
        <span class="sim-tier-name">${tier.tier}</span>
        <div class="sim-tier-bar-track">
          <div class="sim-tier-bar-fill ${cls}" style="width:${w}%"></div>
        </div>
        <span class="sim-tier-pct ${p >= 0.5 ? 'high' : ''}">${w}%</span>
        <span class="sim-tier-expected">(exp. ${tier.expectedMissed.toFixed(1)})</span>
      </div>
    `;
  };

  return `
    <div class="sim-section">
      <div class="sim-section-title">P(≥1 firm in tier has apps open during trip)</div>
      <div class="sim-tiers-grid">
        <div class="sim-tier-col">
          <div class="sim-category-label finance">FINANCE</div>
          ${stats.perTier.filter(t => t.category === 'finance').map(t => tierRow(t, 'finance')).join('')}
        </div>
        <div class="sim-tier-col">
          <div class="sim-category-label tech">TECH</div>
          ${stats.perTier.filter(t => t.category === 'tech').map(t => tierRow(t, 'tech')).join('')}
        </div>
      </div>
    </div>
  `;
}

// ── Histogram ────────────────────────────────────────────────────────────

function buildHistogram(stats) {
  const maxFreq = Math.max(...stats.histogram.map(b => b.frequency));
  let cumulative = 0;
  const bucketsToShow = [];
  for (const b of stats.histogram) {
    bucketsToShow.push(b);
    cumulative += b.pct;
    if (cumulative >= 0.99) break;
  }

  const bars = bucketsToShow.map(b => {
    const barW = maxFreq > 0 ? Math.round((b.frequency / maxFreq) * 100) : 0;
    return `
      <div class="sim-hist-row">
        <span class="sim-hist-key">${b.count}</span>
        <div class="sim-hist-track">
          <div class="sim-hist-fill" style="width:${barW}%"></div>
        </div>
        <span class="sim-hist-pct">${pct(b.pct)}%</span>
      </div>
    `;
  }).join('');

  return `
    <div class="sim-section">
      <div class="sim-section-title">
        Distribution: # firms with apps opening during trip window
        <span class="sim-section-sub">(${stats.totalTrials.toLocaleString()} trials)</span>
      </div>
      <div class="sim-histogram">
        <div class="sim-hist-y-label">firms missed →</div>
        ${bars}
        <div class="sim-hist-expected">
          Expected: <strong>${stats.expectedFirmsMissed.toFixed(1)} firms</strong> per cycle
        </div>
      </div>
    </div>
  `;
}

// ── Firm table ────────────────────────────────────────────────────────────

function buildFirmTable(stats) {
  const rows = stats.perFirm
    .filter(f => f.highPriority)
    .sort((a, b) => b.pMissed - a.pMissed)
    .map(f => {
      const mp = pct(f.pMissed);
      const ip = pct(f.pImpaired);
      const rp = pct(f.pRisk);
      return `
        <tr>
          <td class="ft-name">${f.name}</td>
          <td class="ft-tier">${f.tier}</td>
          <td class="ft-median">~${formatDay(f.medianOpenDay)}</td>
          <td class="ft-missed ${f.pMissed >= 0.5 ? 'danger' : ''}">${mp}%</td>
          <td class="ft-impaired ${f.pImpaired > 0.15 ? 'warn' : ''}">${ip}%</td>
          <td class="ft-risk">${rp}%</td>
        </tr>
      `;
    }).join('');

  return `
    <div class="sim-section">
      <div class="sim-section-title">High-priority firm breakdown</div>
      <div class="sim-table-scroll">
        <table class="sim-firm-table">
          <thead>
            <tr>
              <th>Firm</th><th>Tier</th><th>Median open</th>
              <th>P(missed)</th><th>P(impaired)</th><th>P(any risk)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="sim-table-legend">
        <span class="legend-missed">Missed</span> = opens during trip window &nbsp;·&nbsp;
        <span class="legend-impaired">Impaired</span> = opens during jet-lag recovery
      </div>
    </div>
  `;
}

// ── Utility ───────────────────────────────────────────────────────────────

function pct(p) { return Math.round(p * 100); }
