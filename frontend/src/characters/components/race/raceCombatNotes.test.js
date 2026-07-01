import { describe, it, expect } from 'vitest';
import {
  hasRaceTrait, hasSavageAttacks, hasRelentlessEndurance,
  SAVAGE_ATTACKS_NOTE, RELENTLESS_ENDURANCE_NOTE,
} from './raceCombatNotes';

describe('raceCombatNotes', () => {
  it('hasRaceTrait finds a string trait', () => {
    expect(hasRaceTrait(['Menacing', 'Savage Attacks'], 'Savage Attacks')).toBe(true);
    expect(hasRaceTrait(['Menacing'], 'Savage Attacks')).toBe(false);
  });

  it('hasRaceTrait tolerates an object trait form', () => {
    expect(hasRaceTrait([{ name: 'Savage Attacks' }], 'Savage Attacks')).toBe(true);
  });

  it('hasRaceTrait handles null/undefined traits', () => {
    expect(hasRaceTrait(null, 'Savage Attacks')).toBe(false);
    expect(hasRaceTrait(undefined, 'Savage Attacks')).toBe(false);
  });

  it('hasSavageAttacks / hasRelentlessEndurance detect Half-Orc traits', () => {
    const traits = ['Menacing', 'Savage Attacks', 'Relentless Endurance'];
    expect(hasSavageAttacks(traits)).toBe(true);
    expect(hasRelentlessEndurance(traits)).toBe(true);
    expect(hasSavageAttacks(['Darkvision'])).toBe(false);
    expect(hasRelentlessEndurance(['Darkvision'])).toBe(false);
  });

  it('exports note strings that name each trait', () => {
    expect(SAVAGE_ATTACKS_NOTE).toMatch(/Savage Attacks/);
    expect(RELENTLESS_ENDURANCE_NOTE).toMatch(/Relentless Endurance/);
  });
});
