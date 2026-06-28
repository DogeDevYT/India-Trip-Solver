/**
 * factors.js — Single source of truth for all decision factors.
 *
 * To add, remove, or rename a factor: only edit this file.
 * The components, engine, and store all derive from this.
 *
 * Factor shape:
 *   key        {string}  Unique slug, used as DOM id and store key
 *   label      {string}  Display name (without emoji)
 *   emoji      {string}  Leading emoji for the factor name
 *   note       {string}  Explanatory copy rendered below the label
 *   side       {'go'|'stay'}
 *   defaultVal {number}  Initial slider value (0–10)
 *   highRisk   {boolean} Renders the HIGH RISK badge + red left border
 *   binary     {boolean} Renders the BINARY badge (partially non-linear risk)
 *   annotation {boolean} Renders a dynamic per-day calculation below the slider
 */
export const FACTORS = [
  // ── Go factors ────────────────────────────────────────────────
  {
    key:        'mental',
    label:      'Mental reset / genuine rest',
    emoji:      '😴',
    note:       'Only real downtime window this year. Academic grind + recruiting prep with no break degrades decision quality over time.',
    side:       'go',
    defaultVal: 7,
    highRisk:   false,
    binary:     false,
    annotation: false,
  },
  {
    key:        'family',
    label:      'Family visit',
    emoji:      '👨‍👩‍👧',
    note:       'India trips are rare. Relationship capital with parents matters — especially during a high-stress chapter of life.',
    side:       'go',
    defaultVal: 6,
    highRisk:   false,
    binary:     false,
    annotation: false,
  },
  {
    key:        'culture',
    label:      'Food, culture & sandalwood soap',
    emoji:      '🍛',
    note:       'Real benefits — food is unmatched, culture is energizing. Honest self-assessment: the novelty effect diminishes after day 3.',
    side:       'go',
    defaultVal: 4,
    highRisk:   false,
    binary:     false,
    annotation: false,
  },
  {
    key:        'rarity',
    label:      "Rarity — won't go often",
    emoji:      '✈️',
    note:       'Long-haul India trips realistically happen 1–2× per year max. This window is genuinely limited and has real optionality value.',
    side:       'go',
    defaultVal: 5,
    highRisk:   false,
    binary:     false,
    annotation: false,
  },

  // ── Stay factors ──────────────────────────────────────────────
  {
    key:        'recruiting',
    label:      'SA recruiting window lost',
    emoji:      '🎯',
    note:       "Aug 1 apps go live. India↔EST = 10.5h offset. Missing the opening sprint can be unrecoverable for specific firms — this isn't just a score deduction.",
    side:       'stay',
    defaultVal: 9,
    highRisk:   true,
    binary:     true,
    annotation: false,
  },
  {
    key:        'jetlag',
    label:      'Jet lag recovery',
    emoji:      '😵',
    note:       "~10.5h offset, 5–7 days to normalize. If an OA drops Aug 7 while you're still on India time, you're impaired for a timed exam. That's a real firm risk.",
    side:       'stay',
    defaultVal: 7,
    highRisk:   false,
    binary:     false,
    annotation: false,
  },
  {
    key:        'leetcode',
    label:      'LeetCode rust from 3-week gap',
    emoji:      '💻',
    note:       'Pattern recognition atrophies without daily reps. Estimate ~1 week to re-acclimate — stacks on top of jet lag recovery, not concurrent.',
    side:       'stay',
    defaultVal: 6,
    highRisk:   false,
    binary:     false,
    annotation: false,
  },
  {
    key:        'flight',
    label:      'Flight cost',
    emoji:      '💸',
    note:       'Estimated $900–$1,400 RT. Opportunity cost of capital excluded — airfare alone is real spend with no recruiting upside.',
    side:       'stay',
    defaultVal: 5,
    highRisk:   false,
    binary:     false,
    annotation: true,   // ← triggers the per-day dollar calculation
  },
  {
    key:        'vanguard',
    label:      'Vanguard / OIE admin risk',
    emoji:      '🏛️',
    note:       'Co-op registration with OIE not yet closed. Jul 15 departure is not safe until resolved. Missing a deadline here could jeopardize the co-op itself.',
    side:       'stay',
    defaultVal: 6,
    highRisk:   true,
    binary:     false,
    annotation: false,
  },
  {
    key:        'resume',
    label:      'Resume + networking prep paused',
    emoji:      '📄',
    note:       '"Can still work from India" is excluded as a go-pro. Family obligations make it effectively false. 3 weeks of prep and outreach lost.',
    side:       'stay',
    defaultVal: 5,
    highRisk:   false,
    binary:     false,
    annotation: false,
  },
];

// ── Derived exports ───────────────────────────────────────────────────
export const GO_FACTORS   = FACTORS.filter(f => f.side === 'go');
export const STAY_FACTORS = FACTORS.filter(f => f.side === 'stay');

export const GO_MAX   = GO_FACTORS.length   * 10; // 40
export const STAY_MAX = STAY_FACTORS.length * 10; // 60

/**
 * Build initial store state from factor defaults.
 * @returns {{ [key: string]: number }}
 */
export function buildInitialState() {
  return Object.fromEntries(FACTORS.map(f => [f.key, f.defaultVal]));
}
