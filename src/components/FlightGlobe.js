/**
 * FlightGlobe.js
 *
 * Renders an ultra-premium, interactive 3D WebGL Globe using Globe.gl.
 *
 * Subscribes to the tripStore to dynamically display:
 *   - The exact flight path (outbound, returns, layovers) from live Google Flights data.
 *   - Target hubs labeled with their IATA codes.
 *   - Pulsing threat indicators on any transit airport flagged as high-risk.
 *   - Dynamic geopolitical warning cards showing security details for affected areas.
 */

import Globe from 'globe.gl';
import { AIRPORT_DB } from '../data/recruitingData.js';

export function mountFlightGlobe(container, store, tripStore) {
  const panel = document.createElement('div');
  panel.className = 'fg-panel';
  panel.id = 'flightGlobePanel';

  panel.innerHTML = `
    <div class="fg-header">
      <div class="fg-eyebrow">Geopolitical Risk Analyzer</div>
      <div class="fg-title">Interactive Route Radar</div>
    </div>
    <div class="fg-body">
      <div class="fg-canvas-container" id="globeCanvasContainer"></div>
      <div class="fg-risk-details" id="fgRiskDetails">
        <!-- populated dynamically -->
      </div>
    </div>
  `;

  container.appendChild(panel);

  const globeContainer = panel.querySelector('#globeCanvasContainer');
  const detailsEl      = panel.querySelector('#fgRiskDetails');

  // Initialize Globe.gl
  const myGlobe = Globe()(globeContainer)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .width(280)
    .height(280)
    .showAtmosphere(true)
    .atmosphereColor('#2563eb')
    .atmosphereAltitude(0.15);

  // Set default view pointing to Middle East/India
  myGlobe.pointOfView({ lat: 30, lng: 30, altitude: 2.2 }, 0);

  // ── Render function ──────────────────────────────────────────────────────

  function updateGlobeView(flight) {
    if (!flight || !flight.pathCodes || flight.pathCodes.length === 0) return;

    const route = flight.pathCodes;

    // 1. Build Flight Arcs (glowing blue curves with dashed animations)
    const arcs = [];
    for (let i = 0; i < route.length - 1; i++) {
      const fromLoc = AIRPORT_DB[route[i]];
      const toLoc   = AIRPORT_DB[route[i + 1]];
      if (fromLoc && toLoc) {
        arcs.push({
          startLat: fromLoc.lat,
          startLng: fromLoc.lon,
          endLat:   toLoc.lat,
          endLng:   toLoc.lon,
          color:    flight.affected ? '#ff9b9b' : '#58a6ff', // red if flight path is affected by war risk
        });
      }
    }

    myGlobe
      .arcsData(arcs)
      .arcColor('color')
      .arcDashLength(0.45)
      .arcDashGap(1.5)
      .arcDashAnimateTime(1200)
      .arcStroke(1.5);

    // 2. Build Pulsing Target Rings on affected transit airports
    const rings = [];
    route.forEach((code) => {
      const info = AIRPORT_DB[code];
      if (info && info.risk) {
        rings.push({
          lat: info.lat,
          lng: info.lon,
          color: info.threatLevel === 'CRITICAL' ? '#ef4444' : '#f97316',
        });
      }
    });

    myGlobe
      .ringsData(rings)
      .ringColor(d => d.color)
      .ringMaxRadius(6)
      .ringPropagationSpeed(1.2)
      .ringRepeatPeriod(900);

    // 3. Build Labels (IATA codes + threat indicators)
    const labels = [];
    route.forEach((code) => {
      const loc = AIRPORT_DB[code];
      if (loc) {
        const hasRisk = loc.risk;
        labels.push({
          lat: loc.lat,
          lng: loc.lon,
          text: hasRisk ? `⚠️ ${code}` : code,
          color: hasRisk ? '#f85149' : '#58a6ff',
          size: hasRisk ? 1.8 : 1.4,
        });
      }
    });

    myGlobe
      .labelsData(labels)
      .labelText('text')
      .labelSize(d => d.size)
      .labelDotRadius(0.4)
      .labelColor(d => d.color)
      .labelResolution(3);

    // 4. Smoothly pan camera to center on flight path midpoint
    const midPoint = getRouteMidpoint(route);
    myGlobe.pointOfView({ lat: midPoint.lat, lng: midPoint.lon, altitude: 2.0 }, 1000);
  }

  // Calculate coordinates center point to direct camera
  function getRouteMidpoint(route) {
    let latSum = 0;
    let lonSum = 0;
    let count = 0;
    route.forEach(code => {
      const loc = AIRPORT_DB[code];
      if (loc) {
        latSum += loc.lat;
        lonSum += loc.lon;
        count++;
      }
    });
    return {
      lat: count > 0 ? latSum / count : 30,
      lon: count > 0 ? lonSum / count : 30,
    };
  }

  // ── Geopolitical Risk Assessment Logic ────────────────────────────────────

  function assessRisk(flight) {
    if (!flight) return;

    let alertHtml = '';

    if (flight.affected && flight.threats && flight.threats.length > 0) {
      const threatCards = flight.threats.map(t => `
        <div class="fg-threat-item">
          <div class="fg-threat-badge ${t.level.toLowerCase()}">${t.level} RISK</div>
          <strong>${t.name} (${t.airport})</strong>
          <div class="fg-threat-details">${t.details}</div>
        </div>
      `).join('');

      alertHtml = `
        <div class="fg-alert danger">
          <div class="fg-alert-title">⚠️ Geopolitical War Zone Threats Detected</div>
          <div class="fg-threat-list">${threatCards}</div>
          <div class="fg-threat-summary-note">
            Transit flights near the Strait of Hormuz/Iran are subject to GPS spoofing and airspace closure risks.
          </div>
        </div>
      `;
    } else {
      alertHtml = `
        <div class="fg-alert ok">
          <div class="fg-alert-title">✅ Airspace Warning Cleared</div>
          <div class="fg-alert-body">
            Selected route avoids Persian Gulf conflict zones. Direct paths or European connections routing north
            bypass current geopolitical threat boundaries entirely.
          </div>
        </div>
      `;
    }

    detailsEl.innerHTML = `
      <div class="fg-details-title">Route Path: ${flight.path}</div>
      ${alertHtml}
      <div class="fg-drag-hint">↔ Drag globe to rotate, scroll to zoom</div>
    `;
  }

  // ── Subscribe to tripStore ───────────────────────────────────────────────
  tripStore.subscribe((state) => {
    if (state.selectedFlight) {
      updateGlobeView(state.selectedFlight);
      assessRisk(state.selectedFlight);
    }
  });

  // Initial render check
  const initFlight = tripStore.get().selectedFlight;
  if (initFlight) {
    updateGlobeView(initFlight);
    assessRisk(initFlight);
  }
}
