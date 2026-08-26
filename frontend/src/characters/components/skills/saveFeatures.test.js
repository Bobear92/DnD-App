import { describe, it, expect } from 'vitest';
import { getSaveFeatures, saveFeatureKey, SAVE_FEATURES } from './saveFeatures';
import { SUBCLASS_DATA } from '@/characters/components/classData/subclassData';

const CAVALIER = { charClass: 'Fighter', subclass: 'Cavalier', level: 3, edition: '5e' };

describe('getSaveFeatures', () => {
  it('returns a Cavalier Born to the Saddle at the level it is gained', () => {
    const found = getSaveFeatures(CAVALIER);
    expect(found.map(f => f.name)).toContain('Born to the Saddle');
  });

  it('does not return it below the unlock level', () => {
    expect(getSaveFeatures({ ...CAVALIER, level: 2 })).toEqual([]);
  });

  it('does not return it for another Fighter subclass', () => {
    expect(getSaveFeatures({ ...CAVALIER, subclass: 'Champion' })).toEqual([]);
  });

  it('does not return it for a Fighter with no subclass chosen', () => {
    expect(getSaveFeatures({ ...CAVALIER, subclass: undefined })).toEqual([]);
  });

  it('does not return it for another class', () => {
    expect(getSaveFeatures({ ...CAVALIER, charClass: 'Barbarian' })).toEqual([]);
  });

  it('honours the edition gate — Born to the Saddle is 5e only', () => {
    expect(getSaveFeatures({ ...CAVALIER, edition: '5.5e' })).toEqual([]);
  });

  it('returns nothing for an empty context rather than throwing', () => {
    expect(getSaveFeatures()).toEqual([]);
    expect(getSaveFeatures({})).toEqual([]);
  });

  it('reads the description out of the feature table, not a second copy', () => {
    const tableText = SUBCLASS_DATA.Fighter['5e'].Cavalier.features
      .find(f => f.name === 'Born to the Saddle').description;
    const found = getSaveFeatures(CAVALIER).find(f => f.name === 'Born to the Saddle');
    expect(found.description).toBe(tableText);
    expect(found.description).toMatch(/advantage on saving throws/i);
  });

  it('labels the source with the subclass', () => {
    const found = getSaveFeatures(CAVALIER).find(f => f.name === 'Born to the Saddle');
    expect(found.source).toBe('Cavalier');
  });

  it('sorts by the level the feature is gained', () => {
    const levels = getSaveFeatures({ ...CAVALIER, level: 20 }).map(f => f.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });
});

describe('SAVE_FEATURES registry', () => {
  it('every entry resolves to real rules text — no mistyped feature name', () => {
    for (const entry of SAVE_FEATURES.filter((e) => !e.applies)) {
      for (const edition of entry.editions ?? ['5e', '5.5e']) {
        const found = getSaveFeatures({
          charClass: entry.charClass,
          subclass: entry.subclass,
          level: entry.minLevel,
          edition,
        }).find(f => f.name === entry.name);
        expect(found, `${entry.name} (${edition})`).toBeTruthy();
        expect(found.description, `${entry.name} (${edition}) description`).toBeTruthy();
      }
    }
  });

  it('every entry mentions saving throws — the panel is only for save features', () => {
    for (const entry of SAVE_FEATURES.filter((e) => !e.applies)) {
      const edition = (entry.editions ?? ['5e'])[0];
      const found = getSaveFeatures({
        charClass: entry.charClass,
        subclass: entry.subclass,
        level: entry.minLevel,
        edition,
      }).find(f => f.name === entry.name);
      expect(found.description, entry.name).toMatch(/saving throw/i);
    }
  });
});

describe('saveFeatureKey', () => {
  it('builds a DOM-safe key from class, subclass and name', () => {
    expect(saveFeatureKey({ charClass: 'Fighter', subclass: 'Cavalier', name: 'Born to the Saddle' }))
      .toBe('fighter-cavalier-born-to-the-saddle');
  });

  it('omits the subclass for a class feature', () => {
    expect(saveFeatureKey({ charClass: 'Monk', name: 'Diamond Soul' })).toBe('monk-diamond-soul');
  });

  it('is unique per entry in the registry', () => {
    const keys = SAVE_FEATURES.map(saveFeatureKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('Hill Rune (Rune Knight) — advantage on saves against being poisoned', () => {
  const axe = { uid: 'w1', category: 'weapons', name: 'Battleaxe', equipped: true, hand: 'main' };
  const bow = { uid: 'w2', category: 'weapons', name: 'Longbow', equipped: false };
  const ctx = (rune_items) => ({
    charClass: 'Fighter',
    subclass: 'Rune Knight',
    level: 7,
    edition: '5e',
    characterData: { subclass: 'Rune Knight', runes: ['Hill Rune'], rune_items, inventory: [axe, bow] },
  });
  const hill = (c) => getSaveFeatures(c).find((f) => f.name === 'Hill Rune');

  it('is absent while the rune is only known', () => {
    expect(hill(ctx({}))).toBeUndefined();
  });

  it('appears once the rune is carved onto an equipped item', () => {
    expect(hill(ctx({ 'Hill Rune': 'w1' }))).toMatchObject({ source: 'Rune Knight' });
  });

  it('is absent while the bearing item is unequipped', () => {
    expect(hill(ctx({ 'Hill Rune': 'w2' }))).toBeUndefined();
  });

  it('carries the rune rules text, which names the poison save', () => {
    expect(hill(ctx({ 'Hill Rune': 'w1' })).description).toMatch(/against being poisoned/i);
  });

  // The registry sweeps skip `applies` entries (they cannot build the carved-and-equipped
  // state), so this entry carries their two assertions itself.
  it('resolves real rules text that mentions saving throws — the panel is only for save features', () => {
    const found = hill(ctx({ 'Hill Rune': 'w1' }));
    expect(found).toBeTruthy();
    expect(found.description).toMatch(/saving throw/i);
  });

  it('is absent below level 7', () => {
    expect(hill({ ...ctx({ 'Hill Rune': 'w1' }), level: 6 })).toBeUndefined();
  });

  it('does not disturb the Cavalier entry', () => {
    const cav = getSaveFeatures({ charClass: 'Fighter', subclass: 'Cavalier', level: 3, edition: '5e' });
    expect(cav.map((f) => f.name)).toEqual(['Born to the Saddle']);
  });
});
