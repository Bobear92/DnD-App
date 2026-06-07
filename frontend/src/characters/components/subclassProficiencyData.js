/**
 * Subclass proficiency grants — subclass features that let the player CHOOSE a new
 * proficiency (a tool, skill, or language). The Level-Up wizard reads this table and,
 * at the level a grant is gained, prompts the player to pick — hiding options they
 * already have so they can't double up.
 *
 * Fixed proficiency grants (no choice — e.g. Rune Knight's smith's tools + Giant) are
 * NOT listed here; they're auto-conferred and need no prompt.
 *
 * Shape: SUBCLASS_PROFICIENCY_GRANTS[className][edition][subclassName] = [grant]
 *   grant = { level, key, type: 'tool'|'skill'|'language', count, label, options:[string] }
 *
 * Vertical slice: Fighter → Battle Master (Student of War). Adding another subclass is a
 * pure data entry here — the wizard mechanism is class-agnostic.
 */
import { gatherProficiencies } from './inventoryProficiencies';
import { ARTISAN_TOOLS } from './toolsData';

const lc = (s) => (s || '').toLowerCase();
const dedup = (arr) => [...new Set((arr || []).filter(Boolean))];

export const ARTISAN_TOOL_OPTIONS = ARTISAN_TOOLS;

export const SUBCLASS_PROFICIENCY_GRANTS = {
  Fighter: {
    '5e': {
      'Battle Master': [
        { level: 3, key: 'student_of_war', type: 'tool', count: 1,
          label: "Student of War — Artisan's Tools", options: ARTISAN_TOOL_OPTIONS },
      ],
    },
    '5.5e': {
      'Battle Master': [
        { level: 3, key: 'student_of_war', type: 'tool', count: 1,
          label: "Student of War — Artisan's Tools", options: ARTISAN_TOOL_OPTIONS },
      ],
    },
  },
};

const normEdition = (edition) => (edition === '5.5e' || edition === '2024' ? '5.5e' : '5e');

/** Grants the given subclass confers exactly at `level` (the level being gained). */
export function getSubclassProficiencyGrants(charClass, edition, subclass, level) {
  if (!subclass) return [];
  const grants = SUBCLASS_PROFICIENCY_GRANTS[charClass]?.[normEdition(edition)]?.[subclass] || [];
  return grants.filter((g) => g.level === Number(level));
}

/** Lowercased set of proficiencies of `type` the character already has. */
export function existingProficiencyNames(type, { charClass, characterData = {} } = {}) {
  if (type === 'tool') {
    return new Set(gatherProficiencies({ charClass, characterData }).tools.grants.map(lc));
  }
  if (type === 'skill') {
    return new Set((characterData.skill_proficiencies || []).map(lc));
  }
  if (type === 'language') {
    return new Set([
      ...(characterData.race_languages || []),
      ...(characterData.background_languages || []),
      ...(characterData.subclass_languages || []),
    ].map(lc));
  }
  return new Set();
}

/** A grant's options minus any the character already has (no doubling up). */
export function availableOptions(grant, { charClass, characterData } = {}) {
  const have = existingProficiencyNames(grant.type, { charClass, characterData });
  return (grant.options || []).filter((o) => !have.has(lc(o)));
}

// Where each proficiency type is stored in character_data. Skills merge into the existing
// skill_proficiencies (so the skill panel shows them); tools/languages get their own
// subclass-sourced arrays.
const STORE_FIELD = {
  tool: 'subclass_tool_proficiencies',
  skill: 'skill_proficiencies',
  language: 'subclass_languages',
};

/** character_data patch merging `chosen` proficiencies of `type` into the right field. */
export function applyProficiencyChoice(type, chosen, characterData = {}) {
  const field = STORE_FIELD[type];
  if (!field) return {};
  return { [field]: dedup([...(characterData[field] || []), ...(chosen || [])]) };
}
