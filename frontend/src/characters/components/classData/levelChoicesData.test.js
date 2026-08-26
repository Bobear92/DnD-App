import { describe, it, expect } from 'vitest';
import {
  METAMAGIC_OPTIONS,
  metamagicKnownAtLevel,
  ELDRITCH_INVOCATIONS_5E,
  eldritchInvocationsKnownAtLevel,
  getLevelChoices,
  getEarnedLevelChoices,
  availablePoolOptions,
  applyLevelChoice,
} from '@/characters/components/classData/levelChoicesData';

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
    expect(getLevelChoices('Barbarian', '5e', 2, 3)).toEqual([]);
  });
});

// A subclass-scoped pool (Arcane Archer's Arcane Shot) reuses the whole class-pool mechanism,
// gated on the character's subclass so a Champion never sees it.
describe('getLevelChoices — subclass-scoped pools', () => {
  it('offers Arcane Shot to an Arcane Archer at level 3', () => {
    const choices = getLevelChoices('Fighter', '5e', 2, 3, 'Arcane Archer');
    expect(choices).toHaveLength(1);
    expect(choices[0].key).toBe('arcane_shot');
    expect(choices[0].storeField).toBe('arcane_shot_options');
    expect(choices[0].count).toBe(2);
  });

  it('gives a delta of 1 at each later option level (7 / 10 / 15 / 18)', () => {
    for (const [from, to] of [[6, 7], [9, 10], [14, 15], [17, 18]]) {
      expect(getLevelChoices('Fighter', '5e', from, to, 'Arcane Archer')[0].count).toBe(1);
    }
  });

  it('offers nothing at a Fighter level with no new option (3→4)', () => {
    expect(getLevelChoices('Fighter', '5e', 3, 4, 'Arcane Archer')).toEqual([]);
  });

  it('is hidden from another subclass and from a subclass-less character', () => {
    expect(getLevelChoices('Fighter', '5e', 2, 3, 'Champion')).toEqual([]);
    expect(getLevelChoices('Fighter', '5e', 2, 3)).toEqual([]);
  });

  it('has no 2024 Arcane Archer (the subclass does not exist in that edition)', () => {
    expect(getLevelChoices('Fighter', '5.5e', 2, 3, 'Arcane Archer')).toEqual([]);
  });

  it('still returns class-wide pools when no subclass is passed', () => {
    expect(getLevelChoices('Sorcerer', '5e', 2, 3)).toHaveLength(1);
  });
});

describe('getEarnedLevelChoices', () => {
  it('returns the cumulative count known at a level, not the delta', () => {
    const earned = getEarnedLevelChoices('Fighter', '5e', 10, 'Arcane Archer');
    expect(earned).toHaveLength(1);
    expect(earned[0].count).toBe(4);
  });

  it('returns nothing before the subclass grants any options', () => {
    expect(getEarnedLevelChoices('Fighter', '5e', 2, 'Arcane Archer')).toEqual([]);
  });

  it('respects the subclass gate', () => {
    expect(getEarnedLevelChoices('Fighter', '5e', 10, 'Champion')).toEqual([]);
  });

  it('works for class-wide pools too', () => {
    expect(getEarnedLevelChoices('Sorcerer', '5e', 17)[0].count).toBe(4);
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

describe('eldritchInvocationsKnownAtLevel', () => {
  it('5e: none until L2, then 2/3/4 at 2/3/5, 8 at 15', () => {
    expect(eldritchInvocationsKnownAtLevel(1, '5e')).toBe(0);
    expect(eldritchInvocationsKnownAtLevel(2, '5e')).toBe(2);
    expect(eldritchInvocationsKnownAtLevel(3, '5e')).toBe(3);
    expect(eldritchInvocationsKnownAtLevel(5, '5e')).toBe(4);
    expect(eldritchInvocationsKnownAtLevel(15, '5e')).toBe(8);
  });

  it('2024: 1 from L1, then 2 at L2', () => {
    expect(eldritchInvocationsKnownAtLevel(1, '5.5e')).toBe(1);
    expect(eldritchInvocationsKnownAtLevel(2, '5.5e')).toBe(2);
  });
});

describe('getLevelChoices — Warlock invocations', () => {
  it('5e 1→2 gives the first 2 invocations (none before L2)', () => {
    const choices = getLevelChoices('Warlock', '5e', 1, 2);
    expect(choices).toHaveLength(1);
    expect(choices[0].key).toBe('eldritch_invocations');
    expect(choices[0].count).toBe(2);
  });

  it('5e 4→5 gives 1 more', () => {
    expect(getLevelChoices('Warlock', '5e', 4, 5)[0].count).toBe(1);
  });

  it('2024 1→2 gives 1 (already had 1 at L1)', () => {
    expect(getLevelChoices('Warlock', '5.5e', 1, 2)[0].count).toBe(1);
  });
});

describe('availablePoolOptions — minLevel gating', () => {
  const warlock = getLevelChoices('Warlock', '5e', 1, 2)[0];

  it('hides options gated above the level when a level is passed', () => {
    const atL2 = availablePoolOptions(warlock, {}, 2).map((o) => o.name);
    expect(atL2).toContain('Agonizing Blast');     // minLevel 2
    expect(atL2).not.toContain('Thirsting Blade');  // minLevel 5
  });

  it('includes higher-level options once the level is high enough', () => {
    const atL15 = availablePoolOptions(warlock, {}, 15).map((o) => o.name);
    expect(atL15).toContain('Thirsting Blade');
    expect(atL15).toContain('Witch Sight');         // minLevel 15
  });

  it('does not filter by level when level is omitted (backward compatible)', () => {
    expect(availablePoolOptions(warlock, {})).toHaveLength(ELDRITCH_INVOCATIONS_5E.length);
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

  it('swaps out a replaced option before adding the new picks (replace-on-level-up)', () => {
    const choice = getLevelChoices('Sorcerer', '5e', 9, 10)[0]; // learns 1 metamagic at L10
    const patch = applyLevelChoice(choice, ['Heightened Spell'], { metamagic: ['Quickened Spell', 'Subtle Spell'] }, 'Subtle Spell');
    expect(patch.metamagic).toEqual(['Quickened Spell', 'Heightened Spell']); // Subtle Spell removed, Heightened added
  });
});

describe('Fighter → Rune Knight: Rune Carving', () => {
  const runesAt = (oldLevel, newLevel) =>
    getLevelChoices('Fighter', '5e', oldLevel, newLevel, 'Rune Knight')
      .find((c) => c.key === 'runes');

  it('offers two runes at level 3 — the pick QA found never happened', () => {
    const choice = runesAt(2, 3);
    expect(choice).toBeDefined();
    expect(choice.count).toBe(2);
    expect(choice.storeField).toBe('runes');
  });

  it('offers one more at 7, 10 and 15, and none at a level in between', () => {
    expect(runesAt(6, 7).count).toBe(1);
    expect(runesAt(9, 10).count).toBe(1);
    expect(runesAt(14, 15).count).toBe(1);
    expect(runesAt(3, 4)).toBeUndefined();
    expect(runesAt(15, 16)).toBeUndefined();
  });

  it('is offered only to a Rune Knight, and never in 2024', () => {
    expect(getLevelChoices('Fighter', '5e', 2, 3, 'Champion')).toEqual([]);
    expect(getLevelChoices('Fighter', '5e', 2, 3, null)).toEqual([]);
    expect(getLevelChoices('Fighter', '5.5e', 2, 3, 'Rune Knight')).toEqual([]);
  });

  it('hides Hill below level 7 and Storm below level 15', () => {
    const choice = runesAt(2, 3);
    const atL3 = availablePoolOptions(choice, {}, 3).map((o) => o.name);
    expect(atL3).toEqual(['Cloud Rune', 'Fire Rune', 'Frost Rune', 'Stone Rune']);

    const atL7 = availablePoolOptions(choice, {}, 7).map((o) => o.name);
    expect(atL7).toContain('Hill Rune');
    expect(atL7).not.toContain('Storm Rune');

    expect(availablePoolOptions(choice, {}, 15).map((o) => o.name)).toContain('Storm Rune');
  });

  it('hides runes the character already knows', () => {
    const choice = runesAt(6, 7);
    const names = availablePoolOptions(choice, { runes: ['Fire Rune', 'Frost Rune'] }, 7).map((o) => o.name);
    expect(names).not.toContain('Fire Rune');
    expect(names).not.toContain('Frost Rune');
    expect(names).toContain('Hill Rune');
  });

  it('writes the chosen runes to character_data.runes and supports the level-up swap', () => {
    const choice = runesAt(6, 7);
    expect(applyLevelChoice(choice, ['Hill Rune'], { runes: ['Fire Rune', 'Cloud Rune'] }))
      .toEqual({ runes: ['Fire Rune', 'Cloud Rune', 'Hill Rune'] });
    expect(applyLevelChoice(choice, ['Hill Rune'], { runes: ['Fire Rune', 'Cloud Rune'] }, 'Cloud Rune'))
      .toEqual({ runes: ['Fire Rune', 'Hill Rune'] });
  });

  it('reports the cumulative runes a Rune Knight should already know', () => {
    const earned = getEarnedLevelChoices('Fighter', '5e', 10, 'Rune Knight')
      .find((c) => c.key === 'runes');
    expect(earned.count).toBe(4);
    expect(getEarnedLevelChoices('Fighter', '5e', 2, 'Rune Knight')).toEqual([]);
  });

  it('derives the save DC from CONSTITUTION and states the Channel Rune uses', () => {
    const choice = runesAt(2, 3);
    const atL3 = choice.derived(3, { constitution: 16, intelligence: 8 });
    expect(atL3.value).toBe(13);                       // 8 + PB 2 + CON +3
    expect(atL3.note).toMatch(/Constitution modifier \(\+3\)/);
    expect(atL3.note).toMatch(/once per short or long rest/);
    // Master of Runes doubles the uses at 15th level.
    expect(choice.derived(15, { constitution: 16 }).note).toMatch(/twice per short or long rest/);
  });
});
