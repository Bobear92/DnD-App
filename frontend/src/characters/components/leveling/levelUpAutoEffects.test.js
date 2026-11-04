import { describe, it, expect } from 'vitest';
import { levelUpAutoEffects, signed } from './levelUpAutoEffects';

const SAMURAI = { charClass: 'Fighter', subclass: 'Samurai', edition: '5e' };
const RESILIENT_WIS = [{
  name: 'Resilient', choices: { ability: 'wisdom' },
  effects: [{ kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true }],
}];

describe('levelUpAutoEffects — Samurai Elegant Courtier', () => {
  it('reaching 7 grants Wisdom-save proficiency, with the new save total', () => {
    const { saveProficiencies } = levelUpAutoEffects({ ...SAMURAI, fromLevel: 6, toLevel: 7, scores: { wisdom: 14 } });
    expect(saveProficiencies).toEqual([expect.objectContaining({
      ability: 'wisdom', source: 'Elegant Courtier', alreadyHeld: false, abilityMod: 2, pb: 3, total: 5,
    })]);
  });

  it('reaching 7 adds the Wisdom modifier to Persuasion', () => {
    const { skillBonuses } = levelUpAutoEffects({ ...SAMURAI, fromLevel: 6, toLevel: 7, scores: { wisdom: 16 } });
    expect(skillBonuses).toEqual([expect.objectContaining({ skill: 'Persuasion', amount: 3, source: 'Elegant Courtier' })]);
  });

  it('a negative Wisdom modifier is reported as-is', () => {
    const { skillBonuses } = levelUpAutoEffects({ ...SAMURAI, fromLevel: 6, toLevel: 7, scores: { wisdom: 8 } });
    expect(skillBonuses[0].amount).toBe(-1);
  });

  it('flags the save as already held when Resilient gave it, so the wizard points to the fallback pick', () => {
    const { saveProficiencies } = levelUpAutoEffects({
      ...SAMURAI, fromLevel: 6, toLevel: 7, scores: { wisdom: 12 }, characterData: { feats: RESILIENT_WIS },
    });
    expect(saveProficiencies[0].alreadyHeld).toBe(true);
  });

  it('reports nothing on a level that gains nothing automatic', () => {
    expect(levelUpAutoEffects({ ...SAMURAI, fromLevel: 7, toLevel: 8, scores: { wisdom: 14 } }))
      .toEqual({ saveProficiencies: [], skillBonuses: [] });
    expect(levelUpAutoEffects({ ...SAMURAI, fromLevel: 5, toLevel: 6, scores: { wisdom: 14 } }))
      .toEqual({ saveProficiencies: [], skillBonuses: [] });
  });

  it('another subclass and the 2024 edition get nothing', () => {
    expect(levelUpAutoEffects({ ...SAMURAI, subclass: 'Champion', fromLevel: 6, toLevel: 7 }).skillBonuses).toEqual([]);
    expect(levelUpAutoEffects({ ...SAMURAI, edition: '5.5e', fromLevel: 6, toLevel: 7 }).saveProficiencies).toEqual([]);
  });

  it('ignores a fallback pick already stored — that is a choice, not an automatic effect', () => {
    const { saveProficiencies } = levelUpAutoEffects({
      ...SAMURAI, fromLevel: 6, toLevel: 7, characterData: { subclass_save_proficiencies: ['Charisma'] },
    });
    expect(saveProficiencies.map((p) => p.ability)).toEqual(['wisdom']);
  });
});

describe('signed', () => {
  it('prints a modifier with its sign', () => {
    expect(signed(2)).toBe('+2');
    expect(signed(0)).toBe('+0');
    expect(signed(-1)).toBe('−1');
  });
});
