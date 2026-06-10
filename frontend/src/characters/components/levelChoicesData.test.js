import { describe, it, expect } from 'vitest';
import {
  METAMAGIC_OPTIONS,
  metamagicKnownAtLevel,
  getLevelChoices,
  availablePoolOptions,
  applyLevelChoice,
} from './levelChoicesData';

describe('metamagicKnownAtLevel', () => {
  it('returns 0 before level 3, then 2 / 3 / 4 at 3 / 10 / 17', () => {
    expect(metamagicKnownAtLevel(1)).toBe(0);
    expect(metamagicKnownAtLevel(2)).toBe(0);
    expect(metamagicKnownAtLevel(3)).toBe(2);
    expect(metamagicKnownAtLevel(9)).toBe(2);
    expect(metamagicKnownAtLevel(10)).toBe(3);
    expect(metamagicKnownAtLevel(16)).toBe(3);
    expect(metamagicKnownAtLevel(17)).toBe(4);
    expect(metamagicKnownAtLevel(20)).toBe(4);
  });
});

describe('METAMAGIC_OPTIONS', () => {
  it('is a {name, description} pool with the 10 standard options', () => {
    expect(METAMAGIC_OPTIONS).toHaveLength(10);
    METAMAGIC_OPTIONS.forEach((o) => {
      expect(typeof o.name).toBe('string');
      expect(o.description.length).toBeGreaterThan(0);
    });
    const names = METAMAGIC_OPTIONS.map((o) => o.name);
    expect(names).toContain('Quickened Spell');
    expect(names).toContain('Twinned Spell');
  });
});

describe('getLevelChoices', () => {
  it('returns the per-level delta count for Sorcerer Metamagic (2→3 gives 2)', () => {
    const choices = getLevelChoices('Sorcerer', '5e', 2, 3);
    expect(choices).toHaveLength(1);
    expect(choices[0].key).toBe('metamagic');
    expect(choices[0].count).toBe(2);
  });

  it('gives a delta of 1 when crossing 9→10 and 16→17', () => {
    expect(getLevelChoices('Sorcerer', '5e', 9, 10)[0].count).toBe(1);
    expect(getLevelChoices('Sorcerer', '5e', 16, 17)[0].count).toBe(1);
  });

  it('returns nothing at a level with no new options (3→4)', () => {
    expect(getLevelChoices('Sorcerer', '5e', 3, 4)).toEqual([]);
  });

  it('works for 5.5e and normalizes 2024 alias', () => {
    expect(getLevelChoices('Sorcerer', '5.5e', 2, 3)[0].count).toBe(2);
    expect(getLevelChoices('Sorcerer', '2024', 2, 3)[0].count).toBe(2);
  });

  it('returns nothing for classes without level choices', () => {
    expect(getLevelChoices('Fighter', '5e', 2, 3)).toEqual([]);
  });
});

describe('availablePoolOptions', () => {
  it('hides options the character already has', () => {
    const choice = getLevelChoices('Sorcerer', '5e', 2, 3)[0];
    const opts = availablePoolOptions(choice, { metamagic: ['Quickened Spell'] });
    expect(opts.map((o) => o.name)).not.toContain('Quickened Spell');
    expect(opts).toHaveLength(METAMAGIC_OPTIONS.length - 1);
  });

  it('returns the full pool when nothing is held', () => {
    const choice = getLevelChoices('Sorcerer', '5e', 2, 3)[0];
    expect(availablePoolOptions(choice, {})).toHaveLength(METAMAGIC_OPTIONS.length);
  });
});

describe('applyLevelChoice', () => {
  it('merges chosen names into the storeField, deduped', () => {
    const choice = getLevelChoices('Sorcerer', '5e', 2, 3)[0];
    const patch = applyLevelChoice(choice, ['Quickened Spell', 'Subtle Spell'], { metamagic: ['Quickened Spell'] });
    expect(patch.metamagic).toEqual(['Quickened Spell', 'Subtle Spell']);
  });

  it('returns the chosen names when the field is empty', () => {
    const choice = getLevelChoices('Sorcerer', '5e', 2, 3)[0];
    expect(applyLevelChoice(choice, ['Twinned Spell'], {})).toEqual({ metamagic: ['Twinned Spell'] });
  });
});
