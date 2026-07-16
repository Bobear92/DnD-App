import { describe, it, expect } from 'vitest';
import { gatherProficiencies } from '@/characters/components/inventory/inventoryProficiencies';

describe('gatherProficiencies', () => {
  it('pulls weapon/armor/tool text from the class', () => {
    const p = gatherProficiencies({ charClass: 'Fighter', characterData: {} });
    expect(p.weapons.text).toMatch(/martial weapons/i);
    expect(p.armor.text).toMatch(/all armor/i);
    expect(p.tools.text).toBe(''); // Fighter has no tool proficiency
  });

  it('includes a Rogue tool text', () => {
    const p = gatherProficiencies({ charClass: 'Rogue', characterData: {} });
    expect(p.tools.text).toMatch(/thieves/i);
  });

  it('gathers chosen + race tool grants from character_data', () => {
    const p = gatherProficiencies({
      charClass: 'Fighter',
      characterData: {
        background_tool_choice: "Mason's tools",
        race_tool_proficiency: "Smith's tools",
        race_tool_proficiencies: ["Tinker's tools"],
        tool_choice: 'Lute',
      },
    });
    expect(p.tools.grants).toEqual(expect.arrayContaining(["Mason's tools", "Smith's tools", "Tinker's tools", 'Lute']));
  });

  it('includes subclass tool proficiencies (e.g. Student of War choice)', () => {
    const p = gatherProficiencies({ charClass: 'Fighter', characterData: { subclass_tool_proficiencies: ["Smith's Tools"] } });
    expect(p.tools.grants).toContain("Smith's Tools");
  });

  it('dedups and drops falsy grants', () => {
    const p = gatherProficiencies({
      charClass: 'Fighter',
      characterData: { background_tool_choice: "Mason's tools", race_tool_proficiency: "Mason's tools", tool_choice: '' },
    });
    expect(p.tools.grants).toEqual(["Mason's tools"]);
  });

  it('surfaces race weapon/armor grants', () => {
    const p = gatherProficiencies({
      charClass: 'Wizard',
      characterData: { race_weapon_proficiencies: ['Longsword', 'Shortbow'], race_armor_proficiencies: ['Medium'] },
    });
    expect(p.weapons.grants).toEqual(['Longsword', 'Shortbow']);
    expect(p.armor.grants).toEqual(['Medium']);
  });

  it('handles an unknown class', () => {
    const p = gatherProficiencies({ charClass: 'Nonexistent', characterData: {} });
    expect(p.weapons.text).toBe('');
    expect(p.tools.grants).toEqual([]);
  });

  describe('redundant grant filtering', () => {
    it('drops specific weapon grants already covered by simple/martial weapons class text', () => {
      // Fighter has "Simple weapons, martial weapons" — Elf Weapon Training adds nothing new.
      const p = gatherProficiencies({
        charClass: 'Fighter',
        characterData: { race_weapon_proficiencies: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'] },
      });
      expect(p.weapons.grants).toEqual([]);
    });

    it('keeps specific weapon grants NOT covered by the class', () => {
      // Wizard has no simple/martial category — Elf weapons still matter.
      const p = gatherProficiencies({
        charClass: 'Wizard',
        characterData: { race_weapon_proficiencies: ['Longsword', 'Shortbow'] },
      });
      expect(p.weapons.grants).toEqual(['Longsword', 'Shortbow']);
    });

    it('drops a specific weapon named in a plural class weapon list', () => {
      // Bard lists "longswords, rapiers, shortswords" specifically; a Drow grant is redundant.
      const p = gatherProficiencies({
        charClass: 'Bard',
        characterData: { race_weapon_proficiencies: ['Rapier', 'Shortsword', 'Hand crossbow'] },
      });
      expect(p.weapons.grants).toEqual([]);
    });

    it('keeps only the weapons a class does NOT already cover', () => {
      // Sorcerer covers none of these by name/category; all stay.
      const p = gatherProficiencies({
        charClass: 'Sorcerer',
        characterData: { race_weapon_proficiencies: ['Battleaxe', 'Handaxe'] },
      });
      expect(p.weapons.grants).toEqual(['Battleaxe', 'Handaxe']);
    });

    it('keeps a broad weapon grant the class text does not cover', () => {
      // Hexblade grants Martial weapons; Warlock text is only "Simple weapons".
      const p = gatherProficiencies({
        charClass: 'Warlock',
        subclass: 'The Hexblade',
        characterData: {},
      });
      expect(p.weapons.grants).toContain('Martial weapons');
    });

    it('drops a specific weapon grant covered by a broader (feat/subclass) grant', () => {
      // Hexblade Warlock gains Martial weapons — a racial Longsword grant is now redundant.
      const p = gatherProficiencies({
        charClass: 'Warlock',
        subclass: 'The Hexblade',
        characterData: { race_weapon_proficiencies: ['Longsword'] },
      });
      expect(p.weapons.grants).toEqual(['Martial weapons']);
    });

    it('drops armor grants already covered by "All armor"', () => {
      // Fighter has "All armor, shields" — Dwarven Armor Training adds nothing.
      const p = gatherProficiencies({
        charClass: 'Fighter',
        characterData: { race_armor_proficiencies: ['Light armor', 'Medium armor'] },
      });
      expect(p.armor.grants).toEqual([]);
    });

    it('drops an armor tier and shield the class text already lists', () => {
      // Cleric has "Light armor, medium armor, shields"; a Medium + Shields grant is redundant.
      const p = gatherProficiencies({
        charClass: 'Cleric',
        characterData: { race_armor_proficiencies: ['Medium', 'Shields'] },
      });
      expect(p.armor.grants).toEqual([]);
    });

    it('keeps an armor grant the class does not cover', () => {
      // Wizard has no armor — Dwarven Armor Training matters.
      const p = gatherProficiencies({
        charClass: 'Wizard',
        characterData: { race_armor_proficiencies: ['Light armor', 'Medium'] },
      });
      expect(p.armor.grants).toEqual(['Light armor', 'Medium']);
    });

    it('drops a tool grant the class text already lists', () => {
      // Artificer lists "tinker's tools" — a Rock Gnome Tinker grant is redundant.
      const p = gatherProficiencies({
        charClass: 'Artificer',
        characterData: { race_tool_proficiencies: ["Tinker's tools"] },
      });
      expect(p.tools.grants).not.toContain("Tinker's tools");
    });

    it('keeps a concrete chosen tool even alongside a generic class description', () => {
      // Monk text is "One type of artisan's tools or one musical instrument"; the pick shows.
      const p = gatherProficiencies({
        charClass: 'Monk',
        characterData: { tool_choice: 'Lute' },
      });
      expect(p.tools.grants).toContain('Lute');
    });
  });
});
