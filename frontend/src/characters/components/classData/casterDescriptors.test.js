import { describe, it, expect } from 'vitest';
import {
  CASTER_DESCRIPTORS,
  getCasterDescriptor,
} from '@/characters/components/classData/casterDescriptors';
import {
  validateCasterDescriptor,
  validateCasterDescriptorTable,
  CASTER_KINDS,
} from '@/characters/components/classData/configContracts';
import { SUPPORTED_CLASSES_5E } from '@/characters/components/sheets';

/**
 * Contract fixture for the caster-descriptor table (mirrors configContracts.test.js).
 *
 * Presence in CASTER_DESCRIPTORS is what switches a hand-written class sheet onto the unified
 * Spells-tab layout, so a malformed entry breaks that class's spells tab at runtime rather than at
 * import. These tests are the gate that keeps entry #13 honest — and, per the convention in the
 * sibling fixture, they also feed the validators deliberately-broken input so the guarantee is real
 * rather than decorative.
 */

const VALID = {
  className: 'Cleric',
  edition: '5e',
  kind: 'prepare',
  spellcastingAbility: 'wisdom',
  spellList: 'Cleric',
  slotsForLevel: () => [4, 3, 2, 0, 0, 0, 0, 0, 0],
  startsAtLevel: 1,
  listKey: 'prepared_spells',
  prepareLimit: (level, mod) => Math.max(1, level + mod),
};

describe('CASTER_DESCRIPTORS — the shipped table', () => {
  it('every entry satisfies the contract', () => {
    expect(validateCasterDescriptorTable(CASTER_DESCRIPTORS)).toEqual([]);
  });

  it('every descriptor names a class the app actually supports', () => {
    const unknown = CASTER_DESCRIPTORS
      .map((d) => d.className)
      .filter((c) => !SUPPORTED_CLASSES_5E.includes(c));
    expect(unknown).toEqual([]);
  });

  it('every slot table yields castable slots by the level casting starts', () => {
    CASTER_DESCRIPTORS.forEach((d) => {
      if (d.kind === 'pact') return;
      const row = d.slotsForLevel(d.startsAtLevel);
      expect(row.some((n) => n > 0), `${d.className}/${d.edition} has no slots at level ${d.startsAtLevel}`).toBe(true);
    });
  });

  it('slot counts never decrease as level rises', () => {
    CASTER_DESCRIPTORS.forEach((d) => {
      if (d.kind === 'pact') return;
      for (let l = 2; l <= 20; l += 1) {
        const prev = d.slotsForLevel(l - 1).reduce((a, b) => a + b, 0);
        const cur = d.slotsForLevel(l).reduce((a, b) => a + b, 0);
        expect(cur, `${d.className}/${d.edition} lost slots going from level ${l - 1} to ${l}`)
          .toBeGreaterThanOrEqual(prev);
      }
    });
  });
});

describe('getCasterDescriptor', () => {
  it('finds a converted class by name + edition', () => {
    const d = getCasterDescriptor('Cleric', '5e');
    expect(d).toMatchObject({ className: 'Cleric', edition: '5e', kind: 'prepare' });
  });

  it('returns null for a class whose sheet has not been converted yet', () => {
    // Presence is the fold switch — an unconverted class MUST return null, or CharacterDetail
    // hands its sheet folded racial/feat props it ignores and those spells vanish from the tab.
    expect(getCasterDescriptor('Bard', '5e')).toBeNull();
  });

  it('returns null for the wrong edition of a converted class', () => {
    expect(getCasterDescriptor('Cleric', '5.5e')).toBeNull();
  });

  it('returns null for an unknown class and for no class', () => {
    expect(getCasterDescriptor('Nonesuch', '5e')).toBeNull();
    expect(getCasterDescriptor(undefined, '5e')).toBeNull();
  });
});

describe('validateCasterDescriptor — rejects broken entries', () => {
  it('accepts a well-formed descriptor', () => {
    expect(validateCasterDescriptor(VALID)).toEqual([]);
  });

  it('rejects a non-object', () => {
    expect(validateCasterDescriptor(null)).toHaveLength(1);
  });

  it.each([
    ['className', { className: 42 }],
    ['edition', { edition: '6e' }],
    ['kind', { kind: 'telepathy' }],
    ['spellcastingAbility', { spellcastingAbility: null }],
    ['spellList', { spellList: '' }],
    ['listKey', { listKey: undefined }],
    ['startsAtLevel', { startsAtLevel: 0 }],
  ])('rejects a bad %s', (field, override) => {
    const errs = validateCasterDescriptor({ ...VALID, ...override });
    expect(errs.join(' ')).toContain(field);
  });

  it('rejects a slot row of the wrong width', () => {
    const errs = validateCasterDescriptor({ ...VALID, slotsForLevel: () => [1, 2, 3] });
    expect(errs.join(' ')).toMatch(/slot array/);
  });

  it('rejects negative slot counts', () => {
    const errs = validateCasterDescriptor({ ...VALID, slotsForLevel: () => [-1, 0, 0, 0, 0, 0, 0, 0, 0] });
    expect(errs.join(' ')).toMatch(/non-negative/);
  });

  it('rejects a slotsForLevel that throws', () => {
    const errs = validateCasterDescriptor({
      ...VALID,
      slotsForLevel: () => { throw new Error('boom'); },
    });
    expect(errs.join(' ')).toMatch(/threw: boom/);
  });

  it("requires prepareLimit for kind 'prepare'", () => {
    const { prepareLimit, ...noLimit } = VALID;
    expect(validateCasterDescriptor(noLimit).join(' ')).toMatch(/prepareLimit is required/);
  });

  it("does not require prepareLimit for kind 'known'", () => {
    const { prepareLimit, ...rest } = VALID;
    expect(validateCasterDescriptor({ ...rest, kind: 'known' })).toEqual([]);
  });

  it('rejects a prepareLimit that returns a non-positive value', () => {
    const errs = validateCasterDescriptor({ ...VALID, prepareLimit: () => 0 });
    expect(errs.join(' ')).toMatch(/prepareLimit/);
  });

  it('rejects a non-boolean cantripPicker', () => {
    const errs = validateCasterDescriptor({ ...VALID, cantripPicker: 'yes' });
    expect(errs.join(' ')).toMatch(/cantripPicker/);
  });

  it('accepts a 5-wide half-caster slot row', () => {
    expect(validateCasterDescriptor({ ...VALID, slotsForLevel: () => [4, 3, 2, 0, 0] })).toEqual([]);
  });

  it("accepts a pact [count, level] row for kind 'pact'", () => {
    const { prepareLimit, ...rest } = VALID;
    expect(validateCasterDescriptor({ ...rest, kind: 'pact', slotsForLevel: () => [2, 3] })).toEqual([]);
  });

  it("rejects a per-level slot row for kind 'pact'", () => {
    const { prepareLimit, ...rest } = VALID;
    const errs = validateCasterDescriptor({ ...rest, kind: 'pact', slotsForLevel: () => [4, 3, 2, 0, 0, 0, 0, 0, 0] });
    expect(errs.join(' ')).toMatch(/\[slotCount, slotLevel\]/);
  });

  it('exposes the kind vocabulary the sheets branch on', () => {
    expect(CASTER_KINDS).toEqual(['prepare', 'known', 'pact', 'spellbook']);
  });
});

describe('validateCasterDescriptorTable', () => {
  it('rejects a non-array', () => {
    expect(validateCasterDescriptorTable({})).toEqual(['CASTER_DESCRIPTORS: not an array']);
  });

  it('flags a duplicate class + edition pair', () => {
    const errs = validateCasterDescriptorTable([VALID, { ...VALID }]);
    expect(errs.join(' ')).toMatch(/duplicate descriptor/);
  });

  it('allows the same class in both editions', () => {
    expect(validateCasterDescriptorTable([VALID, { ...VALID, edition: '5.5e' }])).toEqual([]);
  });

  it('locates a broken entry by class and edition', () => {
    const errs = validateCasterDescriptorTable([{ ...VALID, kind: 'nope' }]);
    expect(errs.join(' ')).toContain('Cleric/5e');
  });
});
