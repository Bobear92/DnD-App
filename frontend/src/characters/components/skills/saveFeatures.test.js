import { describe, it, expect } from 'vitest';
import {
  getSaveFeatures, saveFeatureKey, SAVE_FEATURES,
  saveAdvantageSourcesFor, getSaveAdvantageAbilities, conditionalSaveBonuses, saveAdvantageText,
} from './saveFeatures';
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

// The first entry gated on an ACTIVE EFFECT rather than on what the character permanently has,
// and the first that names an ability — which is what lets the grid tag the STR row instead of
// leaving "advantage on Strength saving throws" as prose under it.
describe("Giant's Might (Rune Knight) — advantage while the effect is running", () => {
  const ctx = ({ level = 3, active = ['giants_might'], edition = '5e' } = {}) => ({
    charClass: 'Fighter',
    subclass: 'Rune Knight',
    level,
    edition,
    characterData: { subclass: 'Rune Knight', active_effects: active },
  });
  const might = (c) => getSaveFeatures(c).find((f) => f.name === "Giant's Might");

  it('appears while the effect is switched on', () => {
    expect(might(ctx())).toMatchObject({ source: 'Rune Knight' });
  });

  it('is absent while it is switched off — an unswitched feature grants nothing', () => {
    expect(might(ctx({ active: [] }))).toBeUndefined();
    expect(getSaveAdvantageAbilities(ctx({ active: [] }))).toEqual([]);
  });

  it('is absent before the feature is earned', () => {
    expect(might(ctx({ level: 2 }))).toBeUndefined();
  });

  it('carries the subclass rules text, read out of the feature table', () => {
    expect(might(ctx()).description).toMatch(/saving throw/i);
  });

  it('tags Strength saves and no others', () => {
    expect(getSaveAdvantageAbilities(ctx())).toEqual(['strength']);
    expect(saveAdvantageSourcesFor('strength', ctx()).map((f) => f.name)).toEqual(["Giant's Might"]);
    expect(saveAdvantageSourcesFor('dexterity', ctx())).toEqual([]);
    expect(saveAdvantageSourcesFor('constitution', ctx())).toEqual([]);
  });

  // Advantage that is scoped by SITUATION and not by ability has nowhere honest to sit on a
  // save row, so those entries stay panel-only. Hill Rune (against poison) is the check.
  it('leaves a situational entry untagged, even though it is listed', () => {
    const hillCtx = {
      charClass: 'Fighter', subclass: 'Rune Knight', level: 7, edition: '5e',
      characterData: {
        subclass: 'Rune Knight',
        runes: ['Hill Rune'],
        rune_items: { 'Hill Rune': 'w1' },
        inventory: [{ uid: 'w1', category: 'weapons', name: 'Battleaxe', equipped: true, hand: 'main' }],
      },
    };
    expect(getSaveFeatures(hillCtx).map((f) => f.name)).toContain('Hill Rune');
    expect(getSaveAdvantageAbilities(hillCtx)).toEqual([]);
  });

  it('does not reach another subclass carrying the key', () => {
    expect(getSaveAdvantageAbilities({
      charClass: 'Fighter', subclass: 'Champion', level: 10, edition: '5e',
      characterData: { subclass: 'Champion', active_effects: ['giants_might'] },
    })).toEqual([]);
  });
});

// 2014 Shield Master's middle clause: "+ your shield's AC bonus to Dexterity saves against
// effects that target only you". It shipped as a display-only note and did nothing (QA).
describe('conditionalSaveBonuses — Shield Master', () => {
  const SHIELD_MASTER = {
    id: 1,
    name: 'Shield Master',
    effects: [{
      kind: 'save_mod',
      abilities: ['dexterity'],
      amount: 'shield_ac',
      condition: 'shield',
      situation: 'against effects that target only you',
    }],
  };
  const SHIELD = { uid: 's1', category: 'armor', armor_type: 'Shield', name: 'Shield', equipped: true };
  const held = (extra = {}) => ({ feats: [SHIELD_MASTER], inventory: [SHIELD], ...extra });

  it('resolves the shield AC bonus to a real number while a shield is equipped', () => {
    const [bonus] = conditionalSaveBonuses('dexterity', held());
    expect(bonus.amount).toBe(2);
    expect(bonus.source).toBe('Shield Master');
    expect(bonus.situation).toBe('against effects that target only you');
  });

  // The whole point of the equipment gate: stow the shield and the bonus is gone. Without
  // this the sheet would promise +2 to a character holding a greatsword.
  it('goes away when no shield is equipped', () => {
    expect(conditionalSaveBonuses('dexterity', held({ inventory: [] }))).toEqual([]);
    expect(conditionalSaveBonuses('dexterity', held({
      inventory: [{ ...SHIELD, equipped: false }],
    }))).toEqual([]);
  });

  it('applies to Dexterity saves only', () => {
    expect(conditionalSaveBonuses('strength', held())).toEqual([]);
    expect(conditionalSaveBonuses('wisdom', held())).toEqual([]);
  });

  it('is nothing for a character without the feat', () => {
    expect(conditionalSaveBonuses('dexterity', { feats: [], inventory: [SHIELD] })).toEqual([]);
  });

  // The bonus is summed into the printed save, so the number is a best case. Both strings
  // the resolver hands out must therefore carry the restriction AND the feat — a surface
  // that showed the number without them would be stating a bonus the character may not have.
  it('builds a breakdown term whose label carries the restriction and the source', () => {
    const [bonus] = conditionalSaveBonuses('dexterity', held());
    expect(bonus.part).toEqual({
      key: 'feat-shield-master',
      label: 'Shield Master (only against effects that target only you)',
      value: 2,
    });
  });

  it('words the grid note as inclusion, with the restriction attached', () => {
    const [bonus] = conditionalSaveBonuses('dexterity', held());
    // "include" not "+2 to …": the bonus is already inside the total it sits under.
    expect(bonus.text).toBe(
      'include +2 from Shield Master — but only against effects that target only you',
    );
  });

  // An unknown gate must never be treated as met — a future condition nobody taught this
  // module about should show nothing rather than an unconditional bonus.
  it('ignores a condition it does not understand', () => {
    const odd = { ...SHIELD_MASTER, effects: [{ ...SHIELD_MASTER.effects[0], condition: 'riding_a_dragon' }] };
    expect(conditionalSaveBonuses('dexterity', { feats: [odd], inventory: [SHIELD] })).toEqual([]);
  });
});

// Feats granting advantage on your OWN saves had no route to the panel at all — the registry
// has no feat key and there was no effect kind, so War Caster's concentration advantage lived
// only in the Feats tab, several clicks from the saves it changes.
describe('getSaveFeatures — feat save advantages', () => {
  const WAR_CASTER = {
    id: 20, name: 'War Caster',
    effects: [{ kind: 'save_advantage', abilities: ['constitution'], situation: 'to maintain concentration' }],
  };
  const CAVALIER_WITH_FEAT = {
    charClass: 'Fighter', subclass: 'Cavalier', level: 3, edition: '5e',
    characterData: { subclass: 'Cavalier', feats: [WAR_CASTER] },
  };

  it('lists the feat alongside class features, labelled as a Feat', () => {
    const found = getSaveFeatures(CAVALIER_WITH_FEAT);
    const warCaster = found.find((f) => f.name === 'War Caster');
    expect(warCaster).toBeTruthy();
    expect(warCaster.source).toBe('Feat');
  });

  // Class features are ordered by the level you gained them; a feat has no level in that
  // sense, so it is appended rather than sorted into the middle of that list.
  it('appends feats after the class features', () => {
    const names = getSaveFeatures(CAVALIER_WITH_FEAT).map((f) => f.name);
    expect(names).toEqual(['Born to the Saddle', 'War Caster']);
  });

  // The snapshot on character_data.feats carries no description, so the panel builds the
  // sentence from the same fields the mechanic uses — it cannot drift from them.
  it('builds the description from the effect', () => {
    const warCaster = getSaveFeatures(CAVALIER_WITH_FEAT).find((f) => f.name === 'War Caster');
    expect(warCaster.description)
      .toBe('Advantage on Constitution saving throws to maintain concentration.');
  });

  it('tags no save row for a situation-scoped feat advantage', () => {
    expect(getSaveAdvantageAbilities(CAVALIER_WITH_FEAT)).toEqual([]);
    expect(saveAdvantageSourcesFor('constitution', CAVALIER_WITH_FEAT)).toEqual([]);
  });

  it('gives a character with no such feat nothing extra', () => {
    const names = getSaveFeatures({
      charClass: 'Fighter', subclass: 'Cavalier', level: 3, edition: '5e',
      characterData: { subclass: 'Cavalier', feats: [] },
    }).map((f) => f.name);
    expect(names).toEqual(['Born to the Saddle']);
  });
});

describe('saveAdvantageText', () => {
  it('names the abilities and the situation', () => {
    expect(saveAdvantageText({ abilities: ['constitution'], situation: 'to maintain concentration' }))
      .toBe('Advantage on Constitution saving throws to maintain concentration.');
  });

  // No ability named means ALL of them, so the sentence must not name one.
  it('says plain "saving throws" when RAW names no ability', () => {
    expect(saveAdvantageText({ abilities: [], situation: 'to avoid or resist traps' }))
      .toBe('Advantage on saving throws to avoid or resist traps.');
  });

  it('reads correctly with no situation at all', () => {
    expect(saveAdvantageText({ abilities: ['wisdom'] })).toBe('Advantage on Wisdom saving throws.');
  });
});
