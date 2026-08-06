/**
 * Caster descriptors — the data table that lets a HAND-WRITTEN class sheet render its Spells tab
 * through the shared `CasterSpellBlock` layout (one level strip + per-level Class/Racial/Feats
 * source toggle) instead of hand-rolling its own spells section.
 *
 * Before this table, 15 sheets each carried ~90 lines of near-identical spells markup, so the
 * unified layout built for the Wizard + Eldritch Knight stopped at the config-driven sheets. A
 * sheet now DELEGATES: `if (section === 'spells') return <CasterSpellBlock caster={DESCRIPTOR} …/>`.
 *
 * A descriptor is deliberately the same shape as the `caster` field of a data-driven class config
 * (`sheets/classSheet/configs/*.js`), so migrating a class to a config later moves this entry
 * across unchanged rather than throwing it away.
 *
 * Presence in this table is the SWITCH: `CharacterDetail` folds racial + feat spells into the
 * strip for any class that has a descriptor (see `foldSources`). So never add an entry before the
 * matching sheet actually delegates — an entry without a conversion means the sheet is handed
 * folded props it ignores, and the character's racial/feat spells vanish from the tab.
 *
 * Kinds:
 *   'prepare'   — prepare from the FULL class list each long rest (Cleric, Druid, Paladin,
 *                 Ranger 2024, Artificer). Prepare Spells sub-tab = ClassSpellBrowser + lock/unlock.
 *   'known'     — a fixed known list edited via an add-picker (Bard, Sorcerer, Ranger 5e).
 *   'pact'      — Warlock Pact Magic: all slots at one level, short-rest recovery.
 *   'spellbook' — (default, Wizard) prepare from a personal spellbook.
 *
 * School restriction (`restrictedSchools`) is intentionally NOT expressible here: the only
 * school-split casters are SUBCLASS casters (Eldritch Knight, and the Arcane Trickster when built),
 * which live in `subclassCasterData.js`. No base class separates its spells by school.
 */
import {
  FULL_CASTER_SLOTS,
} from '@/characters/components/classData/classProgressionTables';

// A slot TABLE (20 rows, index 0 = level 1) → the `slotsForLevel(level)` function shape that
// CasterSpellBlock and the class configs already speak.
const fromTable = (table) => (level) => table[Math.min(Math.max(level, 1), 20) - 1];

// The default preparation limit shared by every prepare-caster: level + spellcasting modifier,
// minimum 1. A class that deviates overrides `prepareLimit`.
const levelPlusMod = (level, abilityMod) => Math.max(1, level + abilityMod);

export const CASTER_DESCRIPTORS = [
  {
    className: 'Cleric',
    edition: '5e',
    kind: 'prepare',
    spellcastingAbility: 'wisdom',
    spellList: 'Cleric',
    slotsForLevel: fromTable(FULL_CASTER_SLOTS),
    startsAtLevel: 1,
    listKey: 'prepared_spells',
    prepareLimit: levelPlusMod,
    cantripPicker: true,
  },
];

/**
 * The descriptor for a class+edition, or null if that sheet has not been converted yet.
 * `edition` accepts the campaign's '5e' | '5.5e'.
 */
export function getCasterDescriptor(className, edition) {
  if (!className) return null;
  return CASTER_DESCRIPTORS.find(
    (d) => d.className === className && d.edition === edition,
  ) ?? null;
}

export { fromTable, levelPlusMod };
