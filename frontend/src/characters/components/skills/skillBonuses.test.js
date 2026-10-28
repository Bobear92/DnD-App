import { describe, it, expect } from 'vitest';
import { getSkillBonuses, skillBonusParts, skillBonusSources } from '@/characters/components/skills/skillBonuses';

const samurai = (level, wisdom = 14, extra = {}) => ({
  charClass: 'Fighter', subclass: 'Samurai', level, edition: '5e', scores: { wisdom }, ...extra,
});

describe('skill bonuses — Samurai Elegant Courtier', () => {
  it('adds the Wisdom modifier to Persuasion from level 7, named in the breakdown term', () => {
    expect(skillBonusParts('Persuasion', samurai(7, 16))).toEqual([
      { key: 'skill-bonus-elegant-courtier', label: 'Elegant Courtier (WIS modifier)', value: 3 },
    ]);
    expect(skillBonusSources(samurai(7))).toEqual(['Elegant Courtier']);
  });

  it('touches no other skill — not even another Charisma skill', () => {
    expect(skillBonusParts('Deception', samurai(7, 16))).toEqual([]);
    expect(skillBonusParts('Insight', samurai(7, 16))).toEqual([]);
  });

  it('applies a negative Wisdom modifier as-is (the literal reading)', () => {
    expect(skillBonusParts('Persuasion', samurai(7, 8))[0].value).toBe(-1);
  });

  it('grants nothing below level 7, to another subclass, or in 2024', () => {
    expect(getSkillBonuses(samurai(6))).toEqual([]);
    expect(getSkillBonuses(samurai(7, 14, { subclass: 'Cavalier' }))).toEqual([]);
    expect(getSkillBonuses(samurai(7, 14, { edition: '5.5e' }))).toEqual([]);
  });
});
