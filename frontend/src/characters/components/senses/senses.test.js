import { describe, it, expect } from 'vitest';
import {
  getSenses, getSightNotes, hasSenses, RACE_SENSE_TRAITS, SENSE_SOURCES,
} from '@/characters/components/senses/senses';

const axe = { uid: 'w1', category: 'weapons', name: 'Battleaxe', equipped: true, hand: 'main' };
const stowed = { uid: 'w2', category: 'weapons', name: 'Longbow', equipped: false };

const runeKnight = ({ carvedOn = 'w1', traits = [], race = 'Human', subrace } = {}) => ({
  race,
  subrace,
  level: 7,
  characterData: {
    subclass: 'Rune Knight',
    race_traits: traits,
    runes: ['Stone Rune'],
    rune_items: carvedOn ? { 'Stone Rune': carvedOn } : {},
    inventory: [axe, stowed],
  },
});

describe('no senses', () => {
  it('returns nothing for a character with ordinary vision', () => {
    const ctx = { race: 'Human', level: 5, characterData: { race_traits: ['Extra Language'] } };
    expect(getSenses(ctx)).toEqual([]);
    expect(getSightNotes(ctx)).toEqual([]);
    expect(hasSenses(ctx)).toBe(false);
  });

  it('survives a character with no race_traits at all', () => {
    expect(getSenses({ characterData: {} })).toEqual([]);
    expect(hasSenses({})).toBe(false);
  });
});

describe('racial darkvision', () => {
  it('gives the standard 60 ft from the Darkvision trait', () => {
    const [dv] = getSenses({ race: 'Dwarf', subrace: 'Hill Dwarf', characterData: { race_traits: ['Darkvision'] } });
    expect(dv).toMatchObject({ sense: 'Darkvision', rangeFt: 60, source: 'Hill Dwarf' });
  });

  it('labels the source with the race when there is no subrace', () => {
    const [dv] = getSenses({ race: 'Half-Orc', characterData: { race_traits: ['Darkvision'] } });
    expect(dv.source).toBe('Half-Orc');
  });

  it("gives the Drow's Superior Darkvision 120 ft", () => {
    const [dv] = getSenses({
      race: 'Elf', subrace: 'Dark Elf (Drow)',
      characterData: { race_traits: ['Darkvision', 'Superior Darkvision'] },
    });
    expect(dv.rangeFt).toBe(120);
  });

  // Ranges SUPERSEDE rather than stack — a Drow does not see 180 ft.
  it('keeps only the largest range, listing the rest as superseded', () => {
    const [dv] = getSenses({
      race: 'Elf', subrace: 'Dark Elf (Drow)',
      characterData: { race_traits: ['Darkvision', 'Superior Darkvision'] },
    });
    expect(dv.rangeFt).toBe(120);
    expect(dv.superseded.map((o) => o.rangeFt)).toEqual([60]);
  });
});

describe('the Stone Rune', () => {
  it('grants 120 ft while carved onto an equipped object', () => {
    const [dv] = getSenses(runeKnight());
    expect(dv).toMatchObject({ sense: 'Darkvision', rangeFt: 120, source: 'Stone Rune' });
    expect(dv.note).toBe('Carved on Battleaxe');
  });

  it('grants nothing while uncarved', () => {
    expect(getSenses(runeKnight({ carvedOn: null }))).toEqual([]);
  });

  it('grants nothing while the bearing item is stowed — carving alone is not enough', () => {
    expect(getSenses(runeKnight({ carvedOn: 'w2' }))).toEqual([]);
  });

  // The whole point of returning the losers: put the axe away and you drop to 60, not to nothing.
  it('supersedes a racial 60 ft, and names what it replaced', () => {
    const [dv] = getSenses(runeKnight({ traits: ['Darkvision'], race: 'Dwarf' }));
    expect(dv.rangeFt).toBe(120);
    expect(dv.source).toBe('Stone Rune');
    expect(dv.superseded).toEqual([expect.objectContaining({ rangeFt: 60, source: 'Dwarf' })]);
  });

  it('loses to a larger racial range rather than overriding it', () => {
    // Both are 120, so the racial one is not dropped — it is listed as the superseded equal.
    const ctx = runeKnight({ traits: ['Superior Darkvision'], race: 'Elf', subrace: 'Drow' });
    const [dv] = getSenses(ctx);
    expect(dv.rangeFt).toBe(120);
    expect(dv.superseded).toHaveLength(1);
  });
});

describe('sight notes', () => {
  it('lists Sunlight Sensitivity for a Drow', () => {
    expect(getSightNotes({ characterData: { race_traits: ['Superior Darkvision', 'Sunlight Sensitivity'] } }))
      .toEqual(['Sunlight Sensitivity']);
  });

  it('gives a character the card for a sight note alone, with no ranged sense', () => {
    const ctx = { characterData: { race_traits: ['Sunlight Sensitivity'] } };
    expect(getSenses(ctx)).toEqual([]);
    expect(hasSenses(ctx)).toBe(true);
  });
});

describe('the registry itself', () => {
  it('every race sense trait names a sense and a positive range', () => {
    for (const [trait, def] of Object.entries(RACE_SENSE_TRAITS)) {
      expect(typeof def.sense, trait).toBe('string');
      expect(def.rangeFt, trait).toBeGreaterThan(0);
    }
  });

  it('every source resolves to an array for an empty character', () => {
    for (const src of SENSE_SOURCES) {
      expect(Array.isArray(src.resolve({ characterData: {} })), src.key).toBe(true);
    }
  });
});
