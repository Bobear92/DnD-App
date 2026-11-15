import { describe, it, expect } from 'vitest';
import { abilityMod, profBonus, formatSigned, formatBonus, formatAbilityMod } from './abilityMath';

describe('abilityMod', () => {
  it.each([
    [1, -5], [2, -4], [3, -4], [7, -2], [8, -1], [9, -1], [10, 0], [11, 0],
    [12, 1], [13, 1], [14, 2], [15, 2], [16, 3], [18, 4], [20, 5], [24, 7], [30, 10],
  ])('score %i → %i', (score, expected) => {
    expect(abilityMod(score)).toBe(expected);
  });

  it('rounds DOWN for odd scores below ten (9 is −1, not 0)', () => {
    // Math.trunc or a naive integer division would give 0 here.
    expect(abilityMod(9)).toBe(-1);
    expect(abilityMod(7)).toBe(-2);
  });

  it.each([[undefined], [null], [''], [NaN], ['abc']])(
    'a missing or unusable score (%s) counts as 10 rather than producing NaN',
    (score) => {
      expect(abilityMod(score)).toBe(0);
    },
  );

  it('reads a numeric string the way an <input> hands one over', () => {
    expect(abilityMod('16')).toBe(3);
    expect(abilityMod('8')).toBe(-1);
  });

  it('always returns an integer', () => {
    for (let score = 1; score <= 30; score += 1) expect(Number.isInteger(abilityMod(score))).toBe(true);
  });
});

describe('profBonus', () => {
  it.each([
    [1, 2], [4, 2], [5, 3], [8, 3], [9, 4], [12, 4], [13, 5], [16, 5], [17, 6], [20, 6],
  ])('level %i → +%i', (level, expected) => {
    expect(profBonus(level)).toBe(expected);
  });

  it('steps up exactly at levels 5, 9, 13 and 17', () => {
    const steps = [];
    for (let level = 2; level <= 20; level += 1) {
      if (profBonus(level) !== profBonus(level - 1)) steps.push(level);
    }
    expect(steps).toEqual([5, 9, 13, 17]);
  });

  it.each([[undefined], [null], [''], [NaN], [0]])('a missing level (%s) counts as level 1', (level) => {
    expect(profBonus(level)).toBe(2);
  });

  it('reads a numeric string', () => {
    expect(profBonus('9')).toBe(4);
  });
});

describe('signed formatting', () => {
  it('formatSigned uses a plain hyphen', () => {
    expect(formatSigned(3)).toBe('+3');
    expect(formatSigned(0)).toBe('+0');
    expect(formatSigned(-1)).toBe('-1');
  });

  it('formatBonus uses a real minus sign', () => {
    expect(formatBonus(3)).toBe('+3');
    expect(formatBonus(0)).toBe('+0');
    expect(formatBonus(-1)).toBe('−1');
    expect(formatBonus(-1)).not.toBe('-1');
  });

  it('the two differ ONLY in the minus character', () => {
    for (const n of [-7, -1, 0, 1, 12]) {
      expect(formatBonus(n).replace('−', '-')).toBe(formatSigned(n));
    }
  });

  it('formatAbilityMod prints a score as its signed modifier', () => {
    expect(formatAbilityMod(16)).toBe('+3');
    expect(formatAbilityMod(10)).toBe('+0');
    expect(formatAbilityMod(8)).toBe('-1');
    expect(formatAbilityMod(undefined)).toBe('+0');
  });
});
