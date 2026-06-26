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

/** Level at which the Champion Fighter gains Remarkable Athlete, by edition. */
const REMARKABLE_ATHLETE_UNLOCK = { '5e': 7, '5.5e': 3 };

/**
 * Champion Fighter "Remarkable Athlete" — edition-aware effect descriptor, or
 * null when the character doesn't have it. The two editions are genuinely
 * different features:
 *
 *  - 5e (2014), Champion L7: add half proficiency bonus (rounded up) to any
 *    STR/DEX/CON check that doesn't already use proficiency, and a running long
 *    jump gains the Strength modifier in feet.
 *      → { edition:'5e', checkBonusAbilities:['strength','dexterity','constitution'],
 *          checkBonus, jumpStrBonus:true }
 *  - 2024, Champion L3: advantage on Initiative rolls and Strength (Athletics)
 *    checks (the post-Critical-Hit free move is descriptive only — not modeled).
 *      → { edition:'5.5e', advantageInitiative:true, advantageSkills:['Athletics'] }
 *
 * @param {{ charClass, subclass, level?, edition?, pb? }} ctx
 */
export function remarkableAthlete({ charClass, subclass, level = 1, edition = '5e', pb = 0 } = {}) {
  if (charClass !== 'Fighter' || subclass !== 'Champion') return null;
  const ed = edition === '5.5e' ? '5.5e' : '5e';
  if ((level ?? 1) < REMARKABLE_ATHLETE_UNLOCK[ed]) return null;
  if (ed === '5.5e') {
    return { edition: '5.5e', advantageInitiative: true, advantageSkills: ['Athletics'] };
  }
  return {
    edition: '5e',
    checkBonusAbilities: ['strength', 'dexterity', 'constitution'],
    checkBonus: Math.ceil((pb ?? 0) / 2),
    jumpStrBonus: true,
  };
}

/** True when the character has a feat with the given name (feats may be strings or {name}). */
export function hasFeat(feats = [], name) {
  return (feats ?? []).some(f => (typeof f === 'string' ? f : f?.name) === name);
}

/** True when the character has the Tough feat (+2 HP per level). */
export function hasToughFeat(feats = []) {
  return hasFeat(feats, 'Tough');
}

/** True when the character has the Durable feat (Hit Die healing floored at 2× CON mod, min 2). */
export function hasDurableFeat(feats = []) {
  return hasFeat(feats, 'Durable');
}

/**
 * Minimum HP regained per Hit Die spent. Durable sets it to twice the CON modifier
 * (minimum 2); without Durable there's no floor beyond the normal 0. Returns 0 when
 * Durable isn't present so callers can use it as a plain lower bound.
 */
export function durableHitDieMin(conMod = 0, hasDurable = false) {
  return hasDurable ? Math.max(2, 2 * conMod) : 0;
}

/**
 * Per-level HP bonus rates from subclass/race/feat (the amount added each level).
 * Returns [{ source, detail, perLevel }]. The wizard uses this to show a single
 * level's increment; getHpBonuses multiplies it out to the total at a given level.
 */
export function getHpBonusesPerLevel({ charClass, subclass, raceTraits = [], feats = [] } = {}) {
  const out = [];
  if (isDraconicSorcerer(charClass, subclass)) {
    out.push({ source: 'Draconic Resilience', detail: '1 HP per Sorcerer level', perLevel: 1 });
  }
  if ((raceTraits ?? []).includes('Dwarven Toughness')) {
    out.push({ source: 'Dwarven Toughness', detail: '1 HP per level (Hill Dwarf)', perLevel: 1 });
  }
  if (hasToughFeat(feats)) {
    out.push({ source: 'Tough', detail: '2 HP per level (Tough feat)', perLevel: 2 });
  }
  return out;
}

/**
 * Hit-point bonuses from subclass/race/feat.
 * Returns [{ source, detail, amount }] — amount is the total bonus at this level.
 */
export function getHpBonuses({ level = 1, ...rest } = {}) {
  return getHpBonusesPerLevel(rest).map(b => ({
    source: b.source,
    detail: b.detail,
    amount: b.perLevel * level,
  }));
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
