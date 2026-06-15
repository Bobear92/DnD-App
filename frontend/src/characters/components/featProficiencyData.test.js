import { describe, it, expect } from 'vitest';
import {
  getFeatProficiencyChoices, availableFeatOptions, applyFeatProficiencyChoice,
  existingFeatProfNames, groupFeatProfOptions, getFeatGrantedSkills,
  FEAT_SKILL_OPTIONS, FEAT_LANGUAGE_OPTIONS, FEAT_WEAPON_OPTIONS,
} from './featProficiencyData';

const LINGUIST = { name: 'Linguist', effects: [
  { kind: 'ability_score', ability: 'intelligence', amount: 1 },
  { kind: 'proficiency', prof_type: 'language', count: 3 },
] };
const WEAPON_MASTER = { name: 'Weapon Master', effects: [{ kind: 'proficiency', prof_type: 'weapon', count: 4 }] };
const SKILLED = { name: 'Skilled', effects: [{ kind: 'proficiency', prof_type: 'skill_or_tool', count: 3 }] };
const HEAVILY_ARMORED = { name: 'Heavily Armored', effects: [{ kind: 'proficiency', prof_type: 'armor', items: ['Heavy'] }] };

describe('featProficiencyData', () => {
  it('extracts count-choice grants (not fixed-item grants)', () => {
    expect(getFeatProficiencyChoices(LINGUIST)).toEqual([
      expect.objectContaining({ prof_type: 'language', count: 3, key: 'feat-prof-language' }),
    ]);
    expect(getFeatProficiencyChoices(WEAPON_MASTER)[0].count).toBe(4);
    expect(getFeatProficiencyChoices(HEAVILY_ARMORED)).toEqual([]); // fixed items, not a choice
    expect(getFeatProficiencyChoices({ name: 'X' })).toEqual([]);
  });

  it('uses the right option pool per prof_type', () => {
    expect(getFeatProficiencyChoices(LINGUIST)[0].options).toEqual(FEAT_LANGUAGE_OPTIONS);
    expect(getFeatProficiencyChoices(WEAPON_MASTER)[0].options).toEqual(FEAT_WEAPON_OPTIONS);
    // skill_or_tool combines skills + tools
    const opts = getFeatProficiencyChoices(SKILLED)[0].options;
    expect(opts).toContain('Acrobatics');
    expect(opts.length).toBeGreaterThan(FEAT_SKILL_OPTIONS.length);
  });

  it('availableFeatOptions hides already-held proficiencies', () => {
    const grant = getFeatProficiencyChoices(LINGUIST)[0];
    const opts = availableFeatOptions(grant, { characterData: { race_languages: ['Elvish'], feat_languages: ['Orc'] } });
    expect(opts).not.toContain('Elvish');
    expect(opts).not.toContain('Orc');
    expect(opts).toContain('Draconic');
  });

  it('existingFeatProfNames covers languages/weapons/skills sources', () => {
    expect(existingFeatProfNames('language', { characterData: { feat_languages: ['Orc'] } }).has('orc')).toBe(true);
    expect(existingFeatProfNames('weapon', { characterData: { feat_weapon_proficiencies: ['Longbow'] } }).has('longbow')).toBe(true);
    expect(existingFeatProfNames('skill', { characterData: { skill_proficiencies: ['Stealth'] } }).has('stealth')).toBe(true);
  });

  it('applyFeatProficiencyChoice routes each prof_type to the right field', () => {
    expect(applyFeatProficiencyChoice('language', ['Draconic', 'Orc'], {})).toEqual({ feat_languages: ['Draconic', 'Orc'] });
    expect(applyFeatProficiencyChoice('weapon', ['Longbow'], {})).toEqual({ feat_weapon_proficiencies: ['Longbow'] });
    expect(applyFeatProficiencyChoice('skill', ['Stealth'], { skill_proficiencies: ['Athletics'] }))
      .toEqual({ skill_proficiencies: ['Athletics', 'Stealth'] });
  });

  it('skill_or_tool splits picks into skills vs tools', () => {
    const patch = applyFeatProficiencyChoice('skill_or_tool', ['Arcana', "Thieves' Tools"], {});
    expect(patch.skill_proficiencies).toEqual(['Arcana']);
    expect(patch.feat_tool_proficiencies).toEqual(["Thieves' Tools"]);
  });

  it('dedupes against existing values', () => {
    expect(applyFeatProficiencyChoice('language', ['Orc', 'Draconic'], { feat_languages: ['Orc'] }))
      .toEqual({ feat_languages: ['Orc', 'Draconic'] });
  });

  it('extracts an Expertise grant with a dynamic proficient-skills pool (Skill Expert)', () => {
    const skillExpert = { name: 'Skill Expert', effects: [
      { kind: 'proficiency', prof_type: 'skill', count: 1 },
      { kind: 'expertise', count: 1 },
    ] };
    const choices = getFeatProficiencyChoices(skillExpert, { proficientSkills: ['Stealth', 'Arcana'] });
    const exp = choices.find((c) => c.prof_type === 'expertise');
    expect(exp).toMatchObject({ count: 1, options: ['Stealth', 'Arcana'] });
    // No proficient skills passed → empty pool (so the picker can be skipped / auto-complete)
    expect(getFeatProficiencyChoices(skillExpert).find((c) => c.prof_type === 'expertise').options).toEqual([]);
  });

  it('groupFeatProfOptions splits a Skilled (skill_or_tool) grant into categories', () => {
    const opts = getFeatProficiencyChoices(SKILLED)[0].options;
    const groups = groupFeatProfOptions('skill_or_tool', opts);
    const cats = groups.map((g) => g.category);
    // Categories appear in display order, only non-empty ones.
    expect(cats).toEqual(['Skills', "Artisan's Tools", 'Gaming Sets', 'Musical Instruments', 'Tools & Kits']);
    const byCat = Object.fromEntries(groups.map((g) => [g.category, g.options]));
    expect(byCat.Skills).toContain('Acrobatics');
    expect(byCat["Artisan's Tools"]).toContain("Smith's Tools");
    expect(byCat['Musical Instruments']).toContain('Lute');
    expect(byCat['Gaming Sets']).toContain('Dice Set');
    expect(byCat['Tools & Kits']).toContain("Thieves' Tools");
    // No option is lost or duplicated across groups.
    const flat = groups.flatMap((g) => g.options);
    expect(flat.length).toBe(opts.length);
    expect(new Set(flat).size).toBe(opts.length);
  });

  it('groupFeatProfOptions leaves non-skill/tool grants as a single uncategorized group', () => {
    expect(groupFeatProfOptions('language', FEAT_LANGUAGE_OPTIONS)).toEqual([
      { category: null, options: FEAT_LANGUAGE_OPTIONS },
    ]);
    expect(groupFeatProfOptions('weapon', FEAT_WEAPON_OPTIONS)[0].category).toBeNull();
    expect(groupFeatProfOptions('language', [])).toEqual([]);
  });

  it('getFeatGrantedSkills collects skills recorded on feat instances', () => {
    const feats = [
      { id: 1, name: 'Alert' }, // no choices
      { id: 2, name: 'Skilled', choices: { skills: ['Arcana', 'Stealth'] } },
      { id: 3, name: 'Skill Expert', choices: { ability: 'wisdom', skills: ['Arcana', 'Insight'] } },
    ];
    expect(getFeatGrantedSkills(feats)).toEqual(['Arcana', 'Stealth', 'Insight']); // deduped
    expect(getFeatGrantedSkills([])).toEqual([]);
    expect(getFeatGrantedSkills()).toEqual([]);
    expect(getFeatGrantedSkills([{ name: 'Tough', choices: { ability: 'constitution' } }])).toEqual([]);
  });

  it('routes Expertise to expertise_skills and tracks already-held', () => {
    expect(applyFeatProficiencyChoice('expertise', ['Stealth'], { expertise_skills: ['Arcana'] }))
      .toEqual({ expertise_skills: ['Arcana', 'Stealth'] });
    expect(existingFeatProfNames('expertise', { characterData: { expertise_skills: ['Stealth'] } }).has('stealth')).toBe(true);
  });
});
