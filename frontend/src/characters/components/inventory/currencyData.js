// D&D currency. The GM picks the campaign currency mode (campaign.currency_type):
//   "standard" → Copper / Silver / Gold / Platinum (no electrum)
//   "full"     → adds Electrum (the rarely-used 5e coin)
// A character's coins live in character_data.currency = { cp, sp, ep, gp, pp } (integers).

// gpValue = how many gold pieces one of this coin is worth.
export const COINS = {
  pp: { key: 'pp', label: 'Platinum', abbr: 'pp', gpValue: 10,   color: 'text-cyan-600 dark:text-cyan-400' },
  gp: { key: 'gp', label: 'Gold',     abbr: 'gp', gpValue: 1,    color: 'text-amber-600 dark:text-amber-400' },
  ep: { key: 'ep', label: 'Electrum', abbr: 'ep', gpValue: 0.5,  color: 'text-emerald-600 dark:text-emerald-400' },
  sp: { key: 'sp', label: 'Silver',   abbr: 'sp', gpValue: 0.1,  color: 'text-slate-500 dark:text-slate-300' },
  cp: { key: 'cp', label: 'Copper',   abbr: 'cp', gpValue: 0.01, color: 'text-orange-700 dark:text-orange-400' },
};

// Display order: highest-value coin first.
export const CURRENCY_MODES = {
  standard: ['pp', 'gp', 'sp', 'cp'],
  full:     ['pp', 'gp', 'ep', 'sp', 'cp'],
};

export const ALL_COIN_KEYS = ['cp', 'sp', 'ep', 'gp', 'pp'];
export const EMPTY_WALLET = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

export function currencyMode(mode) {
  return mode === 'full' ? 'full' : 'standard';
}

// Coin definitions to display for a campaign currency mode (ordered highest-first).
export function coinsForMode(mode) {
  return CURRENCY_MODES[currencyMode(mode)].map((k) => COINS[k]);
}

// Total wallet value expressed in gold pieces (counts every coin held, regardless of mode).
export function totalInGp(currency) {
  const w = { ...EMPTY_WALLET, ...(currency || {}) };
  return ALL_COIN_KEYS.reduce((sum, k) => sum + (Number(w[k]) || 0) * COINS[k].gpValue, 0);
}

// Pretty gp total: trims trailing zeros, keeps up to 2 decimals (for cp/sp/ep fractions).
export function formatGp(n) {
  const rounded = Math.round((Number(n) || 0) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '');
}

// ─── Starting wealth ───────────────────────────────────────────────────────────
// In 5e a background's starting equipment includes a pouch of gold. New characters
// start with this much gp (from their chosen background), seeded into the wallet.
export const BACKGROUND_STARTING_GOLD = {
  Acolyte: 15,
  Charlatan: 15,
  Criminal: 15,
  Entertainer: 15,
  'Folk Hero': 10,
  'Guild Artisan': 15,
  Hermit: 5,
  Noble: 25,
  Outlander: 10,
  Sage: 10,
  Sailor: 10,
  Soldier: 10,
  Urchin: 10,
};

export function startingGoldForBackground(name) {
  return BACKGROUND_STARTING_GOLD[name] ?? 0;
}

// A fresh wallet seeded with a background's starting gold.
export function startingWallet(backgroundName) {
  return { ...EMPTY_WALLET, gp: startingGoldForBackground(backgroundName) };
}
