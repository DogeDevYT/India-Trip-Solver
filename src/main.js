/**
 * main.js — Application entry point.
 *
 * Responsibilities:
 *   1. Import styles (Vite inlines them at build time)
 *   2. Create the reactive store from factor defaults
 *   3. Render the static app shell HTML into #app
 *   4. Mount all components into their designated mount points
 *   5. Wire the reset button
 *
 * To add a new top-level section or component, add a mount point
 * here and a corresponding component in src/components/.
 */

import './styles/main.css';

import { GO_FACTORS, STAY_FACTORS, buildInitialState } from './data/factors.js';
import { TRIP_START, TRIP_END, JETLAG_END }             from './data/recruitingData.js';
import { createStore }           from './store/store.js';
import { mountDeltaBar }         from './components/DeltaBar.js';
import { mountVerdictBanner }    from './components/VerdictBanner.js';
import { mountColumnCard }       from './components/ColumnCard.js';
import { mountTripDatePicker }   from './components/TripDatePicker.js';
import { mountFlightEstimator }  from './components/FlightEstimator.js';
import { mountFlightGlobe }      from './components/FlightGlobe.js';
import { mountTopStats }         from './components/TopStats.js';
import { mountSimulationPanel }  from './components/SimulationPanel.js';

// ── Factor store (sliders) ─────────────────────────────────────────────────
const store = createStore(buildInitialState());

// ── Trip date store ────────────────────────────────────────────────────────
// Separate from the factor store so trip dates can be reset independently.
// jetlagDays: how many days of impairment after return (default 7).
const tripStore = createStore({
  tripStart:  TRIP_START,         // Jul 15 (day 196)
  tripEnd:    TRIP_END,           // Aug 8  (day 220)
  jetlagDays: JETLAG_END - TRIP_END, // 7
});

// ── App shell ──────────────────────────────────────────────────────────────
// Mount points are plain divs; components own everything inside them.
document.getElementById('app').innerHTML = `
  <div class="app-inner">

    <header>
      <div class="header-top">
        <div>
          <h1>🇮🇳 India Trip Decision Dashboard</h1>
          <div class="header-sub">
            Mid-July → Mid-August &nbsp;·&nbsp; ~3 weeks &nbsp;·&nbsp; 2 cities
            &nbsp;·&nbsp; CS student, SA recruiting overlap
          </div>
        </div>
        <div class="header-meta">
          <span class="chip">⏱ Jul 15 – Aug 8</span>
          <span class="chip">💼 Aug 1 apps go live</span>
          <button class="reset-btn" id="resetBtn">↺ Reset defaults</button>
        </div>
      </div>

      <!-- DeltaBar component mounts here -->
      <div id="deltaBarMount"></div>
    </header>

    <!-- TopStats component mounts here -->
    <div id="topStatsMount"></div>

    <!-- VerdictBanner component mounts here -->
    <div id="verdictMount"></div>

    <!-- ColumnCard components mount here (side by side) -->
    <div class="columns" id="columnsMount"></div>

    <!-- TripDatePicker mounts here -->
    <div id="tripPickerMount"></div>

    <!-- FlightEstimator mounts here -->
    <div id="flightEstimatorMount"></div>

    <!-- FlightGlobe mounts here -->
    <div id="flightGlobeMount"></div>

    <!-- SimulationPanel mounts here -->
    <div id="simMount"></div>

    <div class="footnote">
      <strong>Model notes:</strong>
      Go max = <strong>40</strong> &nbsp;·&nbsp;
      Stay cost max = <strong>60</strong> &nbsp;·&nbsp;
      Net delta = Go − Stay cost.
      <strong>Verdict threshold:</strong> |Δ| &gt; 4 → clear winner; |Δ| ≤ 4 → too close to call.<br />
      <strong>Recruiting risk is partially binary</strong> — jet lag during an OA or HireVue
      is not just a slider value; it can be disqualifying for a specific firm regardless
      of aggregate score. &nbsp;"Can still work from India" is <em>intentionally excluded</em>
      as a go-pro because family obligations make it false. &nbsp;Flight cost per-day =
      ticket estimate ÷ 21 days; opportunity cost of capital excluded.
    </div>

  </div>
`;

// ── Mount components ───────────────────────────────────────────────────────
mountDeltaBar(
  document.getElementById('deltaBarMount'),
  store,
);

mountVerdictBanner(
  document.getElementById('verdictMount'),
  store,
);

mountTopStats(
  document.getElementById('topStatsMount'),
  store,
  tripStore,
);

mountColumnCard('go',   GO_FACTORS,   document.getElementById('columnsMount'), store, tripStore);
mountColumnCard('stay', STAY_FACTORS, document.getElementById('columnsMount'), store, tripStore);

mountTripDatePicker(
  document.getElementById('tripPickerMount'),
  tripStore,
);

mountFlightEstimator(
  document.getElementById('flightEstimatorMount'),
  store,
  tripStore,
);

mountFlightGlobe(
  document.getElementById('flightGlobeMount'),
  store,
  tripStore,
);

mountSimulationPanel(
  document.getElementById('simMount'),
  tripStore,
);

// ── Reset ──────────────────────────────────────────────────────────────────
// All components self-manage via store.subscribe(), so resetting the store
// is sufficient — no manual component updates needed.
document.getElementById('resetBtn').addEventListener('click', () => {
  store.reset(buildInitialState());
});
