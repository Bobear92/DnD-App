/**
 * Subclass spellcasting — casters granted by a SUBCLASS rather than the class itself
 * (Eldritch Knight Fighter; Arcane Trickster Rogue is the next consumer).
 *
 * A subclass caster entry mirrors the shape of a class config's `caster` object plus
 * subclass-specific gating (`unlockLevel`) and known-caster progressions. Consumers:
 *   - ClassSheet resolves `config.caster ?? getSubclassCaster(...)` so the shared
 *     CasterSpellBlock renders (kind:'known' → slot tracker + cantrips/known lists).
 *   - LevelUpWizard uses cantripsKnownAt/spellsKnownAt as the New Spells step targets.
 *   - CharacterDetail uses getSubclassCaster to decide the Spells tab / Class source.
 *
 * Eldritch Knight (both editions): a THIRD caster — INT-based, wizard spell list
 * (focused on abjuration/evocation), slots from L3 up to 4th level at L19. The 2024
 * version words its spells as "prepared", but mechanically it's the same fixed list
 * swapped on level-up, so the app models both editions as KNOWN casters (matching how
 * it models the 2024 Sorcerer/Bard).
 */

// Third-caster spell slots by CLASS level (index = level − 1), padded to 9 spell levels
// so consumers can share the full-caster slot-grid rendering. Slots begin at L3 (the
// subclass unlock) and cap at 4th-level slots (L19+).
export const THIRD_CASTER_SLOTS = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 3
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 4
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 5
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 6
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 7
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 8
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 9
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 10
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 11
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 12
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 13
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 14
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 15
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 16
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 17
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 18
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 19
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 20
];

const thirdCasterSlotsForLevel = (level) =>
  THIRD_CASTER_SLOTS[Math.min(Math.max(Number(level) || 1, 1), 20) - 1];

/** Eldritch Knight cantrips known: 2 from L3, 3 from L10. */
export const ekCantripsKnownAt = (level) => (Number(level) >= 10 ? 3 : Number(level) >= 3 ? 2 : 0);

// Eldritch Knight spells known by class level (PHB table; identical numbers in 2024,
// where they're worded as "prepared").
const EK_SPELLS_KNOWN_STEPS = [
  [20, 13], [19, 12], [16, 11], [14, 10], [13, 9], [11, 8], [10, 7], [8, 6], [7, 5], [4, 4], [3, 3],
];
export const ekSpellsKnownAt = (level) => {
  const l = Number(level) || 0;
  for (const [lvl, known] of EK_SPELLS_KNOWN_STEPS) if (l >= lvl) return known;
  return 0;
};

const EK_CASTER = {
  kind: 'known',
  spellcastingAbility: 'intelligence',
  unlockLevel: 3,
  slotsForLevel: thirdCasterSlotsForLevel,
  cantripsKnownAt: ekCantripsKnownAt,
  spellsKnownAt: ekSpellsKnownAt,
  spellList: 'Wizard',
  note: 'You learn spells from the Wizard list, primarily Abjuration and Evocation. Intelligence is your spellcasting ability.',
};

// SUBCLASS_CASTERS[class][edition][subclass] → caster object. Both EK editions share
// the same numbers (see the module comment on the 2024 "prepared" wording).
export const SUBCLASS_CASTERS = {
  Fighter: {
    '5e': { 'Eldritch Knight': EK_CASTER },
    '5.5e': { 'Eldritch Knight': EK_CASTER },
  },
};

/**
 * The subclass-granted caster for this character, or null. When `level` is passed the
 * caster is only returned once the subclass feature is actually earned (≥ unlockLevel);
 * omit it to ask "is this a caster subclass at all".
 */
export function getSubclassCaster(charClass, edition, subclass, level) {
  const ed = edition === '5.5e' || edition === '2024' ? '5.5e' : '5e';
  const caster = SUBCLASS_CASTERS[charClass]?.[ed]?.[subclass] || null;
  if (!caster) return null;
  if (level != null && Number(level) < caster.unlockLevel) return null;
  return caster;
}

export default SUBCLASS_CASTERS;
