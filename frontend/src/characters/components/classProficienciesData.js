// Per-class starting proficiencies (PHB 2014). Free-text fields mirror the rulebook
// wording; parsing helpers (e.g. inventoryData.isWeaponProficient) interpret them.
// Shared by CharacterCreate (Variant Human feat armor prereq) and the inventory
// equip/attack math (CharacterDetail Items tab).
export const CLASS_PROFICIENCIES_5E = {
  Artificer: { armor: 'Light armor, medium armor, shields', weapons: 'Simple weapons', tools: "Thieves' tools, tinker's tools, two artisan's tools of your choice", saving_throws: ['Constitution', 'Intelligence'] },
  Barbarian: { armor: 'Light armor, medium armor, shields', weapons: 'Simple weapons, martial weapons', tools: null, saving_throws: ['Strength', 'Constitution'] },
  Bard:      { armor: 'Light armor', weapons: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords', tools: 'Three musical instruments of your choice', saving_throws: ['Dexterity', 'Charisma'] },
  Cleric:    { armor: 'Light armor, medium armor, shields', weapons: 'Simple weapons', tools: null, saving_throws: ['Wisdom', 'Charisma'] },
  Druid:     { armor: 'Light armor, medium armor, shields (no metal)', weapons: 'Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears', tools: 'Herbalism kit', saving_throws: ['Intelligence', 'Wisdom'] },
  Fighter:   { armor: 'All armor, shields', weapons: 'Simple weapons, martial weapons', tools: null, saving_throws: ['Strength', 'Constitution'] },
  Monk:      { armor: 'None', weapons: 'Simple weapons, shortswords', tools: "One type of artisan's tools or one musical instrument", saving_throws: ['Strength', 'Dexterity'] },
  Paladin:   { armor: 'All armor, shields', weapons: 'Simple weapons, martial weapons', tools: null, saving_throws: ['Wisdom', 'Charisma'] },
  Ranger:    { armor: 'Light armor, medium armor, shields', weapons: 'Simple weapons, martial weapons', tools: null, saving_throws: ['Strength', 'Dexterity'] },
  Rogue:     { armor: 'Light armor', weapons: "Simple weapons, hand crossbows, longswords, rapiers, shortswords", tools: "Thieves' tools", saving_throws: ['Dexterity', 'Intelligence'] },
  Sorcerer:  { armor: 'None', weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows', tools: null, saving_throws: ['Constitution', 'Charisma'] },
  Warlock:   { armor: 'Light armor', weapons: 'Simple weapons', tools: null, saving_throws: ['Wisdom', 'Charisma'] },
  Wizard:    { armor: 'None', weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows', tools: null, saving_throws: ['Intelligence', 'Wisdom'] },
};
