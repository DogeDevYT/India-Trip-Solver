/**
 * FactorSlider.js
 *
 * Renders a single factor row:
 *   [emoji label] [badges]          [value]
 *   [note text]
 *   [────────────slider─────────────]
 *   [0           5                10]
 *   (optional) dynamic annotation
 *
 * Wires the slider's `input` event to store.set().
 * Exposes update(state) so the parent can sync this slider
 * when an external reset fires.
 *
 * Now accepts optional `tripStore` to compute dynamic per-day flight costs.
 *
 * @param {object}      factor  Factor definition from factors.js
 * @param {HTMLElement} container  Where to append the row
 * @param {object}      store   The reactive store
 * @param {object}      [tripStore] Trip dates store for dynamic calculations
 * @returns {{ update(state: object): void }}
 */

import { flightToDollars } from '../engine/scoring.js';

export function mountFactorSlider(factor, container, store, tripStore) {
  const sliderClass = factor.side === 'go' ? 'go-slider' : 'stay-slider';
  const valueClass  = factor.side === 'go' ? 'go-val'    : 'stay-val';

  // Build optional badge markup
  const riskBadge   = factor.highRisk   ? `<span class="risk-badge">HIGH RISK</span>`  : '';
  const binaryBadge = factor.binary     ? `<span class="binary-badge">BINARY</span>`   : '';
  const annotHtml   = factor.annotation ? `<div class="flight-note-dynamic" id="annotation-${factor.key}"></div>` : '';

  const el = document.createElement('div');
  el.className = 'factor' + (factor.highRisk ? ' risk-flag' : '');
  el.id = `factor-${factor.key}`;

  el.innerHTML = `
    <div class="factor-top">
      <div class="factor-left">
        <div class="factor-name">
          ${factor.emoji} ${factor.label} ${riskBadge}${binaryBadge}
        </div>
        <div class="factor-note">${factor.note}</div>
      </div>
      <span class="factor-value ${valueClass}" id="val-${factor.key}">
        ${factor.defaultVal}
      </span>
    </div>
    <div class="slider-wrap">
      <input
        type="range" min="0" max="10"
        value="${factor.defaultVal}"
        class="${sliderClass}"
        id="sl-${factor.key}"
        aria-label="${factor.label}"
      />
      <div class="slider-ticks">
        <span>0</span><span>5</span><span>10</span>
      </div>
    </div>
    ${annotHtml}
  `;

  container.appendChild(el);

  // Cache DOM refs
  const sliderEl  = el.querySelector(`#sl-${factor.key}`);
  const valEl     = el.querySelector(`#val-${factor.key}`);
  const annotEl   = factor.annotation ? el.querySelector(`#annotation-${factor.key}`) : null;

  // Get initial trip state
  const getTripState = () => tripStore ? tripStore.get() : { tripStart: 196, tripEnd: 220 };

  // Set initial filled-track visual
  setFill(sliderEl, factor.defaultVal);
  if (annotEl) renderAnnotation(annotEl, factor.defaultVal, getTripState());

  // Wire slider → store
  sliderEl.addEventListener('input', () => {
    const v = parseInt(sliderEl.value, 10);
    setFill(sliderEl, v);
    valEl.textContent = v;
    if (annotEl) renderAnnotation(annotEl, v, getTripState());
    store.set(factor.key, v);
  });

  // Subscribe to tripStore if present to update annotation text dynamically
  if (annotEl && tripStore) {
    tripStore.subscribe((tripState) => {
      const v = parseInt(sliderEl.value, 10);
      renderAnnotation(annotEl, v, tripState);
    });
  }

  /**
   * Called by the parent when the store resets externally.
   * Updates the slider position + display without re-triggering the store.
   * @param {{ [key: string]: number }} state
   */
  function update(state) {
    const v = state[factor.key] ?? factor.defaultVal;
    sliderEl.value    = v;
    valEl.textContent = v;
    setFill(sliderEl, v);
    if (annotEl) renderAnnotation(annotEl, v, getTripState());
  }

  return { update };
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Update the CSS custom property that drives the filled-track gradient. */
function setFill(slider, v) {
  slider.style.setProperty('--pct', `${(v / 10) * 100}%`);
}

/** Render the dynamic flight cost annotation. */
function renderAnnotation(el, v, tripState) {
  const dollars = flightToDollars(v);
  const duration = tripState ? (tripState.tripEnd - tripState.tripStart + 1) : 21;
  const perDay  = (dollars / duration).toFixed(0);
  el.textContent = `≈ $${dollars.toLocaleString()} RT  →  $${perDay} / day over ${duration} days`;
}
