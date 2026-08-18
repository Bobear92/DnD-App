import { describe, it, expect } from 'vitest';
import { getClassConfig } from '@/characters/components/sheets/classSheet/configs';
import { FIGHTER_5E, FIGHTER_2024 } from '@/characters/components/sheets/classSheet/configs/fighter';
import { WIZARD_5E, WIZARD_2024 } from '@/characters/components/sheets/classSheet/configs/wizard';

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

  describe('Echo Knight pools', () => {
    const pool = (key) => FIGHTER_5E.restResources.find((r) => r.key === key);

    it('are gated to the Echo Knight subclass, so no other Fighter sees them', () => {
      for (const key of ['unleash_incarnation_used', 'shadow_martyr_used', 'reclaim_potential_used']) {
        expect(pool(key).subclass).toBe('Echo Knight');
      }
    });

    it('unlock at the level the feature does', () => {
      expect(pool('unleash_incarnation_used').minLevel).toBe(3);
      expect(pool('shadow_martyr_used').minLevel).toBe(10);
      expect(pool('reclaim_potential_used').minLevel).toBe(15);
    });

    it('size the CON-modifier pools off the score, floored at one use', () => {
      // RAW is "equal to your Constitution modifier (minimum once)" — a dump-stat Echo Knight
      // still gets the feature rather than an empty tracker.
      const uses = (key, constitution) => pool(key).total(20, { scores: { constitution } });
      expect(uses('unleash_incarnation_used', 16)).toBe(3);
      expect(uses('unleash_incarnation_used', 8)).toBe(1);
      expect(uses('reclaim_potential_used', 20)).toBe(5);
      expect(uses('reclaim_potential_used', 10)).toBe(1);
    });

    it('gives Shadow Martyr a single use that comes back on a SHORT rest', () => {
      // The only Echo Knight pool that isn't long-rest — and a recharge the feature text
      // used to omit entirely.
      expect(pool('shadow_martyr_used').total(20, { scores: {} })).toBe(1);
      expect(pool('shadow_martyr_used').recharge).toBe('short');
      expect(pool('unleash_incarnation_used').recharge).toBe('long');
      expect(pool('reclaim_potential_used').recharge).toBe('long');
    });
  });

  describe('Psi Warrior pools', () => {
    const pool = (key) => FIGHTER_5E.restResources.find((r) => r.key === key);
    const KEYS = [
      'psionic_energy_used', 'psionic_energy_regain_used', 'telekinetic_movement_used',
      'psi_powered_leap_used', 'bulwark_of_force_used',
    ];

    it('are gated to the Psi Warrior subclass, so no other Fighter sees them', () => {
      for (const key of KEYS) expect(pool(key).subclass).toBe('Psi Warrior');
    });

    it('unlock at the level the feature does', () => {
      expect(pool('psionic_energy_used').minLevel).toBe(3);
      expect(pool('psionic_energy_regain_used').minLevel).toBe(3);
      expect(pool('telekinetic_movement_used').minLevel).toBe(3);
      expect(pool('psi_powered_leap_used').minLevel).toBe(7);
      expect(pool('bulwark_of_force_used').minLevel).toBe(15);
    });

    // One pool, many consumers: the dice are spent by Psionic Strike, Protective Field and
    // Guarded Mind alike, so there is a SINGLE row rather than one per feature.
    it('sizes the Psionic Energy pool at twice the proficiency bonus', () => {
      const uses = (level) => pool('psionic_energy_used').total(level, { scores: {} });
      expect(uses(3)).toBe(4);
      expect(uses(9)).toBe(8);
      expect(uses(17)).toBe(12);
    });

    // The stored feature blurb says a flat "d6s" in both editions; the label is a function of
    // level precisely so the row shows the die the character actually rolls.
    it('names the die in a label that scales with level', () => {
      const label = (level) => pool('psionic_energy_used').label(level, { scores: {} });
      expect(label(3)).toMatch(/d6/);
      expect(label(5)).toMatch(/d8/);
      expect(label(17)).toMatch(/d12/);
    });

    it('splits the charges across both rest types the way RAW does', () => {
      // The pool is long-rest only; the bonus-action regain and the free Telekinetic Movement
      // come back on a short rest, which is the distinction the whole split exists for.
      expect(pool('psionic_energy_used').recharge).toBe('long');
      expect(pool('psionic_energy_regain_used').recharge).toBe('short');
      expect(pool('telekinetic_movement_used').recharge).toBe('short');
      expect(pool('psi_powered_leap_used').recharge).toBe('long');
      expect(pool('bulwark_of_force_used').recharge).toBe('long');
    });

    it('gives every once-per-rest charge exactly one use', () => {
      for (const key of KEYS.slice(1)) {
        expect(pool(key).total(20, { scores: {} })).toBe(1);
      }
    });

    // A player can never restore a resource in this app, so the regain row must say who can
    // rather than implying the button hands a die back.
    it('tells the player the GM restores the regained die', () => {
      expect(pool('psionic_energy_regain_used').description).toMatch(/GM/);
    });
  });
});
