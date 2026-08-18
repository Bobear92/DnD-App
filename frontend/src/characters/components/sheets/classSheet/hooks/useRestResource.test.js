import { describe, it, expect } from 'vitest';
import { useRestResource } from '@/characters/components/sheets/classSheet/hooks/useRestResource';

const RESOURCES = [
  { key: 'second_wind_used', label: 'Second Wind (Short Rest)', total: () => 1, recharge: 'short', minLevel: 1 },
  { key: 'action_surge_used', label: 'Action Surge (Short Rest)', total: (lvl) => (lvl >= 17 ? 2 : lvl >= 2 ? 1 : 0), recharge: 'short', minLevel: 2 },
  { key: 'indomitable_used', label: 'Indomitable (Long Rest)', total: (lvl) => (lvl >= 9 ? 1 : 0), recharge: 'long', minLevel: 9 },
];

describe('useRestResource', () => {
  it('filters out resources below their minLevel', () => {
    const rows = useRestResource({ resources: RESOURCES, level: 1, data: {} });
    expect(rows.map((r) => r.key)).toEqual(['second_wind_used']); // action surge L2, indomitable L9 excluded
  });

  it('resolves total via the level function and computes remaining', () => {
    const rows = useRestResource({ resources: RESOURCES, level: 17, data: { action_surge_used: 1 } });
    const surge = rows.find((r) => r.key === 'action_surge_used');
    expect(surge.total).toBe(2);
    expect(surge.used).toBe(1);
    expect(surge.remaining).toBe(1);
  });

  it('excludes resources whose total resolves to 0', () => {
    // A resource gated by minLevel but with a total() that returns 0 should not render.
    const rows = useRestResource({
      resources: [{ key: 'x', label: 'X', total: () => 0, recharge: 'short', minLevel: 1 }],
      level: 5,
      data: {},
    });
    expect(rows).toEqual([]);
  });

  it('clamps remaining at 0 when used exceeds total', () => {
    const rows = useRestResource({ resources: RESOURCES, level: 9, data: { indomitable_used: 5 } });
    const ind = rows.find((r) => r.key === 'indomitable_used');
    expect(ind.remaining).toBe(0);
  });

  // A subclass-gated resource (Arcane Archer's Arcane Shot uses) lets a subclass pool live in
  // the class config as data instead of a bespoke panel.
  describe('subclass gating', () => {
    const arcaneShot = {
      key: 'arcane_shot_used', label: 'Arcane Shot (Short Rest)', total: () => 2,
      recharge: 'short', minLevel: 3, subclass: 'Arcane Archer',
    };

    it('shows a subclass resource only to that subclass', () => {
      const rows = useRestResource({ resources: [arcaneShot], level: 3, data: { subclass: 'Arcane Archer' } });
      expect(rows.map((r) => r.key)).toEqual(['arcane_shot_used']);
      expect(rows[0].total).toBe(2);
    });

    it('hides it from another subclass and from a character with none', () => {
      expect(useRestResource({ resources: [arcaneShot], level: 3, data: { subclass: 'Champion' } })).toEqual([]);
      expect(useRestResource({ resources: [arcaneShot], level: 3, data: {} })).toEqual([]);
    });

    it('still honours minLevel for the matching subclass', () => {
      expect(useRestResource({ resources: [arcaneShot], level: 2, data: { subclass: 'Arcane Archer' } })).toEqual([]);
    });

    it('leaves un-gated resources visible to every subclass', () => {
      const rows = useRestResource({ resources: RESOURCES, level: 9, data: { subclass: 'Arcane Archer' } });
      expect(rows).toHaveLength(3);
    });
  });

  it('passes a resource description through to the row', () => {
    const rows = useRestResource({
      resources: [{ key: 'x', label: 'X', total: () => 1, recharge: 'short', description: 'Does the thing.' }],
      level: 1,
      data: {},
    });
    expect(rows[0].description).toBe('Does the thing.');
  });

  // A pool's NAME is not always constant either: the Psi Warrior's Psionic Energy die grows
  // d6 → d12 with level, and the die size is the thing the row is read for.
  describe('a label that varies with level', () => {
    const resource = {
      key: 'psi', total: () => 4, recharge: 'long',
      label: (level) => `Psionic Energy — d${level >= 5 ? 8 : 6}`,
    };

    it('resolves a function label against the level', () => {
      expect(useRestResource({ resources: [resource], level: 3, data: {} })[0].label)
        .toBe('Psionic Energy — d6');
      expect(useRestResource({ resources: [resource], level: 5, data: {} })[0].label)
        .toBe('Psionic Energy — d8');
    });

    it('leaves a plain string label untouched', () => {
      const rows = useRestResource({
        resources: [{ key: 'x', label: 'Second Wind', total: () => 1, recharge: 'short' }],
        level: 5, data: {},
      });
      expect(rows[0].label).toBe('Second Wind');
    });
  });

  // Not every pool is sized by level: the Cavalier's two pools hold ability-modifier uses,
  // so `total` receives a context alongside the level.
  describe('ability-derived totals', () => {
    const conUses = {
      key: 'warding_maneuver_used', label: 'Warding Maneuver', recharge: 'long',
      total: (_level, { scores = {} } = {}) => Math.max(1, Math.floor(((scores.constitution ?? 10) - 10) / 2)),
    };

    it('sizes the pool from the ability score, not the level', () => {
      const rows = useRestResource({ resources: [conUses], level: 7, data: {}, scores: { constitution: 16 } });
      expect(rows[0].total).toBe(3);
    });

    it('floors at one use for a negative or zero modifier, so the row never disappears', () => {
      const rows = useRestResource({ resources: [conUses], level: 7, data: {}, scores: { constitution: 8 } });
      expect(rows[0].total).toBe(1);
      expect(rows[0].remaining).toBe(1);
    });

    it('defaults to a score of 10 when no scores are supplied', () => {
      const rows = useRestResource({ resources: [conUses], level: 7, data: {} });
      expect(rows[0].total).toBe(1);
    });

    it('still subtracts spent uses from an ability-derived total', () => {
      const rows = useRestResource({
        resources: [conUses], level: 7, scores: { constitution: 18 },
        data: { warding_maneuver_used: 2 },
      });
      expect(rows[0]).toMatchObject({ total: 4, used: 2, remaining: 2 });
    });

    it('leaves a level-based total working unchanged', () => {
      const rows = useRestResource({
        resources: [{ key: 'y', label: 'Y', total: (level) => (level >= 5 ? 2 : 1), recharge: 'long' }],
        level: 5, data: {}, scores: { constitution: 20 },
      });
      expect(rows[0].total).toBe(2);
    });
  });
});
