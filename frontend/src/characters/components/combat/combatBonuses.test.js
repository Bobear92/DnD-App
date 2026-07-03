import { describe, it, expect } from 'vitest';
import { isDraconicSorcerer, hasToughFeat, hasDurableFeat, durableHitDieMin, getHpBonuses, getHpBonusesPerLevel, totalHpBonus, hpRollBase, effectiveMaxHp, getAcOptions, remarkableAthlete, critRange, critRangeLabel, greatWeaponMasterNote } from '@/characters/components/combat/combatBonuses';

describe('hpRollBase', () => {
  it('returns the stored hp_rolls when present (CON-independent)', () => {
    expect(hpRollBase({ hp_rolls: 30 }, { level: 4, conMod: 3 })).toBe(30);
  });
  it('derives the roll base from a legacy hp_max by removing level × conMod', () => {
    // Legacy hp_max baked CON in: 34 at level 4, CON +2 → roll base 34 − 8 = 26.
    expect(hpRollBase({ hp_max: 34 }, { level: 4, conMod: 2 })).toBe(26);
  });
  it('prefers hp_rolls over a legacy hp_max', () => {
    expect(hpRollBase({ hp_rolls: 26, hp_max: 999 }, { level: 4, conMod: 2 })).toBe(26);
  });
  it('returns null when neither field is present', () => {
    expect(hpRollBase({}, { level: 3, conMod: 1 })).toBeNull();
  });
});

describe('effectiveMaxHp', () => {
  it('layers CON × level on top of the roll base', () => {
    // 26 base + 3 CON × 4 levels = 38.
    expect(effectiveMaxHp({ hp_rolls: 26 }, { level: 4, conMod: 3, charClass: 'Fighter' })).toBe(38);
  });
  it('recomputes dynamically when the CON modifier changes (no stored HP rewrite)', () => {
    const cd = { hp_rolls: 26 };
    expect(effectiveMaxHp(cd, { level: 4, conMod: 2 })).toBe(34); // +2 CON
    expect(effectiveMaxHp(cd, { level: 4, conMod: 3 })).toBe(38); // +1 CON mod → +4 HP (retroactive across 4 levels)
    expect(effectiveMaxHp(cd, { level: 4, conMod: 1 })).toBe(30); // −1 CON mod → −4 HP
  });
  it('adds passive per-level bonuses (Tough) on top of CON', () => {
    // 26 base + 2 CON × 4 + Tough 2/level × 4 = 26 + 8 + 8 = 42.
    expect(effectiveMaxHp({ hp_rolls: 26, feats: [{ name: 'Tough' }] }, { level: 4, conMod: 2, charClass: 'Fighter', feats: [{ name: 'Tough' }] })).toBe(42);
  });
  it('reproduces a legacy hp_max exactly at its own CON (self-consistent fallback)', () => {
    // Legacy hp_max 34 (level 4, CON +2) ⇒ roll base 26 ⇒ effective 34.
    expect(effectiveMaxHp({ hp_max: 34 }, { level: 4, conMod: 2 })).toBe(34);
  });

  it('a legacy-only record is stable across CON (the fallback derives base from the same conMod)', () => {
    // With no stored hp_rolls, changing conMod re-derives the base by the same amount, so HP is
    // unchanged — the documented legacy gap. Such records become dynamic once a real hp_rolls is
    // persisted (next level-up). hp_rolls-backed records ARE dynamic (see the test above).
    expect(effectiveMaxHp({ hp_max: 34 }, { level: 4, conMod: 3 })).toBe(34);
    expect(effectiveMaxHp({ hp_max: 34 }, { level: 4, conMod: 1 })).toBe(34);
  });
  it('floors at 1 HP per level for extreme negative CON', () => {
    expect(effectiveMaxHp({ hp_rolls: 3 }, { level: 3, conMod: -5 })).toBe(3); // max(3, 3 + (-15)) = 3
  });
  it('returns null with no roll base', () => {
    expect(effectiveMaxHp({}, { level: 3, conMod: 1 })).toBeNull();
  });
});

describe('greatWeaponMasterNote', () => {
  it('returns the crit/kill bonus-attack reminder when the character has the feat', () => {
    const note = greatWeaponMasterNote([{ name: 'Great Weapon Master' }]);
    expect(note).toMatch(/critical hit/i);
    expect(note).toMatch(/bonus action/i);
  });

  it('accepts string feat names', () => {
    expect(greatWeaponMasterNote(['Great Weapon Master'])).toBeTruthy();
  });

  it('returns null without the feat / no args', () => {
    expect(greatWeaponMasterNote([{ name: 'Tough' }])).toBeNull();
    expect(greatWeaponMasterNote([])).toBeNull();
    expect(greatWeaponMasterNote()).toBeNull();
  });
});

describe('remarkableAthlete', () => {
  it('null for non-Champion / non-Fighter / missing args', () => {
    expect(remarkableAthlete()).toBeNull();
    expect(remarkableAthlete({ charClass: 'Fighter', subclass: 'Battle Master', level: 10 })).toBeNull();
    expect(remarkableAthlete({ charClass: 'Rogue', subclass: 'Champion', level: 10 })).toBeNull();
  });

  describe('5e (2014)', () => {
    it('null below level 7', () => {
      expect(remarkableAthlete({ charClass: 'Fighter', subclass: 'Champion', level: 6, edition: '5e' })).toBeNull();
    });
    it('gives a ½-PB check bonus + jump bonus at L7+', () => {
      const ra = remarkableAthlete({ charClass: 'Fighter', subclass: 'Champion', level: 7, edition: '5e', pb: 3 });
      expect(ra).toMatchObject({
        edition: '5e',
        checkBonus: 2, // ⌈3/2⌉
        checkBonusAbilities: ['strength', 'dexterity', 'constitution'],
        jumpStrBonus: true,
      });
      expect(ra.advantageInitiative).toBeUndefined();
    });
    it('rounds the check bonus up (PB 5 → 3)', () => {
      expect(remarkableAthlete({ charClass: 'Fighter', subclass: 'Champion', level: 13, edition: '5e', pb: 5 }).checkBonus).toBe(3);
    });
    it('defaults to 5e when no edition is given', () => {
      expect(remarkableAthlete({ charClass: 'Fighter', subclass: 'Champion', level: 7, pb: 3 }).edition).toBe('5e');
    });
  });

  describe('2024 (5.5e)', () => {
    it('null below level 3', () => {
      expect(remarkableAthlete({ charClass: 'Fighter', subclass: 'Champion', level: 2, edition: '5.5e' })).toBeNull();
    });
    it('gives advantage on Initiative + Athletics at L3+ (no check bonus, no jump bonus)', () => {
      const ra = remarkableAthlete({ charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5.5e', pb: 2 });
      expect(ra).toEqual({ edition: '5.5e', advantageInitiative: true, advantageSkills: ['Athletics'] });
      expect(ra.checkBonus).toBeUndefined();
      expect(ra.jumpStrBonus).toBeUndefined();
    });
    it('is active at L3 (earlier than the 5e L7 unlock)', () => {
      expect(remarkableAthlete({ charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5e' })).toBeNull();
      expect(remarkableAthlete({ charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5.5e' })).not.toBeNull();
    });
  });
});

describe('critRange', () => {
  it('null for non-Champion / non-Fighter / missing args', () => {
    expect(critRange()).toBeNull();
    expect(critRange({ charClass: 'Fighter', subclass: 'Battle Master', level: 15 })).toBeNull();
    expect(critRange({ charClass: 'Rogue', subclass: 'Champion', level: 15 })).toBeNull();
  });
  it('null for a Champion below level 3', () => {
    expect(critRange({ charClass: 'Fighter', subclass: 'Champion', level: 2 })).toBeNull();
  });
  it('gives Improved Critical 19–20 at L3+', () => {
    expect(critRange({ charClass: 'Fighter', subclass: 'Champion', level: 3 }))
      .toEqual({ low: 19, high: 20, source: 'Improved Critical' });
    expect(critRange({ charClass: 'Fighter', subclass: 'Champion', level: 14 }).source).toBe('Improved Critical');
  });
  it('upgrades to Superior Critical 18–20 at L15+', () => {
    expect(critRange({ charClass: 'Fighter', subclass: 'Champion', level: 15 }))
      .toEqual({ low: 18, high: 20, source: 'Superior Critical' });
    expect(critRange({ charClass: 'Fighter', subclass: 'Champion', level: 20 }).low).toBe(18);
  });
  it('is edition-independent (Champion works in 2024 too)', () => {
    expect(critRange({ charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5.5e' }).source)
      .toBe('Improved Critical');
  });
});

describe('critRangeLabel', () => {
  it('null for a null crit', () => {
    expect(critRangeLabel(null)).toBeNull();
    expect(critRangeLabel(critRange({ charClass: 'Fighter', subclass: 'Battle Master', level: 15 }))).toBeNull();
  });
  it('renders the expanded range', () => {
    expect(critRangeLabel({ low: 19, high: 20 })).toBe('19–20');
    expect(critRangeLabel({ low: 18, high: 20 })).toBe('18–20');
  });
  it('renders a plain 20 when unexpanded', () => {
    expect(critRangeLabel({ low: 20, high: 20 })).toBe('20');
  });
});

describe('isDraconicSorcerer', () => {
  it('true for 5e Draconic Bloodline', () => {
    expect(isDraconicSorcerer('Sorcerer', 'Draconic Bloodline')).toBe(true);
  });
  it('true for 2024 Draconic Sorcery', () => {
    expect(isDraconicSorcerer('Sorcerer', 'Draconic Sorcery')).toBe(true);
  });
  it('false for other Sorcerer subclasses', () => {
    expect(isDraconicSorcerer('Sorcerer', 'Wild Magic')).toBe(false);
  });
  it('false for non-Sorcerer classes', () => {
    expect(isDraconicSorcerer('Wizard', 'Draconic Bloodline')).toBe(false);
  });
  it('false when no subclass', () => {
    expect(isDraconicSorcerer('Sorcerer', undefined)).toBe(false);
  });
});

describe('getHpBonuses', () => {
  it('returns Draconic Resilience scaling with level', () => {
    const b = getHpBonuses({ charClass: 'Sorcerer', subclass: 'Draconic Bloodline', level: 5 });
    expect(b).toHaveLength(1);
    expect(b[0].source).toBe('Draconic Resilience');
    expect(b[0].amount).toBe(5);
  });
  it('returns Dwarven Toughness for Hill Dwarf trait', () => {
    const b = getHpBonuses({ charClass: 'Fighter', raceTraits: ['Dwarven Toughness'], level: 3 });
    expect(b).toHaveLength(1);
    expect(b[0].source).toBe('Dwarven Toughness');
    expect(b[0].amount).toBe(3);
  });
  it('stacks Draconic Resilience and Dwarven Toughness', () => {
    const b = getHpBonuses({ charClass: 'Sorcerer', subclass: 'Draconic Sorcery', raceTraits: ['Dwarven Toughness'], level: 4 });
    expect(b).toHaveLength(2);
    expect(totalHpBonus({ charClass: 'Sorcerer', subclass: 'Draconic Sorcery', raceTraits: ['Dwarven Toughness'], level: 4 })).toBe(8);
  });
  it('returns the Tough feat at 2 HP per level', () => {
    const b = getHpBonuses({ charClass: 'Fighter', feats: [{ id: 1, name: 'Tough' }], level: 5 });
    expect(b).toHaveLength(1);
    expect(b[0].source).toBe('Tough');
    expect(b[0].amount).toBe(10); // 2 × 5
  });
  it('stacks Dwarven Toughness and the Tough feat', () => {
    const args = { charClass: 'Fighter', raceTraits: ['Dwarven Toughness'], feats: ['Tough'], level: 3 };
    expect(getHpBonuses(args)).toHaveLength(2);
    expect(totalHpBonus(args)).toBe(3 + 6); // +1/level dwarf + +2/level tough
  });
  it('returns empty for a plain Wizard', () => {
    expect(getHpBonuses({ charClass: 'Wizard', subclass: 'School of Evocation', level: 10 })).toEqual([]);
  });
});

describe('hasToughFeat', () => {
  it('true for an object feat list', () => {
    expect(hasToughFeat([{ id: 1, name: 'Tough' }])).toBe(true);
  });
  it('true for a string feat list', () => {
    expect(hasToughFeat(['Alert', 'Tough'])).toBe(true);
  });
  it('false when absent / empty / nullish', () => {
    expect(hasToughFeat([{ name: 'Alert' }])).toBe(false);
    expect(hasToughFeat([])).toBe(false);
    expect(hasToughFeat()).toBe(false);
  });
});

describe('hasDurableFeat', () => {
  it('detects Durable in object/string feat lists', () => {
    expect(hasDurableFeat([{ id: 1, name: 'Durable' }])).toBe(true);
    expect(hasDurableFeat(['Alert', 'Durable'])).toBe(true);
  });
  it('false when absent / empty / nullish', () => {
    expect(hasDurableFeat([{ name: 'Tough' }])).toBe(false);
    expect(hasDurableFeat([])).toBe(false);
    expect(hasDurableFeat()).toBe(false);
  });
});

describe('durableHitDieMin', () => {
  it('returns twice the CON modifier (min 2) when Durable is present', () => {
    expect(durableHitDieMin(3, true)).toBe(6);
    expect(durableHitDieMin(0, true)).toBe(2);   // floored at 2
    expect(durableHitDieMin(-1, true)).toBe(2);  // negative CON → still 2
  });
  it('returns 0 without Durable', () => {
    expect(durableHitDieMin(3, false)).toBe(0);
    expect(durableHitDieMin(3)).toBe(0);
  });
});

describe('getHpBonusesPerLevel', () => {
  it('reports the per-level rate (not the total)', () => {
    const rows = getHpBonusesPerLevel({ charClass: 'Fighter', raceTraits: ['Dwarven Toughness'], feats: ['Tough'] });
    expect(rows).toEqual([
      { source: 'Dwarven Toughness', detail: '1 HP per level (Hill Dwarf)', perLevel: 1 },
      { source: 'Tough', detail: '2 HP per level (Tough feat)', perLevel: 2 },
    ]);
  });
  it('is empty when no sources apply', () => {
    expect(getHpBonusesPerLevel({ charClass: 'Fighter' })).toEqual([]);
  });
});

describe('getAcOptions', () => {
  it('Barbarian unarmored defense = 10 + DEX + CON', () => {
    const o = getAcOptions({ charClass: 'Barbarian', scores: { dexterity: 16, constitution: 14 } });
    expect(o).toHaveLength(1);
    expect(o[0].source).toBe('Unarmored Defense');
    expect(o[0].value).toBe(10 + 3 + 2);
  });
  it('Monk unarmored defense = 10 + DEX + WIS', () => {
    const o = getAcOptions({ charClass: 'Monk', scores: { dexterity: 14, wisdom: 16 } });
    expect(o[0].value).toBe(10 + 2 + 3);
  });
  it('Draconic Resilience = 13 + DEX', () => {
    const o = getAcOptions({ charClass: 'Sorcerer', subclass: 'Draconic Bloodline', scores: { dexterity: 14 } });
    expect(o).toHaveLength(1);
    expect(o[0].source).toBe('Draconic Resilience');
    expect(o[0].value).toBe(13 + 2);
  });
  it('defaults missing scores to 10 (mod 0)', () => {
    const o = getAcOptions({ charClass: 'Barbarian', scores: {} });
    expect(o[0].value).toBe(10);
  });
  it('returns empty for a non-AC class', () => {
    expect(getAcOptions({ charClass: 'Wizard', scores: { dexterity: 14 } })).toEqual([]);
  });
});
