/**
 * Maps racial trait names to the proficiencies they grant.
 *
 * Only skill proficiencies feed the 18-skill panel on the character sheet,
 * so those are the only ones consumed today. Tool/weapon/armor entries are
 * documented for future use when those panels are added.
 */

// Trait → array of skill names that the trait grants as a proficiency.
// Inherited from base race onto all subraces (so Elf's Keen Senses applies to
// High Elf, Wood Elf, and Drow automatically).
export const TRAIT_SKILL_GRANTS = {
  'Keen Senses': ['Perception'],
  'Menacing': ['Intimidation'],
};

// Trait → array of weapon proficiencies. Not surfaced in UI yet.
export const TRAIT_WEAPON_GRANTS = {
  'Dwarven Combat Training': ['Battleaxe', 'Handaxe', 'Light hammer', 'Warhammer'],
  'Elf Weapon Training': ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'],
  'Drow Weapon Training': ['Rapier', 'Shortsword', 'Hand crossbow'],
};

// Trait → array of armor proficiencies. Not surfaced in UI yet.
export const TRAIT_ARMOR_GRANTS = {
  'Dwarven Armor Training': ['Light armor', 'Medium armor'],
};

// Trait → array of tool proficiencies (or descriptive notes for player-choice tools).
// Not surfaced in UI yet.
export const TRAIT_TOOL_GRANTS = {
  'Tool Proficiency': ["Smith's tools, brewer's supplies, or mason's tools (choose one)"],
  'Tinker': ["Tinker's tools"],
};

// Traits whose tool proficiency is a *player choice* (handled by a dedicated picker, e.g. the
// Dwarf "Tool Proficiency" → dwarf_tool select) rather than a fixed automatic grant.
const CHOICE_TOOL_TRAITS = new Set(['Tool Proficiency']);

// Shared: collect grants from a race+subrace's traits against a trait→proficiencies table.
function grantsFromTraits(race, subrace, table, skip = null) {
  const traits = [...(race?.traits ?? []), ...(subrace?.traits ?? [])];
  const out = new Set();
  for (const t of traits) {
    if (skip?.has(t)) continue;
    (table[t] ?? []).forEach((x) => out.add(x));
  }
  return [...out].sort();
}

/** Fixed tool proficiencies granted by race/subrace traits (e.g. Rock Gnome "Tinker" → Tinker's
 *  tools). Excludes player-choice tool traits (Dwarf "Tool Proficiency"), which are picked separately. */
export function getRaceGrantedTools(race, subrace) {
  return grantsFromTraits(race, subrace, TRAIT_TOOL_GRANTS, CHOICE_TOOL_TRAITS);
}

/** Weapon proficiencies granted by race/subrace traits (Elf/Drow Weapon Training, …). */
export function getRaceGrantedWeapons(race, subrace) {
  return grantsFromTraits(race, subrace, TRAIT_WEAPON_GRANTS);
}

/** Armor proficiencies granted by race/subrace traits (Mountain Dwarf "Dwarven Armor Training"). */
export function getRaceGrantedArmor(race, subrace) {
  return grantsFromTraits(race, subrace, TRAIT_ARMOR_GRANTS);
}

/**
 * Returns the deduplicated list of skill names a race + subrace grants via
 * traits like Keen Senses and Menacing.
 *
 * @param {Object|null} race    — a race object with .traits array
 * @param {Object|null} subrace — an optional subrace object with .traits array
 * @returns {string[]}          — sorted unique skill names
 */
export function getRaceGrantedSkills(race, subrace) {
  const traits = [
    ...(race?.traits ?? []),
    ...(subrace?.traits ?? []),
  ];
  const skills = new Set();
  for (const t of traits) {
    const granted = TRAIT_SKILL_GRANTS[t];
    if (granted) granted.forEach(s => skills.add(s));
  }
  return [...skills].sort();
}

/**
 * Returns the deduplicated list of skill names granted by an already-saved
 * character_data.race_traits array. Used by CharacterDetail to render
 * proficiency on the skill panel for existing characters whose
 * character_data.skill_proficiencies array may not include race grants.
 *
 * @param {string[]} raceTraits — character_data.race_traits
 * @returns {string[]}          — sorted unique skill names
 */
export function getRaceGrantedSkillsFromTraits(raceTraits = []) {
  const skills = new Set();
  for (const t of raceTraits) {
    const granted = TRAIT_SKILL_GRANTS[t];
    if (granted) granted.forEach(s => skills.add(s));
  }
  return [...skills].sort();
}

/**
 * Returns a list of { skill, trait } pairs explaining each granted skill's
 * source — useful for the "Perception (from Keen Senses)" UI string in
 * CharacterCreate.
 *
 * @param {Object|null} race
 * @param {Object|null} subrace
 * @returns {Array<{skill: string, trait: string}>}
 */
export function getRaceSkillSources(race, subrace) {
  const traits = [
    ...(race?.traits ?? []),
    ...(subrace?.traits ?? []),
  ];
  const out = [];
  const seen = new Set();
  for (const t of traits) {
    const granted = TRAIT_SKILL_GRANTS[t];
    if (!granted) continue;
    for (const s of granted) {
      const key = `${s}:${t}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ skill: s, trait: t });
    }
  }
  return out;
}
