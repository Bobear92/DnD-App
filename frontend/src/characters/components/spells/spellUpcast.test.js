import { describe, it, expect } from 'vitest';
import {
  spellSaveAbility, spellUsesAttackRoll, computeUpcastDice, summarizeUpcast, classifyUpcast,
  cantripDamageAtLevel, summarizeCantrip,
} from '@/characters/components/spells/spellUpcast';

const FIRE_BOLT = {
  name: 'Fire Bolt', level: 0,
  description: "You hurl a mote of fire. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage.\n\nThis spell's damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10).",
};
const SACRED_FLAME = {
  name: 'Sacred Flame', level: 0,
  description: "The target must succeed on a dexterity saving throw or take 1d8 radiant damage.\n\nThe spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).",
};
const ELDRITCH_BLAST = {
  name: 'Eldritch Blast', level: 0,
  description: 'Make a ranged spell attack against the target. On a hit, the target takes 1d10 force damage. The spell creates more than one beam when you reach higher levels: two beams at 5th level, three beams at 11th level, and four beams at 17th level.',
};
const MAGE_HAND = {
  name: 'Mage Hand', level: 0,
  description: 'A spectral, floating hand appears at a point you choose within range.',
};

const FIREBALL = {
  name: 'Fireball', level: 3,
  description: 'Each creature in a 20-foot-radius sphere must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much on a success.',
  higher_level: 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.',
};
const CURE_WOUNDS = {
  name: 'Cure Wounds', level: 1,
  description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.',
  higher_level: 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.',
};
const SHIELD = {
  name: 'Shield', level: 1,
  description: 'An invisible barrier of magical force appears and protects you. You have a +5 bonus to AC.',
  higher_level: '',
};
const MAGIC_MISSILE = {
  name: 'Magic Missile', level: 1,
  description: 'You create three glowing darts. Each dart hits a creature of your choice and deals 1d4 + 1 force damage.',
  higher_level: 'When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.',
};
const CHROMATIC_ORB = {
  name: 'Chromatic Orb', level: 1,
  description: 'You hurl a sphere. Make a ranged spell attack against the target. On a hit, the target takes 3d8 damage of the chosen type.',
  higher_level: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.',
};

describe('spellUpcast', () => {
  describe('spellSaveAbility', () => {
    it('detects the save ability as a 3-letter tag', () => {
      expect(spellSaveAbility(FIREBALL.description)).toBe('DEX');
    });
    it('returns null when the spell forces no save', () => {
      expect(spellSaveAbility(SHIELD.description)).toBeNull();
      expect(spellSaveAbility(MAGIC_MISSILE.description)).toBeNull();
    });
    it('handles empty/undefined description', () => {
      expect(spellSaveAbility()).toBeNull();
      expect(spellSaveAbility('')).toBeNull();
    });
  });

  describe('spellUsesAttackRoll', () => {
    it('detects a spell attack', () => {
      expect(spellUsesAttackRoll(CHROMATIC_ORB.description)).toBe(true);
    });
    it('is false for save / auto-hit spells', () => {
      expect(spellUsesAttackRoll(FIREBALL.description)).toBe(false);
      expect(spellUsesAttackRoll(MAGIC_MISSILE.description)).toBe(false);
    });
  });

  describe('computeUpcastDice', () => {
    it('computes Fireball damage at a higher slot (8d6 base → 10d6 at 5th)', () => {
      const d = computeUpcastDice(FIREBALL, 5);
      expect(d).toMatchObject({ base: '8d6', atLevel: '10d6', die: 6, kind: 'damage' });
    });
    it('returns base dice unchanged at the spell\'s own level', () => {
      expect(computeUpcastDice(FIREBALL, 3)).toMatchObject({ atLevel: '8d6' });
    });
    it('computes healing (Cure Wounds 1d8 → 3d8 at 3rd)', () => {
      expect(computeUpcastDice(CURE_WOUNDS, 3)).toMatchObject({ atLevel: '3d8', kind: 'healing' });
    });
    it('returns null for a count-based upcast (Magic Missile — more darts)', () => {
      expect(computeUpcastDice(MAGIC_MISSILE, 3)).toBeNull();
    });
    it('returns null when the spell has no higher_level text', () => {
      expect(computeUpcastDice(SHIELD, 3)).toBeNull();
    });
    it('flags ambiguity when several differing base dice share the scaling die size', () => {
      const spell = {
        level: 1,
        description: 'It deals 2d6 fire and 4d6 cold damage.',
        higher_level: 'the damage increases by 1d6 for each slot level above 1st.',
      };
      expect(computeUpcastDice(spell, 2)).toMatchObject({ ambiguous: true });
    });
    it('is not ambiguous when the same base count repeats', () => {
      const spell = {
        level: 1,
        description: 'It deals 2d6 damage, and again 2d6 damage on the next turn.',
        higher_level: 'the damage increases by 1d6 for each slot level above 1st.',
      };
      expect(computeUpcastDice(spell, 2)).toMatchObject({ base: '2d6', atLevel: '3d6' });
    });
  });

  describe('summarizeUpcast', () => {
    it('marks upcast and includes computed damage + save DC', () => {
      const s = summarizeUpcast(FIREBALL, 5, { saveDc: 15 });
      expect(s.isUpcast).toBe(true);
      expect(s.damage).toMatchObject({ atLevel: '10d6' });
      expect(s.save).toEqual({ ability: 'DEX', dc: 15 });
      expect(s.noExtraEffect).toBe(false);
    });
    it('omits the save line when no DC is supplied', () => {
      expect(summarizeUpcast(FIREBALL, 5, {}).save).toBeNull();
    });
    it('reports no extra effect for a spell without higher_level (Shield)', () => {
      const s = summarizeUpcast(SHIELD, 2, { saveDc: 15 });
      expect(s.noExtraEffect).toBe(true);
      expect(s.hasHigherLevel).toBe(false);
      expect(s.damage).toBeNull();
      expect(s.save).toBeNull(); // Shield forces no save
    });
    it('includes attack bonus for a spell-attack spell, damage falls back to prose when ambiguous', () => {
      const s = summarizeUpcast(CHROMATIC_ORB, 2, { attackBonus: 6 });
      expect(s.attackBonus).toBe(6);
      expect(s.damage).toMatchObject({ atLevel: '4d8' });
    });
    it('keeps prose but no computed damage for a count-based upcast (Magic Missile)', () => {
      const s = summarizeUpcast(MAGIC_MISSILE, 3, {});
      expect(s.hasHigherLevel).toBe(true);
      expect(s.damage).toBeNull();
    });
    it('is not an upcast at the base level', () => {
      expect(summarizeUpcast(FIREBALL, 3, {}).isUpcast).toBe(false);
    });
  });

  describe('cantripDamageAtLevel', () => {
    it('scales at 1/5/11/17 (Fire Bolt 1d10 → 2d10 → 3d10 → 4d10)', () => {
      expect(cantripDamageAtLevel(FIRE_BOLT, 1).atLevel).toBe('1d10');
      expect(cantripDamageAtLevel(FIRE_BOLT, 4).atLevel).toBe('1d10');
      expect(cantripDamageAtLevel(FIRE_BOLT, 5).atLevel).toBe('2d10');
      expect(cantripDamageAtLevel(FIRE_BOLT, 10).atLevel).toBe('2d10');
      expect(cantripDamageAtLevel(FIRE_BOLT, 11).atLevel).toBe('3d10');
      expect(cantripDamageAtLevel(FIRE_BOLT, 17).atLevel).toBe('4d10');
      expect(cantripDamageAtLevel(FIRE_BOLT, 20).atLevel).toBe('4d10');
    });
    it('scales a d8 save cantrip (Sacred Flame)', () => {
      expect(cantripDamageAtLevel(SACRED_FLAME, 11).atLevel).toBe('3d8');
    });
    it('returns null for a beam-scaling cantrip (Eldritch Blast — dice do not scale)', () => {
      expect(cantripDamageAtLevel(ELDRITCH_BLAST, 17)).toBeNull();
    });
    it('returns null for a non-damage cantrip (Mage Hand)', () => {
      expect(cantripDamageAtLevel(MAGE_HAND, 20)).toBeNull();
    });
  });

  describe('summarizeCantrip', () => {
    it('gives damage + attack bonus for an attack cantrip', () => {
      const s = summarizeCantrip(FIRE_BOLT, 11, { attackBonus: 7 });
      expect(s.damage.atLevel).toBe('3d10');
      expect(s.attackBonus).toBe(7);
      expect(s.save).toBeNull();
    });
    it('gives damage + save DC for a save cantrip', () => {
      const s = summarizeCantrip(SACRED_FLAME, 5, { saveDc: 15 });
      expect(s.damage.atLevel).toBe('2d8');
      expect(s.save).toEqual({ ability: 'DEX', dc: 15 });
      expect(s.attackBonus).toBeNull();
    });
    it('omits DC/attack when not supplied, keeps damage', () => {
      const s = summarizeCantrip(FIRE_BOLT, 5, {});
      expect(s.damage.atLevel).toBe('2d10');
      expect(s.attackBonus).toBeNull();
    });
    it('is all-null for a utility cantrip', () => {
      const s = summarizeCantrip(MAGE_HAND, 20, { saveDc: 15, attackBonus: 7 });
      expect(s.damage).toBeNull();
      expect(s.save).toBeNull();
      expect(s.attackBonus).toBeNull();
    });
  });

  describe('classifyUpcast', () => {
    it('classifies a no-scaling spell as none', () => {
      expect(classifyUpcast(SHIELD).status).toBe('none');
    });
    it('classifies a clean dice spell as computed', () => {
      expect(classifyUpcast(FIREBALL).status).toBe('computed');
      expect(classifyUpcast(CURE_WOUNDS).status).toBe('computed');
    });
    it('classifies a count-based upcast as prose-only with a reason', () => {
      const c = classifyUpcast(MAGIC_MISSILE);
      expect(c.status).toBe('prose-only');
      expect(c.reason).toMatch(/non-dice/i);
    });
    it('classifies an ambiguous-dice spell as prose-only', () => {
      const spell = {
        level: 1,
        description: 'It deals 2d6 fire and 4d6 cold damage.',
        higher_level: 'the damage increases by 1d6 for each slot level above 1st.',
      };
      expect(classifyUpcast(spell).status).toBe('prose-only');
      expect(classifyUpcast(spell).reason).toMatch(/ambiguous/i);
    });
  });
});
