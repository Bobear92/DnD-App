/**
 * Saving-throw PROFICIENCY granted by a class or subclass FEATURE (not by the class's own save
 * list, which is stored per ability as `character_data.<abbr>_save_prof`, and not by a feat,
 * which `getFeatSaveProficiencies` already answers).
 *
 * Derived from class + subclass + level, never written into the stored `*_save_prof` flags: a
 * character who reached the level before this existed has the proficiency with no migration,
 * and the stored flag keeps meaning "what the player set by hand".
 *
 * Two shapes:
 *   - a FIXED grant (Samurai Elegant Courtier → Wisdom) — a row in FEATURE_SAVE_PROFICIENCIES
 *   - a CHOSEN fallback — RAW Elegant Courtier says that if you already have Wisdom-save
 *     proficiency you instead gain Intelligence or Charisma. That pick is a subclassGrants
 *     choice (offered only when the fallback applies) stored in CHOSEN_SAVE_FIELD, and read
 *     back here so every consumer sees one list.
 *
 * Pure, and deliberately imports nothing but featEffects, so subclassGrants.js can use it as a
 * gate without an import cycle.
 */

import { getFeatSaveProficiencies } from '@/characters/components/feats/featEffects';

/** Each class's own saving-throw proficiencies — the defaults for the stored `*_save_prof` flags. */
export const CLASS_SAVE_PROFS = {
  Barbarian: ['str_save_prof', 'con_save_prof'],
  Bard:      ['dex_save_prof', 'cha_save_prof'],
  Cleric:    ['wis_save_prof', 'cha_save_prof'],
  Druid:     ['int_save_prof', 'wis_save_prof'],
  Fighter:   ['str_save_prof', 'con_save_prof'],
  Monk:      ['str_save_prof', 'dex_save_prof'],
  Paladin:   ['wis_save_prof', 'cha_save_prof'],
  Ranger:    ['str_save_prof', 'dex_save_prof'],
  Rogue:     ['dex_save_prof', 'int_save_prof'],
  Sorcerer:  ['con_save_prof', 'cha_save_prof'],
  Warlock:   ['wis_save_prof', 'cha_save_prof'],
  Wizard:    ['int_save_prof', 'wis_save_prof'],
};

export const SAVE_ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

/** character_data field holding chosen fallback save proficiencies ('Intelligence', …). */
export const CHOSEN_SAVE_FIELD = 'subclass_save_proficiencies';

const normEdition = (edition) => (edition === '5.5e' || edition === '2024' ? '5.5e' : '5e');
const abbr = (ability) => ability.slice(0, 3);

export const FEATURE_SAVE_PROFICIENCIES = [
  {
    name: 'Elegant Courtier',
    charClass: 'Fighter',
    subclass: 'Samurai',
    minLevel: 7,
    editions: ['5e'],
    abilities: ['wisdom'],
  },
];

/**
 * `[{ability, source}]` — every save proficiency a feature grants this character, fixed grants
 * first, then any chosen fallback (attributed to the feature that offered it).
 */
export function featureSaveProficiencies({
  charClass, subclass, level = 1, edition = '5e', characterData = {},
} = {}) {
  const ed = normEdition(edition);
  const out = [];
  for (const row of FEATURE_SAVE_PROFICIENCIES) {
    if (row.charClass !== charClass || row.subclass !== subclass) continue;
    if ((Number(level) || 1) < row.minLevel) continue;
    if (row.editions && !row.editions.includes(ed)) continue;
    for (const ability of row.abilities) out.push({ ability, source: row.name });
    // The fallback pick belongs to the same feature, so it shares its gate and its name.
    for (const picked of characterData?.[CHOSEN_SAVE_FIELD] ?? []) {
      const ability = String(picked).toLowerCase();
      if (SAVE_ABILITIES.includes(ability)) out.push({ ability, source: row.name });
    }
  }
  return out;
}

/** The feature that grants proficiency in this save, or null. */
export function featureSaveProficiencySource(ability, ctx = {}) {
  return featureSaveProficiencies(ctx).find((p) => p.ability === ability)?.source ?? null;
}

/**
 * Save proficiencies held from sources OTHER than a feature grant — the stored per-ability
 * flags (class saves, or set by hand) plus feats (Resilient). This is the question Elegant
 * Courtier's fallback asks: "do you ALREADY have Wisdom-save proficiency?" — which must not
 * count the proficiency the feature itself grants, or the fallback would always fire.
 *
 * `classSaves` is the class's default save list (e.g. ['str_save_prof', 'con_save_prof']),
 * used only when a flag was never stored.
 */
export function nonFeatureSaveProficiencies(characterData = {}, { classSaves = [] } = {}) {
  const stored = SAVE_ABILITIES.filter((a) => {
    const flag = characterData?.[`${abbr(a)}_save_prof`];
    return flag ?? classSaves.includes(`${abbr(a)}_save_prof`);
  });
  return [...new Set([...stored, ...getFeatSaveProficiencies(characterData?.feats ?? [])])];
}
