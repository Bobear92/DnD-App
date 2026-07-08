import { describe, it, expect } from 'vitest';
import {
  buildEntry, addEntry, removeEntry, setQuantity, getByCategory, normalizeWeapons,
  toggleEquipped, toggleAttuned, attunedCount,
  equippedBodyArmor, equippedShield, computeArmorClass,
  isWeaponProficient, isArmorProficient, weaponAbility, computeAttack, getAttacks,
  abilityMod, profBonus, isHeavyWeapon, creatureSize, weaponAttackWarning,
  isLoadingWeapon, weaponLoadingNote,
  armorStrengthNote, armorSpeedPenalty,
  nonProficientEquippedArmor, armorNonProficiencyNote, wornNonProficientArmor,
  assignHand, handContents, migrateHands, freeHandCount,
  isTwoHandedWeapon, weaponVersatileDie, isVersatileWeapon, isShieldEntry,
} from '@/characters/components/inventory/inventoryData';

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

  it('Defense feat adds +1 AC only while wearing armor', () => {
    const feats = [{ name: 'Defense', effects: [{ kind: 'ac_mod', amount: 1, condition: 'armor' }] }];
    const inv = [armor({ armor_type: 'Light', armor_class: 11, equipped: true, name: 'Leather' })];
    expect(computeArmorClass({ inventory: inv, scores: { dexterity: 14 }, feats }).value).toBe(14); // 11 + 2 + 1
    expect(computeArmorClass({ inventory: [], scores: { dexterity: 14 }, charClass: 'Fighter', feats }).value).toBe(12); // no armor → no bonus
  });

  it('Dual Wielder adds +1 AC only with two equipped melee weapons', () => {
    const feats = [{ name: 'Dual Wielder', effects: [{ kind: 'ac_mod', amount: 1, condition: 'two_melee_weapons' }] }];
    const two = [
      weapon({ name: 'Shortsword', weapon_type: 'Melee', equipped: true }),
      weapon({ name: 'Scimitar', weapon_type: 'Melee', equipped: true }),
    ];
    expect(computeArmorClass({ inventory: two, scores: { dexterity: 14 }, charClass: 'Fighter', feats }).value).toBe(13); // 10 + 2 + 1
    expect(computeArmorClass({ inventory: [two[0]], scores: { dexterity: 14 }, charClass: 'Fighter', feats }).value).toBe(12); // one weapon → no bonus
  });

  it('Medium Armor Master raises the medium DEX cap to +3', () => {
    const feats = [{ name: 'Medium Armor Master', effects: [{ kind: 'ac_mod', condition: 'medium_armor_dex_cap', dex_cap: 3 }] }];
    const inv = [armor({ armor_type: 'Medium', armor_class: 15, equipped: true, name: 'Half Plate' })];
    expect(computeArmorClass({ inventory: inv, scores: { dexterity: 18 }, feats }).value).toBe(18); // 15 + min(4,3) = 3
    expect(computeArmorClass({ inventory: inv, scores: { dexterity: 14 }, feats }).value).toBe(17); // 15 + min(2,3) = 2
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

describe('fighting styles fold into attack/AC math', () => {
  it('Archery adds +2 to ranged to-hit (not melee, not without the style)', () => {
    const bow = { name: 'Longbow', damage: '1d8', damage_type: 'Piercing', weapon_type: 'ranged' };
    // DEX 16 (+3), level 1 (PB +2), proficient → +5, plus Archery +2 = +7
    expect(computeAttack(bow, { scores: { dexterity: 16 }, level: 1, proficient: true, styles: ['Archery'] }).toHit).toBe('+7');
    expect(computeAttack(bow, { scores: { dexterity: 16 }, level: 1, proficient: true }).toHit).toBe('+5');
    const sword = { name: 'Longsword', damage: '1d8', weapon_type: 'melee' };
    expect(computeAttack(sword, { scores: { strength: 16 }, level: 1, proficient: true, styles: ['Archery'] }).toHit).toBe('+5');
  });

  it('Archery to-hit flows through getAttacks for an equipped ranged weapon', () => {
    const inv = [weapon({ uid: 'b1', equipped: true, name: 'Longbow', damage: '1d8', weapon_type: 'ranged', weapon_category: 'Martial' })];
    const rows = getAttacks({ inventory: inv, scores: { dexterity: 16 }, level: 1, weaponProfText: 'martial weapons', styles: ['Archery'] });
    expect(rows[0].toHit).toBe('+7');
    expect(rows[0].styleNotes).toContain('Archery');
  });

  it('computeAttack returns a to-hit breakdown of ability / proficiency / fighting style', () => {
    const bow = { name: 'Longbow', damage: '1d8', weapon_type: 'ranged' };
    // DEX 16 (+3), level 13 (PB +5), proficient, Archery +2 → +10
    const atk = computeAttack(bow, { scores: { dexterity: 16 }, level: 13, proficient: true, styles: ['Archery'] });
    expect(atk.toHit).toBe('+10');
    expect(atk.toHitBreakdown).toEqual([
      { label: 'DEX', value: 3 },
      { label: 'Proficiency', value: 5 },
      { label: 'Archery fighting style', value: 2 },
    ]);
    // Sum of the breakdown equals the total to-hit.
    expect(atk.toHitBreakdown.reduce((s, p) => s + p.value, 0)).toBe(10);
  });

  it('to-hit breakdown drops proficiency when not proficient', () => {
    const sword = { name: 'Longsword', damage: '1d8', weapon_type: 'melee' };
    const atk = computeAttack(sword, { scores: { strength: 16 }, level: 5, proficient: false });
    expect(atk.toHitBreakdown).toEqual([{ label: 'STR', value: 3 }]);
  });

  it('Dueling adds +2 damage to a solo one-handed melee weapon, but not when a second weapon is equipped', () => {
    const solo = [weapon({ uid: 's1', equipped: true, name: 'Longsword', damage: '1d8', damage_type: 'Slashing', weapon_type: 'melee', weapon_category: 'Martial' })];
    // STR 16 (+3) + Dueling +2 → 1d8 + 5
    let rows = getAttacks({ inventory: solo, scores: { strength: 16 }, level: 1, weaponProfText: 'martial weapons', styles: ['Dueling'] });
    expect(rows[0].damage).toBe('1d8 + 5 Slashing');
    expect(rows[0].styleNotes).toContain('Dueling');
    // Equip a second weapon → Dueling no longer applies to either.
    const dual = [...solo, weapon({ uid: 's2', equipped: true, name: 'Shortsword', damage: '1d6', weapon_type: 'melee' })];
    rows = getAttacks({ inventory: dual, scores: { strength: 16 }, level: 1, weaponProfText: 'martial weapons', styles: ['Dueling'] });
    expect(rows.find((r) => r.uid === 's1').damage).toBe('1d8 + 3 Slashing');
  });

  it('Dueling does not apply to a two-handed weapon', () => {
    const inv = [weapon({ uid: 'g1', equipped: true, name: 'Greatsword', damage: '2d6', damage_type: 'Slashing', weapon_type: 'melee', properties: 'Heavy, Two-handed', weapon_category: 'Martial' })];
    const rows = getAttacks({ inventory: inv, scores: { strength: 16 }, level: 1, weaponProfText: 'martial weapons', styles: ['Dueling'] });
    expect(rows[0].damage).toBe('2d6 + 3 Slashing');
  });

  it('Thrown Weapon Fighting adds +2 damage to a thrown weapon', () => {
    const axe = { name: 'Handaxe', damage: '1d6', damage_type: 'Slashing', weapon_type: 'melee', properties: 'Light, Thrown' };
    // STR 14 (+2) + Thrown +2 → 1d6 + 4
    expect(computeAttack(axe, { scores: { strength: 14 }, level: 1, proficient: true, styles: ['Thrown Weapon Fighting'] }).damage)
      .toBe('1d6 + 4 Slashing');
  });

  it('Defense fighting style adds +1 AC while armored (not unarmored)', () => {
    const inv = [armor({ equipped: true, name: 'Leather', armor_type: 'light', armor_class: 11 })];
    // 11 + DEX 14 (+2) + Defense +1 = 14
    expect(computeArmorClass({ inventory: inv, scores: { dexterity: 14 }, styles: ['Defense'] }).value).toBe(14);
    // No armor → no Defense bonus.
    expect(computeArmorClass({ inventory: [], scores: { dexterity: 14 }, charClass: 'Fighter', styles: ['Defense'] }).value).toBe(12);
  });
});

describe('heavy weapon / size warnings', () => {
  const greatsword = { name: 'Greatsword', damage: '2d6', properties: '["Two-Handed", "Heavy"]', weapon_category: 'Martial' };
  const heavyXbow = { name: 'Heavy Crossbow', damage: '1d10', properties: '["Heavy", "Loading"]', weapon_type: 'Ranged' };
  const longsword = { name: 'Longsword', damage: '1d8', properties: '["Versatile"]' };

  it('isHeavyWeapon detects the Heavy property', () => {
    expect(isHeavyWeapon(greatsword)).toBe(true);
    expect(isHeavyWeapon(longsword)).toBe(false);
    expect(isHeavyWeapon({})).toBe(false);
  });

  it('creatureSize prefers stored size, else derives from race', () => {
    expect(creatureSize({ size: 'Small' }, 'Human')).toBe('Small');
    expect(creatureSize({}, 'Halfling')).toBe('Small');
    expect(creatureSize({}, 'Rock Gnome')).toBe('Small');
    expect(creatureSize({}, 'Human')).toBe('Medium');
    expect(creatureSize({}, '')).toBe('Medium');
  });

  it('5e: Small creature warns on Heavy weapons, Medium does not', () => {
    expect(weaponAttackWarning(greatsword, { size: 'Small', edition: '5e' })).toMatch(/Small creatures/i);
    expect(weaponAttackWarning(greatsword, { size: 'Medium', edition: '5e' })).toBeNull();
    expect(weaponAttackWarning(longsword, { size: 'Small', edition: '5e' })).toBeNull();
  });

  it('2024: Heavy needs STR 13 (melee) / DEX 13 (ranged), size irrelevant', () => {
    expect(weaponAttackWarning(greatsword, { size: 'Small', scores: { strength: 16 }, edition: '5.5e' })).toBeNull();
    expect(weaponAttackWarning(greatsword, { size: 'Medium', scores: { strength: 10 }, edition: '5.5e' })).toMatch(/Strength 13/i);
    expect(weaponAttackWarning(heavyXbow, { scores: { dexterity: 10 }, edition: '5.5e' })).toMatch(/Dexterity 13/i);
    expect(weaponAttackWarning(heavyXbow, { scores: { dexterity: 14 }, edition: '5.5e' })).toBeNull();
  });

  it('computeAttack / getAttacks carry the disadvantage flag + warning', () => {
    const atk = computeAttack(greatsword, { scores: { strength: 16 }, level: 1, proficient: true, size: 'Small', edition: '5e' });
    expect(atk.disadvantage).toBe(true);
    expect(atk.warning).toMatch(/Small creatures/i);
    const inv = [weapon({ uid: 'g1', equipped: true, ...greatsword })];
    const rows = getAttacks({ inventory: inv, scores: { strength: 16 }, level: 1, weaponProfText: 'martial weapons', size: 'Small', edition: '5e' });
    expect(rows[0].disadvantage).toBe(true);
  });
});

describe('armor Strength requirements', () => {
  const chainMail = { name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, strength_requirement: 13 };
  const leather = { name: 'Leather', armor_type: 'light', armor_class: 11 };

  it('armorStrengthNote warns when STR is below the requirement', () => {
    expect(armorStrengthNote(armor(chainMail), { strength: 11 }))
      .toMatch(/Strength 13.*you have 11.*reduce your speed by 10 ft/i);
  });

  it('armorStrengthNote flips wording once the armor is equipped', () => {
    expect(armorStrengthNote(armor({ ...chainMail, equipped: true }), { strength: 11 }))
      .toMatch(/speed reduced by 10 ft while worn/i);
  });

  it('armorStrengthNote is null when the requirement is met or absent', () => {
    expect(armorStrengthNote(armor(chainMail), { strength: 13 })).toBeNull();
    expect(armorStrengthNote(armor(chainMail), { strength: 16 })).toBeNull();
    expect(armorStrengthNote(armor(leather), { strength: 8 })).toBeNull();
  });

  it('armorStrengthNote treats a missing STR score as 10', () => {
    expect(armorStrengthNote(armor(chainMail), {})).toMatch(/you have 10/);
  });

  it('armorSpeedPenalty returns −10 for equipped armor with unmet STR', () => {
    const inv = [armor({ ...chainMail, equipped: true })];
    expect(armorSpeedPenalty(inv, { strength: 11 }))
      .toEqual({ penalty: 10, name: 'Chain Mail', required: 13, str: 11 });
  });

  it('armorSpeedPenalty is null when unequipped, met, or no requirement', () => {
    expect(armorSpeedPenalty([armor(chainMail)], { strength: 11 })).toBeNull(); // not equipped
    expect(armorSpeedPenalty([armor({ ...chainMail, equipped: true })], { strength: 14 })).toBeNull();
    expect(armorSpeedPenalty([armor({ ...leather, equipped: true })], { strength: 8 })).toBeNull();
    expect(armorSpeedPenalty([], { strength: 8 })).toBeNull();
  });
});

describe('armor non-proficiency', () => {
  const chainMail = { name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
  const shieldItem = { name: 'Shield', armor_type: 'shield' };

  it('isArmorProficient accepts labeled grants ("Heavy armor") and raw categories ("Heavy")', () => {
    expect(isArmorProficient({ armor_type: 'heavy' }, { raceArmor: ['Heavy armor'] })).toBe(true);
    expect(isArmorProficient({ armor_type: 'heavy' }, { raceArmor: ['Heavy'] })).toBe(true);
    expect(isArmorProficient({ armor_type: 'light' }, { raceArmor: ['Light armor', 'Medium armor'] })).toBe(true);
    expect(isArmorProficient({ armor_type: 'heavy' }, { raceArmor: ['Light armor'] })).toBe(false);
  });

  it('isArmorProficient counts a "Shields" grant for shields', () => {
    expect(isArmorProficient({ armor_type: 'shield' }, { raceArmor: ['Shields'] })).toBe(true);
    expect(isArmorProficient({ armor_type: 'shield' }, { armorProfText: 'Light armor' })).toBe(false);
  });

  it('nonProficientEquippedArmor finds worn armor or a shield without proficiency', () => {
    const inv = [armor({ ...chainMail, equipped: true })];
    expect(nonProficientEquippedArmor(inv, { armorProfText: 'None' })?.name).toBe('Chain Mail');
    expect(nonProficientEquippedArmor(inv, { armorProfText: 'All armor, shields' })).toBeNull();
    const shieldOnly = [armor({ ...shieldItem, equipped: true })];
    expect(nonProficientEquippedArmor(shieldOnly, { armorProfText: 'Light armor' })?.name).toBe('Shield');
    expect(nonProficientEquippedArmor([armor(chainMail)], { armorProfText: 'None' })).toBeNull(); // not equipped
  });

  it('getAttacks puts every weapon attack at disadvantage while wearing non-proficient armor', () => {
    const inv = [
      weapon({ uid: 'w1', equipped: true, name: 'Longsword', damage: '1d8', weapon_category: 'Martial' }),
      armor({ uid: 'a1', equipped: true, ...chainMail }),
    ];
    const rows = getAttacks({ inventory: inv, scores: { strength: 16 }, level: 1, weaponProfText: 'martial weapons', armorProfText: 'None' });
    expect(rows[0].disadvantage).toBe(true);
    expect(rows[0].warning).toMatch(/Chain Mail without proficiency/i);
    const ok = getAttacks({ inventory: inv, scores: { strength: 16 }, level: 1, weaponProfText: 'martial weapons', armorProfText: 'All armor, shields' });
    expect(ok[0].disadvantage).toBe(false);
  });

  it('wornNonProficientArmor assembles the context itself (class text + feat armor grants)', () => {
    const inv = [armor({ uid: 'a1', equipped: true, ...chainMail })];
    expect(wornNonProficientArmor({ inventory: inv, charClass: 'Wizard', characterData: {} })?.name).toBe('Chain Mail');
    expect(wornNonProficientArmor({ inventory: inv, charClass: 'Fighter', characterData: {} })).toBeNull();
    const heavilyArmored = { feats: [{ name: 'Heavily Armored', effects: [{ kind: 'proficiency', prof_type: 'armor', items: ['Heavy'] }] }] };
    expect(wornNonProficientArmor({ inventory: inv, charClass: 'Wizard', characterData: heavilyArmored })).toBeNull();
  });

  it('armorNonProficiencyNote spells out the consequences', () => {
    expect(armorNonProficiencyNote('Chain Mail')).toMatch(/disadvantage on Strength and Dexterity/i);
    expect(armorNonProficiencyNote('Chain Mail')).toMatch(/can't cast spells/i);
  });
});

describe('Loading property', () => {
  const lightXbow = { name: 'Crossbow, Light', damage: '1d8', properties: '["Ammunition", "Loading", "Two-Handed"]', weapon_type: 'Ranged' };
  const handXbow = { name: 'Crossbow, Hand', damage: '1d6', properties: '["Ammunition", "Light", "Loading"]', weapon_type: 'Ranged', weapon_category: 'Martial' };
  const blowgun = { name: 'Blowgun', damage: '1', properties: '["Ammunition", "Loading"]', weapon_type: 'Ranged' };
  const longsword = { name: 'Longsword', damage: '1d8', properties: '["Versatile"]', weapon_type: 'Melee' };
  const crossbowExpert = [{ name: 'Crossbow Expert' }];

  it('isLoadingWeapon detects the Loading property', () => {
    expect(isLoadingWeapon(lightXbow)).toBe(true);
    expect(isLoadingWeapon(longsword)).toBe(false);
    expect(isLoadingWeapon({})).toBe(false);
  });

  it('notes the one-attack cap on a loading weapon without the feat', () => {
    expect(weaponLoadingNote(lightXbow, { proficient: true, edition: '5e' })).toMatch(/only one attack per action/i);
  });

  it('Crossbow Expert lifts the cap on a proficient crossbow', () => {
    expect(weaponLoadingNote(lightXbow, { feats: crossbowExpert, proficient: true, edition: '5e' })).toMatch(/ignored \(Crossbow Expert\)/i);
  });

  it('Crossbow Expert does NOT help a blowgun (not a crossbow)', () => {
    expect(weaponLoadingNote(blowgun, { feats: crossbowExpert, proficient: true, edition: '5e' })).toMatch(/only one attack per action/i);
  });

  it('the feat only lifts the cap when proficient with the crossbow', () => {
    expect(weaponLoadingNote(handXbow, { feats: crossbowExpert, proficient: false, edition: '5e' })).toMatch(/only one attack per action/i);
  });

  it('no note for a non-loading weapon, or in 2024 (the property was removed)', () => {
    expect(weaponLoadingNote(longsword, { proficient: true, edition: '5e' })).toBeNull();
    expect(weaponLoadingNote(lightXbow, { proficient: true, edition: '5.5e' })).toBeNull();
  });

  it('computeAttack / getAttacks carry the loadingNote', () => {
    const atk = computeAttack(lightXbow, { scores: { dexterity: 14 }, level: 5, proficient: true, edition: '5e' });
    expect(atk.loadingNote).toMatch(/only one attack per action/i);
    const inv = [weapon({ uid: 'x1', equipped: true, ...handXbow })];
    const rows = getAttacks({ inventory: inv, scores: { dexterity: 14 }, level: 5, weaponProfText: 'simple weapons, martial weapons', feats: crossbowExpert, edition: '5e' });
    expect(rows[0].loadingNote).toMatch(/ignored \(Crossbow Expert\)/i);
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

describe('hands', () => {
  const twoHander = weapon({ uid: 'gs', name: 'Greatsword', properties: '["Two-Handed", "Heavy"]' });
  const sword = weapon({ uid: 'ls', name: 'Longsword', properties: '["Versatile (1d10)"]', damage: '1d8' });
  const daggerA = weapon({ uid: 'da', name: 'Dagger', properties: '["Light"]' });
  const daggerB = weapon({ uid: 'db', name: 'Dagger', properties: '["Light"]' });
  const shield = armor({ uid: 'sh', name: 'Shield', armor_type: 'Shield', armor_class: 2 });

  it('isTwoHandedWeapon / isShieldEntry classify entries', () => {
    expect(isTwoHandedWeapon(twoHander)).toBe(true);
    expect(isTwoHandedWeapon(sword)).toBe(false);
    expect(isShieldEntry(shield)).toBe(true);
    expect(isShieldEntry(sword)).toBe(false);
  });

  it('weaponVersatileDie uses an explicit parenthetical die when present', () => {
    expect(weaponVersatileDie(sword)).toBe('1d10');
    expect(isVersatileWeapon(sword)).toBe(true);
    expect(weaponVersatileDie(daggerA)).toBeNull();
  });

  it('weaponVersatileDie derives the die from base damage for seeded "Versatile" (no parenthetical)', () => {
    const spear = weapon({ name: 'Spear', damage: '1d6', properties: '["Thrown", "Versatile", "Monk"]' });
    expect(isVersatileWeapon(spear)).toBe(true);
    expect(weaponVersatileDie(spear)).toBe('1d8'); // 1d6 → one die up
    const seededLongsword = weapon({ name: 'Longsword', damage: '1d8', properties: '["Versatile"]' });
    expect(weaponVersatileDie(seededLongsword)).toBe('1d10');
  });

  it('assignHand places a one-handed weapon in a hand (equipped synced)', () => {
    const out = assignHand([sword], 'main', 'ls');
    expect(out.find((e) => e.uid === 'ls')).toMatchObject({ hand: 'main', equipped: true });
  });

  it('assignHand dual-wields two one-handed weapons without clobbering', () => {
    let out = assignHand([daggerA, daggerB], 'main', 'da');
    out = assignHand(out, 'off', 'db');
    expect(handContents(out)).toMatchObject({ main: expect.objectContaining({ uid: 'da' }), off: expect.objectContaining({ uid: 'db' }) });
  });

  it('assignHand: a two-handed weapon takes both hands and clears everything else', () => {
    let out = assignHand([daggerA, twoHander], 'main', 'da'); // dagger in main
    out = assignHand(out, 'main', 'gs'); // now wield the greatsword
    const hc = handContents(out);
    expect(hc.twoHanded).toMatchObject({ uid: 'gs' });
    expect(out.find((e) => e.uid === 'da').hand).toBeUndefined();
    expect(out.find((e) => e.uid === 'da').equipped).toBe(false);
  });

  it('assignHand: a one-hander in main clears a two-hander spanning both', () => {
    let out = assignHand([twoHander, sword], 'main', 'gs'); // greatsword both hands
    out = assignHand(out, 'main', 'ls'); // swap to longsword in main
    expect(out.find((e) => e.uid === 'gs').hand).toBeUndefined();
    expect(handContents(out).main).toMatchObject({ uid: 'ls' });
    expect(handContents(out).off).toBeNull();
  });

  it('assignHand with null frees the slot', () => {
    let out = assignHand([sword], 'main', 'ls');
    out = assignHand(out, 'main', null);
    expect(out.find((e) => e.uid === 'ls').hand).toBeUndefined();
    expect(freeHandCount(out)).toBe(2);
  });

  it('a held shield can share a hand with a one-handed weapon and counts toward freeHandCount', () => {
    let out = assignHand([sword, shield], 'main', 'ls');
    out = assignHand(out, 'off', 'sh');
    expect(freeHandCount(out)).toBe(0);
    expect(equippedShield(out)).toMatchObject({ uid: 'sh' });
  });

  it('migrateHands maps legacy equipped weapons to hands (idempotent)', () => {
    const legacy = [{ ...daggerA, equipped: true }, { ...daggerB, equipped: true }];
    const migrated = migrateHands(legacy);
    expect(migrated.find((e) => e.uid === 'da').hand).toBe('main');
    expect(migrated.find((e) => e.uid === 'db').hand).toBe('off');
    // running again is a no-op (already has hands)
    expect(migrateHands(migrated)).toEqual(migrated);
  });

  it('migrateHands gives a legacy two-handed weapon both hands and unequips the rest', () => {
    const legacy = [{ ...twoHander, equipped: true }, { ...daggerA, equipped: true }];
    const migrated = migrateHands(legacy);
    expect(migrated.find((e) => e.uid === 'gs').hand).toBe('both');
    expect(migrated.find((e) => e.uid === 'da').equipped).toBe(false);
  });

  it('assignHand can grip a versatile weapon in both hands and revert it', () => {
    let out = assignHand([sword], 'main', 'ls', true);
    expect(handContents(out).twoHanded).toMatchObject({ uid: 'ls' });
    out = assignHand(out, 'main', 'ls', false);
    expect(out.find((e) => e.uid === 'ls').hand).toBe('main');
    expect(handContents(out).off).toBeNull();
  });

  it('getAttacks uses the versatile two-handed die only when gripped in both hands', () => {
    const oneHanded = getAttacks({ inventory: [{ ...sword, hand: 'main', equipped: true }], scores: { strength: 10 } });
    expect(oneHanded[0].damage).toContain('1d8'); // one-handed grip → base die
    const twoHanded = getAttacks({ inventory: [{ ...sword, hand: 'both', equipped: true }], scores: { strength: 10 } });
    expect(twoHanded[0].damage).toContain('1d10'); // two-handed grip → versatile die
  });
});
