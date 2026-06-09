/**
 * Feat proficiency CHOICES — count-choice proficiency grants a feat makes the player pick
 * at acquisition (Skilled = 3 skills/tools, Linguist = 3 languages, Weapon Master = 4
 * weapons). Mirrors subclassProficiencyData's grant shape so the acquisition UI is the same
 * count-limited toggle picker, but kept separate so the feat and subclass flows don't couple.
 *
 * A feat's `proficiency` effect is a CHOICE when it has a `count` and no `items`
 * (fixed `items` grants are handled by featEffects.getFeatProficiencyGrants instead).
 *
 * Stored at acquisition into character_data: skills merge into `skill_proficiencies`;
 * tools → `feat_tool_proficiencies`; languages → `feat_languages`; weapons →
 * `feat_weapon_proficiencies`. `skill_or_tool` picks are split by membership.
 */
import { SKILLS } from '../../encyclopedia/data/skillsData';
import { TOOL_NAMES } from './toolsData';
import { gatherProficiencies } from './inventoryProficiencies';

const lc = (s) => (s || '').toLowerCase();
const dedup = (arr) => [...new Set((arr || []).filter(Boolean))];

export const FEAT_SKILL_OPTIONS = SKILLS.map((s) => s.name);
export const FEAT_TOOL_OPTIONS = TOOL_NAMES;
export const FEAT_LANGUAGE_OPTIONS = [
  'Abyssal', 'Celestial', 'Deep Speech', 'Draconic', 'Dwarvish', 'Elvish',
  'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Infernal', 'Orc',
  'Primordial', 'Sylvan', 'Undercommon',
];
export const FEAT_WEAPON_OPTIONS = [
  // Simple
  'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer', 'Mace',
  'Quarterstaff', 'Sickle', 'Spear', 'Light Crossbow', 'Dart', 'Shortbow', 'Sling',
  // Martial
  'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd', 'Lance',
  'Longsword', 'Maul', 'Morningstar', 'Pike', 'Rapier', 'Scimitar', 'Shortsword',
  'Trident', 'War Pick', 'Warhammer', 'Whip', 'Blowgun', 'Hand Crossbow',
  'Heavy Crossbow', 'Longbow', 'Net',
];

const _skillSet = new Set(FEAT_SKILL_OPTIONS.map(lc));

function optionsFor(profType) {
  switch (profType) {
    case 'skill': return FEAT_SKILL_OPTIONS;
    case 'tool': return FEAT_TOOL_OPTIONS;
    case 'language': return FEAT_LANGUAGE_OPTIONS;
    case 'weapon': return FEAT_WEAPON_OPTIONS;
    case 'skill_or_tool': return [...FEAT_SKILL_OPTIONS, ...FEAT_TOOL_OPTIONS];
    default: return [];
  }
}

const PROF_LABEL = {
  skill: 'skills', tool: 'tools', language: 'languages',
  weapon: 'weapons', skill_or_tool: 'skills or tools',
};

/**
 * Count-choice proficiency grants on a single feat (the one being picked). Returns
 * [{ key, prof_type, count, label, options }] — empty for feats with no count-choice
 * proficiency (fixed-item grants are excluded; they aren't a choice).
 */
export function getFeatProficiencyChoices(feat) {
  if (!feat || !Array.isArray(feat.effects)) return [];
  return feat.effects
    .filter((e) => e.kind === 'proficiency' && e.count > 0 && !Array.isArray(e.items))
    .map((e) => ({
      key: `feat-prof-${e.prof_type}`,
      prof_type: e.prof_type,
      count: e.count,
      label: e.label || `Choose ${e.count} ${PROF_LABEL[e.prof_type] || e.prof_type}`,
      options: optionsFor(e.prof_type),
    }));
}

/** Lowercased set of proficiencies of `profType` the character already has. */
export function existingFeatProfNames(profType, { charClass, characterData = {} } = {}) {
  const cd = characterData || {};
  if (profType === 'language') {
    return new Set([
      ...(cd.race_languages || []), ...(cd.background_languages || []),
      ...(cd.subclass_languages || []), ...(cd.feat_languages || []),
    ].map(lc));
  }
  if (profType === 'weapon') {
    return new Set([...(cd.race_weapon_proficiencies || []), ...(cd.feat_weapon_proficiencies || [])].map(lc));
  }
  if (profType === 'skill') {
    return new Set((cd.skill_proficiencies || []).map(lc));
  }
  if (profType === 'tool' || profType === 'skill_or_tool') {
    const tools = gatherProficiencies({ charClass, characterData: cd }).tools.grants.map(lc);
    const skills = profType === 'skill_or_tool' ? (cd.skill_proficiencies || []).map(lc) : [];
    return new Set([...tools, ...skills]);
  }
  return new Set();
}

/** A grant's options minus any the character already has (no doubling up). */
export function availableFeatOptions(grant, ctx = {}) {
  const have = existingFeatProfNames(grant.prof_type, ctx);
  return (grant.options || []).filter((o) => !have.has(lc(o)));
}

/** character_data patch merging the chosen proficiencies of `profType` into the right field(s). */
export function applyFeatProficiencyChoice(profType, chosen = [], characterData = {}) {
  const cd = characterData || {};
  const merge = (field, vals) => ({ [field]: dedup([...(cd[field] || []), ...vals]) });
  switch (profType) {
    case 'skill': return merge('skill_proficiencies', chosen);
    case 'tool': return merge('feat_tool_proficiencies', chosen);
    case 'language': return merge('feat_languages', chosen);
    case 'weapon': return merge('feat_weapon_proficiencies', chosen);
    case 'skill_or_tool': {
      const skills = chosen.filter((c) => _skillSet.has(lc(c)));
      const tools = chosen.filter((c) => !_skillSet.has(lc(c)));
      return {
        ...(skills.length ? merge('skill_proficiencies', skills) : {}),
        ...(tools.length ? { feat_tool_proficiencies: dedup([...(cd.feat_tool_proficiencies || []), ...tools]) } : {}),
      };
    }
    default: return {};
  }
}
