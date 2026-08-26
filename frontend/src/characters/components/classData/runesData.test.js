import { describe, it, expect } from 'vitest';
import {
  RUNE_OPTIONS,
  runesKnownAtLevel,
  channelRuneUses,
  runeSaveDcParts,
  runeSaveDcBreakdown,
  getRuneOptions,
  MASTER_OF_RUNES_LEVEL,
} from '@/characters/components/classData/runesData';

describe('RUNE_OPTIONS', () => {
  it('holds the six TCoE runes', () => {
    expect(RUNE_OPTIONS.map((o) => o.name)).toEqual([
      'Cloud Rune', 'Fire Rune', 'Frost Rune', 'Stone Rune', 'Hill Rune', 'Storm Rune',
    ]);
  });

  it('gates Hill at level 7 and Storm at level 15, leaving the other four ungated', () => {
    const byName = Object.fromEntries(RUNE_OPTIONS.map((o) => [o.name, o]));
    expect(byName['Hill Rune'].minLevel).toBe(7);
    expect(byName['Storm Rune'].minLevel).toBe(15);
    for (const name of ['Cloud Rune', 'Fire Rune', 'Frost Rune', 'Stone Rune']) {
      expect(byName[name].minLevel).toBeUndefined();
    }
  });

  it('describes both halves of every rune — the passive and the Channel Rune effect', () => {
    for (const o of RUNE_OPTIONS) {
      expect(o.description).toMatch(/Passive:/);
      expect(o.description).toMatch(/Channel Rune/);
    }
  });
});

describe('runesKnownAtLevel', () => {
  it('returns 0 before level 3, then 2 / 3 / 4 / 5 at 3 / 7 / 10 / 15', () => {
    expect(runesKnownAtLevel(1)).toBe(0);
    expect(runesKnownAtLevel(2)).toBe(0);
    expect(runesKnownAtLevel(3)).toBe(2);
    expect(runesKnownAtLevel(6)).toBe(2);
    expect(runesKnownAtLevel(7)).toBe(3);
    expect(runesKnownAtLevel(9)).toBe(3);
    expect(runesKnownAtLevel(10)).toBe(4);
    expect(runesKnownAtLevel(14)).toBe(4);
    expect(runesKnownAtLevel(15)).toBe(5);
    expect(runesKnownAtLevel(20)).toBe(5);
  });
});

describe('channelRuneUses', () => {
  it('is one per rest until Master of Runes, then two', () => {
    expect(channelRuneUses(3)).toBe(1);
    expect(channelRuneUses(MASTER_OF_RUNES_LEVEL - 1)).toBe(1);
    expect(channelRuneUses(MASTER_OF_RUNES_LEVEL)).toBe(2);
    expect(channelRuneUses(20)).toBe(2);
  });
});

describe('runeSaveDcParts', () => {
  it('is 8 + proficiency bonus + CONSTITUTION modifier — not Intelligence', () => {
    // L5 → PB +3, CON 16 → +3
    expect(runeSaveDcParts(5, 16)).toEqual({ dc: 14, pb: 3, mod: 3 });
  });

  it('folds in a negative Constitution modifier', () => {
    expect(runeSaveDcParts(3, 8).dc).toBe(9); // 8 + 2 - 1
  });

  it('breaks down to the same total it displays', () => {
    const bd = runeSaveDcBreakdown(5, 16);
    expect(bd.total).toBe(runeSaveDcParts(5, 16).dc);
    expect(bd.parts.map((p) => p.label)).toEqual(['Base', 'Proficiency bonus', 'CON modifier']);
  });
});

describe('getRuneOptions', () => {
  it('returns the full options for known names, in canonical pool order', () => {
    expect(getRuneOptions(['Storm Rune', 'Cloud Rune']).map((o) => o.name))
      .toEqual(['Cloud Rune', 'Storm Rune']);
  });

  it('ignores unknown names and an empty list', () => {
    expect(getRuneOptions(['Not A Rune'])).toEqual([]);
    expect(getRuneOptions()).toEqual([]);
  });
});
