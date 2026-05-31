/**
 * Cross-cutting combat-bonus helpers — centralizes hit-point and armor-class
 * bonuses that come from a subclass, race, or class feature (not from armor).
 *
 * Pure functions; the display lives in CombatBonuses.jsx (rendered in the
 * CharacterDetail Stats tab). HP bonuses are display-only — they are added on
 * top of the stored `hp_max` to produce an "effective max HP", never written
 * back into `hp_max` (which would double-count on the next level-up).
 *
 * To add a new source: extend getHpBonuses / getAcOptions here and it appears
 * everywhere CombatBonuses is rendered — no per-sheet edits needed.
 */

const mod = (score) => Math.floor(((score ?? 10) - 10) / 2);

/** True for the Sorcerer Draconic Bloodline (5e) / Draconic Sorcery (2024) subclass. */
export function isDraconicSorcerer(charClass, subclass) {
  if (charClass !== 'Sorcerer') return false;
  return subclass === 'Draconic Bloodline' || subclass === 'Draconic Sorcery';
}

/**
 * Hit-point bonuses from subclass/race/class features.
 * Returns [{ source, detail, amount }] — amount is the total bonus at this level.
 */
export function getHpBonuses({ charClass, subclass, raceTraits = [], level = 1 } = {}) {
  const bonuses = [];
  if (isDraconicSorcerer(charClass, subclass)) {
    bonuses.push({ source: 'Draconic Resilience', detail: '1 HP per Sorcerer level', amount: level });
  }
  if ((raceTraits ?? []).includes('Dwarven Toughness')) {
    bonuses.push({ source: 'Dwarven Toughness', detail: '1 HP per level (Hill Dwarf)', amount: level });
  }
  return bonuses;
}

/** Sum of all HP bonuses at this level. */
export function totalHpBonus(args) {
  return getHpBonuses(args).reduce((sum, b) => sum + b.amount, 0);
}

/**
 * Alternate armor-class formulas that don't come from worn armor.
 * Returns [{ source, detail, formula, value }] computed from ability scores.
 */
export function getAcOptions({ charClass, subclass, scores = {} } = {}) {
  const dex = mod(scores.dexterity);
  const con = mod(scores.constitution);
  const wis = mod(scores.wisdom);
  const options = [];
  if (charClass === 'Barbarian') {
    options.push({ source: 'Unarmored Defense', detail: 'Barbarian — no armor', formula: '10 + DEX + CON', value: 10 + dex + con });
  }
  if (charClass === 'Monk') {
    options.push({ source: 'Unarmored Defense', detail: 'Monk — no armor or shield', formula: '10 + DEX + WIS', value: 10 + dex + wis });
  }
  if (isDraconicSorcerer(charClass, subclass)) {
    options.push({ source: 'Draconic Resilience', detail: 'while not wearing armor', formula: '13 + DEX', value: 13 + dex });
  }
  return options;
}
