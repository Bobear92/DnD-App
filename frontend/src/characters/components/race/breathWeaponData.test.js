import { describe, it, expect } from 'vitest';
import {
  breathWeaponDamage, breathWeaponSaveAbility, breathWeaponSaveDc,
  breathWeaponSaveDcParts, getBreathWeapon,
} from '@/characters/components/race/breathWeaponData';

const RED = { name: 'Red', damage: 'Fire', breath: '15 ft cone' };
const WHITE = { name: 'White', damage: 'Cold', breath: '15 ft cone' };
const BLACK = { name: 'Black', damage: 'Acid', breath: '5×30 ft line' };

describe('breathWeaponDamage', () => {
  it('scales at 6th, 11th and 16th level', () => {
    expect(breathWeaponDamage(1)).toBe('2d6');
    expect(breathWeaponDamage(5)).toBe('2d6');
    expect(breathWeaponDamage(6)).toBe('3d6');
    expect(breathWeaponDamage(10)).toBe('3d6');
    expect(breathWeaponDamage(11)).toBe('4d6');
    expect(breathWeaponDamage(15)).toBe('4d6');
    expect(breathWeaponDamage(16)).toBe('5d6');
    expect(breathWeaponDamage(20)).toBe('5d6');
  });

  it('defaults to the level-1 die for a missing level', () => {
    expect(breathWeaponDamage()).toBe('2d6');
  });
});

describe('breathWeaponSaveAbility', () => {
  // Per the PHB ancestry table, the save tracks the damage type across all ten dragons.
  it('is DEX for acid, lightning and fire', () => {
    expect(breathWeaponSaveAbility('Acid')).toBe('DEX');
    expect(breathWeaponSaveAbility('Lightning')).toBe('DEX');
    expect(breathWeaponSaveAbility('Fire')).toBe('DEX');
  });

  it('is CON for poison and cold', () => {
    expect(breathWeaponSaveAbility('Poison')).toBe('CON');
    expect(breathWeaponSaveAbility('Cold')).toBe('CON');
  });

  it('falls back to DEX for an unknown or missing type', () => {
    expect(breathWeaponSaveAbility(null)).toBe('DEX');
    expect(breathWeaponSaveAbility('Radiant')).toBe('DEX');
  });
});

describe('breathWeaponSaveDc', () => {
  it('is 8 + CON modifier + proficiency bonus', () => {
    // L1 (PB 2), CON 16 (+3) → 8 + 2 + 3 = 13
    expect(breathWeaponSaveDc(1, 16)).toBe(13);
    // L9 (PB 4), CON 16 (+3) → 8 + 4 + 3 = 15
    expect(breathWeaponSaveDc(9, 16)).toBe(15);
  });

  it('handles a negative modifier', () => {
    // L1 (PB 2), CON 8 (−1) → 8 + 2 − 1 = 9
    expect(breathWeaponSaveDc(1, 8)).toBe(9);
  });

  it('exposes the parts so a surface can show the math', () => {
    expect(breathWeaponSaveDcParts(9, 16)).toEqual({ dc: 15, pb: 4, mod: 3 });
  });
});

describe('getBreathWeapon', () => {
  it('returns null without the Breath Weapon trait', () => {
    expect(getBreathWeapon({ raceTraits: ['Darkvision'], draconicAncestry: RED, level: 5 })).toBeNull();
    expect(getBreathWeapon({})).toBeNull();
  });

  it('resolves a level-6 red Dragonborn', () => {
    const bw = getBreathWeapon({
      raceTraits: ['Draconic Ancestry', 'Breath Weapon'],
      draconicAncestry: RED,
      level: 6,
      constitutionScore: 16,
    });
    expect(bw.damage).toBe('3d6');
    expect(bw.damageType).toBe('Fire');
    expect(bw.shape).toBe('15 ft cone');
    expect(bw.saveAbility).toBe('DEX');
    expect(bw.saveDc).toBe(14); // 8 + PB 3 + CON 3
    expect(bw.summary).toContain('15 ft cone');
    expect(bw.summary).toContain('DC 14 DEX save');
    expect(bw.summary).toContain('3d6 fire damage');
  });

  it('uses a CON save for a cold breath', () => {
    const bw = getBreathWeapon({
      raceTraits: ['Breath Weapon'], draconicAncestry: WHITE, level: 1, constitutionScore: 14,
    });
    expect(bw.saveAbility).toBe('CON');
    expect(bw.summary).toContain('DC 12 CON save');
  });

  it('reads the line shape from the ancestry', () => {
    const bw = getBreathWeapon({
      raceTraits: ['Breath Weapon'], draconicAncestry: BLACK, level: 11, constitutionScore: 10,
    });
    expect(bw.shape).toBe('5×30 ft line');
    expect(bw.summary).toContain('in a 5×30 ft line');
    expect(bw.summary).toContain('4d6 acid damage');
  });

  it('degrades to a generic area when no ancestry is stored', () => {
    // Damage and DC don't depend on the ancestry, so the feature stays useful rather than vanishing.
    const bw = getBreathWeapon({
      raceTraits: ['Breath Weapon'], draconicAncestry: null, level: 16, constitutionScore: 16,
    });
    expect(bw.damage).toBe('5d6');
    expect(bw.damageType).toBeNull();
    expect(bw.shape).toBeNull();
    expect(bw.summary).toContain('in a line or cone');
    expect(bw.summary).toContain('5d6 damage');
  });
});
