import { describe, it, expect } from 'vitest';
import { gatherProficiencies } from './inventoryProficiencies';

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
});
