/**
 * TopStats.js
 *
 * Renders a high-level summary panel near the top of the dashboard.
 * Subscribes to:
 *   - store: for net delta score calculations (Go score - Stay score)
 *   - tripStore: for dynamic flight budget breakdown (total price, duration, cost/day)
 *
 * Displays:
 *   - Delta Score Card: showing net delta with color indicator (green for Go, orange for Stay, gray for Tie).
 *   - Flight Budget Card: showing selected airline, total price, and cost per day over duration.
 */

import { calcGoScore, calcStayScore, calcDelta } from '../engine/scoring.js';

export function mountTopStats(container, store, tripStore) {
  const panel = document.createElement('div');
  panel.className = 'ts-container';
  panel.id = 'topStatsPanel';

  panel.innerHTML = `
    <div class="ts-card delta-card" id="tsDeltaCard">
      <div class="ts-label">Decision Matrix Delta</div>
      <div class="ts-main-row">
        <span class="ts-value" id="tsDeltaValue">0</span>
        <span class="ts-badge" id="tsDeltaBadge">neutral</span>
      </div>
      <div class="ts-footer" id="tsDeltaFooter">Go score vs Stay cost</div>
    </div>

    <div class="ts-card budget-card" id="tsBudgetCard">
      <div class="ts-label">Flight Budget Tracker</div>
      <div class="ts-main-row">
        <span class="ts-value" id="tsBudgetValue">$0</span>
        <span class="ts-badge" id="tsBudgetBadge">/ day</span>
      </div>
      <div class="ts-footer" id="tsBudgetFooter">No flight selected</div>
    </div>
  `;

  container.appendChild(panel);

  const deltaValueEl  = panel.querySelector('#tsDeltaValue');
  const deltaBadgeEl  = panel.querySelector('#tsDeltaBadge');
  const deltaFooterEl  = panel.querySelector('#tsDeltaFooter');

  const budgetValueEl  = panel.querySelector('#tsBudgetValue');
  const budgetBadgeEl  = panel.querySelector('#tsBudgetBadge');
  const budgetFooterEl  = panel.querySelector('#tsBudgetFooter');

  // ── Render functions ─────────────────────────────────────────────────────

  function renderDelta(state) {
    const go = calcGoScore(state);
    const stay = calcStayScore(state);
    const delta = calcDelta(go, stay);
    const sign = delta >= 0 ? '+' : '';

    deltaValueEl.textContent = sign + delta;

    if (Math.abs(delta) <= 4) {
      deltaBadgeEl.textContent = 'Too Close';
      deltaBadgeEl.className = 'ts-badge neutral';
      deltaFooterEl.innerHTML = `Go (<strong>${go}</strong>) vs Stay (<strong>${stay}</strong>) · Tie zone`;
    } else if (delta > 0) {
      deltaBadgeEl.textContent = 'Go Recommended';
      deltaBadgeEl.className = 'ts-badge go';
      deltaFooterEl.innerHTML = `Go (<strong>${go}</strong>) leads Stay (<strong>${stay}</strong>) by ${delta} pts`;
    } else {
      deltaBadgeEl.textContent = 'Stay Recommended';
      deltaBadgeEl.className = 'ts-badge stay';
      deltaFooterEl.innerHTML = `Stay (<strong>${stay}</strong>) leads Go (<strong>${go}</strong>) by ${Math.abs(delta)} pts`;
    }
  }

  function renderBudget(state) {
    const flight = state.selectedFlight;
    const duration = state.tripEnd - state.tripStart + 1;

    if (flight) {
      budgetValueEl.textContent = `$${flight.ticketPrice.toLocaleString()}`;
      budgetBadgeEl.textContent = `$${flight.perDay}/day`;
      budgetBadgeEl.className = `ts-badge budget ${flight.affected ? 'warn' : 'safe'}`;
      budgetFooterEl.innerHTML = `✈️ <strong>${flight.name}</strong> · ${duration} days round trip`;
    } else {
      budgetValueEl.textContent = '—';
      budgetBadgeEl.textContent = '—';
      budgetBadgeEl.className = 'ts-badge neutral';
      budgetFooterEl.textContent = `${duration} days trip · choose flight below`;
    }
  }

  // ── Subscribe ────────────────────────────────────────────────────────────
  store.subscribe(renderDelta);
  tripStore.subscribe(renderBudget);

  // Initial draw
  renderDelta(store.get());
  renderBudget(tripStore.get());
}
