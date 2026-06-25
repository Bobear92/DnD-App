import { describe, it, expect } from 'vitest';
import {
  weaponAmmoType, ammoEntryType, isAmmunitionEntry, weaponNeedsAmmo,
  ammoMatchesWeapon, matchingAmmo, resolveWeaponAmmo, setWeaponAmmo,
  decrementAmmo, setAmmoQuantity, isAmmoItem,
} from './ammunitionData';

const longbow = { uid: 'w1', category: 'weapons', name: 'Longbow', weapon_type: 'ranged', properties: '["Ammunition","Heavy","Two-handed"]' };
const lightCrossbow = { uid: 'w2', category: 'weapons', name: 'Light Crossbow', weapon_type: 'ranged', properties: '["Ammunition","Loading"]' };
const dagger = { uid: 'w3', category: 'weapons', name: 'Dagger', weapon_type: 'melee', properties: '["Finesse","Light","Thrown"]' };
const arrows = { uid: 'a1', category: 'adventuring-gear', name: 'Arrows', item_category: 'Ammunition', quantity: 20 };
const bolts = { uid: 'a2', category: 'adventuring-gear', name: 'Crossbow Bolts', item_category: 'Ammunition', quantity: 20 };

describe('weaponAmmoType', () => {
  it('maps bows to Arrows and crossbows to Bolts (crossbow wins)', () => {
    expect(weaponAmmoType(longbow)).toBe('Arrows');
    expect(weaponAmmoType({ name: 'Shortbow' })).toBe('Arrows');
    expect(weaponAmmoType(lightCrossbow)).toBe('Bolts');
    expect(weaponAmmoType({ name: 'Hand Crossbow' })).toBe('Bolts');
  });
  it('maps sling to Bullets and blowgun to Needles', () => {
    expect(weaponAmmoType({ name: 'Sling' })).toBe('Bullets');
    expect(weaponAmmoType({ name: 'Blowgun' })).toBe('Needles');
  });
  it('returns null for a non-ranged weapon', () => {
    expect(weaponAmmoType(dagger)).toBeNull();
  });
});

describe('ammoEntryType', () => {
  it('identifies type from the stack name, including homebrew variants', () => {
    expect(ammoEntryType(arrows)).toBe('Arrows');
    expect(ammoEntryType({ name: 'Silvered Arrows' })).toBe('Arrows');
    expect(ammoEntryType(bolts)).toBe('Bolts');
    expect(ammoEntryType({ name: '+1 Bolts' })).toBe('Bolts');
    expect(ammoEntryType({ name: 'Sling Bullets' })).toBe('Bullets');
    expect(ammoEntryType({ name: 'Blowgun Needles' })).toBe('Needles');
  });
  it('returns null for an unrecognized name', () => {
    expect(ammoEntryType({ name: 'Glass Pellets' })).toBeNull();
  });
});

describe('isAmmunitionEntry', () => {
  it('matches by item_category', () => {
    expect(isAmmunitionEntry({ name: 'Glass Pellets', item_category: 'Ammunition' })).toBe(true);
  });
  it('matches by known ammo name even without item_category', () => {
    expect(isAmmunitionEntry({ name: 'Arrows' })).toBe(true);
  });
  it('is false for ordinary gear and weapons', () => {
    expect(isAmmunitionEntry({ name: 'Rope' })).toBe(false);
    expect(isAmmunitionEntry(dagger)).toBe(false);
    expect(isAmmunitionEntry(null)).toBe(false);
  });
});

describe('weaponNeedsAmmo', () => {
  it('is true for weapons with the Ammunition property', () => {
    expect(weaponNeedsAmmo(longbow)).toBe(true);
    expect(weaponNeedsAmmo(lightCrossbow)).toBe(true);
  });
  it('is false otherwise', () => {
    expect(weaponNeedsAmmo(dagger)).toBe(false);
    expect(weaponNeedsAmmo({ name: 'Club', properties: '[]' })).toBe(false);
  });
});

describe('ammoMatchesWeapon', () => {
  it('matches arrows to a bow but not bolts', () => {
    expect(ammoMatchesWeapon(arrows, longbow)).toBe(true);
    expect(ammoMatchesWeapon(bolts, longbow)).toBe(false);
  });
  it('matches bolts to a crossbow but not arrows', () => {
    expect(ammoMatchesWeapon(bolts, lightCrossbow)).toBe(true);
    expect(ammoMatchesWeapon(arrows, lightCrossbow)).toBe(false);
  });
  it('is permissive when ammo type is unrecognized (homebrew)', () => {
    expect(ammoMatchesWeapon({ name: 'Glass Pellets', item_category: 'Ammunition' }, longbow)).toBe(true);
  });
  it('rejects non-ammunition entries', () => {
    expect(ammoMatchesWeapon({ name: 'Rope' }, longbow)).toBe(false);
  });
});

describe('matchingAmmo / resolveWeaponAmmo', () => {
  const inv = [longbow, lightCrossbow, arrows, bolts, { uid: 'a3', name: 'Arrows', item_category: 'Ammunition', quantity: 5 }];
  it('returns only matching stacks', () => {
    const m = matchingAmmo(inv, longbow).map((e) => e.uid);
    expect(m).toEqual(['a1', 'a3']);
  });
  it('resolves the selected stack by ammo_uid', () => {
    const w = { ...longbow, ammo_uid: 'a3' };
    expect(resolveWeaponAmmo([...inv, w], w).uid).toBe('a3');
  });
  it('falls back to the first matching stack when none selected or selection stale', () => {
    expect(resolveWeaponAmmo(inv, longbow).uid).toBe('a1');
    expect(resolveWeaponAmmo(inv, { ...longbow, ammo_uid: 'nope' }).uid).toBe('a1');
  });
  it('returns null when no ammo matches', () => {
    expect(resolveWeaponAmmo([bolts], longbow)).toBeNull();
  });
});

describe('setWeaponAmmo', () => {
  it('stores the chosen ammo uid on the weapon', () => {
    const out = setWeaponAmmo([longbow, arrows], 'w1', 'a1');
    expect(out.find((e) => e.uid === 'w1').ammo_uid).toBe('a1');
  });
  it('clears the selection when given falsy', () => {
    const out = setWeaponAmmo([{ ...longbow, ammo_uid: 'a1' }], 'w1', null);
    expect(out[0].ammo_uid).toBeNull();
  });
});

describe('decrementAmmo / setAmmoQuantity', () => {
  it('lowers the count by 1, never below 0', () => {
    const out = decrementAmmo([{ ...arrows, quantity: 1 }], 'a1');
    expect(out[0].quantity).toBe(0);
    expect(decrementAmmo(out, 'a1')[0].quantity).toBe(0);
  });
  it('decrements by n', () => {
    expect(decrementAmmo([arrows], 'a1', 5)[0].quantity).toBe(15);
  });
  it('sets a count clamped to >= 0', () => {
    expect(setAmmoQuantity([arrows], 'a1', 30)[0].quantity).toBe(30);
    expect(setAmmoQuantity([arrows], 'a1', -4)[0].quantity).toBe(0);
  });
});

describe('isAmmoItem', () => {
  it('matches a raw encyclopedia gear item that is ammunition', () => {
    expect(isAmmoItem({ name: 'Arrows', category: 'Ammunition' })).toBe(true);
    expect(isAmmoItem({ name: 'Crossbow Bolts' })).toBe(true);
    expect(isAmmoItem({ name: 'Rope', category: 'Standard Gear' })).toBe(false);
    expect(isAmmoItem(null)).toBe(false);
  });
});
