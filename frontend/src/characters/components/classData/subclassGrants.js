/**
 * Subclass grants — subclass features that, at a given level, let the player CHOOSE from a
 * pool. One model for both kinds we've QA'd:
 *   • a proficiency (tool/skill/language) — e.g. Battle Master "Student of War"
 *   • a pick from a class option pool — e.g. Champion "Additional Fighting Style" (a 2nd
 *     Fighting Style)
 * Consolidates the former subclassProficiencyData.js + subclassLevelChoices.js (merged while
 * only two subclasses were wired, so the blast radius was tiny). The two differed only in
 * (a) option shape and (b) how "already held" is computed — both absorbed here by normalized
 * `options:[{value, description?}]` + a per-grant `heldFrom(cd, ctx)` resolver.
 *
 * NOT consolidated: levelChoicesData.js — that's a different shape (class-scoped, cumulative
 * knownAtLevel deltas, replace-on-level-up, per-option minLevel) and the canonical pool source
 * the Sorcerer/Warlock sheets import. Keeping it separate avoids an over-parameterized config.
 *
 * Shape: SUBCLASS_GRANTS[className][edition][subclassName] = [grant]
 *   grant = {
 *     level,                       // the level the choice is gained
 *     key,                         // unique step/test key
 *     label,                       // shown in the wizard + sheet
 *     count,                       // how many to pick (current grants all use 1)
 *     storeField,                  // character_data array the picks merge into
 *     options: [{value, description?}],  // the pool (description → OptionCardPicker; else button grid)
 *     heldFrom: (characterData, ctx) => string[],  // names already held → excluded (no doubling up)
 *     surface: 'sheet' | 'banner' | 'skills' | 'spells',
 *                                   // where the CHOSEN value is shown afterward (default 'sheet').
 *                                   //   'sheet'  = a class-pool pick the ClassSheet renders in
 *                                   //              the subclass features area.
 *                                   //   'banner' = a tool/weapon/armor proficiency, already shown
 *                                   //              in the Items-tab proficiency banners.
 *                                   //   'skills' = a skill proficiency, already shown in the
 *                                   //              Abilities & Skills panel.
 *                                   //   'spells' = a granted spell, already shown in the Spells
 *                                   //              tab's Subclass source.
 *                                   // Only 'sheet' renders in the ClassSheet grant block; the
 *                                   // rest would be a duplicate of an existing surface.
 *   }
 *
 * Adding another subclass (any of these two kinds) is a pure data entry here; the LevelUpWizard
 * `subclass-grants` step + the ClassSheet display are pool-agnostic.
 */
import { gatherProficiencies } from '@/characters/components/inventory/inventoryProficiencies';
import { ARTISAN_TOOLS } from '@/characters/components/inventory/toolsData';
import { getFeatGrantedSpells } from '@/characters/components/feats/featEffects';
import { FIGHTER_FIGHTING_STYLES_5E, FIGHTER_FIGHTING_STYLES_2024 } from '@/characters/components/classData/classChoicesData';

const lc = (s) => (s || '').toLowerCase();
const dedup = (arr) => [...new Set((arr || []).filter(Boolean))];
const normEdition = (edition) => (edition === '5.5e' || edition === '2024' ? '5.5e' : '5e');

// ── Shared "already held" resolvers ──────────────────────────────────────────
// A proficiency tool grant dedups against every tool proficiency the character has (class +
// race + background + subclass), via gatherProficiencies — so it needs the class in ctx.
const heldTools = (cd, { charClass } = {}) => gatherProficiencies({ charClass, characterData: cd }).tools.grants;
const heldSkills = (cd) => cd.skill_proficiencies || [];
const heldLanguages = (cd) => [
  ...(cd.race_languages || []), ...(cd.background_languages || []), ...(cd.subclass_languages || []),
];
// A granted cantrip dedups against cantrips the character already knows from ANY source — a
// High Elf who took Prestidigitation, or a Magic Initiate who took Druidcraft, isn't offered
// the same cantrip twice.
const heldCantrips = (cd) => [
  ...(cd.subclass_cantrips || []),
  ...(cd.cantrips || []),
  ...(cd.cantrips_known || []),
  cd.high_elf_cantrip,
  ...getFeatGrantedSpells(cd.feats).cantrips.map((c) => c.name),
];
// A class-pool pick dedups against the base choice + any already picked (Champion: the base
// fighting_style plus prior additional_fighting_styles).
const heldFightingStyles = (cd) => [cd.fighting_style, ...(cd.additional_fighting_styles || [])];

const asOptions = (names) => names.map((value) => ({ value })); // string[] → {value} (no description)

// A Battle Master Student of War grant is identical in both editions.
const studentOfWar = {
  level: 3, key: 'student_of_war', label: "Student of War — Artisan's Tools", count: 1,
  storeField: 'subclass_tool_proficiencies', options: asOptions(ARTISAN_TOOLS), heldFrom: heldTools,
  surface: 'banner', // the chosen tool shows in the Items-tab proficiency banner, not the sheet
};

// Arcane Archer Lore is TWO grants at the same level: a skill proficiency and a cantrip. Each
// is surfaced by the panel that already owns that kind of thing (the Skills panel / the Spells
// tab), so neither is repeated in the ClassSheet grant block.
const arcaneArcherLore = [
  {
    level: 3, key: 'arcane_archer_lore_skill', label: 'Arcane Archer Lore — Skill', count: 1,
    storeField: 'skill_proficiencies',
    options: [
      { value: 'Arcana', description: 'Your Intelligence (Arcana) checks measure your knowledge of spells, magic items, eldritch symbols and magical traditions.' },
      { value: 'Nature', description: 'Your Intelligence (Nature) checks measure your knowledge of terrain, plants and animals, the weather, and natural cycles.' },
    ],
    heldFrom: heldSkills, surface: 'skills',
  },
  {
    level: 3, key: 'arcane_archer_lore_cantrip', label: 'Arcane Archer Lore — Cantrip', count: 1,
    storeField: 'subclass_cantrips',
    options: [
      { value: 'Prestidigitation', description: 'A minor magical trick: sensory effects, lighting or snuffing a small flame, cleaning or soiling an object, and other novice tricks.' },
      { value: 'Druidcraft', description: 'Whisper to the spirits of nature: predict the weather, make a flower bloom, create a harmless sensory effect, or light or snuff a small flame.' },
    ],
    heldFrom: heldCantrips, surface: 'spells',
  },
];

export const SUBCLASS_GRANTS = {
  Fighter: {
    '5e': {
      'Battle Master': [studentOfWar],
      'Arcane Archer': arcaneArcherLore,
      Champion: [
        {
          level: 10, key: 'additional_fighting_style', label: 'Additional Fighting Style',
          count: 1, storeField: 'additional_fighting_styles',
          options: FIGHTER_FIGHTING_STYLES_5E, heldFrom: heldFightingStyles,
        },
      ],
    },
    '5.5e': {
      'Battle Master': [studentOfWar],
      Champion: [
        {
          level: 7, key: 'additional_fighting_style', label: 'Additional Fighting Style',
          count: 1, storeField: 'additional_fighting_styles',
          options: FIGHTER_FIGHTING_STYLES_2024, heldFrom: heldFightingStyles,
        },
      ],
    },
  },
};

// Re-exported held resolvers so future skill/language grants can reference them by name.
export const HELD_RESOLVERS = { heldTools, heldSkills, heldLanguages, heldFightingStyles, heldCantrips };

function subclassGrantsFor(charClass, edition, subclass) {
  if (!subclass) return [];
  return SUBCLASS_GRANTS[charClass]?.[normEdition(edition)]?.[subclass] || [];
}

/** Grants the subclass confers exactly at `level` (the level being gained) — drives the wizard step. */
export function getSubclassGrants(charClass, edition, subclass, level) {
  return subclassGrantsFor(charClass, edition, subclass).filter((g) => g.level === Number(level));
}

/** Grants already earned by `level` (grant.level <= level) — drives the sheet display + owed-slot detection. */
export function getEarnedSubclassGrants(charClass, edition, subclass, level) {
  return subclassGrantsFor(charClass, edition, subclass).filter((g) => g.level <= Number(level));
}

/** A grant's option objects minus any the character already holds (per the grant's heldFrom). */
export function availableGrantOptions(grant, characterData = {}, ctx = {}) {
  const held = new Set((grant.heldFrom?.(characterData, ctx) || []).map(lc));
  return (grant.options || []).filter((o) => !held.has(lc(o.value)));
}

/** character_data patch merging the `chosen` value-names into the grant's storeField. */
export function applyGrant(grant, chosen, characterData = {}) {
  if (!grant?.storeField) return {};
  return { [grant.storeField]: dedup([...(characterData[grant.storeField] || []), ...(chosen || [])]) };
}
