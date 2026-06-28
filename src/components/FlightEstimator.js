/**
 * FlightEstimator.js
 *
 * Renders the Flight Cost & Airline Calculator.
 * Receives:
 *   - container: mount element
 *   - store: Factor slider store (to set the flight score)
 *   - tripStore: Trip date store (to listen to travel dates)
 *
 * Connects to SerpApi Google Flights API with robust error wrappers and
 * persistent localStorage caching. Features a Refresh button to force bypass cache.
 */

import { formatDay } from '../data/recruitingData.js';
import { fetchFlightPrices } from '../engine/flightApi.js';
import { dollarsToFlightScore } from '../engine/scoring.js';

export function mountFlightEstimator(container, store, tripStore) {
  const el = document.createElement('div');
  el.className = 'fe-panel';
  el.id = 'flightEstimator';

  // Read saved settings from localStorage
  const savedKey = localStorage.getItem('serpapi_key') || '';
  const savedDep = localStorage.getItem('flight_dep') || 'JFK';
  const savedArr = localStorage.getItem('flight_arr') || 'DEL';

  el.innerHTML = `
    <div class="fe-header">
      <div class="fe-header-top-row">
        <div>
          <div class="fe-eyebrow">Flight Cost Calculator</div>
          <div class="fe-title">Compare Summer Flight Deals</div>
        </div>
        <div class="fe-actions">
          <button class="fe-refresh-btn" id="feRefreshBtn">🔄 Sync Live Deals</button>
          <button class="fe-settings-btn" id="feSettingsBtn">⚙️ API Settings</button>
        </div>
      </div>

      <!-- Settings Dropdown Panel -->
      <div class="fe-settings-panel" id="feSettingsPanel" style="display: none;">
        <div class="fe-settings-field">
          <label class="fe-settings-label">SerpApi API Key</label>
          <input
            type="password"
            id="feApiKey"
            class="fe-settings-input"
            placeholder="Paste SerpApi API Key..."
            value="${savedKey}"
          />
          <div class="fe-settings-hint">
            Get an API key from the <a href="https://serpapi.com/" target="_blank" rel="noopener noreferrer">SerpApi Homepage</a>.
          </div>
        </div>
        <div class="fe-settings-row" style="margin-top: 8px;">
          <div class="fe-settings-field">
            <label class="fe-settings-label">Depart Airport (IATA)</label>
            <input
              type="text"
              id="feDepAirport"
              class="fe-settings-input short"
              maxlength="3"
              value="${savedDep}"
            />
          </div>
          <div class="fe-settings-field">
            <label class="fe-settings-label">Arrival Airport (IATA)</label>
            <input
              type="text"
              id="feArrAirport"
              class="fe-settings-input short"
              maxlength="3"
              value="${savedArr}"
            />
          </div>
        </div>
        <button class="fe-save-btn" id="feSaveSettingsBtn">Save Settings</button>
      </div>

      <!-- Error warning banner -->
      <div class="fe-error-banner" id="feErrorBanner" style="display: none;"></div>

      <div class="fe-subtitle" id="feSearchRoute">
        Searching: <strong>${savedDep} ⇄ ${savedArr}</strong>
        &nbsp;·&nbsp; <span id="feSourceLabel" class="fe-source-chip">calibrated mock</span>
      </div>
    </div>

    <div class="fe-loading" id="feLoading" style="display:none">
      <div class="fe-spinner"></div>
      <div class="fe-loading-text">Querying SerpApi Google Flights API...</div>
    </div>

    <div class="fe-list" id="feList"></div>

    <div class="fe-sync-msg">
      <span>💡</span> Selecting an airline automatically updates the <strong>Flight Cost score</strong> in the stay card.
    </div>
  `;

  container.appendChild(el);

  const listEl       = el.querySelector('#feList');
  const loadingEl    = el.querySelector('#feLoading');
  const settingsBtn  = el.querySelector('#feSettingsBtn');
  const settingsEl   = el.querySelector('#feSettingsPanel');
  const saveBtn      = el.querySelector('#feSaveSettingsBtn');
  const routeEl      = el.querySelector('#feSearchRoute');
  const errorBanner  = el.querySelector('#feErrorBanner');
  const refreshBtn   = el.querySelector('#feRefreshBtn');

  let currentSearchId = 0;
  let flightPrices    = [];
  let selectedCode    = '';

  // Toggle settings
  settingsBtn.addEventListener('click', () => {
    const isHidden = settingsEl.style.display === 'none';
    settingsEl.style.display = isHidden ? 'block' : 'none';
    settingsBtn.classList.toggle('active', isHidden);
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const key = el.querySelector('#feApiKey').value.trim();
    const dep = el.querySelector('#feDepAirport').value.trim().toUpperCase();
    const arr = el.querySelector('#feArrAirport').value.trim().toUpperCase();

    localStorage.setItem('serpapi_key', key);
    localStorage.setItem('flight_dep', dep);
    localStorage.setItem('flight_arr', arr);

    settingsEl.style.display = 'none';
    settingsBtn.classList.remove('active');

    routeEl.innerHTML = `Searching: <strong>${dep} ⇄ ${arr}</strong> &nbsp;·&nbsp; <span id="feSourceLabel" class="fe-source-chip">updating...</span>`;

    searchFlights(tripStore.get(), false);
  });

  // Wire force refresh button click
  refreshBtn.addEventListener('click', () => {
    searchFlights(tripStore.get(), true);
  });

  // ── Search flights ────────────────────────────────────────────────────────
  async function searchFlights(state, forceRefresh = false) {
    const searchId = ++currentSearchId;

    // Show loading
    loadingEl.style.display = 'flex';
    listEl.style.opacity = '0.35';

    const dep = localStorage.getItem('flight_dep') || 'JFK';
    const arr = localStorage.getItem('flight_arr') || 'DEL';

    try {
      const result = await fetchFlightPrices(state.tripStart, state.tripEnd, dep, arr, forceRefresh);

      // Avoid race conditions
      if (searchId !== currentSearchId) return;

      flightPrices = result.prices;

      // Update source label indicator
      const sourceChip = el.querySelector('#feSourceLabel');
      if (sourceChip) {
        // Look up if local cache was hit
        const cacheKey = `flight_cache_${dep}_${arr}_${state.tripStart}_${state.tripEnd}`;
        const isCached = !forceRefresh && !!localStorage.getItem(cacheKey);

        const sourceName = result.isLive ? 'live SerpApi' : 'calibrated mock';
        sourceChip.textContent = isCached ? `${sourceName} (cached)` : sourceName;
        sourceChip.className = `fe-source-chip ${result.isLive ? 'live' : 'mock'}`;
      }

      // Display warning banner if an error fallback occurred
      if (result.error) {
        errorBanner.style.display = 'block';
        if (result.error === 'RATE_LIMIT') {
          errorBanner.innerHTML = '⚠️ SerpApi rate limit (429) exceeded. Using calibrated offline fallback.';
        } else if (result.error === 'UNAUTHORIZED') {
          errorBanner.innerHTML = '⚠️ SerpApi unauthorized (401). Verify your API Key under settings.';
        } else {
          errorBanner.innerHTML = '⚠️ Live flight search failed. Using calibrated offline fallback.';
        }
      } else {
        errorBanner.style.display = 'none';
      }

      // Select first option by default if nothing chosen yet
      if (!selectedCode || !flightPrices.some(p => p.code === selectedCode)) {
        selectedCode = flightPrices[0]?.code || '';
        if (flightPrices[0]) {
          tripStore.set('selectedFlight', flightPrices[0]);
        }
      } else {
        const currentSelected = flightPrices.find(p => p.code === selectedCode);
        if (currentSelected) {
          tripStore.set('selectedFlight', currentSelected);
        }
      }

      renderList();
    } catch (err) {
      console.error(err);
      listEl.innerHTML = `<div class="fe-error">Error loading flight data: ${err.message}</div>`;
    } finally {
      if (searchId === currentSearchId) {
        loadingEl.style.display = 'none';
        listEl.style.opacity = '1';
      }
    }
  }

  // ── Render airline rows ──────────────────────────────────────────────────
  function renderList() {
    listEl.innerHTML = '';

    if (flightPrices.length === 0) {
      listEl.innerHTML = `<div class="fe-empty">No flights found. Try adjusting airports or key.</div>`;
      return;
    }

    flightPrices.forEach((f) => {
      const isSelected = selectedCode === f.code;
      const row = document.createElement('div');
      row.className = `fe-row ${isSelected ? 'selected' : ''}`;

      row.innerHTML = `
        <div class="fe-airline-info">
          <div class="fe-logo-badge ${f.code.toLowerCase()}">${f.code.slice(0, 2)}</div>
          <div>
            <div class="fe-name-row">
              <span class="fe-airline-name">${f.name}</span>
              ${f.direct ? '<span class="fe-direct-badge">DIRECT</span>' : `<span class="fe-stop-badge">${f.note}</span>`}
            </div>
            <div class="fe-path">${f.path}</div>
            <div class="fe-note">Real-time data via Google Flights.</div>
          </div>
        </div>
        <div class="fe-pricing">
          <div class="fe-price">$${f.ticketPrice.toLocaleString()} <span class="fe-rt">RT</span></div>
          <div class="fe-price-per-day">$${f.perDay}/day</div>
        </div>
        <button class="fe-select-btn" ${isSelected ? 'disabled' : ''}>
          ${isSelected ? 'Selected' : 'Select'}
        </button>
      `;

      row.querySelector('.fe-select-btn').addEventListener('click', () => {
        selectedCode = f.code;
        renderList();

        const score = dollarsToFlightScore(f.ticketPrice);
        store.set('flight', score);
        tripStore.set('selectedFlight', f);
      });

      listEl.appendChild(row);
    });
  }

  // ── Listen to trip date updates (with 500ms debounce, loads from cache by default)
  const initialTrip = tripStore.get();
  let lastSearchedStart = initialTrip.tripStart;
  let lastSearchedEnd   = initialTrip.tripEnd;
  let searchDebounce    = null;

  tripStore.subscribe((state) => {
    if (state.tripStart === lastSearchedStart && state.tripEnd === lastSearchedEnd) {
      return;
    }

    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      lastSearchedStart = state.tripStart;
      lastSearchedEnd   = state.tripEnd;
      searchFlights(state, false); // false = default read from local storage cache
    }, 500);
  });

  // Initial trigger immediately on mount (read from cache by default)
  searchFlights(tripStore.get(), false);
}
