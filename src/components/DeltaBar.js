/**
 * DeltaBar.js
 *
 * Renders the visual balance bar in the header:
 *
 *   ← Stay wins         Net Δ: -16         Go wins →
 *   [████████████████████|          ]
 *
 * The fill grows left (orange/stay) or right (green/go) from center,
 * proportional to the delta capped at ±50 for visual range.
 *
 * Subscribes to the store; re-renders on every change.
 *
 * @param {HTMLElement} container
 * @param {object}      store
 */

import { calcGoScore, calcStayScore, calcDelta } from '../engine/scoring.js';

export function mountDeltaBar(container, store) {
  const el = document.createElement('div');
  el.className = 'delta-bar-wrap';

  el.innerHTML = `
    <div class="delta-bar-label">
      <span>← Stay wins</span>
      <span id="deltaBarLabel" class="delta-bar-center-label">Net Δ: 0</span>
      <span>Go wins →</span>
    </div>
    <div class="delta-bar-track" role="meter" aria-label="Decision balance">
      <div class="delta-bar-center"></div>
      <div class="delta-bar-fill" id="deltaBarFill"></div>
    </div>
  `;

  container.appendChild(el);

  const labelEl = el.querySelector('#deltaBarLabel');
  const fillEl  = el.querySelector('#deltaBarFill');

  function render(state) {
    const goScore   = calcGoScore(state);
    const stayScore = calcStayScore(state);
    const delta     = calcDelta(goScore, stayScore);
    const sign      = delta >= 0 ? '+' : '';

    labelEl.textContent = `Net Δ: ${sign}${delta}`;

    // Normalise delta to ±50 for the visual bar (beyond that it's capped)
    const maxSwing = 50;
    const norm     = Math.max(-maxSwing, Math.min(maxSwing, delta));
    const width    = `${(Math.abs(norm) / maxSwing) * 50}%`;

    if (norm >= 0) {
      fillEl.style.left       = '50%';
      fillEl.style.right      = 'auto';
      fillEl.style.width      = width;
      fillEl.style.background = 'var(--go)';
    } else {
      fillEl.style.right      = '50%';
      fillEl.style.left       = 'auto';
      fillEl.style.width      = width;
      fillEl.style.background = 'var(--stay)';
    }
  }

  store.subscribe(render);
  render(store.get());
}
