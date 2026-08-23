/**
 * Spells granted outright by a SUBCLASS feature — no choice, no spell slot, no class spell list.
 *
 * The gap this closes: a subclass can hand a non-caster a specific spell it can cast at will, and
 * nothing modelled that. `subclass_cantrips` (subclassGrants, `surface:'spells'`) covers only the
 * CHOSEN cantrip case — the player picks from a pool at level-up and the pick is stored. A feature
 * like the Psi Warrior's Telekinetic Master is the opposite shape on every axis: it is FIXED (no
 * pick to store), LEVELED (5th, not a cantrip), and gained automatically at a set level. So it is
 * derived from the character rather than stored, the same way race-granted cantrips are derived in
 * raceCantrips.js instead of being written into character_data at creation.
 *
 * Shape: SUBCLASS_SPELL_GRANTS[className][subclassName] = [grant]
 *   grant = {
 *     spell,      // the catalog name, so the Spells tab's detail dialog resolves it
 *     level,      // the spell's own level — which SpellLevelTabs tab it files under
 *     minLevel,   // CLASS level the feature is gained at (the gate)
 *     feature,    // the subclass feature responsible, named on the row
 *     ability,    // the spellcasting ability the feature dictates (Psi Warrior: INT, even
 *                 //   though the Fighter has no spellcasting ability of its own)
 *     atWill,     // true = cast without a spell slot, as often as you like
 *     note,       // one short line shown under the spell name
 *   }
 *
 * Edition-neutral by design: entries are registered once and answer for both 5e and 2024 unless a
 * revision actually moves something. The Psi Warrior's 2024 revision renames nothing and moves no
 * level, which is how every other Psi Warrior consumer is authored (see psiWarriorData.js).
 *
 * NOT a rest resource: an at-will spell has no counter, so there is deliberately nothing here for
 * the backend rest flow to reset. A subclass spell with limited uses belongs in a rest-resource
 * table alongside its counter (the racialRestResources.js shape), not here.
 */

const normEdition = (edition) => (edition === '5.5e' || edition === '2024' ? '5.5e' : '5e');

export const SUBCLASS_SPELL_GRANTS = {
  Fighter: {
    'Psi Warrior': [
      {
        spell: 'Telekinesis',
        level: 5,
        minLevel: 18,
        feature: 'Telekinetic Master',
        ability: 'Intelligence',
        atWill: true,
        note: 'At will, without a spell slot or components.',
      },
    ],
  },
};

/**
 * Spells a character's subclass grants outright at its current level, split the way the Spells tab
 * consumes them. Returns `{ cantrips: [], leveled: [] }` — both always arrays, so a caller can
 * spread them without a null check. `cantrips` is empty today (no authored entry is level 0) but
 * exists because the split is the Spells tab's, not this table's.
 */
export function getSubclassGrantedSpells({ charClass, subclass, level = 1, edition } = {}) {
  normEdition(edition); // entries are edition-neutral today; normalized so the arg is honest
  const grants = SUBCLASS_SPELL_GRANTS[charClass]?.[subclass] ?? [];
  const earned = grants.filter((g) => Number(level) >= g.minLevel);
  return {
    cantrips: earned.filter((g) => g.level === 0),
    leveled: earned.filter((g) => g.level > 0),
  };
}

/** True when the subclass grants the character any spell at this level — the hasSpells gate. */
export function hasSubclassGrantedSpells(ctx) {
  const { cantrips, leveled } = getSubclassGrantedSpells(ctx);
  return cantrips.length + leveled.length > 0;
}

export default getSubclassGrantedSpells;
