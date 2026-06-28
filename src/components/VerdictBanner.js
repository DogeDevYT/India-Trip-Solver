/**
 * VerdictBanner.js
 *
 * Renders the top-of-page verdict banner:
 *   [icon]  Current Verdict          [Go: 22] [Stay: 38] [Δ: -16]
 *           Title text
 *           Note text (HTML)
 *
 * Subscribes to the store. Re-renders on every state change.
 * Applies .go / .stay / .tie class to the banner for colour theming.
 *
 * @param {HTMLElement} container
 * @param {object}      store
 */

import { calcGoScore, calcStayScore, calcDelta, calcVerdict } from '../engine/scoring.js';

export function mountVerdictBanner(container, store) {
  const el = document.createElement('div');
  el.className = 'verdict-banner';
  el.id = 'verdictBanner';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  el.innerHTML = `
    <div class="verdict-icon" id="verdictIcon">⚖️</div>
    <div class="verdict-body">
      <div class="verdict-label">Current Verdict</div>
      <div class="verdict-text" id="verdictText">Calculating…</div>
      <div class="verdict-note" id="verdictNote"></div>
    </div>
    <div class="verdict-scores">
      <div class="score-pill go">
        <span class="sp-label">Go</span>
        <span class="sp-value" id="goTotal">0</span>
      </div>
      <div class="score-pill stay">
        <span class="sp-label">Stay cost</span>
        <span class="sp-value" id="stayTotal">0</span>
      </div>
      <div class="score-pill delta">
        <span class="sp-label">Net Δ</span>
        <span class="sp-value" id="netDelta">0</span>
      </div>
    </div>
  `;

  container.appendChild(el);

  // Cache DOM refs
  const iconEl      = el.querySelector('#verdictIcon');
  const textEl      = el.querySelector('#verdictText');
  const noteEl      = el.querySelector('#verdictNote');
  const goTotalEl   = el.querySelector('#goTotal');
  const stayTotalEl = el.querySelector('#stayTotal');
  const netDeltaEl  = el.querySelector('#netDelta');

  function render(state) {
    const goScore   = calcGoScore(state);
    const stayScore = calcStayScore(state);
    const delta     = calcDelta(goScore, stayScore);
    const sign      = delta >= 0 ? '+' : '';
    const verdict   = calcVerdict(goScore, stayScore);

    // Score pills
    goTotalEl.textContent   = goScore;
    stayTotalEl.textContent = stayScore;
    netDeltaEl.textContent  = sign + delta;

    // Banner theming
    el.classList.remove('go', 'stay', 'tie');
    el.classList.add(verdict.outcome);

    // Verdict content
    iconEl.textContent = verdict.icon;
    textEl.textContent = verdict.title;
    noteEl.innerHTML   = verdict.note;
  }

  store.subscribe(render);
  render(store.get());
}
