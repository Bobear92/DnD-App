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
 * SPELL-GRANTING entries also carry:
 *   `spell`      — the spell's catalog name, used to look it up in the encyclopedia.
 *                  Distinct from `label`, which is the tracker's wording and may
 *                  describe the cast ("Hellish Rebuke (2nd-level)").
 *   `spellLevel` — the level the trait casts it AT (Infernal Legacy casts Hellish
 *                  Rebuke as a 2nd-level spell, not its native 1st).
 * This makes the table the single source of truth for both the use-counter and the
 * spell itself, so a leveled racial spell shows up in the Spells tab instead of
 * existing only as a number on the Stats tab. Race-granted CANTRIPS are not rest
 * resources and live in `raceCantrips.js`.
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
    spell: 'Faerie Fire',
    spellLevel: 1,
  },
  {
    trait: 'Drow Magic',
    key: 'drow_darkness_used',
    max: 1,
    recharge: 'long',
    minLevel: 5,
    label: 'Darkness',
    note: 'Drow Magic',
    spell: 'Darkness',
    spellLevel: 2,
  },
  {
    trait: 'Infernal Legacy',
    key: 'infernal_hellish_rebuke_used',
    max: 1,
    recharge: 'long',
    minLevel: 3,
    label: 'Hellish Rebuke (2nd-level)',
    note: 'Infernal Legacy',
    spell: 'Hellish Rebuke',
    spellLevel: 2,
  },
  {
    trait: 'Infernal Legacy',
    key: 'infernal_darkness_used',
    max: 1,
    recharge: 'long',
    minLevel: 5,
    label: 'Darkness',
    note: 'Infernal Legacy',
    spell: 'Darkness',
    spellLevel: 2,
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

/**
 * The LEVELED spells a character's racial traits grant at this level, as
 * `[{ name, level, resourceKey, label, note, recharge, max }]`.
 *
 * Sourced from the same table as the use-counters, so the Spells tab and the
 * Racial Features tracker can never disagree about what the race grants.
 * Deduped by spell name + cast level: a race granting the same spell twice
 * (or a future trait overlapping another) shows one entry, not two.
 */
export function getRacialSpellResources(traits = [], level = 1) {
  const seen = new Set();
  return getRacialRestResources(traits, level)
    .filter((r) => r.spell)
    .filter((r) => {
      const id = `${r.spell}:${r.spellLevel}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((r) => ({
      name: r.spell,
      level: r.spellLevel,
      resourceKey: r.key,
      label: r.label,
      note: r.note,
      recharge: r.recharge,
      max: r.max,
    }));
}
