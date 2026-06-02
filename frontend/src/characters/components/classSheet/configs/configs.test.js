import { describe, it, expect } from 'vitest';
import { getClassConfig } from './index.jsx';
import { FIGHTER_5E, FIGHTER_2024 } from './fighter';
import { WIZARD_5E, WIZARD_2024 } from './wizard';

const ALL = [FIGHTER_5E, FIGHTER_2024, WIZARD_5E, WIZARD_2024];

describe('class configs — validity', () => {
  it('getClassConfig returns the right config per class+edition', () => {
    expect(getClassConfig('Fighter', '5e')).toBe(FIGHTER_5E);
    expect(getClassConfig('Fighter', '5.5e')).toBe(FIGHTER_2024);
    expect(getClassConfig('Wizard', '5e')).toBe(WIZARD_5E);
    expect(getClassConfig('Wizard', '5.5e')).toBe(WIZARD_2024);
  });

  it('returns null for unsupported class/edition', () => {
    expect(getClassConfig('Barbarian', '5e')).toBeNull();
    expect(getClassConfig('Fighter', '99e')).toBeNull();
  });

  it('every config exposes the required fields', () => {
    for (const c of ALL) {
      expect(typeof c.className).toBe('string');
      expect(typeof c.hitDie).toBe('number');
      expect(c.features).toBeTruthy();
      expect(c.subclass).toBeTruthy();
      expect(typeof c.subclass.unlockLevel).toBe('number');
      expect(Array.isArray(c.subclass.options)).toBe(true);
      expect(Array.isArray(c.asiLevels)).toBe(true);
      expect(Array.isArray(c.skill.allowed)).toBe(true);
      expect(typeof c.skill.count).toBe('number');
    }
  });

  it('Fighter is a martial class (no caster); Wizard is a full caster', () => {
    expect(FIGHTER_5E.caster).toBeNull();
    expect(FIGHTER_2024.caster).toBeNull();
    expect(WIZARD_5E.caster).toBeTruthy();
    expect(typeof WIZARD_5E.caster.slotsForLevel).toBe('function');
    expect(WIZARD_5E.caster.slotsForLevel(1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(WIZARD_5E.caster.arcaneRecovery).toBe(true);
  });

  it('Fighter rest resources cover Second Wind / Action Surge / Indomitable', () => {
    const keys = FIGHTER_5E.restResources.map((r) => r.key);
    expect(keys).toContain('second_wind_used');
    expect(keys).toContain('action_surge_used');
    expect(keys).toContain('indomitable_used');
  });
});
