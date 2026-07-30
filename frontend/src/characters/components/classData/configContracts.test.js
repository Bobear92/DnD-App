import { describe, it, expect } from 'vitest';
import {
  validateClassConfig,
  validateLevelChoice,
  validateSubclassGrant,
  validateSubclassCaster,
  validateClassConfigRegistry,
  validateLevelChoicesTable,
  validateSubclassGrantsTable,
  validateSubclassCastersTable,
} from '@/characters/components/classData/configContracts';
import { CONFIGS } from '@/characters/components/sheets/classSheet/configs';
import { FIGHTER_5E } from '@/characters/components/sheets/classSheet/configs/fighter';
import { WIZARD_5E } from '@/characters/components/sheets/classSheet/configs/wizard';
import { LEVEL_CHOICES } from '@/characters/components/classData/levelChoicesData';
import { SUBCLASS_GRANTS } from '@/characters/components/classData/subclassGrants';
import { SUBCLASS_CASTERS } from '@/characters/components/classData/subclassCasterData';

// A minimal, hand-built valid instance of each shape — the negative tests mutate a clone of one.
const VALID_LEVEL_CHOICE = {
  key: 'x', label: 'X', storeField: 'x',
  knownAtLevel: (l) => (l >= 3 ? 2 : 0),
  pool: [{ name: 'A', description: 'does a thing' }],
};
const VALID_GRANT = {
  level: 3, key: 'g', label: 'G', count: 1, storeField: 'g',
  options: [{ value: 'A' }], heldFrom: () => [], surface: 'sheet',
};
const VALID_CASTER = SUBCLASS_CASTERS.Fighter['5e']['Eldritch Knight'];

describe('config contracts — the real tables validate clean', () => {
  it('class config registry (getClassConfig) has no contract violations', () => {
    expect(validateClassConfigRegistry(CONFIGS)).toEqual([]);
  });
  it('LEVEL_CHOICES has no contract violations', () => {
    expect(validateLevelChoicesTable(LEVEL_CHOICES)).toEqual([]);
  });
  it('SUBCLASS_GRANTS has no contract violations', () => {
    expect(validateSubclassGrantsTable(SUBCLASS_GRANTS)).toEqual([]);
  });
  it('SUBCLASS_CASTERS has no contract violations', () => {
    expect(validateSubclassCastersTable(SUBCLASS_CASTERS)).toEqual([]);
  });
});

describe('config contracts — validators reject malformed input', () => {
  it('class config: rejects a missing hit die', () => {
    const errs = validateClassConfig({ ...FIGHTER_5E, hitDie: undefined });
    expect(errs.some((m) => m.includes('hitDie'))).toBe(true);
  });

  it('class config: rejects an unknown edition', () => {
    const errs = validateClassConfig({ ...FIGHTER_5E, edition: '3.5e' });
    expect(errs.some((m) => m.includes('edition'))).toBe(true);
  });

  it('class config: rejects a caster whose slot table is the wrong width', () => {
    const broken = { ...WIZARD_5E, caster: { ...WIZARD_5E.caster, slotsForLevel: () => [1, 2, 3] } };
    const errs = validateClassConfig(broken);
    expect(errs.some((m) => m.includes('slotsForLevel'))).toBe(true);
  });

  it('class config: rejects a rest resource with a non-function total', () => {
    const broken = { ...FIGHTER_5E, restResources: [{ ...FIGHTER_5E.restResources[0], total: 1 }] };
    const errs = validateClassConfig(broken);
    expect(errs.some((m) => m.includes('total'))).toBe(true);
  });

  it('class config: rejects a subclass unlock level outside 1..20', () => {
    const broken = { ...FIGHTER_5E, subclass: { ...FIGHTER_5E.subclass, unlockLevel: 0 } };
    const errs = validateClassConfig(broken);
    expect(errs.some((m) => m.includes('unlockLevel'))).toBe(true);
  });

  it('registry: rejects a config filed under the wrong class/edition key', () => {
    const errs = validateClassConfigRegistry({ '5e': { Wizard: FIGHTER_5E } });
    expect(errs.some((m) => m.includes('does not match registry key'))).toBe(true);
  });

  it('registry: rejects an unexpected edition key', () => {
    const errs = validateClassConfigRegistry({ '2024': { Fighter: FIGHTER_5E } });
    expect(errs.some((m) => m.includes("unexpected edition key '2024'"))).toBe(true);
  });

  it('level choice: rejects an empty pool', () => {
    const errs = validateLevelChoice({ ...VALID_LEVEL_CHOICE, pool: [] });
    expect(errs.some((m) => m.includes('pool'))).toBe(true);
  });

  it('level choice: rejects a non-monotonic knownAtLevel', () => {
    const errs = validateLevelChoice({ ...VALID_LEVEL_CHOICE, knownAtLevel: (l) => (l >= 5 ? 1 : 3) });
    expect(errs.some((m) => m.includes('non-decreasing'))).toBe(true);
  });

  it('level choice: rejects a pool entry missing a name', () => {
    const errs = validateLevelChoice({ ...VALID_LEVEL_CHOICE, pool: [{ description: 'no name' }] });
    expect(errs.some((m) => m.includes('name'))).toBe(true);
  });

  it('subclass grant: rejects count < 1 and a bad surface', () => {
    const errs = validateSubclassGrant({ ...VALID_GRANT, count: 0, surface: 'popup' });
    expect(errs.some((m) => m.includes('count'))).toBe(true);
    expect(errs.some((m) => m.includes('surface'))).toBe(true);
  });

  it('subclass grant: rejects an option missing value and a non-function heldFrom', () => {
    const errs = validateSubclassGrant({ ...VALID_GRANT, options: [{ label: 'x' }], heldFrom: [] });
    expect(errs.some((m) => m.includes('value'))).toBe(true);
    expect(errs.some((m) => m.includes('heldFrom'))).toBe(true);
  });

  it('subclass caster: rejects a wrong-width slot row and a missing spellsKnownAt', () => {
    const errs = validateSubclassCaster({ ...VALID_CASTER, slotsForLevel: () => [1], spellsKnownAt: undefined });
    expect(errs.some((m) => m.includes('slotsForLevel'))).toBe(true);
    expect(errs.some((m) => m.includes('spellsKnownAt'))).toBe(true);
  });

  it('validators never throw on garbage and always return an array', () => {
    for (const fn of [validateClassConfig, validateLevelChoice, validateSubclassGrant, validateSubclassCaster]) {
      expect(Array.isArray(fn(null))).toBe(true);
      expect(fn(null).length).toBeGreaterThan(0);
      expect(Array.isArray(fn({}))).toBe(true);
    }
    for (const fn of [validateClassConfigRegistry, validateLevelChoicesTable, validateSubclassGrantsTable, validateSubclassCastersTable]) {
      expect(Array.isArray(fn(null))).toBe(true);
      expect(fn(null).length).toBeGreaterThan(0);
    }
  });
});
