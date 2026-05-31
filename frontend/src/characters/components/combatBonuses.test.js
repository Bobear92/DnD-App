import { describe, it, expect } from 'vitest';
import { isDraconicSorcerer, getHpBonuses, totalHpBonus, getAcOptions } from './combatBonuses';

describe('isDraconicSorcerer', () => {
  it('true for 5e Draconic Bloodline', () => {
    expect(isDraconicSorcerer('Sorcerer', 'Draconic Bloodline')).toBe(true);
  });
  it('true for 2024 Draconic Sorcery', () => {
    expect(isDraconicSorcerer('Sorcerer', 'Draconic Sorcery')).toBe(true);
  });
  it('false for other Sorcerer subclasses', () => {
    expect(isDraconicSorcerer('Sorcerer', 'Wild Magic')).toBe(false);
  });
  it('false for non-Sorcerer classes', () => {
    expect(isDraconicSorcerer('Wizard', 'Draconic Bloodline')).toBe(false);
  });
  it('false when no subclass', () => {
    expect(isDraconicSorcerer('Sorcerer', undefined)).toBe(false);
  });
});

describe('getHpBonuses', () => {
  it('returns Draconic Resilience scaling with level', () => {
    const b = getHpBonuses({ charClass: 'Sorcerer', subclass: 'Draconic Bloodline', level: 5 });
    expect(b).toHaveLength(1);
    expect(b[0].source).toBe('Draconic Resilience');
    expect(b[0].amount).toBe(5);
  });
  it('returns Dwarven Toughness for Hill Dwarf trait', () => {
    const b = getHpBonuses({ charClass: 'Fighter', raceTraits: ['Dwarven Toughness'], level: 3 });
    expect(b).toHaveLength(1);
    expect(b[0].source).toBe('Dwarven Toughness');
    expect(b[0].amount).toBe(3);
  });
  it('stacks Draconic Resilience and Dwarven Toughness', () => {
    const b = getHpBonuses({ charClass: 'Sorcerer', subclass: 'Draconic Sorcery', raceTraits: ['Dwarven Toughness'], level: 4 });
    expect(b).toHaveLength(2);
    expect(totalHpBonus({ charClass: 'Sorcerer', subclass: 'Draconic Sorcery', raceTraits: ['Dwarven Toughness'], level: 4 })).toBe(8);
  });
  it('returns empty for a plain Wizard', () => {
    expect(getHpBonuses({ charClass: 'Wizard', subclass: 'School of Evocation', level: 10 })).toEqual([]);
  });
});

describe('getAcOptions', () => {
  it('Barbarian unarmored defense = 10 + DEX + CON', () => {
    const o = getAcOptions({ charClass: 'Barbarian', scores: { dexterity: 16, constitution: 14 } });
    expect(o).toHaveLength(1);
    expect(o[0].source).toBe('Unarmored Defense');
    expect(o[0].value).toBe(10 + 3 + 2);
  });
  it('Monk unarmored defense = 10 + DEX + WIS', () => {
    const o = getAcOptions({ charClass: 'Monk', scores: { dexterity: 14, wisdom: 16 } });
    expect(o[0].value).toBe(10 + 2 + 3);
  });
  it('Draconic Resilience = 13 + DEX', () => {
    const o = getAcOptions({ charClass: 'Sorcerer', subclass: 'Draconic Bloodline', scores: { dexterity: 14 } });
    expect(o).toHaveLength(1);
    expect(o[0].source).toBe('Draconic Resilience');
    expect(o[0].value).toBe(13 + 2);
  });
  it('defaults missing scores to 10 (mod 0)', () => {
    const o = getAcOptions({ charClass: 'Barbarian', scores: {} });
    expect(o[0].value).toBe(10);
  });
  it('returns empty for a non-AC class', () => {
    expect(getAcOptions({ charClass: 'Wizard', scores: { dexterity: 14 } })).toEqual([]);
  });
});
