import { describe, it, expect } from 'vitest';
import {
  psionicDieSize, psionicDie, psionicDiceTotal, psionicDieAndInt,
  psiSaveDc, psiSaveDcBreakdown, bulwarkTargets,
  nextPsionicDieStep,
} from '@/characters/components/classData/psiWarriorData';

describe('psiWarriorData', () => {
  // The stored subclass blurb says a flat "d6s" in BOTH editions; RAW scales the die. This is
  // the whole reason the numbers are computed here rather than transcribed onto a card.
  it('scales the Psionic Energy die d6 → d8 → d10 → d12 at levels 3, 5, 11 and 17', () => {
    expect(psionicDieSize(3)).toBe(6);
    expect(psionicDieSize(4)).toBe(6);
    expect(psionicDieSize(5)).toBe(8);
    expect(psionicDieSize(10)).toBe(8);
    expect(psionicDieSize(11)).toBe(10);
    expect(psionicDieSize(16)).toBe(10);
    expect(psionicDieSize(17)).toBe(12);
    expect(psionicDieSize(20)).toBe(12);
  });

  it('answers the starting die below the subclass unlock level rather than nothing', () => {
    expect(psionicDieSize(1)).toBe(6);
    expect(psionicDie(1)).toBe('d6');
    expect(psionicDie(11)).toBe('d10');
  });

  it('sizes the pool at twice the proficiency bonus', () => {
    expect(psionicDiceTotal(3)).toBe(4);
    expect(psionicDiceTotal(5)).toBe(6);
    expect(psionicDiceTotal(9)).toBe(8);
    expect(psionicDiceTotal(13)).toBe(10);
    expect(psionicDiceTotal(17)).toBe(12);
    expect(psionicDiceTotal(20)).toBe(12);
  });

  it('writes one die plus the Intelligence modifier', () => {
    expect(psionicDieAndInt(3, 16)).toBe('1d6 + 3');
    expect(psionicDieAndInt(11, 20)).toBe('1d10 + 5');
  });

  // A "+ 0" term reads as a real bonus the player should look for; a negative one must not be
  // printed as "+ -1".
  it('drops a zero Intelligence modifier and subtracts a negative one', () => {
    expect(psionicDieAndInt(5, 10)).toBe('1d8');
    expect(psionicDieAndInt(5, 8)).toBe('1d8 − 1');
  });

  it('computes the Telekinetic Thrust save DC as 8 + proficiency + INT', () => {
    expect(psiSaveDc(7, 16)).toBe(8 + 3 + 3);
    expect(psiSaveDc(17, 20)).toBe(8 + 6 + 5);
    expect(psiSaveDc(7, 10)).toBe(8 + 3 + 0);
  });

  it('exposes the save DC as a breakdown whose parts sum to the DC', () => {
    const breakdown = psiSaveDcBreakdown(7, 16);
    const total = breakdown.parts.reduce((sum, p) => sum + p.value, 0);
    expect(total).toBe(psiSaveDc(7, 16));
    expect(breakdown.parts.map((p) => p.key)).toEqual(['base', 'proficiency', 'ability']);
  });

  // Floored at one for the same reason the Cavalier/Echo Knight pools are: a zero-target card
  // is an empty feature rather than a feature you happen to be bad at.
  it('sizes Bulwark of Force by the Intelligence modifier, floored at one', () => {
    expect(bulwarkTargets(16)).toBe(3);
    expect(bulwarkTargets(20)).toBe(5);
    expect(bulwarkTargets(10)).toBe(1);
    expect(bulwarkTargets(8)).toBe(1);
  });
});

// The die-growth steps as PROGRESSION information — what the pool becomes — so a sheet can say
// it in words instead of tagging a feature with the level it was gained.
describe('nextPsionicDieStep', () => {
  it('names the next growth level and die', () => {
    expect(nextPsionicDieStep(3)).toEqual({ level: 5, die: 'd8' });
    expect(nextPsionicDieStep(4)).toEqual({ level: 5, die: 'd8' });
    expect(nextPsionicDieStep(5)).toEqual({ level: 11, die: 'd10' });
    expect(nextPsionicDieStep(11)).toEqual({ level: 17, die: 'd12' });
  });

  it('returns null once the die is at its maximum', () => {
    expect(nextPsionicDieStep(17)).toBeNull();
    expect(nextPsionicDieStep(20)).toBeNull();
  });

  // Whatever it reports must be the size psionicDie actually hands back at that level.
  it('agrees with psionicDie at the level it names', () => {
    for (const lvl of [3, 5, 11]) {
      const step = nextPsionicDieStep(lvl);
      expect(psionicDie(step.level)).toBe(step.die);
    }
  });
});
