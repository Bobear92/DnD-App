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
});
