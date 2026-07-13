import { describe, it, expect } from 'vitest';
import {
  THIRD_CASTER_SLOTS,
  ekCantripsKnownAt,
  ekSpellsKnownAt,
  getSubclassCaster,
  ekAnySlotsAt,
  ekRestrictedSlotsAt,
  ekSpellSlots,
  ekSpellsInSlot,
  EK_SLOT_ANY,
  EK_SLOT_RESTRICTED,
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

describe('Eldritch Knight school restriction (5e only)', () => {
  const ek5e = getSubclassCaster('Fighter', '5e', 'Eldritch Knight');
  const ek2024 = getSubclassCaster('Fighter', '5.5e', 'Eldritch Knight');

  it('5e restricts spells to Abjuration & Evocation', () => {
    expect(ek5e.restrictedSchools).toEqual(['Abjuration', 'Evocation']);
    expect(ek5e.freeSchoolLevels).toEqual([3, 8, 14, 20]);
  });

  it('2024 has no school restriction', () => {
    expect(ek2024.restrictedSchools).toBeNull();
  });

  it('any-school slots accrue at levels 3, 8, 14, 20 — one at L3, four at L20', () => {
    expect(ekAnySlotsAt(2)).toBe(0);
    expect(ekAnySlotsAt(3)).toBe(1);
    expect(ekAnySlotsAt(7)).toBe(1);
    expect(ekAnySlotsAt(8)).toBe(2);
    expect(ekAnySlotsAt(13)).toBe(2);
    expect(ekAnySlotsAt(14)).toBe(3);
    expect(ekAnySlotsAt(19)).toBe(3);
    expect(ekAnySlotsAt(20)).toBe(4);
  });

  it('restricted slots are the rest of the known count (L3 = 2 restricted + 1 any of 3)', () => {
    expect(ekRestrictedSlotsAt(3)).toBe(2);
    expect(ekRestrictedSlotsAt(3) + ekAnySlotsAt(3)).toBe(ekSpellsKnownAt(3));
    expect(ekRestrictedSlotsAt(20)).toBe(9);
    expect(ekRestrictedSlotsAt(20) + ekAnySlotsAt(20)).toBe(ekSpellsKnownAt(20));
  });

  it('every level from 3 to 20 partitions the known spells into the two categories', () => {
    for (let l = 3; l <= 20; l++) {
      expect(ekRestrictedSlotsAt(l) + ekAnySlotsAt(l)).toBe(ekSpellsKnownAt(l));
    }
  });

  it('5e cantrips are permanent; 2024 may swap one per level; both swap one leveled spell', () => {
    expect(ek5e.cantripSwapPerLevel).toBe(0);
    expect(ek2024.cantripSwapPerLevel).toBe(1);
    expect(ek5e.leveledSwapPerLevel).toBe(1);
    expect(ek2024.leveledSwapPerLevel).toBe(1);
  });
});

describe('ekSpellSlots / ekSpellsInSlot', () => {
  it('reads the sidecar map off character_data (empty when absent)', () => {
    expect(ekSpellSlots({ ek_spell_slots: { Shield: 'any' } })).toEqual({ Shield: 'any' });
    expect(ekSpellSlots({})).toEqual({});
    expect(ekSpellSlots(null)).toEqual({});
  });

  it('splits the known list by recorded slot, NOT by the spell\'s actual school', () => {
    const known = ['Shield', 'Magic Missile', 'Fireball'];
    // Shield is an abjuration, but it was learned in the any-school slot — it stays there.
    const slots = { Shield: 'any', 'Magic Missile': 'restricted', Fireball: 'restricted' };
    expect(ekSpellsInSlot(known, slots, EK_SLOT_ANY)).toEqual(['Shield']);
    expect(ekSpellsInSlot(known, slots, EK_SLOT_RESTRICTED)).toEqual(['Magic Missile', 'Fireball']);
  });

  it('treats an unrecorded spell as restricted (the common case)', () => {
    expect(ekSpellsInSlot(['Shield'], {}, EK_SLOT_RESTRICTED)).toEqual(['Shield']);
    expect(ekSpellsInSlot(['Shield'], {}, EK_SLOT_ANY)).toEqual([]);
  });
});
