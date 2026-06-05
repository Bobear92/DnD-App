/**
 * 5e (2014) starting equipment for classes and backgrounds.
 *
 * Item references resolve (startingEquipmentResolver.js) to encyclopedia snapshots
 * by exact name, falling back to a plain inventory entry when not found.
 *
 * Ref shapes:
 *   { name, category, quantity }                       — a specific item
 *   { choose: 'simple'|'martial', category:'weapons', quantity, label }  — player picks a weapon of that category
 *
 * A class is a list of GROUPS:
 *   { fixed: [ref] }                                   — always granted
 *   { id, prompt, options: [{ key, label, refs:[ref] }] }  — pick one option
 *
 * A background is a flat list of granted item refs.
 */

const w = (name, quantity = 1) => ({ name, category: 'weapons', quantity });
const a = (name, quantity = 1) => ({ name, category: 'armor', quantity });
const g = (name, quantity = 1) => ({ name, category: 'adventuring-gear', quantity });
const pickM = (label = 'a martial weapon') => ({ choose: 'martial', category: 'weapons', quantity: 1, label });
const pickS = (label = 'a simple weapon') => ({ choose: 'simple', category: 'weapons', quantity: 1, label });

export const CLASS_STARTING_EQUIPMENT_5E = {
  Barbarian: { groups: [
    { id: 'b1', prompt: 'Primary weapon', options: [
      { key: 'a', label: 'A greataxe', refs: [w('Greataxe')] },
      { key: 'b', label: 'Any martial melee weapon', refs: [pickM()] },
    ] },
    { id: 'b2', prompt: 'Secondary weapon', options: [
      { key: 'a', label: 'Two handaxes', refs: [w('Handaxe', 2)] },
      { key: 'b', label: 'Any simple weapon', refs: [pickS()] },
    ] },
    { fixed: [g("Explorer's Pack"), w('Javelin', 4)] },
  ] },

  Bard: { groups: [
    { id: 'b1', prompt: 'Weapon', options: [
      { key: 'a', label: 'A rapier', refs: [w('Rapier')] },
      { key: 'b', label: 'A longsword', refs: [w('Longsword')] },
      { key: 'c', label: 'Any simple weapon', refs: [pickS()] },
    ] },
    { id: 'b2', prompt: 'Pack', options: [
      { key: 'a', label: "A diplomat's pack", refs: [g("Diplomat's Pack")] },
      { key: 'b', label: "An entertainer's pack", refs: [g("Entertainer's Pack")] },
    ] },
    { id: 'b3', prompt: 'Instrument', options: [
      { key: 'a', label: 'A lute', refs: [g('Lute')] },
      { key: 'b', label: 'Any other musical instrument', refs: [g('Musical Instrument')] },
    ] },
    { fixed: [a('Leather'), w('Dagger')] },
  ] },

  Cleric: { groups: [
    { id: 'c1', prompt: 'Weapon', options: [
      { key: 'a', label: 'A mace', refs: [w('Mace')] },
      { key: 'b', label: 'A warhammer (if proficient)', refs: [w('Warhammer')] },
    ] },
    { id: 'c2', prompt: 'Armor', options: [
      { key: 'a', label: 'Scale mail', refs: [a('Scale Mail')] },
      { key: 'b', label: 'Leather armor', refs: [a('Leather')] },
      { key: 'c', label: 'Chain mail (if proficient)', refs: [a('Chain Mail')] },
    ] },
    { id: 'c3', prompt: 'Ranged option', options: [
      { key: 'a', label: 'A light crossbow and 20 bolts', refs: [w('Light Crossbow'), g('Crossbow Bolts', 20)] },
      { key: 'b', label: 'Any simple weapon', refs: [pickS()] },
    ] },
    { id: 'c4', prompt: 'Pack', options: [
      { key: 'a', label: "A priest's pack", refs: [g("Priest's Pack")] },
      { key: 'b', label: "An explorer's pack", refs: [g("Explorer's Pack")] },
    ] },
    { fixed: [a('Shield'), g('Holy Symbol')] },
  ] },

  Druid: { groups: [
    { id: 'd1', prompt: 'Shield or weapon', options: [
      { key: 'a', label: 'A wooden shield', refs: [a('Shield')] },
      { key: 'b', label: 'Any simple weapon', refs: [pickS()] },
    ] },
    { id: 'd2', prompt: 'Melee weapon', options: [
      { key: 'a', label: 'A scimitar', refs: [w('Scimitar')] },
      { key: 'b', label: 'Any simple melee weapon', refs: [pickS('a simple melee weapon')] },
    ] },
    { fixed: [a('Leather'), g("Explorer's Pack"), g('Druidic Focus')] },
  ] },

  Fighter: { groups: [
    { id: 'f1', prompt: 'Armor', options: [
      { key: 'a', label: 'Chain mail', refs: [a('Chain Mail')] },
      { key: 'b', label: 'Leather armor, longbow, and 20 arrows', refs: [a('Leather'), w('Longbow'), g('Arrows', 20)] },
    ] },
    { id: 'f2', prompt: 'Weapons', options: [
      { key: 'a', label: 'A martial weapon and a shield', refs: [pickM(), a('Shield')] },
      { key: 'b', label: 'Two martial weapons', refs: [pickM('first martial weapon'), pickM('second martial weapon')] },
    ] },
    { id: 'f3', prompt: 'Ranged option', options: [
      { key: 'a', label: 'A light crossbow and 20 bolts', refs: [w('Light Crossbow'), g('Crossbow Bolts', 20)] },
      { key: 'b', label: 'Two handaxes', refs: [w('Handaxe', 2)] },
    ] },
    { id: 'f4', prompt: 'Pack', options: [
      { key: 'a', label: "A dungeoneer's pack", refs: [g("Dungeoneer's Pack")] },
      { key: 'b', label: "An explorer's pack", refs: [g("Explorer's Pack")] },
    ] },
  ] },

  Monk: { groups: [
    { id: 'm1', prompt: 'Weapon', options: [
      { key: 'a', label: 'A shortsword', refs: [w('Shortsword')] },
      { key: 'b', label: 'Any simple weapon', refs: [pickS()] },
    ] },
    { id: 'm2', prompt: 'Pack', options: [
      { key: 'a', label: "A dungeoneer's pack", refs: [g("Dungeoneer's Pack")] },
      { key: 'b', label: "An explorer's pack", refs: [g("Explorer's Pack")] },
    ] },
    { fixed: [w('Dart', 10)] },
  ] },

  Paladin: { groups: [
    { id: 'p1', prompt: 'Weapons', options: [
      { key: 'a', label: 'A martial weapon and a shield', refs: [pickM(), a('Shield')] },
      { key: 'b', label: 'Two martial weapons', refs: [pickM('first martial weapon'), pickM('second martial weapon')] },
    ] },
    { id: 'p2', prompt: 'Thrown / melee', options: [
      { key: 'a', label: 'Five javelins', refs: [w('Javelin', 5)] },
      { key: 'b', label: 'Any simple melee weapon', refs: [pickS('a simple melee weapon')] },
    ] },
    { id: 'p3', prompt: 'Pack', options: [
      { key: 'a', label: "A priest's pack", refs: [g("Priest's Pack")] },
      { key: 'b', label: "An explorer's pack", refs: [g("Explorer's Pack")] },
    ] },
    { fixed: [a('Chain Mail'), g('Holy Symbol')] },
  ] },

  Ranger: { groups: [
    { id: 'r1', prompt: 'Armor', options: [
      { key: 'a', label: 'Scale mail', refs: [a('Scale Mail')] },
      { key: 'b', label: 'Leather armor', refs: [a('Leather')] },
    ] },
    { id: 'r2', prompt: 'Melee weapons', options: [
      { key: 'a', label: 'Two shortswords', refs: [w('Shortsword', 2)] },
      { key: 'b', label: 'Two simple melee weapons', refs: [pickS('first simple melee weapon'), pickS('second simple melee weapon')] },
    ] },
    { id: 'r3', prompt: 'Pack', options: [
      { key: 'a', label: "A dungeoneer's pack", refs: [g("Dungeoneer's Pack")] },
      { key: 'b', label: "An explorer's pack", refs: [g("Explorer's Pack")] },
    ] },
    { fixed: [w('Longbow'), g('Arrows', 20)] },
  ] },

  Rogue: { groups: [
    { id: 'r1', prompt: 'Primary weapon', options: [
      { key: 'a', label: 'A rapier', refs: [w('Rapier')] },
      { key: 'b', label: 'A shortsword', refs: [w('Shortsword')] },
    ] },
    { id: 'r2', prompt: 'Ranged / secondary', options: [
      { key: 'a', label: 'A shortbow and 20 arrows', refs: [w('Shortbow'), g('Arrows', 20)] },
      { key: 'b', label: 'A shortsword', refs: [w('Shortsword')] },
    ] },
    { id: 'r3', prompt: 'Pack', options: [
      { key: 'a', label: "A burglar's pack", refs: [g("Burglar's Pack")] },
      { key: 'b', label: "A dungeoneer's pack", refs: [g("Dungeoneer's Pack")] },
      { key: 'c', label: "An explorer's pack", refs: [g("Explorer's Pack")] },
    ] },
    { fixed: [a('Leather'), w('Dagger', 2), g("Thieves' Tools")] },
  ] },

  Sorcerer: { groups: [
    { id: 's1', prompt: 'Weapon', options: [
      { key: 'a', label: 'A light crossbow and 20 bolts', refs: [w('Light Crossbow'), g('Crossbow Bolts', 20)] },
      { key: 'b', label: 'Any simple weapon', refs: [pickS()] },
    ] },
    { id: 's2', prompt: 'Spellcasting focus', options: [
      { key: 'a', label: 'A component pouch', refs: [g('Component Pouch')] },
      { key: 'b', label: 'An arcane focus', refs: [g('Arcane Focus')] },
    ] },
    { id: 's3', prompt: 'Pack', options: [
      { key: 'a', label: "A dungeoneer's pack", refs: [g("Dungeoneer's Pack")] },
      { key: 'b', label: "An explorer's pack", refs: [g("Explorer's Pack")] },
    ] },
    { fixed: [w('Dagger', 2)] },
  ] },

  Warlock: { groups: [
    { id: 'w1', prompt: 'Weapon', options: [
      { key: 'a', label: 'A light crossbow and 20 bolts', refs: [w('Light Crossbow'), g('Crossbow Bolts', 20)] },
      { key: 'b', label: 'Any simple weapon', refs: [pickS()] },
    ] },
    { id: 'w2', prompt: 'Spellcasting focus', options: [
      { key: 'a', label: 'A component pouch', refs: [g('Component Pouch')] },
      { key: 'b', label: 'An arcane focus', refs: [g('Arcane Focus')] },
    ] },
    { id: 'w3', prompt: 'Pack', options: [
      { key: 'a', label: "A scholar's pack", refs: [g("Scholar's Pack")] },
      { key: 'b', label: "A dungeoneer's pack", refs: [g("Dungeoneer's Pack")] },
    ] },
    { fixed: [a('Leather'), pickS(), w('Dagger', 2)] },
  ] },

  Wizard: { groups: [
    { id: 'w1', prompt: 'Weapon', options: [
      { key: 'a', label: 'A quarterstaff', refs: [w('Quarterstaff')] },
      { key: 'b', label: 'A dagger', refs: [w('Dagger')] },
    ] },
    { id: 'w2', prompt: 'Spellcasting focus', options: [
      { key: 'a', label: 'A component pouch', refs: [g('Component Pouch')] },
      { key: 'b', label: 'An arcane focus', refs: [g('Arcane Focus')] },
    ] },
    { id: 'w3', prompt: 'Pack', options: [
      { key: 'a', label: "A scholar's pack", refs: [g("Scholar's Pack")] },
      { key: 'b', label: "An explorer's pack", refs: [g("Explorer's Pack")] },
    ] },
    { fixed: [g('Spellbook')] },
  ] },

  Artificer: { groups: [
    { id: 'a1', prompt: 'Weapons', options: [
      { key: 'a', label: 'Any two simple weapons', refs: [pickS('first simple weapon'), pickS('second simple weapon')] },
      { key: 'b', label: 'A light crossbow and 20 bolts', refs: [w('Light Crossbow'), g('Crossbow Bolts', 20)] },
    ] },
    { id: 'a2', prompt: 'Armor', options: [
      { key: 'a', label: 'Studded leather armor', refs: [a('Studded Leather')] },
      { key: 'b', label: 'Scale mail', refs: [a('Scale Mail')] },
    ] },
    { fixed: [g("Thieves' Tools"), g("Dungeoneer's Pack")] },
  ] },
};

// Average gp if a player takes starting wealth instead of class equipment.
export const CLASS_STARTING_WEALTH_5E = {
  Barbarian: { dice: '2d4 × 10', avg: 50 },
  Bard: { dice: '5d4 × 10', avg: 125 },
  Cleric: { dice: '5d4 × 10', avg: 125 },
  Druid: { dice: '2d4 × 10', avg: 50 },
  Fighter: { dice: '5d4 × 10', avg: 125 },
  Monk: { dice: '5d4', avg: 13 },
  Paladin: { dice: '5d4 × 10', avg: 125 },
  Ranger: { dice: '5d4 × 10', avg: 125 },
  Rogue: { dice: '4d4 × 10', avg: 100 },
  Sorcerer: { dice: '3d4 × 10', avg: 75 },
  Warlock: { dice: '4d4 × 10', avg: 100 },
  Wizard: { dice: '4d4 × 10', avg: 100 },
  Artificer: { dice: '5d4 × 10', avg: 125 },
};

// Background equipment (the gold pouch is handled separately by BACKGROUND_STARTING_GOLD).
export const BACKGROUND_STARTING_EQUIPMENT_5E = {
  Acolyte: [g('Holy Symbol'), g('Prayer Book'), g('Incense', 5), g('Vestments'), g('Common Clothes')],
  Charlatan: [g('Fine Clothes'), g('Disguise Kit'), g('Forgery Kit')],
  Criminal: [g('Crowbar'), g('Common Clothes')],
  Entertainer: [g('Musical Instrument'), g('Costume')],
  'Folk Hero': [g("Artisan's Tools"), g('Shovel'), g('Iron Pot'), g('Common Clothes')],
  'Guild Artisan': [g("Artisan's Tools"), g("Traveler's Clothes")],
  Hermit: [g('Scroll Case'), g('Blanket'), g('Herbalism Kit'), g('Common Clothes')],
  Noble: [g('Fine Clothes'), g('Signet Ring')],
  Outlander: [g('Staff'), g('Hunting Trap'), g("Traveler's Clothes")],
  Sage: [g('Ink'), g('Ink Pen'), w('Dagger'), g('Common Clothes')],
  Sailor: [w('Club'), g('Silk Rope'), g('Lucky Charm'), g('Common Clothes')],
  Soldier: [g('Insignia of Rank'), g('Gaming Set'), g('Common Clothes')],
  Urchin: [w('Dagger'), g('Map'), g('Common Clothes')],
};

// Equipment-pack contents (PHB). When a pack is granted at creation it expands into
// these individual inventory items (see startingEquipmentResolver.buildStartingInventory).
export const PACK_CONTENTS = {
  "Burglar's Pack": [g('Backpack'), g('Ball Bearings'), g('String (10 feet)'), g('Bell'), g('Candle', 5), g('Crowbar'), g('Hammer'), g('Piton', 10), g('Hooded Lantern'), g('Oil (flask)', 2), g('Rations', 5), g('Tinderbox'), g('Waterskin'), g('Hempen Rope (50 feet)')],
  "Diplomat's Pack": [g('Chest'), g('Map or Scroll Case', 2), g('Fine Clothes'), g('Ink'), g('Ink Pen'), g('Lamp'), g('Oil (flask)', 2), g('Paper (sheet)', 5), g('Perfume'), g('Sealing Wax'), g('Soap')],
  "Dungeoneer's Pack": [g('Backpack'), g('Crowbar'), g('Hammer'), g('Piton', 10), g('Torch', 10), g('Tinderbox'), g('Rations', 10), g('Waterskin'), g('Hempen Rope (50 feet)')],
  "Entertainer's Pack": [g('Backpack'), g('Bedroll'), g('Costume', 2), g('Candle', 5), g('Rations', 5), g('Waterskin'), g('Disguise Kit')],
  "Explorer's Pack": [g('Backpack'), g('Bedroll'), g('Mess Kit'), g('Tinderbox'), g('Torch', 10), g('Rations', 10), g('Waterskin'), g('Hempen Rope (50 feet)')],
  "Priest's Pack": [g('Backpack'), g('Blanket'), g('Candle', 10), g('Tinderbox'), g('Alms Box'), g('Incense', 2), g('Censer'), g('Vestments'), g('Rations', 2), g('Waterskin')],
  "Scholar's Pack": [g('Backpack'), g('Book of Lore'), g('Ink'), g('Ink Pen'), g('Parchment (sheet)', 10), g('Bag of Sand'), g('Small Knife')],
};

export function classStartingEquipment(charClass) {
  return CLASS_STARTING_EQUIPMENT_5E[charClass] ?? null;
}
export function backgroundStartingEquipment(name) {
  return BACKGROUND_STARTING_EQUIPMENT_5E[name] ?? [];
}
export function classStartingWealth(charClass) {
  return CLASS_STARTING_WEALTH_5E[charClass] ?? null;
}
