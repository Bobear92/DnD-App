import { describe, it, expect } from 'vitest';
import {
  THIRD_CASTER_SLOTS,
  ekCantripsKnownAt,
  ekSpellsKnownAt,
  getSubclassCaster,
} from './subclassCasterData';

describe('THIRD_CASTER_SLOTS', () => {
  it('has 20 rows of 9 spell levels each', () => {
    expect(THIRD_CASTER_SLOTS).toHaveLength(20);
    for (const row of THIRD_CASTER_SLOTS) expect(row).toHaveLength(9);
  });

  it('grants no slots before L3 and 2×L1 at L3', () => {
    expect(THIRD_CASTER_SLOTS[0].every((n) => n === 0)).toBe(true);
    expect(THIRD_CASTER_SLOTS[1].every((n) => n === 0)).toBe(true);
    expect(THIRD_CASTER_SLOTS[2]).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('hits the PHB third-caster milestones (L7 2nd, L13 3rd, L19 4th; caps at 4th)', () => {
    expect(THIRD_CASTER_SLOTS[6]).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0]);
    expect(THIRD_CASTER_SLOTS[12]).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    expect(THIRD_CASTER_SLOTS[18]).toEqual([4, 3, 3, 1, 0, 0, 0, 0, 0]);
    expect(THIRD_CASTER_SLOTS[19]).toEqual([4, 3, 3, 1, 0, 0, 0, 0, 0]);
  });
});

describe('ekCantripsKnownAt / ekSpellsKnownAt', () => {
  it('cantrips: 0 below L3, 2 from L3, 3 from L10', () => {
    expect(ekCantripsKnownAt(2)).toBe(0);
    expect(ekCantripsKnownAt(3)).toBe(2);
    expect(ekCantripsKnownAt(9)).toBe(2);
    expect(ekCantripsKnownAt(10)).toBe(3);
    expect(ekCantripsKnownAt(20)).toBe(3);
  });

  it('spells known follow the PHB EK table', () => {
    expect(ekSpellsKnownAt(2)).toBe(0);
    expect(ekSpellsKnownAt(3)).toBe(3);
    expect(ekSpellsKnownAt(4)).toBe(4);
    expect(ekSpellsKnownAt(7)).toBe(5);
    expect(ekSpellsKnownAt(8)).toBe(6);
    expect(ekSpellsKnownAt(10)).toBe(7);
    expect(ekSpellsKnownAt(13)).toBe(9);
    expect(ekSpellsKnownAt(19)).toBe(12);
    expect(ekSpellsKnownAt(20)).toBe(13);
  });
});

describe('getSubclassCaster', () => {
  it('returns the EK known caster for both editions (2024 alias accepted)', () => {
    for (const ed of ['5e', '5.5e', '2024']) {
      const caster = getSubclassCaster('Fighter', ed, 'Eldritch Knight');
      expect(caster).toBeTruthy();
      expect(caster.kind).toBe('known');
      expect(caster.spellcastingAbility).toBe('intelligence');
      expect(caster.unlockLevel).toBe(3);
    }
  });

  it('level-gates when a level is passed', () => {
    expect(getSubclassCaster('Fighter', '5e', 'Eldritch Knight', 2)).toBeNull();
    expect(getSubclassCaster('Fighter', '5e', 'Eldritch Knight', 3)).toBeTruthy();
  });

  it('returns null for non-caster subclasses / classes / missing subclass', () => {
    expect(getSubclassCaster('Fighter', '5e', 'Champion')).toBeNull();
    expect(getSubclassCaster('Wizard', '5e', 'Eldritch Knight')).toBeNull();
    expect(getSubclassCaster('Fighter', '5e', undefined)).toBeNull();
  });

  it('slotsForLevel clamps out-of-range levels', () => {
    const caster = getSubclassCaster('Fighter', '5e', 'Eldritch Knight');
    expect(caster.slotsForLevel(0)).toEqual(THIRD_CASTER_SLOTS[0]);
    expect(caster.slotsForLevel(25)).toEqual(THIRD_CASTER_SLOTS[19]);
    expect(caster.slotsForLevel(7)[1]).toBe(2); // 2 × L2 slots at level 7
  });
});
