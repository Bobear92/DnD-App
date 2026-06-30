/**
 * Racial / subracial features that recharge on a short or long rest.
 *
 * Each entry maps a racial trait (the exact name stored in
 * `character_data.race_traits`) to a `_used` counter stored in character_data.
 * `minLevel` gates spell-granting uses that only come online later
 * (e.g. Drow Magic's darkness at character level 5).
 *
 * `recharge`:
 *   'short' — recovers on a short OR long rest
 *   'long'  — recovers only on a long rest
 *
 * The backend mirrors this table in `_compute_rest_patch`
 * (backend/players/characters/service.py) so the GM's rest buttons reset
 * these counters. Keep the two in sync when adding new resources.
 */
export const RACIAL_REST_RESOURCES = [
  {
    trait: 'Breath Weapon',
    key: 'breath_weapon_used',
    max: 1,
    recharge: 'short',
    minLevel: 1,
    label: 'Breath Weapon',
    note: 'Exhale destructive energy',
  },
  {
    trait: 'Relentless Endurance',
    key: 'relentless_endurance_used',
    max: 1,
    recharge: 'long',
    minLevel: 1,
    label: 'Relentless Endurance',
    note: 'Drop to 1 HP instead of 0',
  },
  {
    trait: 'Drow Magic',
    key: 'drow_faerie_fire_used',
    max: 1,
    recharge: 'long',
    minLevel: 3,
    label: 'Faerie Fire',
    note: 'Drow Magic',
  },
  {
    trait: 'Drow Magic',
    key: 'drow_darkness_used',
    max: 1,
    recharge: 'long',
    minLevel: 5,
    label: 'Darkness',
    note: 'Drow Magic',
  },
  {
    trait: 'Infernal Legacy',
    key: 'infernal_hellish_rebuke_used',
    max: 1,
    recharge: 'long',
    minLevel: 3,
    label: 'Hellish Rebuke (2nd-level)',
    note: 'Infernal Legacy',
  },
  {
    trait: 'Infernal Legacy',
    key: 'infernal_darkness_used',
    max: 1,
    recharge: 'long',
    minLevel: 5,
    label: 'Darkness',
    note: 'Infernal Legacy',
  },
];

/**
 * Resources applicable to a character given its race_traits and current level.
 * Filters by trait presence and the minLevel gate.
 */
export function getRacialRestResources(traits = [], level = 1) {
  const traitSet = new Set(traits ?? []);
  return RACIAL_REST_RESOURCES.filter(
    (r) => traitSet.has(r.trait) && (level ?? 1) >= (r.minLevel ?? 1)
  );
}
