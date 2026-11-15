import { describe, it, expect } from 'vitest';
import { buildCharacterContext, ABILITY_KEYS } from './characterContext';
import { matchesGate } from './featureGate';

const character = {
  id: 1, name: 'Aldric', race: 'Human', char_class: 'Fighter', level: 5,
  strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 8, charisma: 11,
  character_data: {
    subclass: 'Champion',
    subrace: 'Variant',
    feats: [{ id: 1, name: 'Tough' }],
    inventory: [{ uid: 'a', name: 'Longsword' }],
    race_traits: ['Darkvision'],
    second_wind_used: 1,
  },
};

describe('buildCharacterContext — saved character, no drafts', () => {
  const ctx = buildCharacterContext({ character, campaign: { edition: '5.5e' } });

  it('reads the standard facts off the saved character', () => {
    expect(ctx.charClass).toBe('Fighter');
    expect(ctx.subclass).toBe('Champion');
    expect(ctx.level).toBe(5);
    expect(ctx.edition).toBe('5.5e');
    expect(ctx.race).toBe('Human');
    expect(ctx.subrace).toBe('Variant');
  });

  it('exposes the character_data collections every surface asks for', () => {
    expect(ctx.characterData).toBe(character.character_data);
    expect(ctx.feats).toEqual([{ id: 1, name: 'Tough' }]);
    expect(ctx.inventory).toEqual([{ uid: 'a', name: 'Longsword' }]);
    expect(ctx.raceTraits).toEqual(['Darkvision']);
  });

  it('carries every ability score, its modifier, and the proficiency bonus', () => {
    expect(Object.keys(ctx.scores)).toEqual(ABILITY_KEYS);
    expect(ctx.scores).toEqual({ strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 8, charisma: 11 });
    expect(ctx.mods).toEqual({ strength: 3, dexterity: 1, constitution: 2, intelligence: 0, wisdom: -1, charisma: 0 });
    expect(ctx.pb).toBe(3);
  });
});

describe('buildCharacterContext — drafts win over the saved character', () => {
  it('an unsaved subclass change is what every surface sees', () => {
    const ctx = buildCharacterContext({ character, draftData: { ...character.character_data, subclass: 'Samurai' } });
    expect(ctx.subclass).toBe('Samurai');
    expect(ctx.characterData.subclass).toBe('Samurai');
  });

  it('unsaved feats and inventory come from the draft', () => {
    const draftData = { ...character.character_data, feats: [], inventory: [{ uid: 'b', name: 'Bow' }] };
    const ctx = buildCharacterContext({ character, draftData });
    expect(ctx.feats).toEqual([]);
    expect(ctx.inventory).toEqual([{ uid: 'b', name: 'Bow' }]);
  });

  it('an unsaved ability score moves the score AND its modifier together', () => {
    const ctx = buildCharacterContext({ character, draftIdentity: { constitution: 18 } });
    expect(ctx.scores.constitution).toBe(18);
    expect(ctx.mods.constitution).toBe(4);
    expect(ctx.scores.strength).toBe(16);
  });

  it('an unsaved race or level comes from the identity draft, and PB follows the level', () => {
    const ctx = buildCharacterContext({ character, draftIdentity: { race: 'Elf', level: 9 } });
    expect(ctx.race).toBe('Elf');
    expect(ctx.level).toBe(9);
    expect(ctx.pb).toBe(4);
  });

  it('a partial draft is layered over the saved data rather than replacing it', () => {
    const ctx = buildCharacterContext({ character, draftData: { second_wind_used: 0 } });
    expect(ctx.characterData.second_wind_used).toBe(0);
    expect(ctx.subclass).toBe('Champion');
    expect(ctx.feats).toEqual([{ id: 1, name: 'Tough' }]);
  });

  it('does not mutate the saved character or the draft', () => {
    const saved = JSON.stringify(character);
    const draftData = { subclass: 'Samurai' };
    buildCharacterContext({ character, draftData, draftIdentity: { level: 9 } });
    expect(JSON.stringify(character)).toBe(saved);
    expect(draftData).toEqual({ subclass: 'Samurai' });
  });

  it('a null draft (page still loading) falls back to the saved character', () => {
    const ctx = buildCharacterContext({ character, draftData: null, draftIdentity: null });
    expect(ctx.subclass).toBe('Champion');
    expect(ctx.level).toBe(5);
  });
});

describe('buildCharacterContext — missing data', () => {
  it('defaults the edition to 5e without a campaign', () => {
    expect(buildCharacterContext({ character }).edition).toBe('5e');
    expect(buildCharacterContext({ character, campaign: {} }).edition).toBe('5e');
  });

  it('a character with no character_data yields empty collections, not undefined', () => {
    const ctx = buildCharacterContext({ character: { char_class: 'Rogue', level: 1 } });
    expect(ctx.characterData).toEqual({});
    expect(ctx.feats).toEqual([]);
    expect(ctx.inventory).toEqual([]);
    expect(ctx.raceTraits).toEqual([]);
    expect(ctx.subclass).toBeUndefined();
  });

  it('missing ability scores count as 10 and a missing level as 1', () => {
    const ctx = buildCharacterContext({ character: { char_class: 'Rogue' } });
    for (const key of ABILITY_KEYS) {
      expect(ctx.scores[key]).toBe(10);
      expect(ctx.mods[key]).toBe(0);
    }
    expect(ctx.level).toBe(1);
    expect(ctx.pb).toBe(2);
  });

  it('survives being called with nothing', () => {
    const ctx = buildCharacterContext();
    expect(ctx.charClass).toBeUndefined();
    expect(ctx.level).toBe(1);
    expect(ctx.edition).toBe('5e');
  });
});

describe('buildCharacterContext feeds matchesGate directly', () => {
  it('the context object is a valid gate ctx with no reshaping', () => {
    const ctx = buildCharacterContext({ character, campaign: { edition: '5e' } });
    expect(matchesGate({ charClass: 'Fighter', subclass: 'Champion', minLevel: 3, edition: '5e' }, ctx)).toBe(true);
    expect(matchesGate({ charClass: 'Fighter', subclass: 'Champion', minLevel: 7 }, ctx)).toBe(false);
    expect(matchesGate({ applies: ({ feats }) => feats.some((f) => f.name === 'Tough') }, ctx)).toBe(true);
  });

  it('a draft subclass change flips a subclass gate immediately', () => {
    const gate = { charClass: 'Fighter', subclass: 'Samurai', minLevel: 3 };
    expect(matchesGate(gate, buildCharacterContext({ character }))).toBe(false);
    expect(matchesGate(gate, buildCharacterContext({ character, draftData: { subclass: 'Samurai' } }))).toBe(true);
  });
});
