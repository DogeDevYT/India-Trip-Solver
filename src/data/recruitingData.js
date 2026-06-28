/**
 * recruitingData.js — Calibrated firm-level recruiting distributions.
 *
 * Dates are encoded as day-of-year (1 = Jan 1, 196 = Jul 15, 220 = Aug 8).
 * Distributions are Normal(meanDay, stdDev) fit to 2022–2025 community data.
 */

// ── Trip window (day-of-year) ──────────────────────────────────────────────
export const TRIP_START = 196; // Jul 15  — departure
export const TRIP_END   = 220; // Aug 8   — return day (inclusive; you're still travelling/landing)
export const JETLAG_END = 227; // Aug 15  — ~7 days of meaningful impairment after return

/**
 * Convert a month + day to day-of-year (non-leap year).
 * dayOfYear(8, 1) → 213 (Aug 1)
 */
export function dayOfYear(month, day) {
  const offsets = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return offsets[month - 1] + day;
}

/**
 * Format a day-of-year as a readable date string, e.g. "Aug 1".
 */
export function formatDay(doy) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sizes   = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let remaining = doy;
  for (let m = 0; m < 12; m++) {
    if (remaining <= sizes[m]) return `${months[m]} ${remaining}`;
    remaining -= sizes[m];
  }
  return `Day ${doy}`;
}

/** Year used for calendar picker inputs. */
export const TRIP_YEAR = 2026;

/**
 * Convert a day-of-year to an ISO date string ("YYYY-MM-DD") for use in
 * <input type="date"> values. Uses month arithmetic to avoid timezone shifts.
 */
export function doyToDateStr(doy) {
  const sizes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let remaining = doy;
  for (let m = 0; m < 12; m++) {
    if (remaining <= sizes[m]) {
      return `${TRIP_YEAR}-${String(m + 1).padStart(2, '0')}-${String(remaining).padStart(2, '0')}`;
    }
    remaining -= sizes[m];
  }
  return `${TRIP_YEAR}-12-31`;
}

/**
 * Convert an ISO date string ("YYYY-MM-DD") back to a day-of-year.
 */
export function dateStrToDoy(dateStr) {
  const parts = dateStr.split('-');
  return dayOfYear(parseInt(parts[1], 10), parseInt(parts[2], 10));
}

/**
 * Season display range used by the timeline visualisation.
 * Covers all firms' plausible open dates with some padding.
 */
export const SEASON_START = dayOfYear(6, 1);   // Jun 1  (day 152)
export const SEASON_END   = dayOfYear(10, 1);  // Oct 1  (day 274)

// ── Firm definitions ───────────────────────────────────────────────────────
export const FIRMS = [
  // ── Quant & HFT (highly competitive finance/tech overlap; opens very early) ──
  {
    id: 'janestreet', name: 'Jane Street', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 1), stdDev: 5, highPriority: true,
    source: 'Historically opens very early, late June or early July.'
  },
  {
    id: 'hrt', name: 'Hudson River Trading', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 5), stdDev: 5, highPriority: true,
    source: 'Typical early July opening.'
  },
  {
    id: 'citadel', name: 'Citadel', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 10), stdDev: 6, highPriority: true,
    source: 'CIT/Citadel Sec typical early-mid July openings.'
  },
  {
    id: 'citadelsecurities', name: 'Citadel Securities', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 10), stdDev: 6, highPriority: true,
    source: 'Parallel with Citadel main.'
  },
  {
    id: 'fiverings', name: 'Five Rings Capital', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 12), stdDev: 6, highPriority: true,
    source: 'Early July opener.'
  },
  {
    id: 'virtu', name: 'Virtu Financial', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 15), stdDev: 7, highPriority: false,
    source: 'Opens mid July.'
  },
  {
    id: 'sig', name: 'Susquehanna International Group (SIG)', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 18), stdDev: 7, highPriority: true,
    source: 'Mid-late July typical.'
  },
  {
    id: 'optiver', name: 'Optiver', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 8), stdDev: 5, highPriority: true,
    source: 'Famous early July opener.'
  },
  {
    id: 'aquatic', name: 'Aquatic Capital Management', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 20), stdDev: 8, highPriority: false,
    source: 'Mid July typical.'
  },
  {
    id: 'aqr', name: 'AQR Capital Management', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 22), stdDev: 8, highPriority: false,
    source: 'Mid-late July typical.'
  },
  {
    id: 'twosigma', name: 'Two Sigma', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 15), stdDev: 6, highPriority: true,
    source: 'Mid July typical.'
  },
  {
    id: 'jump', name: 'Jump Trading', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 18), stdDev: 6, highPriority: true,
    source: 'Mid July opener.'
  },
  {
    id: 'drw', name: 'DRW', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 20), stdDev: 7, highPriority: true,
    source: 'Typical mid July opening.'
  },
  {
    id: 'imc', name: 'IMC Trading', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 12), stdDev: 5, highPriority: true,
    source: 'Early July opener.'
  },
  {
    id: 'rentech', name: 'Renaissance Technologies', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(8, 1), stdDev: 10, highPriority: false,
    source: 'Varying mid-summer openings.'
  },
  {
    id: 'millennium', name: 'Millennium Management', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 25), stdDev: 8, highPriority: true,
    source: 'Late July typical.'
  },
  {
    id: 'flowtraders', name: 'Flow Traders', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 15), stdDev: 7, highPriority: false,
    source: 'Mid July opener.'
  },
  {
    id: 'tower', name: 'Tower Research Capital', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 22), stdDev: 8, highPriority: false,
    source: 'Late July typical.'
  },
  {
    id: 'squarepoint', name: 'Squarepoint Capital', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 24), stdDev: 8, highPriority: false,
    source: 'Late July typical.'
  },
  {
    id: 'radix', name: 'Radix Trading', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 10), stdDev: 5, highPriority: true,
    source: 'Early July opener.'
  },
  {
    id: 'voleon', name: 'Voleon', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 28), stdDev: 10, highPriority: false,
    source: 'Late July/early Aug typical.'
  },
  {
    id: 'transmarket', name: 'TransMarket Group', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 15), stdDev: 7, highPriority: false,
    source: 'Mid July typical.'
  },
  {
    id: 'oldmission', name: 'Old Mission Capital', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 18), stdDev: 7, highPriority: false,
    source: 'Mid July typical.'
  },
  {
    id: 'ctc', name: 'Chicago Trading Company', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 20), stdDev: 7, highPriority: false,
    source: 'Mid July typical.'
  },
  {
    id: 'belvedere', name: 'Belvedere Trading', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 15), stdDev: 6, highPriority: false,
    source: 'Mid July typical.'
  },
  {
    id: 'wolverine', name: 'Wolverine Trading', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 18), stdDev: 6, highPriority: false,
    source: 'Mid July typical.'
  },
  {
    id: 'gresearch', name: 'G-Research', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 1), stdDev: 5, highPriority: true,
    source: 'Very early July typical.'
  },
  {
    id: 'cubist', name: 'Cubist Systematic Strategies', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 15), stdDev: 6, highPriority: true,
    source: 'Citadel-aligned early timelines.'
  },
  {
    id: 'deshaw', name: 'D.E. Shaw', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 12), stdDev: 5, highPriority: true,
    source: 'Very early July typical.'
  },
  {
    id: 'akuna', name: 'Akuna Capital', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 10), stdDev: 5, highPriority: true,
    source: 'Early July opener.'
  },
  {
    id: 'walleye', name: 'Walleye Capital', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 20), stdDev: 8, highPriority: false,
    source: 'Mid July typical.'
  },
  {
    id: 'point72', name: 'Point72', tier: 'Quant & HFT', category: 'finance',
    meanDay: dayOfYear(7, 15), stdDev: 6, highPriority: true,
    source: 'Mid July typical.'
  },

  // ── Bulge Bracket & EB (traditional finance, late July / August) ──
  {
    id: 'gs', name: 'Goldman Sachs', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(7, 25), stdDev: 4, highPriority: true,
    source: 'Late July consistent 2022–2025.'
  },
  {
    id: 'ms', name: 'Morgan Stanley', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(7, 28), stdDev: 4, highPriority: true,
    source: 'Closely follows GS.'
  },
  {
    id: 'jpm', name: 'JPMorgan', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 1), stdDev: 5, highPriority: true,
    source: 'Early August typical.'
  },
  {
    id: 'bofa', name: 'Bank of America', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 2), stdDev: 5, highPriority: true,
    source: 'Early August typical.'
  },
  {
    id: 'citi', name: 'Citi', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 3), stdDev: 6, highPriority: true,
    source: 'Early August typical.'
  },
  {
    id: 'wellsfargo', name: 'Wells Fargo', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 5), stdDev: 6, highPriority: false,
    source: 'Early-mid August typical.'
  },
  {
    id: 'barclays', name: 'Barclays', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 4), stdDev: 6, highPriority: false,
    source: 'Early August typical.'
  },
  {
    id: 'db', name: 'Deutsche Bank', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 6), stdDev: 7, highPriority: false,
    source: 'Early-mid August typical.'
  },
  {
    id: 'ubs', name: 'UBS', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 5), stdDev: 6, highPriority: false,
    source: 'Early August typical.'
  },
  {
    id: 'bnymellon', name: 'BNY Mellon', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 15), stdDev: 10, highPriority: false,
    source: 'Mid August typical.'
  },
  {
    id: 'statestreet', name: 'State Street', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 18), stdDev: 10, highPriority: false,
    source: 'Mid-late August typical.'
  },
  {
    id: 'nomura', name: 'Nomura', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 12), stdDev: 8, highPriority: false,
    source: 'Mid August typical.'
  },
  {
    id: 'pnc', name: 'PNC', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 20), stdDev: 12, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'charlesschwab', name: 'Charles Schwab', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 22), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'evr', name: 'Evercore', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 3), stdDev: 5, highPriority: true,
    source: 'Opens early August.'
  },
  {
    id: 'laz', name: 'Lazard', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 5), stdDev: 6, highPriority: false,
    source: 'Early August typical.'
  },
  {
    id: 'jefferies', name: 'Jefferies', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 8), stdDev: 7, highPriority: false,
    source: 'Early August typical.'
  },
  {
    id: 'cen', name: 'Centerview', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 7), stdDev: 7, highPriority: true,
    source: 'Often opens Aug 7–10.'
  },
  {
    id: 'pjt', name: 'PJT Partners', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 5), stdDev: 6, highPriority: true,
    source: 'Early August typical.'
  },
  {
    id: 'moe', name: 'Moelis', tier: 'Bulge Bracket & EB', category: 'finance',
    meanDay: dayOfYear(8, 8), stdDev: 7, highPriority: false,
    source: 'Early August typical.'
  },

  // ── Asset Management & PE (August to mid September) ──
  {
    id: 'vanguard', name: 'Vanguard', tier: 'Asset Management & PE', category: 'finance',
    meanDay: dayOfYear(8, 25), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'fidelity', name: 'Fidelity', tier: 'Asset Management & PE', category: 'finance',
    meanDay: dayOfYear(8, 20), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'blackrock', name: 'BlackRock', tier: 'Asset Management & PE', category: 'finance',
    meanDay: dayOfYear(8, 15), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },
  {
    id: 'bridgewater', name: 'Bridgewater', tier: 'Asset Management & PE', category: 'finance',
    meanDay: dayOfYear(8, 10), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },
  {
    id: 'coatue', name: 'Coatue Management', tier: 'Asset Management & PE', category: 'finance',
    meanDay: dayOfYear(8, 12), stdDev: 8, highPriority: false,
    source: 'Mid August typical.'
  },
  {
    id: 'spglobal', name: 'S&P Global', tier: 'Asset Management & PE', category: 'finance',
    meanDay: dayOfYear(8, 30), stdDev: 12, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'moodys', name: 'Moody\'s', tier: 'Asset Management & PE', category: 'finance',
    meanDay: dayOfYear(8, 30), stdDev: 12, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'factset', name: 'FactSet', tier: 'Asset Management & PE', category: 'finance',
    meanDay: dayOfYear(9, 1), stdDev: 10, highPriority: false,
    source: 'Early September typical.'
  },
  {
    id: 'bloomberg', name: 'Bloomberg', tier: 'Asset Management & PE', category: 'finance',
    meanDay: dayOfYear(8, 15), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },

  // ── FAANG & Big Tech (large scale tech, August to September) ──
  {
    id: 'google', name: 'Google', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(8, 12), stdDev: 7, highPriority: true,
    source: 'Mid-August historically.'
  },
  {
    id: 'meta', name: 'Meta', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(8, 15), stdDev: 8, highPriority: true,
    source: 'Mid-August historically.'
  },
  {
    id: 'apple', name: 'Apple', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(8, 18), stdDev: 9, highPriority: true,
    source: 'Mid-late August typical.'
  },
  {
    id: 'netflix', name: 'Netflix', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(8, 20), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'amazon', name: 'Amazon', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 2), stdDev: 10, highPriority: true,
    source: 'Historically a September opener.'
  },
  {
    id: 'microsoft', name: 'Microsoft', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(8, 25), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'nvidia', name: 'Nvidia', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: true,
    source: 'September typical.'
  },
  {
    id: 'adobe', name: 'Adobe', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(8, 28), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'salesforce', name: 'Salesforce', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 1), stdDev: 10, highPriority: false,
    source: 'Early September typical.'
  },
  {
    id: 'oracle', name: 'Oracle', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'ibm', name: 'IBM', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 8), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'cisco', name: 'Cisco', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'paloalto', name: 'Palo Alto Networks', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'crowdstrike', name: 'CrowdStrike', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 8), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'servicenow', name: 'ServiceNow', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'intuit', name: 'Intuit', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 1), stdDev: 10, highPriority: false,
    source: 'Early September typical.'
  },
  {
    id: 'purestorage', name: 'Pure Storage', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'netapp', name: 'NetApp', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 12), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'nutanix', name: 'Nutanix', tier: 'FAANG & Big Tech', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },

  // ── Unicorns & AI (high-growth startups, AI labs, and high-visibility firms) ──
  {
    id: 'openai', name: 'OpenAI', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 20), stdDev: 10, highPriority: true,
    source: 'August-September typical.'
  },
  {
    id: 'xai', name: 'xAI', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 25), stdDev: 10, highPriority: true,
    source: 'August-September typical.'
  },
  {
    id: 'anthropic', name: 'Anthropic', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 22), stdDev: 10, highPriority: true,
    source: 'August-September typical.'
  },
  {
    id: 'waymo', name: 'Waymo', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(9, 1), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'scaleai', name: 'Scale AI', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 28), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'anduril', name: 'Anduril', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 15), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },
  {
    id: 'stripe', name: 'Stripe', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 18), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },
  {
    id: 'ramp', name: 'Ramp', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 20), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },
  {
    id: 'rippling', name: 'Rippling', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 22), stdDev: 9, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'brex', name: 'Brex', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 25), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'plaid', name: 'Plaid', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 20), stdDev: 9, highPriority: true,
    source: 'Mid-late August typical.'
  },
  {
    id: 'figma', name: 'Figma', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 28), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'databricks', name: 'Databricks', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 15), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },
  {
    id: 'snowflake', name: 'Snowflake', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(9, 2), stdDev: 10, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'palantir', name: 'Palantir', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(8, 18), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },
  {
    id: 'rubrik', name: 'Rubrik', tier: 'Unicorns & AI', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },

  // ── Fintech & Consumer Tech (high growth / general consumer, late summer) ──
  {
    id: 'robinhood', name: 'Robinhood', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(8, 25), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'coinbase', name: 'Coinbase', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(8, 28), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'uber', name: 'Uber', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(8, 15), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },
  {
    id: 'lyft', name: 'Lyft', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 2), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'doordash', name: 'DoorDash', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(8, 30), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'instacart', name: 'Instacart', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'shopify', name: 'Shopify', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(8, 20), stdDev: 8, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'toast', name: 'Toast', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'sofi', name: 'SoFi', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(8, 30), stdDev: 12, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'affirm', name: 'Affirm', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 2), stdDev: 10, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'chime', name: 'Chime', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'klarna', name: 'Klarna', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'wealthfront', name: 'Wealthfront', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'betterment', name: 'Betterment', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 12), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'nerdwallet', name: 'NerdWallet', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'gofundme', name: 'GoFundMe', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'zoom', name: 'Zoom', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'dropbox', name: 'Dropbox', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 2), stdDev: 10, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'box', name: 'Box', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 8), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'twitch', name: 'Twitch', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 2), stdDev: 10, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'slack', name: 'Slack', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 10, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'linkedin', name: 'LinkedIn', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(8, 25), stdDev: 8, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'pinterest', name: 'Pinterest', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 2), stdDev: 10, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'cloudflare', name: 'Cloudflare', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(8, 22), stdDev: 9, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'twilio', name: 'Twilio', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'atlassian', name: 'Atlassian', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'mongodb', name: 'MongoDB', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 8), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'elastic', name: 'Elastic', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'hashicorp', name: 'HashiCorp', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 12), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'okta', name: 'Okta', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 8), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'workday', name: 'Workday', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'datadog', name: 'Datadog', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(8, 28), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'block', name: 'Block', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 2), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'splunk', name: 'Splunk', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'zendesk', name: 'Zendesk', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'hubspot', name: 'HubSpot', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 2), stdDev: 10, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'veeva', name: 'Veeva Systems', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'guidewire', name: 'Guidewire', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'wattpad', name: 'Wattpad', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 20), stdDev: 14, highPriority: false,
    source: 'Late September typical.'
  },

  // ── Defense, Hardware & Industrial (aerospace, defense, physical systems, components) ──
  {
    id: 'spacex', name: 'SpaceX', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(8, 15), stdDev: 8, highPriority: true,
    source: 'Mid August typical.'
  },
  {
    id: 'lockheed', name: 'Lockheed Martin', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(8, 20), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'raytheon', name: 'Raytheon', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(8, 22), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'northrop', name: 'Northrop Grumman', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(8, 25), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'l3harris', name: 'L3Harris', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(8, 28), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'generaldynamics', name: 'General Dynamics', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 1), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'leidos', name: 'Leidos', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'joby', name: 'Joby Aviation', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 8), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'boomsupersonic', name: 'Boom Supersonic', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'rocketlab', name: 'Rocket Lab', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(8, 30), stdDev: 10, highPriority: false,
    source: 'Late August typical.'
  },
  {
    id: 'tesla', name: 'Tesla', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(8, 20), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'bmw', name: 'BMW', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'volkswagen', name: 'Volkswagen', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'rivian', name: 'Rivian', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'caterpillar', name: 'Caterpillar', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'deltaairlines', name: 'Delta Air Lines', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 20), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'fedex', name: 'FedEx', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 20), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'seagate', name: 'Seagate', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'intel', name: 'Intel', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 1), stdDev: 10, highPriority: false,
    source: 'Early September typical.'
  },
  {
    id: 'amd', name: 'AMD', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 1), stdDev: 10, highPriority: false,
    source: 'Early September typical.'
  },
  {
    id: 'qualcomm', name: 'Qualcomm', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'broadcom', name: 'Broadcom', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'appliedmaterials', name: 'Applied Materials', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'visa', name: 'Visa', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(8, 25), stdDev: 10, highPriority: true,
    source: 'Late August typical.'
  },
  {
    id: 'walmart', name: 'Walmart', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 15), stdDev: 14, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'disney', name: 'Walt Disney Company', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'mathworks', name: 'MathWorks', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'epicsystems', name: 'Epic Systems', tier: 'Defense, Hardware & Industrial', category: 'tech',
    meanDay: dayOfYear(9, 10), stdDev: 12, highPriority: false,
    source: 'September typical.'
  },
  {
    id: 'creditkarma', name: 'Credit Karma', tier: 'Fintech & Consumer Tech', category: 'tech',
    meanDay: dayOfYear(9, 5), stdDev: 12, highPriority: false,
    source: 'September typical.'
  }
];

// ── Derived groupings ──────────────────────────────────────────────────────
export const TIER_ORDER = [
  'Quant & HFT',
  'Bulge Bracket & EB',
  'Asset Management & PE',
  'FAANG & Big Tech',
  'Unicorns & AI',
  'Fintech & Consumer Tech',
  'Defense, Hardware & Industrial'
];

export const HIGH_PRIORITY_FIRMS = FIRMS.filter(f => f.highPriority);

// ── Airport Database with Geopolitical Risk Flags ─────────────────────────
export const AIRPORT_DB = {
  // US Gateways
  JFK: { lat: 40.6413, lon: -73.7781, name: 'New York (JFK)', risk: false },
  SFO: { lat: 37.6213, lon: -122.3790, name: 'San Francisco (SFO)', risk: false },
  ORD: { lat: 41.9742, lon: -87.9073, name: 'Chicago (ORD)', risk: false },
  LAX: { lat: 33.9416, lon: -118.4085, name: 'Los Angeles (LAX)', risk: false },
  EWR: { lat: 40.6895, lon: -74.1745, name: 'Newark (EWR)', risk: false },
  IAD: { lat: 38.9531, lon: -77.4565, name: 'Washington Dulles (IAD)', risk: false },
  BOS: { lat: 42.3656, lon: -71.0096, name: 'Boston (BOS)', risk: false },
  SEA: { lat: 47.4502, lon: -122.3088, name: 'Seattle (SEA)', risk: false },
  DFW: { lat: 32.8998, lon: -97.0403, name: 'Dallas (DFW)', risk: false },
  ATL: { lat: 33.6407, lon: -84.4277, name: 'Atlanta (ATL)', risk: false },

  // India Gateways
  DEL: { lat: 28.5562, lon: 77.1000, name: 'Delhi (DEL)', risk: false },
  BOM: { lat: 19.0896, lon: 72.8656, name: 'Mumbai (BOM)', risk: false },
  BLR: { lat: 13.1986, lon: 77.7066, name: 'Bengaluru (BLR)', risk: false },
  HYD: { lat: 17.2403, lon: 78.4294, name: 'Hyderabad (HYD)', risk: false },
  MAA: { lat: 12.9941, lon: 80.1709, name: 'Chennai (MAA)', risk: false },

  // Middle East Hubs (Close to Strait of Hormuz / Persian Gulf / Iran)
  DXB: { lat: 25.2532, lon: 55.3657, name: 'Dubai (DXB)', risk: true, threatLevel: 'CRITICAL', details: 'Directly on the Strait of Hormuz flight corridor; severe GPS spoofing reported.' },
  AUH: { lat: 24.4330, lon: 54.6511, name: 'Abu Dhabi (AUH)', risk: true, threatLevel: 'HIGH', details: 'Adjacent to Persian Gulf airspace; heavily exposed to regional airspace closure risks.' },
  DOH: { lat: 25.2611, lon: 51.5648, name: 'Doha (DOH)', risk: true, threatLevel: 'HIGH', details: 'Requires routing near Persian Gulf conflict corridors and Iranian ATC borders.' },
  MCT: { lat: 23.5933, lon: 58.2844, name: 'Muscat (MCT)', risk: true, threatLevel: 'MEDIUM', details: 'Located on Gulf of Oman transit routes near active maritime tension areas.' },
  KWI: { lat: 29.2268, lon: 47.9689, name: 'Kuwait (KWI)', risk: true, threatLevel: 'MEDIUM', details: 'North Persian Gulf route; close to complex boundary airspaces.' },
  BAH: { lat: 26.2708, lon: 50.6336, name: 'Bahrain (BAH)', risk: true, threatLevel: 'HIGH', details: 'Central Persian Gulf transit hub; close to potential navigation spoofing zones.' },
  SHJ: { lat: 25.3286, lon: 55.5172, name: 'Sharjah (SHJ)', risk: true, threatLevel: 'CRITICAL', details: 'Parallel track to DXB; directly bordering Strait of Hormuz flight paths.' },

  // Europe Hubs
  LHR: { lat: 51.4700, lon: -0.4543, name: 'London (LHR)', risk: false },
  CDG: { lat: 49.0097, lon: 2.5479, name: 'Paris (CDG)', risk: false },
  FRA: { lat: 50.0379, lon: 8.5622, name: 'Frankfurt (FRA)', risk: false },
  AMS: { lat: 52.3105, lon: 4.7683, name: 'Amsterdam (AMS)', risk: false },
  IST: { lat: 41.2599, lon: 28.7277, name: 'Istanbul (IST)', risk: false },
  ZRH: { lat: 47.4582, lon: 8.5555, name: 'Zurich (ZRH)', risk: false },
  MUC: { lat: 48.3537, lon: 11.7860, name: 'Munich (MUC)', risk: false },
  HEL: { lat: 60.3172, lon: 24.9633, name: 'Helsinki (HEL)', risk: false },

  // Asia Hubs
  SIN: { lat: 1.3644, lon: 103.9915, name: 'Singapore (SIN)', risk: false },
  HKG: { lat: 22.3080, lon: 113.9185, name: 'Hong Kong (HKG)', risk: false },
  ICN: { lat: 37.4602, lon: 126.4407, name: 'Seoul (ICN)', risk: false },
  NRT: { lat: 35.7767, lon: 140.3864, name: 'Tokyo Narita (NRT)', risk: false },
  HND: { lat: 35.5494, lon: 139.7798, name: 'Tokyo Haneda (HND)', risk: false },
  TPE: { lat: 25.0797, lon: 121.2342, name: 'Taipei (TPE)', risk: false },
  BKK: { lat: 13.6900, lon: 100.7501, name: 'Bangkok (BKK)', risk: false },
};

