import { describe, it, expect } from 'vitest';
import {
  ARCANE_SHOT_OPTIONS, ARCANE_SHOT_USES,
  arcaneShotKnownAtLevel, arcaneShotImproved, arcaneShotSaveDc, arcaneShotSaveDcBreakdown,
  getArcaneShotOptions, isArcaneShotBow,
} from '@/characters/components/classData/arcaneShotData';

describe('arcaneShotData', () => {
  it('has the 8 XGE Arcane Shot options', () => {
    expect(ARCANE_SHOT_OPTIONS).toHaveLength(8);
    expect(ARCANE_SHOT_OPTIONS.map((o) => o.name)).toEqual([
      'Banishing Arrow', 'Beguiling Arrow', 'Bursting Arrow', 'Enfeebling Arrow',
      'Grasping Arrow', 'Piercing Arrow', 'Seeking Arrow', 'Shadow Arrow',
    ]);
  });

  it('every option carries a description and a distinct 18th-level version of it', () => {
    for (const o of ARCANE_SHOT_OPTIONS) {
      expect(o.description.length).toBeGreaterThan(20);
      // The improved text is the WHOLE option, not a trailing clause — so it must read as a
      // full description and must actually differ from the base one.
      expect(o.improvedDescription.length).toBeGreaterThan(20);
      expect(o.improvedDescription).not.toBe(o.description);
    }
  });

  // The upgrade is a substitution ON the description, so the base text can never survive into
  // the improved one — the bug this shape exists to prevent is a card showing both dice.
  it('writes the upgraded dice into the option text instead of appending a clause', () => {
    const byName = Object.fromEntries(ARCANE_SHOT_OPTIONS.map((o) => [o.name, o]));
    expect(byName['Bursting Arrow'].improvedDescription).toMatch(/each take 4d6 force damage/);
    expect(byName['Bursting Arrow'].improvedDescription).not.toMatch(/2d6/);
    expect(byName['Bursting Arrow'].improvedDescription).not.toMatch(/increases to/);
    // Grasping Arrow upgrades two separate 2d6 damages — both must move.
    expect(byName['Grasping Arrow'].improvedDescription).toMatch(/4d6 poison damage/);
    expect(byName['Grasping Arrow'].improvedDescription).toMatch(/4d6 slashing damage/);
    expect(byName['Grasping Arrow'].improvedDescription).not.toMatch(/2d6/);
    expect(byName['Piercing Arrow'].improvedDescription).toMatch(/extra 2d6 piercing damage/);
    // Banishing Arrow deals no damage at all until 18th level, so its upgrade ADDS a sentence.
    expect(byName['Banishing Arrow'].description).not.toMatch(/damage/);
    expect(byName['Banishing Arrow'].improvedDescription).toMatch(/also deals 2d6 force damage/);
  });

  it('drops the authoring-only substitution fields from the resolved options', () => {
    for (const o of ARCANE_SHOT_OPTIONS) {
      expect(o).not.toHaveProperty('improvedDice');
      expect(o).not.toHaveProperty('improvedText');
      expect(o).not.toHaveProperty('improvement');
    }
  });

  it('knows 2 options from level 3, gaining one at 7, 10, 15 and 18', () => {
    expect(arcaneShotKnownAtLevel(1)).toBe(0);
    expect(arcaneShotKnownAtLevel(2)).toBe(0);
    expect(arcaneShotKnownAtLevel(3)).toBe(2);
    expect(arcaneShotKnownAtLevel(6)).toBe(2);
    expect(arcaneShotKnownAtLevel(7)).toBe(3);
    expect(arcaneShotKnownAtLevel(9)).toBe(3);
    expect(arcaneShotKnownAtLevel(10)).toBe(4);
    expect(arcaneShotKnownAtLevel(14)).toBe(4);
    expect(arcaneShotKnownAtLevel(15)).toBe(5);
    expect(arcaneShotKnownAtLevel(17)).toBe(5);
    expect(arcaneShotKnownAtLevel(18)).toBe(6);
    expect(arcaneShotKnownAtLevel(20)).toBe(6);
  });

  // RAW is a flat two uses — the subclass blurb's "one more use at 10th level" was wrong.
  it('grants a flat two uses at every level', () => {
    expect(ARCANE_SHOT_USES).toBe(2);
  });

  it('improves the options only from level 18', () => {
    expect(arcaneShotImproved(17)).toBe(false);
    expect(arcaneShotImproved(18)).toBe(true);
    expect(arcaneShotImproved(20)).toBe(true);
  });

  it('computes the save DC as 8 + proficiency bonus + Intelligence modifier', () => {
    expect(arcaneShotSaveDc(3, 10)).toBe(10); // 8 + 2 + 0
    expect(arcaneShotSaveDc(3, 16)).toBe(13); // 8 + 2 + 3
    expect(arcaneShotSaveDc(17, 16)).toBe(17); // 8 + 6 + 3
    expect(arcaneShotSaveDc(5, 8)).toBe(10); // 8 + 3 + (-1)
  });

  it('breaks the save DC into base + proficiency + Intelligence, totalling the same number', () => {
    const b = arcaneShotSaveDcBreakdown(17, 18); // 8 + 6 + 4
    expect(b.total).toBe(18);
    expect(b.total).toBe(arcaneShotSaveDc(17, 18));
    expect(b.parts.map((p) => [p.label, p.value])).toEqual([
      ['Base', 8], ['Proficiency bonus', 6], ['INT modifier', 4],
    ]);
    // The flat 8 is a DC, not a bonus — it must not render as "+8".
    expect(b.parts[0].signed).toBe(false);
  });

  it('keeps a negative Intelligence modifier in the breakdown', () => {
    const b = arcaneShotSaveDcBreakdown(5, 8); // 8 + 3 + (−1)
    expect(b.total).toBe(10);
    expect(b.parts[2]).toMatchObject({ label: 'INT modifier', value: -1 });
  });

  // RAW: "when you fire an arrow from a shortbow or longbow" — a crossbow fires bolts and
  // never qualifies, however much its name looks like a bow.
  it('recognises only shortbows and longbows as Arcane Shot weapons', () => {
    for (const name of ['Shortbow', 'Longbow', 'longbow', 'Longbow +1', 'Elven Shortbow']) {
      expect(isArcaneShotBow(name), name).toBe(true);
    }
    for (const name of ['Crossbow', 'Hand Crossbow', 'Light Crossbow', 'Heavy Crossbow',
      'Sling', 'Dart', 'Longsword', 'Bow of Bows', '', null, undefined]) {
      expect(isArcaneShotBow(name), String(name)).toBe(false);
    }
  });

  it('resolves known option names to full options in pool order', () => {
    const got = getArcaneShotOptions(['Shadow Arrow', 'Bursting Arrow', 'Not A Real Arrow']);
    expect(got.map((o) => o.name)).toEqual(['Bursting Arrow', 'Shadow Arrow']);
    expect(getArcaneShotOptions()).toEqual([]);
  });
});
