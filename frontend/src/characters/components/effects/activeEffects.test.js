import { describe, it, expect } from 'vitest';
import {
  ACTIVE_EFFECTS, getActiveEffectDefs, activeEffectKeys, isEffectActive,
  toggleEffectPatch, activeEffectGrants, mightDie, sizeAt,
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
});
