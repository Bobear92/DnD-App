import { describe, it, expect } from 'vitest';
import { parsePrerequisite, checkFeatPrerequisite } from './featPrerequisites';

const feat = (text) => ({ name: 'X', prerequisites: text ? { text } : {} });

describe('parsePrerequisite', () => {
  it('returns nothing for empty / missing text', () => {
    expect(parsePrerequisite('')).toEqual([]);
    expect(parsePrerequisite(null)).toEqual([]);
    expect(parsePrerequisite(undefined)).toEqual([]);
  });

  it('parses a single ability requirement', () => {
    expect(parsePrerequisite('Strength 13 or higher')).toEqual([
      { kind: 'ability', abilities: ['strength'], min: 13 },
    ]);
  });

  it('parses an either/or ability requirement', () => {
    expect(parsePrerequisite('Intelligence or Wisdom 13 or higher')).toEqual([
      { kind: 'ability', abilities: ['intelligence', 'wisdom'], min: 13 },
    ]);
  });

  it('parses the "13+" shorthand', () => {
    expect(parsePrerequisite('Charisma 13+')).toEqual([
      { kind: 'ability', abilities: ['charisma'], min: 13 },
    ]);
  });

  it('parses spellcasting phrasings', () => {
    expect(parsePrerequisite('The ability to cast at least one spell')).toEqual([{ kind: 'spell' }]);
    expect(parsePrerequisite('spellcasting or pact magic')).toEqual([{ kind: 'spell' }]);
  });

  it('parses armor proficiency and training', () => {
    expect(parsePrerequisite('Proficiency with medium armor')).toEqual([{ kind: 'armor', armor: 'medium' }]);
    expect(parsePrerequisite('Heavy armor training')).toEqual([{ kind: 'armor', armor: 'heavy' }]);
  });

  it('parses level requirements without treating the level number as an ability', () => {
    expect(parsePrerequisite('Level 4+')).toEqual([{ kind: 'level', min: 4 }]);
  });

  it('parses a combined 2024-style prerequisite', () => {
    expect(parsePrerequisite('Level 4+, Charisma 13+')).toEqual([
      { kind: 'ability', abilities: ['charisma'], min: 13 },
      { kind: 'level', min: 4 },
    ]);
  });

  it('ignores unrecognized text (fail-open)', () => {
    expect(parsePrerequisite('Membership in the Harpers')).toEqual([]);
  });
});

describe('checkFeatPrerequisite', () => {
  const fullCtx = {
    level: 1, className: 'Fighter',
    scores: { strength: 15, dexterity: 14, constitution: 13, intelligence: 8, wisdom: 10, charisma: 12 },
    abilityScoresKnown: true, spellcaster: false, armorProficiencies: ['light', 'medium', 'heavy'],
  };

  it('met when the feat has no prerequisite', () => {
    expect(checkFeatPrerequisite(feat(null), fullCtx).met).toBe(true);
  });

  it('met when an ability score meets the requirement', () => {
    expect(checkFeatPrerequisite(feat('Strength 13 or higher'), fullCtx).met).toBe(true);
  });

  it('unmet with a reason when an ability score is too low', () => {
    const res = checkFeatPrerequisite(feat('Charisma 13 or higher'), fullCtx);
    expect(res.met).toBe(false);
    expect(res.unmet[0]).toMatchObject({ kind: 'ability', dependsOn: 'ability' });
    expect(res.unmet[0].reason).toMatch(/Charisma 13\+ \(highest is 12\)/);
  });

  it('either/or ability is met when one side qualifies', () => {
    const ctx = { ...fullCtx, scores: { ...fullCtx.scores, intelligence: 8, wisdom: 14 } };
    expect(checkFeatPrerequisite(feat('Intelligence or Wisdom 13 or higher'), ctx).met).toBe(true);
  });

  it('skips ability checks until scores are known (fail-open)', () => {
    const ctx = { ...fullCtx, scores: null, abilityScoresKnown: false };
    expect(checkFeatPrerequisite(feat('Charisma 13 or higher'), ctx).met).toBe(true);
  });

  it('blocks a spellcasting feat for a non-caster', () => {
    const res = checkFeatPrerequisite(feat('The ability to cast at least one spell'), fullCtx);
    expect(res.met).toBe(false);
    expect(res.unmet[0]).toMatchObject({ kind: 'spell', dependsOn: 'class' });
    expect(res.unmet[0].reason).toMatch(/cast a spell/);
  });

  it('allows a spellcasting feat for a caster', () => {
    expect(checkFeatPrerequisite(feat('The ability to cast at least one spell'), { ...fullCtx, spellcaster: true }).met).toBe(true);
  });

  it('skips spell checks when spellcaster is unknown', () => {
    expect(checkFeatPrerequisite(feat('The ability to cast at least one spell'), { ...fullCtx, spellcaster: null }).met).toBe(true);
  });

  it('blocks an armor feat when the category is missing', () => {
    const ctx = { ...fullCtx, armorProficiencies: ['light'] };
    const res = checkFeatPrerequisite(feat('Proficiency with medium armor'), ctx);
    expect(res.met).toBe(false);
    expect(res.unmet[0]).toMatchObject({ kind: 'armor', dependsOn: 'class' });
  });

  it('allows an armor feat when the category is present', () => {
    expect(checkFeatPrerequisite(feat('Proficiency with medium armor'), fullCtx).met).toBe(true);
  });

  it('skips armor checks when proficiencies are unknown', () => {
    expect(checkFeatPrerequisite(feat('Proficiency with heavy armor'), { ...fullCtx, armorProficiencies: null }).met).toBe(true);
  });

  it('blocks a level requirement above the current level', () => {
    const res = checkFeatPrerequisite(feat('Level 4+'), fullCtx);
    expect(res.met).toBe(false);
    expect(res.unmet[0]).toMatchObject({ kind: 'level', dependsOn: 'level' });
  });
});
