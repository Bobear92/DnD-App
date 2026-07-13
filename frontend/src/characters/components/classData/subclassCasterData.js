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
 * Eldritch Knight (both editions): a THIRD caster — INT-based, wizard spell list,
 * slots from L3 up to 4th level at L19. The 2024 version words its spells as
 * "prepared", but mechanically it's the same fixed list swapped on level-up, so the
 * app models both editions as KNOWN casters (matching how it models the 2024
 * Sorcerer/Bard).
 *
 * The editions differ in TWO ways, both modeled here:
 *
 *   1. School restriction (5e only). A 5e EK's leveled spells must be Abjuration or
 *      Evocation, EXCEPT the one spell learned at each of levels 3, 8, 14 and 20 —
 *      four "any school" slots over 20 levels. (At L3 the EK learns three 1st-level
 *      spells: two restricted, one any-school.) The 2024 EK dropped the restriction
 *      entirely — any Wizard spell.
 *
 *      The restriction attaches to the SLOT, not to the spell's actual school: a
 *      Shield (an abjuration) chosen for the any-school slot still occupies that
 *      slot and may later be swapped for a spell of any school. So the slot each
 *      spell was learned under is RECORDED at pick time in a sidecar on
 *      character_data — `ek_spell_slots: { [spellName]: 'restricted' | 'any' }` —
 *      rather than inferred from the spell's school. `known_spells` stays a flat
 *      string[] (shared with every other known caster + the action economy).
 *
 *   2. Swap on level-up. Both editions may replace ONE leveled spell whenever the
 *      character gains a Fighter level (not only on levels that grant a new spell) —
 *      and a 5e swap must stay within its slot's category. The 2024 EK may ALSO swap
 *      one cantrip per level; 5e cantrips are permanent once chosen.
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

/** The two schools a 5e Eldritch Knight is normally limited to. */
export const EK_RESTRICTED_SCHOOLS = ['Abjuration', 'Evocation'];

/** Class levels at which a 5e EK's newly learned spell may come from ANY school. */
export const EK_FREE_SCHOOL_LEVELS = [3, 8, 14, 20];

/** Slot categories a known EK spell can occupy. */
export const EK_SLOT_RESTRICTED = 'restricted';
export const EK_SLOT_ANY = 'any';

/** How many "any school" spells a 5e EK knows at this level (1 at L3 → 4 at L20). */
export const ekAnySlotsAt = (level) => {
  const l = Number(level) || 0;
  return EK_FREE_SCHOOL_LEVELS.filter((lvl) => l >= lvl).length;
};

/** How many Abjuration/Evocation-restricted spells a 5e EK knows at this level. */
export const ekRestrictedSlotsAt = (level) =>
  Math.max(0, ekSpellsKnownAt(level) - ekAnySlotsAt(level));

/**
 * The recorded slot category of each known EK spell:
 *   character_data.ek_spell_slots = { [spellName]: 'restricted' | 'any' }
 * A spell missing from the map is treated as restricted (the common case), so a
 * partially-recorded list still renders.
 */
export const ekSpellSlots = (characterData) => characterData?.ek_spell_slots ?? {};

/** The known spells recorded in a given slot category, in `knownSpells` order. */
export const ekSpellsInSlot = (knownSpells = [], slotMap = {}, slot = EK_SLOT_RESTRICTED) =>
  knownSpells.filter((name) => (slotMap[name] ?? EK_SLOT_RESTRICTED) === slot);

const EK_COMMON = {
  kind: 'known',
  spellcastingAbility: 'intelligence',
  unlockLevel: 3,
  slotsForLevel: thirdCasterSlotsForLevel,
  cantripsKnownAt: ekCantripsKnownAt,
  spellsKnownAt: ekSpellsKnownAt,
  spellList: 'Wizard',
  // Both editions: replace one leveled spell whenever you gain a level in this class.
  leveledSwapPerLevel: 1,
};

const EK_CASTER_5E = {
  ...EK_COMMON,
  restrictedSchools: EK_RESTRICTED_SCHOOLS,
  freeSchoolLevels: EK_FREE_SCHOOL_LEVELS,
  anySlotsAt: ekAnySlotsAt,
  restrictedSlotsAt: ekRestrictedSlotsAt,
  cantripSwapPerLevel: 0, // 5e cantrips are permanent once chosen
  note: 'You learn spells from the Wizard list. Most must be Abjuration or Evocation — only the spells you learn at levels 3, 8, 14 and 20 may come from any school. Intelligence is your spellcasting ability.',
};

const EK_CASTER_2024 = {
  ...EK_COMMON,
  restrictedSchools: null, // 2024 dropped the Abjuration/Evocation restriction
  cantripSwapPerLevel: 1,  // 2024 may also swap one cantrip each Fighter level
  note: 'You learn spells from the Wizard list — any school. Intelligence is your spellcasting ability.',
};

// SUBCLASS_CASTERS[class][edition][subclass] → caster object. The EK editions share the
// same slot/known numbers but differ on the school restriction + cantrip swapping.
export const SUBCLASS_CASTERS = {
  Fighter: {
    '5e': { 'Eldritch Knight': EK_CASTER_5E },
    '5.5e': { 'Eldritch Knight': EK_CASTER_2024 },
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
