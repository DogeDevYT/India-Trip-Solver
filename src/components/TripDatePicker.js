/**
 * TripDatePicker.js
 *
 * Calendar picker for the trip departure and return dates.
 * Renders:
 *   - Two <input type="date"> inputs (depart / return)
 *   - Auto-computed jet-lag clearance date (return + jetlagDays)
 *   - Trip stats: duration, # firms with median open dates in window
 *   - Timeline bar: Jun 1 → Oct 1, showing trip window + jetlag zone + firm dots
 *
 * Writes to tripStore on every change. The SimulationPanel subscribes
 * to the same store and auto-reruns when dates update.
 *
 * @param {HTMLElement} container
 * @param {object}      tripStore  { tripStart, tripEnd, jetlagDays }
 */

import {
  FIRMS,
  formatDay,
  doyToDateStr,
  dateStrToDoy,
  SEASON_START,
  SEASON_END,
} from '../data/recruitingData.js';

// Constrain the picker to the likely recruiting season
const PICKER_MIN = doyToDateStr(SEASON_START);    // Jun 1 2026
const PICKER_MAX = doyToDateStr(SEASON_END - 1);  // Sep 30 2026
const SEASON_SPAN = SEASON_END - SEASON_START;

// Firms to show as dots on the timeline (high-priority finance only, to avoid clutter)
const TIMELINE_FIRMS = FIRMS.filter(f => f.highPriority && f.category === 'finance');

// ── Mount ──────────────────────────────────────────────────────────────────

export function mountTripDatePicker(container, tripStore) {
  const el = document.createElement('div');
  el.className = 'tdp-panel';
  el.id = 'tripDatePicker';

  el.innerHTML = `
    <div class="tdp-header">
      <div class="tdp-eyebrow">Trip Window</div>
      <div class="tdp-title">Adjust Travel Dates</div>
      <div class="tdp-hint">Drag dates — simulation updates automatically</div>
    </div>

    <div class="tdp-inputs">
      <div class="tdp-field">
        <label class="tdp-label" for="departDate">✈️ Departure</label>
        <input
          type="date"
          id="departDate"
          class="tdp-date-input"
          min="${PICKER_MIN}"
          max="${PICKER_MAX}"
        />
      </div>
      <div class="tdp-arrow">→</div>
      <div class="tdp-field">
        <label class="tdp-label" for="returnDate">🏠 Return</label>
        <input
          type="date"
          id="returnDate"
          class="tdp-date-input"
          min="${PICKER_MIN}"
          max="${PICKER_MAX}"
        />
      </div>
      <div class="tdp-divider"></div>
      <div class="tdp-field tdp-field--auto">
        <div class="tdp-label">🧠 Jet-lag clears</div>
        <div class="tdp-auto-value" id="jetlagClearDate">—</div>
        <div class="tdp-auto-sub">return + <span id="jetlagDaysLabel">7</span> days</div>
      </div>
    </div>

    <div class="tdp-stats" id="tdpStats"></div>

    <div class="tdp-timeline-wrap">
      <div class="tdp-timeline-label">
        <span>${formatDay(SEASON_START)}</span>
        <span>Recruiting season</span>
        <span>${formatDay(SEASON_END - 1)}</span>
      </div>
      <div class="tdp-timeline" id="tdpTimeline">
        <!-- trip zone, jetlag zone, firm dots rendered by JS -->
      </div>
    </div>
  `;

  container.appendChild(el);

  const departInput  = el.querySelector('#departDate');
  const returnInput  = el.querySelector('#returnDate');
  const jetlagClear  = el.querySelector('#jetlagClearDate');
  const jetlagDaysLbl = el.querySelector('#jetlagDaysLabel');
  const statsEl      = el.querySelector('#tdpStats');
  const timelineEl   = el.querySelector('#tdpTimeline');

  // ── Sync from store on mount ─────────────────────────────────────────────
  function syncFromStore(state) {
    departInput.value = doyToDateStr(state.tripStart);
    returnInput.value = doyToDateStr(state.tripEnd);
    returnInput.min   = doyToDateStr(state.tripStart + 1);
    departInput.max   = doyToDateStr(state.tripEnd   - 1);

    const jetlagEnd = state.tripEnd + state.jetlagDays;
    jetlagClear.textContent  = formatDay(jetlagEnd);
    jetlagDaysLbl.textContent = state.jetlagDays;

    renderStats(state);
    renderTimeline(state, timelineEl);
  }

  // ── Wire inputs → store ─────────────────────────────────────────────────
  departInput.addEventListener('change', () => {
    const doy = dateStrToDoy(departInput.value);
    if (isNaN(doy) || doy <= 0) return;
    tripStore.set('tripStart', doy);
  });

  returnInput.addEventListener('change', () => {
    const doy = dateStrToDoy(returnInput.value);
    if (isNaN(doy) || doy <= 0) return;
    tripStore.set('tripEnd', doy);
  });

  // ── Subscribe to store (handles external resets too) ────────────────────
  tripStore.subscribe(syncFromStore);

  // ── Initial render ───────────────────────────────────────────────────────
  syncFromStore(tripStore.get());
}

// ── Stats bar ──────────────────────────────────────────────────────────────

function renderStats(state) {
  const el = document.getElementById('tdpStats');
  if (!el) return;

  const { tripStart, tripEnd, jetlagDays } = state;
  const duration   = tripEnd - tripStart + 1;
  const jetlagEnd  = tripEnd + jetlagDays;

  // Count firms whose median date falls in trip window (instant, no simulation)
  const firmsDuringTrip    = FIRMS.filter(f => f.meanDay >= tripStart && f.meanDay <= tripEnd);
  const firmsInJetlag      = FIRMS.filter(f => f.meanDay > tripEnd && f.meanDay <= jetlagEnd);
  const highPriDuringTrip  = firmsDuringTrip.filter(f => f.highPriority);

  const pill = (label, cls) =>
    `<span class="tdp-stat-pill ${cls}">${label}</span>`;

  el.innerHTML = `
    <div class="tdp-stat-row">
      ${pill(`${duration} days`, 'neutral')}
      ${pill(`${firmsDuringTrip.length} firms open during trip`, firmsDuringTrip.length > 0 ? 'danger' : 'ok')}
      ${highPriDuringTrip.length > 0
        ? pill(`${highPriDuringTrip.length} high-priority`, 'danger')
        : pill('0 high-priority', 'ok')}
      ${firmsInJetlag.length > 0
        ? pill(`${firmsInJetlag.length} during jet-lag zone`, 'warn')
        : ''}
    </div>
    ${highPriDuringTrip.length > 0
      ? `<div class="tdp-firm-names">${highPriDuringTrip.map(f => f.name).join(' · ')}</div>`
      : ''}
  `;
}

// ── Timeline visualisation ─────────────────────────────────────────────────

function renderTimeline(state, el) {
  const { tripStart, tripEnd, jetlagDays } = state;
  const jetlagEnd = tripEnd + jetlagDays;

  function pct(doy) {
    return Math.max(0, Math.min(100, ((doy - SEASON_START) / SEASON_SPAN) * 100)).toFixed(2);
  }

  // Trip bar
  const tripLeft  = pct(tripStart);
  const tripWidth = Math.max(0, ((tripEnd - tripStart) / SEASON_SPAN) * 100).toFixed(2);

  // Jetlag bar
  const jlLeft  = pct(tripEnd);
  const jlWidth = Math.max(0, ((jetlagEnd - tripEnd) / SEASON_SPAN) * 100).toFixed(2);

  // Firm dots
  const firmDots = TIMELINE_FIRMS.map(f => {
    const left = pct(f.meanDay);
    const inTrip  = f.meanDay >= tripStart && f.meanDay <= tripEnd;
    const inJetlag = f.meanDay > tripEnd && f.meanDay <= jetlagEnd;
    const cls = inTrip ? 'dot-danger' : inJetlag ? 'dot-warn' : 'dot-safe';
    return `<div class="tdp-dot ${cls}" style="left:${left}%" title="${f.name}: ~${formatDay(f.meanDay)}"></div>`;
  }).join('');

  // Month markers (Jun, Jul, Aug, Sep, Oct)
  const months = [
    { label: 'Jun', doy: 152 },
    { label: 'Jul', doy: 182 },
    { label: 'Aug', doy: 213 },
    { label: 'Sep', doy: 244 },
    { label: 'Oct', doy: 274 },
  ];
  const monthMarkers = months.map(m => {
    const left = pct(m.doy);
    return `<div class="tdp-month" style="left:${left}%">${m.label}</div>`;
  }).join('');

  el.innerHTML = `
    <div class="tdp-timeline-track">
      <div class="tdp-zone trip" style="left:${tripLeft}%;width:${tripWidth}%" title="Trip window"></div>
      <div class="tdp-zone jetlag" style="left:${jlLeft}%;width:${jlWidth}%" title="Jet-lag zone"></div>
      ${firmDots}
    </div>
    <div class="tdp-months">${monthMarkers}</div>
  `;
}
