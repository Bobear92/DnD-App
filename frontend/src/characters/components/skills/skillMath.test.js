import { describe, it, expect } from 'vitest';
import { abilityMod, formatBonus, skillBreakdown, ABILITY_ABBREV } from './skillMath';

describe('abilityMod', () => {
  it('halves score minus 10, rounding down', () => {
    expect(abilityMod(8)).toBe(-1);
    expect(abilityMod(10)).toBe(0);
    expect(abilityMod(11)).toBe(0);
    expect(abilityMod(19)).toBe(4);
    expect(abilityMod(20)).toBe(5);
  });

  it('treats a missing score as 10', () => {
    expect(abilityMod(undefined)).toBe(0);
    expect(abilityMod(null)).toBe(0);
  });
});

describe('formatBonus', () => {
  it('signs the number with a real minus for negatives', () => {
    expect(formatBonus(3)).toBe('+3');
    expect(formatBonus(0)).toBe('+0');
    expect(formatBonus(-1)).toBe('−1');
  });
});

describe('skillBreakdown', () => {
  it('is the ability modifier alone when not proficient', () => {
    const b = skillBreakdown({ skill: 'Nature', ability: 'intelligence', abilityScore: 19, pb: 4 });
    expect(b.total).toBe(4);
    expect(b.parts).toEqual([{ key: 'ability', label: 'INT modifier', value: 4 }]);
  });

  it('adds the proficiency bonus and reports a negative ability modifier (EK Perception)', () => {
    const b = skillBreakdown({
      skill: 'Perception', ability: 'wisdom', abilityScore: 8, pb: 4, isProficient: true,
    });
    // WIS 8 → −1, proficient +4 → +3
    expect(b.total).toBe(3);
    expect(b.parts).toEqual([
      { key: 'ability', label: 'WIS modifier', value: -1 },
      { key: 'proficiency', label: 'Proficiency bonus', value: 4 },
    ]);
  });

  it('doubles proficiency for expertise and labels the doubling', () => {
    const b = skillBreakdown({
      skill: 'Stealth', ability: 'dexterity', abilityScore: 16, pb: 3, isProficient: true, isExpert: true,
    });
    expect(b.total).toBe(9); // +3 DEX + 6
    expect(b.parts[1]).toEqual({ key: 'expertise', label: 'Expertise (2 × proficiency +3)', value: 6 });
  });

  it('applies half proficiency only when not already proficient', () => {
    const args = { skill: 'Athletics', ability: 'strength', abilityScore: 16, pb: 4, halfProficiency: 2 };
    expect(skillBreakdown(args).total).toBe(5); // +3 STR + 2 half prof
    expect(skillBreakdown({ ...args, isProficient: true }).total).toBe(7); // full prof wins, no half
    expect(skillBreakdown({ ...args, isProficient: true }).parts).toHaveLength(2);
  });

  it('carries advantage/disadvantage notes and drops falsy ones', () => {
    const b = skillBreakdown({
      skill: 'Athletics', ability: 'strength', abilityScore: 10, pb: 2,
      notes: [false, 'Advantage — Remarkable Athlete', null],
    });
    expect(b.notes).toEqual(['Advantage — Remarkable Athlete']);
  });

  it('exposes the ability abbreviation for display', () => {
    expect(skillBreakdown({ ability: 'charisma', abilityScore: 10 }).abilityAbbrev).toBe('CHA');
    expect(ABILITY_ABBREV.constitution).toBe('CON');
  });

  it('parts always sum to the total', () => {
    const b = skillBreakdown({ ability: 'wisdom', abilityScore: 8, pb: 4, isProficient: true });
    expect(b.parts.reduce((s, p) => s + p.value, 0)).toBe(b.total);
  });
});
