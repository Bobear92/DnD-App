import { describe, it, expect } from 'vitest';
import { PASSIVE_SKILLS, computePassiveScores } from './passiveSkills';

const SCORES = { strength: 16, dexterity: 12, constitution: 14, intelligence: 14, wisdom: 12, charisma: 8 };

const byKey = (rows, key) => rows.find((r) => r.key === key);

describe('PASSIVE_SKILLS', () => {
  it('lists Perception, Investigation and Insight in that order', () => {
    expect(PASSIVE_SKILLS.map((p) => p.skill)).toEqual(['Perception', 'Investigation', 'Insight']);
  });

  it('maps each passive to its governing ability', () => {
    expect(PASSIVE_SKILLS.map((p) => p.ability)).toEqual(['wisdom', 'intelligence', 'wisdom']);
  });
});

describe('computePassiveScores', () => {
  it('is 10 + ability modifier when not proficient — the proficiency bonus is NOT added', () => {
    const rows = computePassiveScores({ abilityScores: SCORES, pb: 3, classData: { skill_proficiencies: ['Athletics'] } });
    // WIS 12 → +1, no Perception proficiency → 10 + 1 = 11 (not 14)
    expect(byKey(rows, 'perception').total).toBe(11);
    expect(byKey(rows, 'perception').isProficient).toBe(false);
    // INT 14 → +2 → 12
    expect(byKey(rows, 'investigation').total).toBe(12);
  });

  it('adds the proficiency bonus when proficient in the skill', () => {
    const rows = computePassiveScores({
      abilityScores: SCORES,
      pb: 3,
      classData: { skill_proficiencies: ['Perception'] },
    });
    expect(byKey(rows, 'perception').total).toBe(14); // 10 + 1 + 3
    expect(byKey(rows, 'perception').isProficient).toBe(true);
    expect(byKey(rows, 'insight').total).toBe(11); // still not proficient
  });

  it('doubles the proficiency bonus for expertise', () => {
    const rows = computePassiveScores({
      abilityScores: SCORES,
      pb: 3,
      classData: { skill_proficiencies: ['Perception'], expertise_skills: ['Perception'] },
    });
    const perception = byKey(rows, 'perception');
    expect(perception.total).toBe(17); // 10 + 1 + 6
    expect(perception.isExpert).toBe(true);
  });

  it('counts race-granted proficiency from race_traits (Elf Keen Senses)', () => {
    const rows = computePassiveScores({
      abilityScores: SCORES,
      pb: 3,
      classData: { skill_proficiencies: [], race_traits: ['Keen Senses'] },
    });
    expect(byKey(rows, 'perception').total).toBe(14);
    expect(byKey(rows, 'perception').isProficient).toBe(true);
  });

  it("adds a feat's stat_mod to the matching passive and reports the source", () => {
    const feats = [{
      name: 'Observant',
      effects: [
        { kind: 'stat_mod', stat: 'passive_perception', amount: 5 },
        { kind: 'stat_mod', stat: 'passive_investigation', amount: 5 },
      ],
    }];
    const rows = computePassiveScores({ abilityScores: SCORES, pb: 3, classData: { feats } });
    expect(byKey(rows, 'perception').total).toBe(16); // 10 + 1 + 5
    expect(byKey(rows, 'investigation').total).toBe(17); // 10 + 2 + 5
    expect(byKey(rows, 'perception').featSources).toEqual([{ source: 'Observant', amount: 5, label: undefined }]);
    // Insight is untouched by Observant
    expect(byKey(rows, 'insight').total).toBe(11);
    expect(byKey(rows, 'insight').featSources).toEqual([]);
  });

  it('stacks proficiency and a feat bonus', () => {
    const feats = [{ name: 'Observant', effects: [{ kind: 'stat_mod', stat: 'passive_perception', amount: 5 }] }];
    const rows = computePassiveScores({
      abilityScores: SCORES,
      pb: 3,
      classData: { skill_proficiencies: ['Perception'], feats },
    });
    expect(byKey(rows, 'perception').total).toBe(19); // 10 + 1 + 3 + 5
  });

  it('resolves a PB-scaled feat amount', () => {
    const feats = [{ name: 'Homebrew Watcher', effects: [{ kind: 'stat_mod', stat: 'passive_insight', amount: 'pb' }] }];
    const rows = computePassiveScores({ abilityScores: SCORES, pb: 4, classData: { feats } });
    expect(byKey(rows, 'insight').total).toBe(15); // 10 + 1 + 4
  });

  it('defaults safely with no arguments', () => {
    const rows = computePassiveScores();
    expect(rows).toHaveLength(3);
    rows.forEach((r) => expect(r.total).toBe(10)); // score defaults to 10 → +0 modifier
  });
});
