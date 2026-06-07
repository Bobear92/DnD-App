/**
 * Weapon property reference — plain-language explanations of the standard 5e weapon
 * properties (plus category + handedness). Surfaced as click-to-explain badges in the
 * character-creation equipment picker and the encyclopedia weapon detail, so a new
 * player can learn what "Versatile", "Heavy", "Finesse", etc. actually mean.
 */

export const WEAPON_PROPERTY_DESCRIPTIONS = {
  Simple: 'Simple weapons are basic arms that almost everyone — even most spellcasters — is trained to use.',
  Martial: 'Martial weapons need specialized training; usually only martial classes (Fighter, Paladin, Barbarian, etc.) are proficient with them.',
  'One-handed': 'Used in one hand, leaving your other hand free for a shield, a second weapon, or spell components.',
  'Two-handed': "Requires both hands, so you can't also hold a shield or a second weapon while attacking with it.",
  Versatile: 'Can be wielded with one or two hands. Using two hands deals the larger damage die shown in parentheses (e.g. 1d10 instead of 1d8).',
  Light: 'Small and easy to handle — ideal for two-weapon fighting, letting you attack with a second light weapon as a bonus action.',
  Heavy: 'Large and unwieldy. Small creatures have disadvantage on attack rolls made with it.',
  Finesse: 'You may use your Dexterity instead of Strength for the attack and damage rolls (use whichever is higher).',
  Thrown: 'You can throw the weapon to make a ranged attack, using the same ability modifier as a melee attack with it.',
  Ammunition: 'Needs ammunition (and a way to load it) to fire. Drawing ammo is part of the attack; you can recover about half your spent ammo after a fight.',
  Loading: 'You can fire only one piece of ammunition per action, bonus action, or reaction, no matter how many attacks you could normally make.',
  Reach: 'Adds 5 feet to your reach when you attack and when making opportunity attacks.',
  Range: 'Has a range in feet (normal/long). Attacking beyond normal range is at disadvantage; you can\'t attack past the long range.',
  Special: 'The weapon has unusual rules described in its own entry (for example the lance or net).',
};

const LC = Object.fromEntries(
  Object.entries(WEAPON_PROPERTY_DESCRIPTIONS).map(([k, v]) => [k.toLowerCase(), v])
);

/** Strip a trailing detail parenthetical so "Versatile (1d10)" → "Versatile". */
export function weaponPropertyBaseName(prop) {
  return (prop || '').replace(/\(.*?\)/g, '').trim();
}

/** Description for a property/category/handedness label, or null if unknown. */
export function weaponPropertyDescription(prop) {
  return LC[weaponPropertyBaseName(prop).toLowerCase()] || null;
}

/** `properties` may be a JSON-string array, a comma list, or already an array. */
export function parseWeaponProperties(p) {
  if (Array.isArray(p)) return p;
  if (typeof p === 'string' && p.trim()) {
    try { const j = JSON.parse(p); if (Array.isArray(j)) return j; } catch { /* not JSON */ }
    return p.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function weaponHandedness(props) {
  const lc = props.map((s) => weaponPropertyBaseName(s).toLowerCase());
  if (lc.includes('two-handed')) return 'Two-handed';
  if (lc.includes('versatile')) return 'Versatile';
  return 'One-handed';
}

/**
 * Explainable badge list for a weapon: category, handedness, then the remaining
 * properties (two-handed/versatile are conveyed by the handedness badge, so they're
 * not repeated). Each entry: { label, variant }.
 */
export function weaponBadges(weapon = {}) {
  const props = parseWeaponProperties(weapon.properties);
  const others = props.filter(
    (p) => !['two-handed', 'versatile'].includes(weaponPropertyBaseName(p).toLowerCase())
  );
  const badges = [];
  if (weapon.weapon_category) badges.push({ label: weapon.weapon_category, variant: 'outline' });
  badges.push({ label: weaponHandedness(props), variant: 'outline' });
  for (const p of others) badges.push({ label: p, variant: 'secondary' });
  return badges;
}
