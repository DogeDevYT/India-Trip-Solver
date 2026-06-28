/**
 * flightApi.js — Live SerpApi Google Flights API client.
 *
 * Authenticates using SerpApi API key.
 * Proxied via Vite config to bypass CORS browser blocks:
 *   Vite routes /api/serpapi/* -> https://serpapi.com/*
 *
 * Implements a persistent localStorage cache to prevent credit drain on reloads.
 */

import { doyToDateStr, AIRPORT_DB } from '../data/recruitingData.js';

// ── Fallback Airline Config ────────────────────────────────────────────────
export const AIRLINES = [
  {
    code: 'AI',
    name: 'Air India',
    basePrice: 1250,
    direct: true,
    note: 'Direct flight (NYC/SFO to DEL/BOM). Saves time/jetlag but mixed service quality.',
  },
  {
    code: 'UA',
    name: 'United Airlines',
    basePrice: 1400,
    direct: true,
    note: 'Direct flight. Reliable EST schedules, but often pricier for late bookings.',
  },
  {
    code: 'EK',
    name: 'Emirates',
    basePrice: 1650,
    direct: false,
    note: '1-stop via DXB. Outstanding service, but layover adds to total transit time.',
  },
  {
    code: 'QR',
    name: 'Qatar Airways',
    basePrice: 1700,
    direct: false,
    note: '1-stop via DOH. World-class business/economy, long-haul segment is very comfortable.',
  },
  {
    code: 'SQ',
    name: 'Singapore Airlines',
    basePrice: 1800,
    direct: false,
    note: '1-stop via SIN. Ultra-premium, but SIN layover adds significant flight hours.',
  },
  {
    code: 'BA',
    name: 'British Airways',
    basePrice: 1150,
    direct: false,
    note: '1-stop via LHR. Often the most economical option, but LHR connection risk.',
  },
  {
    code: 'EY',
    name: 'Etihad Airways',
    basePrice: 1550,
    direct: false,
    note: '1-stop via AUH. Premium service, but transits via Abu Dhabi near the Strait of Hormuz.',
  },
];

/**
 * Main entry point for flight pricing.
 * Checks for local storage cache unless forceRefresh is true.
 * Decides between live SerpApi search and mock fallback.
 *
 * @param {number} departDoy  Departure day-of-year
 * @param {number} returnDoy  Return day-of-year
 * @param {string} depAirport Departure airport IATA code
 * @param {string} arrAirport Arrival airport IATA code
 * @param {boolean} forceRefresh Ignore cache and pull fresh data
 * @returns {Promise<{ prices: object[], isLive: boolean, error: string | null }>}
 */
export async function fetchFlightPrices(departDoy, returnDoy, depAirport = 'JFK', arrAirport = 'DEL', forceRefresh = false) {
  const cacheKey = `flight_cache_${depAirport}_${arrAirport}_${departDoy}_${returnDoy}`;

  // 1. Try cache if forceRefresh is false
  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Expire local cache after 4 hours
        if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
          console.log(`[Cache Hit] Returning flight details for key: ${cacheKey}`);
          return parsed.result;
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
  }

  const apiKey = localStorage.getItem('serpapi_key');
  let result;

  // 2. Query Live API or Mock
  if (apiKey && apiKey.trim() !== '') {
    try {
      const prices = await fetchSerpApiPrices(apiKey, departDoy, returnDoy, depAirport, arrAirport);
      result = {
        prices,
        isLive: true,
        error: null,
      };
    } catch (err) {
      console.warn('SerpApi Live API call failed, falling back to calibrated mock data:', err.message);
      const mockPrices = await fetchMockPrices(departDoy, returnDoy, depAirport, arrAirport);

      let errorType = 'API_ERROR';
      if (err.message.includes('429')) errorType = 'RATE_LIMIT';
      else if (err.message.includes('401')) errorType = 'UNAUTHORIZED';

      result = {
        prices: mockPrices,
        isLive: false,
        error: errorType,
      };
    }
  } else {
    const mockPrices = await fetchMockPrices(departDoy, returnDoy, depAirport, arrAirport);
    result = {
      prices: mockPrices,
      isLive: false,
      error: null,
    };
  }

  // 3. Save to cache (skip caching if API unauthorized)
  if (result.error !== 'UNAUTHORIZED') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        result,
      }));
    } catch (e) {
      console.warn('Failed to write flight cache to localStorage:', e);
    }
  }

  return result;
}

// ── Live SerpApi Call ──────────────────────────────────────────────────────

async function fetchSerpApiPrices(apiKey, departDoy, returnDoy, depAirport, arrAirport) {
  const outboundDate = doyToDateStr(departDoy);
  const returnDate   = doyToDateStr(returnDoy);
  const duration     = returnDoy - departDoy + 1;

  const url = `/api/serpapi/search.json?engine=google_flights&departure_id=${depAirport}&arrival_id=${arrAirport}&outbound_date=${outboundDate}&return_date=${returnDate}&currency=USD&api_key=${apiKey.trim()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`SerpApi HTTP error! Status: ${response.status}`);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(`SerpApi Error: ${json.error}`);
  }

  return parseSerpApiResponse(json, duration, depAirport, arrAirport);
}

/**
 * Parses SerpApi Google Flights response.
 */
function parseSerpApiResponse(json, duration, depAirport, arrAirport) {
  const best = json.best_flights || [];
  const other = json.other_flights || [];
  const list = [...best, ...other];

  if (list.length === 0) {
    throw new Error('No flight offers returned for the selected dates/airports.');
  }

  return list.slice(0, 12).map((item) => {
    const price = item.price || 1200;
    const flights = item.flights || [];
    const firstLeg = flights[0] || {};
    const airline = firstLeg.airline || item.airline || 'Other Airline';

    let code = 'XX';
    if (firstLeg.flight_number) {
      code = firstLeg.flight_number.split(' ')[0] || 'XX';
    } else if (airline) {
      code = airline.slice(0, 2).toUpperCase();
    }

    const stops = item.stops !== undefined ? item.stops : (flights.length > 0 ? flights.length - 1 : 0);
    const direct = stops === 0;

    // Build flight path string, e.g., JFK ➔ LHR ➔ DEL
    const pathCodes = [];
    if (flights.length > 0) {
      pathCodes.push(flights[0].departure_airport?.id || depAirport);
      flights.forEach(f => {
        if (f.arrival_airport?.id) pathCodes.push(f.arrival_airport.id);
      });
    } else {
      pathCodes.push(depAirport, arrAirport);
    }
    const path = pathCodes.join(' ➔ ');

    const threats = [];
    let affected = false;

    pathCodes.forEach((code) => {
      const info = AIRPORT_DB[code];
      if (info && info.risk) {
        affected = true;
        threats.push({
          airport: code,
          name: info.name,
          level: info.threatLevel || 'HIGH',
          details: info.details || 'Located near active geopolitical tension areas.'
        });
      }
    });

    return {
      code,
      name: airline,
      ticketPrice: Math.round(price),
      perDay: Math.round(price / duration),
      direct,
      note: direct ? 'Direct flight' : `${stops}-stop connection flight`,
      path,
      pathCodes,
      affected,
      threats,
    };
  });
}

// ── Mock Fallback ──────────────────────────────────────────────────────────

function fetchMockPrices(departDoy, returnDoy, depAirport, arrAirport) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const duration = returnDoy - departDoy + 1;

      // Peak July pricing +25%, August +5%, June/Sept -10%
      let seasonMultiplier = 1.0;
      if (departDoy >= 182 && departDoy <= 212) {
        seasonMultiplier = 1.25;
      } else if (departDoy > 212 && departDoy <= 243) {
        seasonMultiplier = 1.05;
      } else {
        seasonMultiplier = 0.90;
      }

      // Duration adjustment
      let durationMultiplier = 1.0;
      if (duration < 12) {
        durationMultiplier = 1.10;
      } else if (duration > 25) {
        durationMultiplier = 0.92;
      }

      // Mock flight paths
      const mockPaths = {
        'AI': [depAirport, arrAirport],
        'UA': [depAirport, arrAirport],
        'EK': [depAirport, 'DXB', arrAirport],
        'QR': [depAirport, 'DOH', arrAirport],
        'SQ': [depAirport, 'SIN', arrAirport],
        'BA': [depAirport, 'LHR', arrAirport],
        'EY': [depAirport, 'AUH', arrAirport],
      };

      const results = AIRLINES.map((airline) => {
        const seedVal = (airline.code.charCodeAt(0) + departDoy + returnDoy) % 10;
        const variation = 1 + (seedVal - 5) * 0.02;

        const finalPrice = Math.round(
          airline.basePrice * seasonMultiplier * durationMultiplier * variation
        );

        const pathCodes = mockPaths[airline.code] || [depAirport, arrAirport];
        const path = pathCodes.join(' ➔ ');

        const threats = [];
        let affected = false;

        pathCodes.forEach((code) => {
          const info = AIRPORT_DB[code];
          if (info && info.risk) {
            affected = true;
            threats.push({
              airport: code,
              name: info.name,
              level: info.threatLevel || 'HIGH',
              details: info.details || 'Located near active geopolitical tension areas.'
            });
          }
        });

        return {
          code: airline.code,
          name: airline.name,
          ticketPrice: finalPrice,
          perDay: Math.round(finalPrice / duration),
          direct: airline.direct,
          note: airline.note,
          path,
          pathCodes,
          affected,
          threats,
        };
      });

      resolve(results);
    }, 400);
  });
}
