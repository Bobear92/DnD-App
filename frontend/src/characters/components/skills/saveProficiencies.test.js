import { describe, it, expect } from 'vitest';
import {
  featureSaveProficiencies, featureSaveProficiencySource, nonFeatureSaveProficiencies,
  CLASS_SAVE_PROFS, CHOSEN_SAVE_FIELD,
} from '@/characters/components/skills/saveProficiencies';

const samurai = (level, characterData = {}, extra = {}) => ({
  charClass: 'Fighter', subclass: 'Samurai', level, edition: '5e', characterData, ...extra,
});

const resilientWis = { feats: [{
  name: 'Resilient', choices: { ability: 'wisdom' },
  effects: [{ kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true }],
}] };

describe('featureSaveProficiencies — Samurai Elegant Courtier', () => {
  it('grants Wisdom-save proficiency from level 7', () => {
    expect(featureSaveProficiencies(samurai(7))).toEqual([{ ability: 'wisdom', source: 'Elegant Courtier' }]);
    expect(featureSaveProficiencySource('wisdom', samurai(7))).toBe('Elegant Courtier');
  });

  it('grants nothing below level 7, to another subclass, or in 2024 (no 2024 Samurai)', () => {
    expect(featureSaveProficiencies(samurai(6))).toEqual([]);
    expect(featureSaveProficiencies(samurai(7, {}, { subclass: 'Champion' }))).toEqual([]);
    expect(featureSaveProficiencies(samurai(7, {}, { edition: '5.5e' }))).toEqual([]);
  });

  it('adds the chosen INT/CHA fallback, attributed to the same feature', () => {
    const ctx = samurai(7, { [CHOSEN_SAVE_FIELD]: ['Charisma'] });
    expect(featureSaveProficiencySource('charisma', ctx)).toBe('Elegant Courtier');
    expect(featureSaveProficiencySource('intelligence', ctx)).toBeNull();
  });

  it('a stored fallback pick grants nothing once the feature is not held', () => {
    expect(featureSaveProficiencies(samurai(6, { [CHOSEN_SAVE_FIELD]: ['Charisma'] }))).toEqual([]);
  });
});

describe('nonFeatureSaveProficiencies — "do you ALREADY have it?"', () => {
  it('falls back to the class saves when no flag was stored', () => {
    expect(nonFeatureSaveProficiencies({}, { classSaves: CLASS_SAVE_PROFS.Fighter }))
      .toEqual(['strength', 'constitution']);
  });

  it('a stored flag overrides the class default', () => {
    const cd = { str_save_prof: false, wis_save_prof: true };
    expect(nonFeatureSaveProficiencies(cd, { classSaves: CLASS_SAVE_PROFS.Fighter }))
      .toEqual(['constitution', 'wisdom']);
  });

  it('counts a feat-granted save (Resilient)', () => {
    expect(nonFeatureSaveProficiencies(resilientWis, { classSaves: CLASS_SAVE_PROFS.Fighter })).toContain('wisdom');
  });

  it('never counts the feature grant itself — or the fallback would always fire', () => {
    expect(nonFeatureSaveProficiencies({}, { classSaves: CLASS_SAVE_PROFS.Fighter })).not.toContain('wisdom');
  });
});
