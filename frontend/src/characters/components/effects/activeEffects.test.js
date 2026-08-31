import { describe, it, expect } from 'vitest';
import {
  ACTIVE_EFFECTS, getActiveEffectDefs, activeEffectKeys, isEffectActive,
  toggleEffectPatch, activeEffectGrants, mightDie, sizeAt,
  activeEffectCheckParts, activeEffectSaveParts, FROST_RUNE_BONUS,
  activeEffectCheckSources, activeEffectSaveSources,
  activeEffectCheckBonus, activeEffectSaveBonus,
} from '@/characters/components/effects/activeEffects';

const runeKnight = (level, extra = {}) => ({
  charClass: 'Fighter', subclass: 'Rune Knight', level, edition: '5e', ...extra,
});

describe('activeEffects', () => {
  describe('which effects a character has earned', () => {
    it('gives a Rune Knight Giant\'s Might from level 3', () => {
      expect(getActiveEffectDefs(runeKnight(3)).map((e) => e.key)).toEqual(['giants_might']);
    });

    it('does not give it below the unlock level', () => {
      expect(getActiveEffectDefs(runeKnight(2))).toEqual([]);
    });

    it('does not give it to another Fighter subclass', () => {
      expect(getActiveEffectDefs({ ...runeKnight(10), subclass: 'Champion' })).toEqual([]);
    });

    it('does not give it in a 2024 campaign — there is no 2024 Rune Knight', () => {
      expect(getActiveEffectDefs({ ...runeKnight(10), edition: '5.5e' })).toEqual([]);
    });
  });

  describe('the damage die and size scale with the later features', () => {
    // Great Stature (L10) and Runic Juggernaut (L18) do nothing but change these numbers, so
    // they are level-keyed here rather than being entries of their own.
    it('is 1d6 at 3, 1d8 from Great Stature, 1d10 from Runic Juggernaut', () => {
      expect(mightDie(3)).toBe('1d6');
      expect(mightDie(9)).toBe('1d6');
      expect(mightDie(10)).toBe('1d8');
      expect(mightDie(17)).toBe('1d8');
      expect(mightDie(18)).toBe('1d10');
    });

    it('grows you Large, and Huge once Runic Juggernaut lands', () => {
      expect(sizeAt(3)).toBe('Large');
      expect(sizeAt(17)).toBe('Large');
      expect(sizeAt(18)).toBe('Huge');
    });
  });

  describe('switching an effect on and off', () => {
    it('reports nothing active by default', () => {
      expect(activeEffectKeys({})).toEqual([]);
      expect(isEffectActive({}, 'giants_might')).toBe(false);
    });

    it('switches on, and is idempotent', () => {
      const on = toggleEffectPatch({}, 'giants_might', true);
      expect(on).toEqual({ active_effects: ['giants_might'] });
      expect(toggleEffectPatch(on, 'giants_might', true)).toEqual({ active_effects: ['giants_might'] });
    });

    it('switches off without disturbing another running effect', () => {
      const data = { active_effects: ['giants_might', 'something_else'] };
      expect(toggleEffectPatch(data, 'giants_might', false))
        .toEqual({ active_effects: ['something_else'] });
    });
  });

  describe('what an active effect grants', () => {
    it('grants nothing while switched off', () => {
      const g = activeEffectGrants(runeKnight(10, { characterData: {} }));
      expect(g.size).toBeNull();
      expect(g.attackDie).toBeNull();
      expect(g.advantageAbilities).toEqual([]);
      expect(g.sources).toEqual([]);
    });

    it('grants size, Strength advantage and the damage die while switched on', () => {
      const g = activeEffectGrants(runeKnight(10, {
        characterData: { active_effects: ['giants_might'] },
      }));
      expect(g.size).toBe('Large');
      expect(g.attackDie).toBe('1d8');
      // RAW is Strength CHECKS and Strength SAVES — not saving throws generally, which is how
      // the stored feature blurb reads.
      expect(g.advantageAbilities).toEqual(['strength']);
      expect(g.advantageSaves).toEqual(['strength']);
      expect(g.reachBonus).toBe(0);
      expect(g.sources).toEqual(["Giant's Might"]);
    });

    it('adds Huge + 5 ft of reach at 18 (Runic Juggernaut)', () => {
      const g = activeEffectGrants(runeKnight(18, {
        characterData: { active_effects: ['giants_might'] },
      }));
      expect(g.size).toBe('Huge');
      expect(g.attackDie).toBe('1d10');
      expect(g.reachBonus).toBe(5);
    });

    it('ignores a stored effect the character has not earned', () => {
      // A GM lowering a level, or a stale key, must not keep granting the benefit.
      const g = activeEffectGrants(runeKnight(2, {
        characterData: { active_effects: ['giants_might'] },
      }));
      expect(g.size).toBeNull();
    });

    it('ignores an unknown effect key entirely', () => {
      const g = activeEffectGrants(runeKnight(10, {
        characterData: { active_effects: ['not_a_real_effect'] },
      }));
      expect(g.size).toBeNull();
      expect(g.sources).toEqual([]);
    });
  });

  it('every authored effect has the fields the consumers read', () => {
    for (const e of ACTIVE_EFFECTS) {
      expect(typeof e.key).toBe('string');
      expect(typeof e.label).toBe('string');
      expect(typeof e.grants).toBe('function');
      expect(typeof e.summary).toBe('function');
      expect(e.grants(20)).toBeTruthy();
    }
  });

  // The SECOND effect, and the one that made `grants` carry a NUMBER. It is also the first
  // gated on equipment: a rune grants nothing until it is carved onto something you hold.
  describe('Channel Rune: Frost', () => {
    const axe = { uid: 'w1', category: 'weapons', name: 'Battleaxe', equipped: true, hand: 'main' };
    const stowed = { uid: 'w2', category: 'weapons', name: 'Longbow', equipped: false };
    const ctx = ({ carvedOn = 'w1', active = true, level = 3 } = {}) => runeKnight(level, {
      characterData: {
        subclass: 'Rune Knight',
        runes: ['Frost Rune'],
        rune_items: carvedOn ? { 'Frost Rune': carvedOn } : {},
        inventory: [axe, stowed],
        active_effects: active ? ['channel_rune_frost'] : [],
      },
    });

    it('is offered once the rune is carved onto an equipped object', () => {
      expect(getActiveEffectDefs(ctx()).map((e) => e.key)).toContain('channel_rune_frost');
    });

    it('is not offered while the rune is uncarved', () => {
      expect(getActiveEffectDefs(ctx({ carvedOn: null })).map((e) => e.key))
        .not.toContain('channel_rune_frost');
    });

    it('is not offered while the bearing item is stowed — carving alone grants nothing', () => {
      expect(getActiveEffectDefs(ctx({ carvedOn: 'w2' })).map((e) => e.key))
        .not.toContain('channel_rune_frost');
    });

    it('adds its bonus to Strength and Constitution checks while running', () => {
      expect(activeEffectCheckParts('strength', ctx()))
        .toEqual([{ key: 'effect:channel_rune_frost', label: 'Channel Rune: Frost', value: FROST_RUNE_BONUS }]);
      expect(activeEffectCheckParts('constitution', ctx()).map((p) => p.value))
        .toEqual([FROST_RUNE_BONUS]);
    });

    it('adds the same bonus to Strength and Constitution SAVES', () => {
      expect(activeEffectSaveParts('strength', ctx()).map((p) => p.value)).toEqual([FROST_RUNE_BONUS]);
      expect(activeEffectSaveParts('constitution', ctx()).map((p) => p.value)).toEqual([FROST_RUNE_BONUS]);
    });

    it('touches no other ability', () => {
      for (const ability of ['dexterity', 'intelligence', 'wisdom', 'charisma']) {
        expect(activeEffectCheckParts(ability, ctx())).toEqual([]);
        expect(activeEffectSaveParts(ability, ctx())).toEqual([]);
      }
    });

    it('adds nothing while it is switched off, though the rune is carved and equipped', () => {
      expect(activeEffectCheckParts('strength', ctx({ active: false }))).toEqual([]);
      expect(activeEffectSaveParts('strength', ctx({ active: false }))).toEqual([]);
    });

    // The key can linger in active_effects after the axe is stowed. The effect simply stops
    // resolving, which is the honest answer for a rune you are no longer carrying.
    it('stops resolving when the bearing item is unequipped mid-effect', () => {
      expect(activeEffectCheckParts('strength', ctx({ carvedOn: 'w2' }))).toEqual([]);
    });

    it('names itself in the grants sources, alongside another running effect', () => {
      const both = runeKnight(10, {
        characterData: {
          subclass: 'Rune Knight',
          runes: ['Frost Rune'],
          rune_items: { 'Frost Rune': 'w1' },
          inventory: [axe],
          active_effects: ['giants_might', 'channel_rune_frost'],
        },
      });
      const g = activeEffectGrants(both);
      expect(g.sources).toEqual(["Giant's Might", 'Channel Rune: Frost']);
      expect(g.checkBonuses.strength).toBe(FROST_RUNE_BONUS);
      expect(g.saveBonuses.constitution).toBe(FROST_RUNE_BONUS);
      // Giant's Might is untouched by the new fields.
      expect(g.size).toBe('Large');
    });

    it('leaves the bonus maps empty when nothing grants one', () => {
      const g = activeEffectGrants(runeKnight(10, {
        characterData: { active_effects: ['giants_might'] },
      }));
      expect(g.checkBonuses).toEqual({});
      expect(g.saveBonuses).toEqual({});
    });
  });
});

// The grouped-by-source view, for a legend or a summary line — the per-ability `…Parts` helpers
// answer "what does THIS row add up to", which is a different question.
describe('bonus sources and totals', () => {
  const axe = { uid: 'w1', category: 'weapons', name: 'Battleaxe', equipped: true, hand: 'main' };
  const frost = (active = true) => ({
    charClass: 'Fighter', subclass: 'Rune Knight', level: 7, edition: '5e',
    characterData: {
      subclass: 'Rune Knight',
      runes: ['Frost Rune'],
      rune_items: { 'Frost Rune': 'w1' },
      inventory: [axe],
      active_effects: active ? ['channel_rune_frost'] : [],
    },
  });

  it('groups a running effect by source, with the abilities it covers', () => {
    expect(activeEffectCheckSources(frost())).toEqual([{
      key: 'channel_rune_frost',
      source: 'Channel Rune: Frost',
      amount: FROST_RUNE_BONUS,
      abilities: ['strength', 'constitution'],
    }]);
    expect(activeEffectSaveSources(frost()).map((s) => s.source)).toEqual(['Channel Rune: Frost']);
  });

  it('lists nothing while the effect is off', () => {
    expect(activeEffectCheckSources(frost(false))).toEqual([]);
    expect(activeEffectSaveSources(frost(false))).toEqual([]);
  });

  it('totals the bonus per ability — the number a row tag shows', () => {
    expect(activeEffectCheckBonus('strength', frost())).toBe(FROST_RUNE_BONUS);
    expect(activeEffectSaveBonus('constitution', frost())).toBe(FROST_RUNE_BONUS);
    expect(activeEffectCheckBonus('dexterity', frost())).toBe(0);
    expect(activeEffectSaveBonus('strength', frost(false))).toBe(0);
  });

  it('lists nothing for an effect that grants no flat bonus at all', () => {
    const mightOnly = {
      charClass: 'Fighter', subclass: 'Rune Knight', level: 10, edition: '5e',
      characterData: { subclass: 'Rune Knight', active_effects: ['giants_might'] },
    };
    expect(activeEffectCheckSources(mightOnly)).toEqual([]);
    expect(activeEffectSaveBonus('strength', mightOnly)).toBe(0);
  });
});
