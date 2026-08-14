import { describe, it, expect } from 'vitest';
import {
  getDefenses, hasDefenses, formatDamageTypes, formatDefenseValue, defenseKey, DEFENSES,
  applyDamage,
} from './defenses';
import { SUBCLASS_DATA } from '@/characters/components/classData/subclassData';

const HAM_5E = {
  name: 'Heavy Armor Master',
  effects: [
    { kind: 'ability_score', ability: 'strength', amount: 1 },
    {
      kind: 'damage_reduction',
      amount: 3,
      damage_types: ['bludgeoning', 'piercing', 'slashing'],
      condition: 'heavy_armor',
      nonmagical_only: true,
    },
  ],
};

const HAM_2024 = {
  name: 'Heavy Armor Master',
  effects: [{
    kind: 'damage_reduction',
    amount: 'pb',
    damage_types: ['bludgeoning', 'piercing', 'slashing'],
    condition: 'heavy_armor',
    nonmagical_only: false,
  }],
};

describe('formatDamageTypes', () => {
  it('collapses the bludgeoning/piercing/slashing triple', () => {
    expect(formatDamageTypes(['bludgeoning', 'piercing', 'slashing'])).toBe('B / P / S');
  });

  it('collapses the triple regardless of order', () => {
    expect(formatDamageTypes(['slashing', 'bludgeoning', 'piercing'])).toBe('B / P / S');
  });

  it('title-cases and joins any other set', () => {
    expect(formatDamageTypes(['fire'])).toBe('Fire');
    expect(formatDamageTypes(['lightning', 'thunder'])).toBe('Lightning / Thunder');
  });
});

describe('formatDefenseValue', () => {
  it('renders each kind distinctly', () => {
    expect(formatDefenseValue('resistance')).toBe('Resistance');
    expect(formatDefenseValue('immunity')).toBe('Immunity');
    expect(formatDefenseValue('reduction', 3)).toBe('−3');
  });
});

describe('applyDamage — the RAW order of operations', () => {
  it('halves and rounds down for resistance', () => {
    expect(applyDamage({ amount: 13, resistant: true }).final).toBe(6);
  });

  it('doubles for vulnerability', () => {
    expect(applyDamage({ amount: 13, vulnerable: true }).final).toBe(26);
  });

  it('cancels resistance against vulnerability instead of compounding them', () => {
    const { final, steps } = applyDamage({ amount: 13, resistant: true, vulnerable: true });
    expect(final).toBe(13);
    expect(steps.some((s) => /cancel/i.test(s.label))).toBe(true);
  });

  it('subtracts a flat reduction AFTER halving, not before', () => {
    // 16 halved = 8, minus 3 = 5. Reducing first would give (16-3)/2 = 6 — the common error.
    expect(applyDamage({ amount: 16, resistant: true, reduction: 3 }).final).toBe(5);
  });

  it('never drives damage below zero', () => {
    expect(applyDamage({ amount: 4, resistant: true, reduction: 10 }).final).toBe(0);
  });

  it('leaves damage untouched with no defenses', () => {
    expect(applyDamage({ amount: 13 }).final).toBe(13);
  });

  it('reports each step so the page can show the working', () => {
    const { steps } = applyDamage({ amount: 16, resistant: true, reduction: 3 });
    expect(steps.map((s) => s.value)).toEqual([16, 8, 5]);
  });
});

describe('getDefenses — race traits', () => {
  it('lists a Dwarf poison resistance as always on', () => {
    const { alwaysOn, situational } = getDefenses({
      charClass: 'Fighter',
      characterData: { race_traits: ['Dwarven Resilience'] },
    });
    expect(alwaysOn).toHaveLength(1);
    expect(alwaysOn[0].name).toBe('Dwarven Resilience');
    expect(alwaysOn[0].typeLabel).toBe('Poison');
    expect(alwaysOn[0].valueLabel).toBe('Resistance');
    expect(situational).toHaveLength(0);
  });

  it('reads the real rules text out of the race trait table', () => {
    const { alwaysOn } = getDefenses({
      charClass: 'Fighter',
      characterData: { race_traits: ['Hellish Resistance'] },
    });
    expect(alwaysOn[0].description).toMatch(/fire damage/i);
  });

  it('gives a character without the trait nothing', () => {
    const { alwaysOn, situational } = getDefenses({
      charClass: 'Fighter',
      characterData: { race_traits: ['Darkvision'] },
    });
    expect(alwaysOn).toHaveLength(0);
    expect(situational).toHaveLength(0);
  });
});

describe('getDefenses — a damage type that is a stored player choice', () => {
  it("uses the Dragonborn's chosen ancestry damage type", () => {
    const { alwaysOn } = getDefenses({
      charClass: 'Fighter',
      characterData: {
        race_traits: ['Damage Resistance'],
        draconic_ancestry: { name: 'Silver Dragon', damage: 'Cold' },
      },
    });
    expect(alwaysOn).toHaveLength(1);
    expect(alwaysOn[0].typeLabel).toBe('Cold');
  });

  it('omits the row entirely when no ancestry was chosen — rather than showing an empty type', () => {
    const { alwaysOn, situational } = getDefenses({
      charClass: 'Fighter',
      characterData: { race_traits: ['Damage Resistance'] },
    });
    expect([...alwaysOn, ...situational]).toHaveLength(0);
  });
});

describe('getDefenses — conditional class features', () => {
  it("puts a Barbarian's Rage resistance in SITUATIONAL, never always-on", () => {
    const { alwaysOn, situational } = getDefenses({
      charClass: 'Barbarian', level: 1, characterData: {},
    });
    expect(alwaysOn).toHaveLength(0);
    expect(situational).toHaveLength(1);
    expect(situational[0].name).toBe('Rage');
    expect(situational[0].typeLabel).toBe('B / P / S');
    expect(situational[0].condition).toBe('while raging');
  });

  it('does not give Rage to another class', () => {
    const { situational } = getDefenses({ charClass: 'Fighter', level: 20, characterData: {} });
    expect(situational.find((r) => r.name === 'Rage')).toBeUndefined();
  });
});

describe('getDefenses — feat reductions come from the structured effect', () => {
  it('reads the 5e flat 3 and marks it nonmagical-only', () => {
    const { situational } = getDefenses({
      charClass: 'Fighter', level: 12, pb: 4, characterData: { feats: [HAM_5E] },
    });
    const ham = situational.find((r) => r.name === 'Heavy Armor Master');
    expect(ham.valueLabel).toBe('−3');
    expect(ham.qualifier).toBe('from nonmagical attacks');
    expect(ham.condition).toBe('while wearing heavy armor');
  });

  it('scales the 2024 reduction with proficiency bonus and drops the nonmagical clause', () => {
    const { situational } = getDefenses({
      charClass: 'Fighter', level: 12, edition: '5.5e', pb: 4, characterData: { feats: [HAM_2024] },
    });
    const ham = situational.find((r) => r.name === 'Heavy Armor Master');
    expect(ham.valueLabel).toBe('−4');
    expect(ham.qualifier).toBeNull();
  });

  it('is never listed as always-on — the reduction needs the armor', () => {
    const { alwaysOn } = getDefenses({
      charClass: 'Fighter', level: 12, pb: 4, characterData: { feats: [HAM_5E] },
    });
    expect(alwaysOn).toHaveLength(0);
  });
});

describe('hasDefenses', () => {
  it('is false for a character with none', () => {
    expect(hasDefenses({ charClass: 'Fighter', characterData: {} })).toBe(false);
  });

  it('is true when only a situational defense exists', () => {
    expect(hasDefenses({ charClass: 'Barbarian', level: 1, characterData: {} })).toBe(true);
  });
});

describe('getDefenses — subclass entries', () => {
  const sub = (charClass, subclass, level, edition = '5e', characterData = {}) =>
    getDefenses({ charClass, subclass, level, edition, characterData });

  it('lists a standing subclass resistance', () => {
    const { alwaysOn } = sub('Sorcerer', 'Storm Sorcery', 6);
    expect(alwaysOn.map((r) => r.name)).toContain('Heart of the Storm');
    expect(alwaysOn[0].typeLabel).toBe('Lightning / Thunder');
  });

  it('gates on level', () => {
    expect(sub('Sorcerer', 'Storm Sorcery', 5).alwaysOn).toHaveLength(0);
  });

  it('gates on subclass', () => {
    expect(sub('Sorcerer', 'Aberrant Mind', 6).alwaysOn.map((r) => r.name))
      .not.toContain('Heart of the Storm');
  });

  it('shows immunity and the earlier resistance together at high level', () => {
    // RAW a Forge cleric has both; the panel reports sources, not a computed net.
    const names = sub('Cleric', 'Forge Domain', 17).alwaysOn.map((r) => r.name);
    expect(names).toContain('Soul of the Forge');
    expect(names).toContain('Saint of Forge and Fire');
  });

  it('narrows a source-keyed resistance with a qualifier rather than overstating it', () => {
    const { alwaysOn } = sub('Paladin', 'Oath of the Ancients', 7);
    const aura = alwaysOn.find((r) => r.name === 'Aura of Warding');
    expect(aura.typeLabel).toBe('All');
    expect(aura.qualifier).toBe('from spells');
  });

  it('respects per-edition subclass renames', () => {
    expect(sub('Wizard', 'School of Abjuration', 14, '5e').alwaysOn.map((r) => r.name))
      .toContain('Spell Resistance');
    expect(sub('Wizard', 'Abjurer', 14, '5.5e').alwaysOn.map((r) => r.name))
      .toContain('Spell Resistance');
    // The 5e spelling must not match in a 2024 campaign.
    expect(sub('Wizard', 'School of Abjuration', 14, '5.5e').alwaysOn).toHaveLength(0);
  });

  it('respects per-edition level differences', () => {
    // Fiendish Resilience is L10 in 2014 and L6 in 2024.
    expect(sub('Warlock', 'The Fiend', 6, '5e').alwaysOn).toHaveLength(0);
    expect(sub('Warlock', 'The Fiend', 6, '5.5e').alwaysOn.map((r) => r.name))
      .toContain('Fiendish Resilience');
  });

  it('names an unpersisted player choice instead of inventing a damage type', () => {
    const { alwaysOn } = sub('Warlock', 'The Fiend', 10, '5e');
    expect(alwaysOn[0].typeLabel).toBe('Your choice');
  });

  it("reads the Sorcerer's stored bloodline for Elemental Affinity", () => {
    const { situational } = sub('Sorcerer', 'Draconic Bloodline', 6, '5e', {
      draconic_bloodline: { name: 'Gold Dragon', damage: 'Fire' },
    });
    const ea = situational.find((r) => r.name === 'Elemental Affinity');
    expect(ea.typeLabel).toBe('Fire');
  });

  it('puts a transformation-gated resistance in Situational', () => {
    const { alwaysOn, situational } = sub('Sorcerer', 'Shadow Magic', 18);
    expect(alwaysOn.map((r) => r.name)).not.toContain('Umbral Form');
    const umbral = situational.find((r) => r.name === 'Umbral Form');
    expect(umbral.condition).toBe('while in umbral form');
    expect(umbral.qualifier).toBe('except force and radiant');
  });
});

describe('registry integrity', () => {
  it('gives every entry a unique key', () => {
    const keys = DEFENSES.map(defenseKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('declares a known kind and a condition decision on every entry', () => {
    for (const entry of DEFENSES) {
      expect(['resistance', 'immunity', 'reduction']).toContain(entry.kind);
      // `condition` must be explicitly present — an omitted one would silently default to
      // always-on, which is exactly the wrong-by-default failure this panel exists to avoid.
      expect(entry).toHaveProperty('condition');
    }
  });

  it('resolves rules text for EVERY entry — a typo would silently render an empty note', () => {
    // The real failure mode of a hand-authored catalog: a misspelled subclass or feature name
    // never matches its feature table, so the row expands to nothing. Driving every entry
    // through its own gates catches that at build time instead of on someone's sheet.
    for (const entry of DEFENSES) {
      const edition = entry.editions?.[0] ?? '5e';
      const { alwaysOn, situational } = getDefenses({
        charClass: entry.charClass ?? 'Fighter',
        subclass: entry.subclass,
        level: entry.minLevel ?? 1,
        edition,
        characterData: {
          race_traits: entry.race ? [entry.race] : [],
          draconic_ancestry: { damage: 'Fire' },
          draconic_bloodline: { damage: 'Fire' },
        },
      });
      const row = [...alwaysOn, ...situational].find((r) => r.name === entry.name);
      expect(row, `${entry.name} (${entry.subclass ?? entry.charClass ?? entry.race}, ${edition}) never matched its own gates`).toBeTruthy();
      expect(row.description, `${entry.name} resolved no rules text`).toBeTruthy();
    }
  });

  it('gives every entry that names a subclass a real subclass in that edition', () => {
    for (const entry of DEFENSES.filter((e) => e.subclass)) {
      for (const edition of entry.editions ?? ['5e', '5.5e']) {
        const features = SUBCLASS_DATA[entry.charClass]?.[edition]?.[entry.subclass]?.features;
        expect(features, `${entry.charClass}/${entry.subclass} missing in ${edition}`).toBeTruthy();
        expect(
          features.some((f) => f.name === entry.name),
          `${entry.subclass} (${edition}) has no feature named "${entry.name}"`,
        ).toBe(true);
      }
    }
  });
});
