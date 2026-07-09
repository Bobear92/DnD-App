import { describe, it, expect } from 'vitest';
import {
  WEAPON_BOND_MAX,
  weaponBondCapacity, bondedWeaponUids, isWeaponBonded, bondedWeapons, toggleBondedWeapon,
  isHexWarrior, canBeHexWeapon, hexWeaponUid, isHexWeapon, hexWeapon, setHexWeapon,
} from './weaponBondData';

const rapier = { uid: 'w1', category: 'weapons', name: 'Rapier', properties: 'Finesse', damage: '1d8' };
const longsword = { uid: 'w2', category: 'weapons', name: 'Longsword', properties: 'Versatile (1d10)', damage: '1d8' };
const greatsword = { uid: 'w3', category: 'weapons', name: 'Greatsword', properties: 'Heavy, Two-Handed', damage: '2d6' };
const shield = { uid: 'a1', category: 'armor', name: 'Shield', armor_type: 'Shield' };
const INV = [rapier, longsword, greatsword, shield];

describe('weaponBondCapacity', () => {
  it('is 2 for an Eldritch Knight Fighter at L3+', () => {
    expect(weaponBondCapacity({ charClass: 'Fighter', subclass: 'Eldritch Knight', level: 3 })).toBe(WEAPON_BOND_MAX);
    expect(weaponBondCapacity({ charClass: 'Fighter', subclass: 'Eldritch Knight', level: 12 })).toBe(2);
  });

  it('is 0 below L3, for other subclasses, and for other classes', () => {
    expect(weaponBondCapacity({ charClass: 'Fighter', subclass: 'Eldritch Knight', level: 2 })).toBe(0);
    expect(weaponBondCapacity({ charClass: 'Fighter', subclass: 'Champion', level: 5 })).toBe(0);
    expect(weaponBondCapacity({ charClass: 'Wizard', subclass: 'Eldritch Knight', level: 5 })).toBe(0);
    expect(weaponBondCapacity({})).toBe(0);
  });
});

describe('bonded weapons', () => {
  it('bondedWeaponUids returns [] when unset or malformed', () => {
    expect(bondedWeaponUids({})).toEqual([]);
    expect(bondedWeaponUids({ bonded_weapon_uids: 'w1' })).toEqual([]);
    expect(bondedWeaponUids(null)).toEqual([]);
  });

  it('isWeaponBonded / bondedWeapons resolve stored uids against the inventory', () => {
    const cd = { bonded_weapon_uids: ['w1', 'gone'] };
    expect(isWeaponBonded(rapier, cd)).toBe(true);
    expect(isWeaponBonded(longsword, cd)).toBe(false);
    expect(bondedWeapons(INV, cd)).toEqual([rapier]); // stale uid dropped
  });

  it('toggleBondedWeapon adds up to capacity, removes when already bonded', () => {
    let cd = {};
    let patch = toggleBondedWeapon(cd, 'w1', 2);
    expect(patch).toEqual({ bonded_weapon_uids: ['w1'] });
    cd = { ...cd, ...patch };
    patch = toggleBondedWeapon(cd, 'w2', 2);
    expect(patch).toEqual({ bonded_weapon_uids: ['w1', 'w2'] });
    cd = { ...cd, ...patch };
    // at capacity — bonding a third is refused
    expect(toggleBondedWeapon(cd, 'w3', 2)).toBeNull();
    // unbonding always works
    expect(toggleBondedWeapon(cd, 'w1', 2)).toEqual({ bonded_weapon_uids: ['w2'] });
  });
});

describe('Hex Warrior', () => {
  it('isHexWarrior is true only for a 5e Hexblade Warlock', () => {
    expect(isHexWarrior({ charClass: 'Warlock', subclass: 'The Hexblade', edition: '5e' })).toBe(true);
    expect(isHexWarrior({ charClass: 'Warlock', subclass: 'The Hexblade', edition: '5.5e' })).toBe(false);
    expect(isHexWarrior({ charClass: 'Warlock', subclass: 'The Fiend', edition: '5e' })).toBe(false);
    expect(isHexWarrior({ charClass: 'Fighter', subclass: 'The Hexblade', edition: '5e' })).toBe(false);
  });

  it('canBeHexWeapon excludes Two-Handed weapons and non-weapons', () => {
    expect(canBeHexWeapon(rapier)).toBe(true);
    expect(canBeHexWeapon(longsword)).toBe(true); // Versatile is fine
    expect(canBeHexWeapon(greatsword)).toBe(false);
    expect(canBeHexWeapon(shield)).toBe(false);
  });

  it('setHexWeapon designates, swaps, and clears (toggle on the same uid)', () => {
    expect(setHexWeapon({}, 'w1')).toEqual({ hex_weapon_uid: 'w1' });
    expect(setHexWeapon({ hex_weapon_uid: 'w1' }, 'w2')).toEqual({ hex_weapon_uid: 'w2' }); // swap
    expect(setHexWeapon({ hex_weapon_uid: 'w1' }, 'w1')).toEqual({ hex_weapon_uid: null }); // clear
    expect(setHexWeapon({ hex_weapon_uid: 'w1' }, null)).toEqual({ hex_weapon_uid: null });
  });

  it('hexWeapon / isHexWeapon resolve the stored uid against the inventory', () => {
    const cd = { hex_weapon_uid: 'w2' };
    expect(hexWeaponUid(cd)).toBe('w2');
    expect(isHexWeapon(longsword, cd)).toBe(true);
    expect(isHexWeapon(rapier, cd)).toBe(false);
    expect(hexWeapon(INV, cd)).toEqual(longsword);
    expect(hexWeapon(INV, { hex_weapon_uid: 'gone' })).toBeNull();
    expect(hexWeapon(INV, {})).toBeNull();
  });
});
