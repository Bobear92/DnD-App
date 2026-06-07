import { describe, it, expect } from 'vitest';
import {
  buildEntry, addEntry, removeEntry, setQuantity, getByCategory, normalizeWeapons,
  toggleEquipped, toggleAttuned, attunedCount,
  equippedBodyArmor, equippedShield, computeArmorClass,
  isWeaponProficient, isArmorProficient, weaponAbility, computeAttack, getAttacks,
  abilityMod, profBonus,
} from './inventoryData';

const armor = (over) => ({ uid: Math.random().toString(), category: 'armor', equipped: false, ...over });
const weapon = (over) => ({ uid: Math.random().toString(), category: 'weapons', equipped: false, ...over });

describe('normalizeWeapons', () => {
  it('splits a stacked weapon into individual quantity-1 entries', () => {
    const inv = normalizeWeapons([weapon({ uid: 'h1', name: 'Handaxe', quantity: 2, equipped: true })]);
    expect(inv).toHaveLength(2);
    expect(inv.map((e) => e.uid)).toEqual(['h1', 'h1-2']);
    expect(inv.every((e) => e.quantity === 1)).toBe(true);
    // only the first copy inherits the equipped flag
    expect(inv[0].equipped).toBe(true);
    expect(inv[1].equipped).toBe(false);
  });

  it('leaves single weapons and non-weapons untouched', () => {
    const inv = normalizeWeapons([
      weapon({ uid: 'w1', name: 'Longsword', quantity: 1 }),
      { uid: 'g1', category: 'adventuring-gear', name: 'Arrows', quantity: 20 },
    ]);
    expect(inv).toHaveLength(2);
    expect(inv.find((e) => e.uid === 'g1').quantity).toBe(20); // ammo still stacks
  });

  it('is idempotent (re-running on split inventory is a no-op)', () => {
    const once = normalizeWeapons([weapon({ uid: 'h1', name: 'Handaxe', quantity: 3 })]);
    const twice = normalizeWeapons(once);
    expect(twice.map((e) => e.uid)).toEqual(['h1', 'h1-2', 'h1-3']);
    expect(twice).toHaveLength(3);
  });
});

describe('inventory CRUD', () => {
  it('addEntry snapshots the item, strips id/owner, defaults quantity/equipped', () => {
    const inv = addEntry([], 'weapons', { id: 5, owner_type: 'system', owner_id: null, name: 'Longsword', damage: '1d8', weapon_category: 'Martial' });
    expect(inv).toHaveLength(1);
    const e = inv[0];
    expect(e.category).toBe('weapons');
    expect(e.source_id).toBe(5);
    expect(e.id).toBeUndefined();
    expect(e.owner_type).toBeUndefined();
    expect(e.name).toBe('Longsword');
    expect(e.quantity).toBe(1);
    expect(e.equipped).toBe(false);
    expect(e.uid).toBeTruthy();
  });

  it('removeEntry drops by uid', () => {
    const inv = addEntry([], 'potions', { name: 'Potion of Healing' });
    expect(removeEntry(inv, inv[0].uid)).toHaveLength(0);
  });

  it('setQuantity clamps to a minimum of 1', () => {
    const inv = addEntry([], 'adventuring-gear', { name: 'Torch' });
    expect(setQuantity(inv, inv[0].uid, 5)[0].quantity).toBe(5);
    expect(setQuantity(inv, inv[0].uid, 0)[0].quantity).toBe(1);
    expect(setQuantity(inv, inv[0].uid, -3)[0].quantity).toBe(1);
  });

  it('buildEntry keeps the routing slug + count when the item has its own category/quantity fields', () => {
    // Adventuring-gear / food items carry `category` ("Equipment Pack") and `quantity` ("50 ft."/null)
    // fields that must NOT clobber the inventory routing slug or owned count.
    const e = buildEntry('adventuring-gear', { id: 9, name: "Explorer's Pack", category: 'Equipment Pack', quantity: null, description: 'A backpack…' }, 1);
    expect(e.category).toBe('adventuring-gear'); // routing slug, not "Equipment Pack"
    expect(e.quantity).toBe(1);                  // owned count, not the item's null quantity
    expect(e.item_category).toBe('Equipment Pack'); // preserved for display
    expect(e.source_id).toBe(9);
    expect(e.name).toBe("Explorer's Pack");
  });

  it('getByCategory filters', () => {
    let inv = addEntry([], 'weapons', { name: 'Dagger' });
    inv = addEntry(inv, 'armor', { name: 'Shield', armor_type: 'Shield' });
    expect(getByCategory(inv, 'weapons')).toHaveLength(1);
    expect(getByCategory(inv, 'armor')).toHaveLength(1);
  });
});

describe('equip rules', () => {
  it('equipping a second body armor unequips the first', () => {
    const inv = [armor({ uid: 'a', armor_type: 'Heavy', equipped: true, name: 'Plate' }), armor({ uid: 'b', armor_type: 'Light', name: 'Leather' })];
    const next = toggleEquipped(inv, 'b');
    expect(next.find((e) => e.uid === 'a').equipped).toBe(false);
    expect(next.find((e) => e.uid === 'b').equipped).toBe(true);
  });

  it('a shield equips independently of body armor', () => {
    const inv = [armor({ uid: 'a', armor_type: 'Heavy', equipped: true, name: 'Plate' }), armor({ uid: 's', armor_type: 'Shield', name: 'Shield' })];
    const next = toggleEquipped(inv, 's');
    expect(next.find((e) => e.uid === 'a').equipped).toBe(true);
    expect(next.find((e) => e.uid === 's').equipped).toBe(true);
  });

  it('weapons stack (equipping one does not unequip another)', () => {
    const inv = [weapon({ uid: 'w1', equipped: true, name: 'Dagger' }), weapon({ uid: 'w2', name: 'Shortsword' })];
    const next = toggleEquipped(inv, 'w2');
    expect(next.find((e) => e.uid === 'w1').equipped).toBe(true);
    expect(next.find((e) => e.uid === 'w2').equipped).toBe(true);
  });

  it('attunement is capped at 3', () => {
    let inv = [1, 2, 3, 4].map((n) => ({ uid: `m${n}`, category: 'magic-items', attuned: false, name: `Item ${n}` }));
    inv = toggleAttuned(inv, 'm1');
    inv = toggleAttuned(inv, 'm2');
    inv = toggleAttuned(inv, 'm3');
    expect(attunedCount(inv)).toBe(3);
    inv = toggleAttuned(inv, 'm4'); // blocked
    expect(attunedCount(inv)).toBe(3);
    expect(inv.find((e) => e.uid === 'm4').attuned).toBe(false);
    inv = toggleAttuned(inv, 'm1'); // un-attune frees a slot
    expect(attunedCount(inv)).toBe(2);
  });
});

describe('computeArmorClass', () => {
  it('light armor adds full DEX', () => {
    const inv = [armor({ armor_type: 'Light', armor_class: 11, equipped: true, name: 'Leather' })];
    expect(computeArmorClass({ inventory: inv, scores: { dexterity: 16 } }).value).toBe(14); // 11 + 3
  });

  it('medium armor caps DEX at +2', () => {
    const inv = [armor({ armor_type: 'Medium', armor_class: 15, equipped: true, name: 'Half Plate' })];
    expect(computeArmorClass({ inventory: inv, scores: { dexterity: 18 } }).value).toBe(17); // 15 + 2
  });

  it('heavy armor ignores DEX', () => {
    const inv = [armor({ armor_type: 'Heavy', armor_class: 16, equipped: true, name: 'Chain Mail' })];
    expect(computeArmorClass({ inventory: inv, scores: { dexterity: 16 } }).value).toBe(16);
  });

  it('a shield adds +2', () => {
    const inv = [
      armor({ armor_type: 'Heavy', armor_class: 16, equipped: true, name: 'Chain Mail' }),
      armor({ armor_type: 'Shield', equipped: true, name: 'Shield' }),
    ];
    expect(computeArmorClass({ inventory: inv, scores: { dexterity: 10 } }).value).toBe(18);
  });

  it('uses the Barbarian unarmored formula when no body armor is worn', () => {
    const ac = computeArmorClass({ inventory: [], scores: { dexterity: 14, constitution: 16 }, charClass: 'Barbarian' });
    expect(ac.value).toBe(15); // 10 + 2 + 3
  });

  it('falls back to 10 + DEX unarmored', () => {
    const ac = computeArmorClass({ inventory: [], scores: { dexterity: 14 }, charClass: 'Fighter' });
    expect(ac.value).toBe(12);
  });
});

describe('proficiency parsing', () => {
  it('isWeaponProficient by category and specific name', () => {
    expect(isWeaponProficient({ weapon_category: 'Simple' }, { weaponProfText: 'Simple weapons' })).toBe(true);
    expect(isWeaponProficient({ weapon_category: 'Martial' }, { weaponProfText: 'Simple weapons' })).toBe(false);
    expect(isWeaponProficient({ weapon_category: 'Martial', name: 'Longsword' }, { weaponProfText: 'Simple weapons, longswords, rapiers' })).toBe(true);
    expect(isWeaponProficient({ weapon_category: 'Martial', name: 'Greataxe' }, { weaponProfText: 'Simple weapons', raceWeapons: ['Greataxe'] })).toBe(true);
  });

  it('isArmorProficient by type, all-armor, and shield', () => {
    expect(isArmorProficient({ armor_type: 'Light' }, { armorProfText: 'Light armor, medium armor' })).toBe(true);
    expect(isArmorProficient({ armor_type: 'Heavy' }, { armorProfText: 'Light armor, medium armor' })).toBe(false);
    expect(isArmorProficient({ armor_type: 'Heavy' }, { armorProfText: 'All armor, shields' })).toBe(true);
    expect(isArmorProficient({ armor_type: 'Shield' }, { armorProfText: 'All armor, shields' })).toBe(true);
    expect(isArmorProficient({ armor_type: 'Shield' }, { armorProfText: 'Light armor' })).toBe(false);
  });
});

describe('attack math', () => {
  it('weaponAbility: ranged uses DEX, finesse picks the better, melee uses STR', () => {
    expect(weaponAbility({ weapon_type: 'Ranged' }, { strength: 18, dexterity: 14 }).ability).toBe('dexterity');
    expect(weaponAbility({ properties: 'Finesse' }, { strength: 12, dexterity: 16 }).ability).toBe('dexterity');
    expect(weaponAbility({ properties: 'Finesse' }, { strength: 18, dexterity: 12 }).ability).toBe('strength');
    expect(weaponAbility({}, { strength: 16, dexterity: 18 }).ability).toBe('strength');
  });

  it('computeAttack includes proficiency in to-hit and ability mod in damage', () => {
    // STR 18 (+4), level 5 (PB +3), proficient → +7; damage 1d8 + 4 Slashing
    const atk = computeAttack({ name: 'Longsword', damage: '1d8', damage_type: 'Slashing' }, { scores: { strength: 18 }, level: 5, proficient: true });
    expect(atk.toHit).toBe('+7');
    expect(atk.damage).toBe('1d8 + 4 Slashing');
  });

  it('computeAttack drops proficiency bonus when not proficient', () => {
    const atk = computeAttack({ name: 'Longsword', damage: '1d8' }, { scores: { strength: 18 }, level: 5, proficient: false });
    expect(atk.toHit).toBe('+4');
  });

  it('getAttacks returns rows only for equipped weapons', () => {
    const inv = [
      weapon({ uid: 'w1', equipped: true, name: 'Longsword', damage: '1d8', weapon_category: 'Martial' }),
      weapon({ uid: 'w2', equipped: false, name: 'Dagger', damage: '1d4' }),
    ];
    const atks = getAttacks({ inventory: inv, scores: { strength: 16 }, level: 1, weaponProfText: 'Simple weapons, martial weapons' });
    expect(atks).toHaveLength(1);
    expect(atks[0].name).toBe('Longsword');
    expect(atks[0].proficient).toBe(true);
  });
});

describe('basic helpers', () => {
  it('abilityMod and profBonus', () => {
    expect(abilityMod(10)).toBe(0);
    expect(abilityMod(18)).toBe(4);
    expect(abilityMod(7)).toBe(-2);
    expect(profBonus(1)).toBe(2);
    expect(profBonus(5)).toBe(3);
    expect(profBonus(20)).toBe(6);
  });
});
