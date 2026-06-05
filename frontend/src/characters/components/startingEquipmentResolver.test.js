import { describe, it, expect } from 'vitest';
import {
  buildItemIndex, weaponNamesOfCategory, defaultSelectedOptions,
  enumerateChooseSlots, buildStartingInventory,
} from './startingEquipmentResolver';
import {
  CLASS_STARTING_EQUIPMENT_5E, CLASS_STARTING_WEALTH_5E,
  BACKGROUND_STARTING_EQUIPMENT_5E, classStartingEquipment, backgroundStartingEquipment,
} from './startingEquipmentData';

const WEAPONS = [
  { id: 1, name: 'Longsword', weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d8', damage_type: 'Slashing' },
  { id: 2, name: 'Greataxe', weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d12', damage_type: 'Slashing' },
  { id: 3, name: 'Dagger', weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d4', damage_type: 'Piercing' },
  { id: 4, name: 'Light Crossbow', weapon_category: 'Simple', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing' },
];
const ARMOR = [
  { id: 10, name: 'Chain Mail', armor_type: 'Heavy', armor_class: 16 },
  { id: 11, name: 'Shield', armor_type: 'Shield' },
];
const GEAR = [
  { id: 20, name: "Dungeoneer's Pack", category: 'Pack' },
];

const index = buildItemIndex({ weapons: WEAPONS, armor: ARMOR, 'adventuring-gear': GEAR });

describe('item index + weapon filters', () => {
  it('buildItemIndex maps names case-insensitively', () => {
    expect(index.weapons['longsword'].id).toBe(1);
    expect(index.armor['chain mail'].armor_class).toBe(16);
  });

  it('weaponNamesOfCategory filters by simple/martial', () => {
    expect(weaponNamesOfCategory(WEAPONS, 'martial')).toEqual(['Greataxe', 'Longsword']);
    expect(weaponNamesOfCategory(WEAPONS, 'simple')).toEqual(['Dagger', 'Light Crossbow']);
  });
});

describe('option defaults + choose slots', () => {
  const fighter = classStartingEquipment('Fighter');

  it('defaultSelectedOptions picks the first option of each choice group', () => {
    const sel = defaultSelectedOptions(fighter);
    expect(sel).toEqual({ f1: 'a', f2: 'a', f3: 'a', f4: 'a' });
  });

  it('enumerateChooseSlots surfaces the martial-weapon pick for Fighter f2 option a', () => {
    const slots = enumerateChooseSlots(fighter, { f1: 'a', f2: 'a', f3: 'a', f4: 'a' });
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ filter: 'martial', category: 'weapons' });
  });

  it('enumerateChooseSlots surfaces two martial picks for Fighter f2 option b', () => {
    const slots = enumerateChooseSlots(fighter, { f1: 'a', f2: 'b', f3: 'a', f4: 'a' });
    expect(slots).toHaveLength(2);
  });
});

describe('buildStartingInventory', () => {
  const fighter = classStartingEquipment('Fighter');

  it('resolves specific items to real encyclopedia snapshots with stats', () => {
    const inv = buildStartingInventory({ classEquip: fighter, selectedOptions: { f1: 'a', f2: 'a', f3: 'a', f4: 'a' }, picks: { 'f2:a:0': 'Longsword' }, index });
    const chain = inv.find((e) => e.name === 'Chain Mail');
    expect(chain).toMatchObject({ category: 'armor', armor_class: 16, source_id: 10 });
    const longsword = inv.find((e) => e.name === 'Longsword');
    expect(longsword).toMatchObject({ category: 'weapons', damage: '1d8', source_id: 1 });
    const shield = inv.find((e) => e.name === 'Shield');
    expect(shield).toBeTruthy();
  });

  it('applies quantity (20 crossbow bolts)', () => {
    const inv = buildStartingInventory({ classEquip: fighter, selectedOptions: { f1: 'a', f2: 'a', f3: 'a', f4: 'a' }, picks: { 'f2:a:0': 'Longsword' }, index });
    const bolts = inv.find((e) => e.name === 'Crossbow Bolts');
    expect(bolts.quantity).toBe(20);
  });

  it('falls back to a plain entry when an item is not in the encyclopedia', () => {
    const inv = buildStartingInventory({ classEquip: fighter, selectedOptions: { f1: 'a', f2: 'a', f3: 'a', f4: 'a' }, picks: { 'f2:a:0': 'Longsword' }, index });
    const bolts = inv.find((e) => e.name === 'Crossbow Bolts');
    expect(bolts.source_id).toBeNull(); // not seeded in this test index → plain entry
    expect(bolts.category).toBe('adventuring-gear');
  });

  it('skips an unpicked choose slot', () => {
    const inv = buildStartingInventory({ classEquip: fighter, selectedOptions: { f1: 'a', f2: 'a', f3: 'a', f4: 'a' }, picks: {}, index });
    expect(inv.find((e) => e.name === 'Longsword')).toBeUndefined(); // martial pick not made
    expect(inv.find((e) => e.name === 'Chain Mail')).toBeTruthy(); // fixed/specific still resolve
  });

  it('expands an equipment pack into its individual contents', () => {
    const inv = buildStartingInventory({ classEquip: fighter, selectedOptions: { f1: 'a', f2: 'a', f3: 'a', f4: 'a' }, picks: { 'f2:a:0': 'Longsword' }, index });
    // Fighter f4 default = Dungeoneer's Pack → expanded, no single "pack" entry remains.
    expect(inv.some((e) => e.name === "Dungeoneer's Pack")).toBe(false);
    expect(inv.some((e) => e.name === 'Backpack')).toBe(true);
    const torches = inv.find((e) => e.name === 'Torch');
    expect(torches.quantity).toBe(10);
    const rations = inv.find((e) => e.name === 'Rations');
    expect(rations.quantity).toBe(10);
  });

  it('includes background items', () => {
    const inv = buildStartingInventory({ classEquip: fighter, bgEquip: backgroundStartingEquipment('Acolyte'), selectedOptions: { f1: 'a', f2: 'a', f3: 'a', f4: 'a' }, picks: { 'f2:a:0': 'Longsword' }, index });
    expect(inv.find((e) => e.name === 'Holy Symbol')).toBeTruthy();
    expect(inv.find((e) => e.name === 'Vestments')).toBeTruthy();
  });

  it("substitutes a background's chosen tool for the generic Artisan's Tools placeholder", () => {
    const inv = buildStartingInventory({
      classEquip: null,
      bgEquip: backgroundStartingEquipment('Guild Artisan'), // includes Artisan's Tools
      bgToolChoice: "Mason's Tools",
      index,
    });
    expect(inv.some((e) => e.name === "Artisan's Tools")).toBe(false);
    expect(inv.some((e) => e.name === "Mason's Tools")).toBe(true);
  });
});

describe('data integrity', () => {
  it('all 13 classes have valid equipment groups + starting wealth', () => {
    const classes = Object.keys(CLASS_STARTING_EQUIPMENT_5E);
    expect(classes).toHaveLength(13);
    for (const cls of classes) {
      const eq = CLASS_STARTING_EQUIPMENT_5E[cls];
      expect(Array.isArray(eq.groups)).toBe(true);
      for (const grp of eq.groups) {
        if (grp.fixed) {
          expect(Array.isArray(grp.fixed)).toBe(true);
        } else {
          expect(grp.id).toBeTruthy();
          expect(grp.options.length).toBeGreaterThanOrEqual(2);
          for (const opt of grp.options) {
            expect(opt.key).toBeTruthy();
            expect(opt.label).toBeTruthy();
            expect(Array.isArray(opt.refs)).toBe(true);
          }
        }
      }
      expect(CLASS_STARTING_WEALTH_5E[cls].avg).toBeGreaterThan(0);
    }
  });

  it('all 13 backgrounds have an equipment list', () => {
    expect(Object.keys(BACKGROUND_STARTING_EQUIPMENT_5E)).toHaveLength(13);
    for (const items of Object.values(BACKGROUND_STARTING_EQUIPMENT_5E)) {
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    }
  });
});
