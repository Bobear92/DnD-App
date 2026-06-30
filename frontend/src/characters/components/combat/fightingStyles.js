/**
 * Fighting-style mechanical effects — turns a character's chosen fighting styles
 * into real attack/AC modifiers instead of just a description card.
 *
 * Styles live in character_data.fighting_style (the class pick) plus
 * character_data.additional_fighting_styles (e.g. Champion's Additional Fighting
 * Style). These helpers are pure and edition-agnostic; the consumers
 * (computeAttack / getAttacks / computeArmorClass in inventoryData.js) pass the
 * gathered style list + the relevant equipment context.
 *
 * Mechanized here (the numerically-computable styles):
 *   Archery               → +2 to ranged weapon attack rolls (to-hit)
 *   Dueling               → +2 damage with a one-handed melee weapon and no other weapon
 *   Thrown Weapon Fighting → +2 damage with thrown weapon attacks
 *   Defense               → +1 AC while wearing armor
 * Not mechanized (no honest static number): Great Weapon Fighting (reroll 1s/2s),
 *   Two-Weapon Fighting (off-hand damage — handled in actionEconomyData),
 *   Blind Fighting / Interception / Protection / Druidic Warrior (situational/reaction).
 */

/** The character's chosen fighting styles (class pick + any additional). */
export function gatherFightingStyles(characterData = {}) {
  return [characterData?.fighting_style, ...(characterData?.additional_fighting_styles || [])]
    .filter(Boolean);
}

export function hasFightingStyle(characterData, name) {
  return gatherFightingStyles(characterData).some((s) => s === name);
}

const isRanged = (w = {}) => (w.weapon_type || '').toLowerCase() === 'ranged';
const isTwoHanded = (w = {}) => /two-handed/i.test(w.properties || '');
const isThrown = (w = {}) => /thrown/i.test(w.properties || '');

// Roll up [{source, amount}] parts into the { bonus, sources, parts } shape consumers use.
function rollup(parts) {
  return { bonus: parts.reduce((s, p) => s + p.amount, 0), sources: parts.map((p) => p.source), parts };
}

/**
 * To-hit bonus a fighting style grants for THIS weapon.
 *   Archery: +2 with ranged weapons.
 * Returns { bonus, sources: [styleName], parts: [{source, amount}] }.
 */
export function styleToHitBonus(weapon = {}, styles = []) {
  const parts = [];
  if (styles.includes('Archery') && isRanged(weapon)) parts.push({ source: 'Archery', amount: 2 });
  return rollup(parts);
}

/**
 * Flat damage bonus a fighting style grants for THIS weapon, given equipment context.
 *   Dueling: +2 with a one-handed melee weapon while no other weapon is wielded (`soloWeapon`).
 *   Thrown Weapon Fighting: +2 with thrown weapon attacks.
 * Returns { bonus, sources: [styleName], parts: [{source, amount}] }.
 */
export function styleDamageBonus(weapon = {}, styles = [], { soloWeapon = false } = {}) {
  const parts = [];
  const melee = !isRanged(weapon);
  if (styles.includes('Dueling') && melee && !isTwoHanded(weapon) && soloWeapon) {
    parts.push({ source: 'Dueling', amount: 2 });
  }
  if (styles.includes('Thrown Weapon Fighting') && isThrown(weapon)) {
    parts.push({ source: 'Thrown Weapon Fighting', amount: 2 });
  }
  return rollup(parts);
}

/**
 * AC bonus a fighting style grants given the equipment context.
 *   Defense: +1 while wearing armor.
 * Returns { bonus, sources: [styleName] }.
 */
export function styleAcBonus(styles = [], { armored = false } = {}) {
  let bonus = 0;
  const sources = [];
  if (styles.includes('Defense') && armored) { bonus += 1; sources.push('Defense'); }
  return { bonus, sources };
}
