import { describe, it, expect } from 'vitest';
import {
  TRAIT_SKILL_GRANTS,
  getRaceGrantedSkills,
  getRaceGrantedSkillsFromTraits,
  getRaceSkillSources,
  getRaceGrantedTools,
  getRaceGrantedWeapons,
  getRaceGrantedArmor,
} from '@/characters/components/race/raceProficienciesData';

describe('raceProficienciesData', () => {
  describe('TRAIT_SKILL_GRANTS', () => {
    it('maps Keen Senses → Perception', () => {
      expect(TRAIT_SKILL_GRANTS['Keen Senses']).toEqual(['Perception']);
    });

    it('maps Menacing → Intimidation', () => {
      expect(TRAIT_SKILL_GRANTS['Menacing']).toEqual(['Intimidation']);
    });
  });

  describe('getRaceGrantedSkills', () => {
    it('returns empty array when race is null', () => {
      expect(getRaceGrantedSkills(null, null)).toEqual([]);
    });

    it('returns Perception for base Elf (Keen Senses)', () => {
      const elf = { traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'] };
      expect(getRaceGrantedSkills(elf, null)).toEqual(['Perception']);
    });

    it('returns Perception for High Elf (inherits Keen Senses from base Elf)', () => {
      const elf = { traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'] };
      const highElf = { traits: ['Elf Weapon Training', 'Cantrip', 'Extra Language'] };
      expect(getRaceGrantedSkills(elf, highElf)).toEqual(['Perception']);
    });

    it('returns Intimidation for Half-Orc (Menacing)', () => {
      const halfOrc = { traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks'] };
      expect(getRaceGrantedSkills(halfOrc, null)).toEqual(['Intimidation']);
    });

    it('returns empty array for races without skill-granting traits (Dwarf)', () => {
      const dwarf = { traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Tool Proficiency'] };
      expect(getRaceGrantedSkills(dwarf, null)).toEqual([]);
    });

    it('returns empty array for Human (no skill-granting traits)', () => {
      const human = { traits: ['Extra Language', 'Variant: +1 to Two, one Feat, one extra Skill'] };
      expect(getRaceGrantedSkills(human, null)).toEqual([]);
    });

    it('deduplicates when both base race and subrace grant the same skill', () => {
      const a = { traits: ['Keen Senses'] };
      const b = { traits: ['Keen Senses'] };
      expect(getRaceGrantedSkills(a, b)).toEqual(['Perception']);
    });

    it('sorts the result alphabetically', () => {
      // Hypothetical: a race that grants both Intimidation and Perception
      const mixed = { traits: ['Menacing', 'Keen Senses'] };
      expect(getRaceGrantedSkills(mixed, null)).toEqual(['Intimidation', 'Perception']);
    });
  });

  describe('getRaceGrantedSkillsFromTraits', () => {
    it('returns empty array when traits array is empty', () => {
      expect(getRaceGrantedSkillsFromTraits([])).toEqual([]);
    });

    it('returns Perception when Keen Senses is in the traits array', () => {
      expect(getRaceGrantedSkillsFromTraits(['Darkvision', 'Keen Senses'])).toEqual(['Perception']);
    });

    it('returns Intimidation when Menacing is in the traits array', () => {
      expect(getRaceGrantedSkillsFromTraits(['Menacing'])).toEqual(['Intimidation']);
    });

    it('ignores traits that do not grant skills', () => {
      expect(getRaceGrantedSkillsFromTraits(['Darkvision', 'Trance'])).toEqual([]);
    });
  });

  describe('getRaceSkillSources', () => {
    it('returns Perception + Keen Senses for an Elf', () => {
      const elf = { traits: ['Keen Senses'] };
      expect(getRaceSkillSources(elf, null)).toEqual([
        { skill: 'Perception', trait: 'Keen Senses' },
      ]);
    });

    it('returns Intimidation + Menacing for a Half-Orc', () => {
      const halfOrc = { traits: ['Menacing'] };
      expect(getRaceSkillSources(halfOrc, null)).toEqual([
        { skill: 'Intimidation', trait: 'Menacing' },
      ]);
    });

    it('returns empty array for races without skill grants', () => {
      const human = { traits: ['Extra Language'] };
      expect(getRaceSkillSources(human, null)).toEqual([]);
    });

    it('deduplicates skill+trait pairs across base race and subrace', () => {
      const a = { traits: ['Keen Senses'] };
      const b = { traits: ['Keen Senses'] };
      expect(getRaceSkillSources(a, b)).toEqual([
        { skill: 'Perception', trait: 'Keen Senses' },
      ]);
    });
  });

  describe('getRaceGrantedTools', () => {
    it('grants Tinker’s tools for a Rock Gnome (Tinker trait on the subrace)', () => {
      const gnome = { traits: ['Darkvision', 'Gnome Cunning'] };
      const rock = { traits: ["Artificer's Lore", 'Tinker'] };
      expect(getRaceGrantedTools(gnome, rock)).toEqual(["Tinker's tools"]);
    });

    it('excludes the Dwarf "Tool Proficiency" player-choice trait', () => {
      const dwarf = { traits: ['Darkvision', 'Tool Proficiency'] };
      expect(getRaceGrantedTools(dwarf, null)).toEqual([]);
    });

    it('returns empty for races without tool-granting traits', () => {
      expect(getRaceGrantedTools({ traits: ['Brave'] }, null)).toEqual([]);
      expect(getRaceGrantedTools(null, null)).toEqual([]);
    });
  });

  describe('getRaceGrantedWeapons', () => {
    it('grants Elf Weapon Training weapons for a High Elf', () => {
      const elf = { traits: ['Keen Senses'] };
      const high = { traits: ['Elf Weapon Training', 'Cantrip'] };
      expect(getRaceGrantedWeapons(elf, high)).toEqual(
        ['Longbow', 'Longsword', 'Shortbow', 'Shortsword'] // sorted
      );
    });

    it('grants Drow Weapon Training weapons for a Drow', () => {
      const elf = { traits: ['Keen Senses'] };
      const drow = { traits: ['Drow Weapon Training', 'Drow Magic'] };
      expect(getRaceGrantedWeapons(elf, drow)).toEqual(['Hand crossbow', 'Rapier', 'Shortsword']);
    });

    it('returns empty for races without weapon-granting traits', () => {
      expect(getRaceGrantedWeapons({ traits: ['Brave'] }, null)).toEqual([]);
    });
  });

  describe('getRaceGrantedArmor', () => {
    it('grants light + medium armor for a Mountain Dwarf', () => {
      const dwarf = { traits: ['Tool Proficiency'] };
      const mountain = { traits: ['Dwarven Armor Training'] };
      expect(getRaceGrantedArmor(dwarf, mountain)).toEqual(['Light armor', 'Medium armor']);
    });

    it('returns empty for races without armor-granting traits', () => {
      expect(getRaceGrantedArmor({ traits: ['Keen Senses'] }, null)).toEqual([]);
    });
  });
});
