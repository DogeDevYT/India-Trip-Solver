/**
 * ColumnCard.js
 *
 * Renders the full Go or Stay column:
 *   ┌─────────────────────────────────────┐
 *   │ ● Go Factors — Benefits    22 / 40  │   ← col-header
 *   ├─────────────────────────────────────┤
 *   │ [FactorSlider]                      │
 *   │ [FactorSlider]                      │   ← col-body
 *   │  ...                                │
 *   └─────────────────────────────────────┘
 *
 * Mounts each FactorSlider and subscribes to the store so
 * the column total badge stays live.
 *
 * @param {'go'|'stay'}  side
 * @param {object[]}     factors  Filtered factor list for this side
 * @param {HTMLElement}  container  The columns grid element
 * @param {object}       store
 */

import { mountFactorSlider } from './FactorSlider.js';

export function mountColumnCard(side, factors, container, store, tripStore) {
  const isGo     = side === 'go';
  const heading  = isGo ? 'Go Factors — Benefits' : 'Stay Factors — Costs of Traveling';
  const maxScore = factors.length * 10;

  const card = document.createElement('div');
  card.className = 'col-card';
  card.id = `${side}-card`;

  card.innerHTML = `
    <div class="col-header ${side}">
      <div class="col-title ${side}">
        <span class="dot"></span>
        <span>${heading}</span>
      </div>
      <span class="col-total-badge ${side}" id="${side}Badge">0 / ${maxScore}</span>
    </div>
    <div class="col-body" id="${side}Body"></div>
  `;

  container.appendChild(card);

  const bodyEl   = card.querySelector(`#${side}Body`);
  const badgeEl  = card.querySelector(`#${side}Badge`);

  // Mount a FactorSlider for each factor and keep refs for reset syncing
  const sliders = factors.map(f => mountFactorSlider(f, bodyEl, store, tripStore));


  function getColumnTotal(state) {
    return factors.reduce((sum, f) => sum + (state[f.key] ?? 0), 0);
  }

  function render(state) {
    // Sync each slider's visual (handles external resets)
    sliders.forEach(s => s.update(state));
    // Update the column total badge
    badgeEl.textContent = `${getColumnTotal(state)} / ${maxScore}`;
  }

  // Subscribe — this handles both live slider changes and resets
  store.subscribe(render);

  // Initial render with current store state
  render(store.get());
}
