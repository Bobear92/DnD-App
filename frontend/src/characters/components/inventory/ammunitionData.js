/**
 * Ammunition model for the character Items tab.
 *
 * Ammunition (Arrows, Crossbow Bolts, Sling Bullets, Blowgun Needles, and homebrew
 * variants) is stored as ordinary adventuring-gear inventory entries (the seed gives
 * them item_category 'Ammunition'), but it is *displayed* under the Weapons tab — a
 * ranged weapon with the Ammunition property fires from a matching ammo stack.
 *
 * All functions here are pure (return new arrays/objects) so the UI can persist the
 * result via the normal character_data save path.
 */
import { parseWeaponProperties, weaponPropertyBaseName } from '@/characters/components/inventory/weaponPropertyData';

// Ammo "type" buckets and the weapon-name keyword that fires each. Crossbow is checked
// before bow so "Light Crossbow" → Bolts, "Longbow" → Arrows.
const WEAPON_AMMO = [
  { type: 'Bolts', match: 'crossbow' },
  { type: 'Arrows', match: 'bow' },
  { type: 'Bullets', match: 'sling' },
  { type: 'Needles', match: 'blowgun' },
];
// The ammo-name keyword that identifies a stack's type (covers homebrew names like
// "Silvered Arrows" or "+1 Bolts" that still contain the base word).
const AMMO_NAME = [
  { type: 'Bolts', match: 'bolt' },
  { type: 'Arrows', match: 'arrow' },
  { type: 'Bullets', match: 'bullet' },
  { type: 'Needles', match: 'needle' },
];

/** The ammo type a ranged weapon fires ('Arrows' | 'Bolts' | 'Bullets' | 'Needles'), or null. */
export function weaponAmmoType(weapon = {}) {
  const name = (weapon.name || '').toLowerCase();
  for (const { type, match } of WEAPON_AMMO) if (name.includes(match)) return type;
  return null;
}

/** The ammo type of an inventory stack from its name, or null for unrecognized/homebrew. */
export function ammoEntryType(entry = {}) {
  const name = (entry.name || '').toLowerCase();
  for (const { type, match } of AMMO_NAME) if (name.includes(match)) return type;
  return null;
}

/** True if an inventory entry represents ammunition (vs ordinary adventuring gear). */
export function isAmmunitionEntry(entry) {
  if (!entry) return false;
  if ((entry.item_category || '').toLowerCase() === 'ammunition') return true;
  return ammoEntryType(entry) !== null;
}

/** Does this weapon have the Ammunition property (i.e. it needs ammo to fire)? */
export function weaponNeedsAmmo(weapon = {}) {
  return parseWeaponProperties(weapon.properties)
    .some((p) => weaponPropertyBaseName(p).toLowerCase() === 'ammunition');
}

/**
 * Can this ammo stack be fired from this weapon? Matches by type; an ammo stack or
 * weapon whose type can't be determined (homebrew naming) is permissive so a custom
 * weapon/ammo pairing still works.
 */
export function ammoMatchesWeapon(ammoEntry, weapon) {
  if (!isAmmunitionEntry(ammoEntry)) return false;
  const wType = weaponAmmoType(weapon);
  const aType = ammoEntryType(ammoEntry);
  if (!wType || !aType) return true;
  return wType === aType;
}

/** Every ammo stack in the inventory that fires from this weapon. */
export function matchingAmmo(inventory = [], weapon) {
  return (inventory || []).filter((e) => ammoMatchesWeapon(e, weapon));
}

/**
 * The ammo stack currently selected for a weapon — the one whose uid is stored on the
 * weapon's `ammo_uid`, falling back to the first matching stack (or null when none).
 */
export function resolveWeaponAmmo(inventory = [], weapon = {}) {
  const matches = matchingAmmo(inventory, weapon);
  if (!matches.length) return null;
  return matches.find((a) => a.uid === weapon.ammo_uid) || matches[0];
}

/** Set which ammo stack a weapon fires from. */
export function setWeaponAmmo(inventory = [], weaponUid, ammoUid) {
  return (inventory || []).map((e) =>
    e.uid === weaponUid ? { ...e, ammo_uid: ammoUid || null } : e);
}

/** Decrement an ammo stack's count by n (default 1), never below 0. */
export function decrementAmmo(inventory = [], uid, n = 1) {
  return (inventory || []).map((e) =>
    e.uid === uid ? { ...e, quantity: Math.max(0, (Number(e.quantity) || 0) - n) } : e);
}

/** Set an ammo stack's count, clamped to ≥ 0 (ammo may legitimately reach 0). */
export function setAmmoQuantity(inventory = [], uid, qty) {
  const q = Math.max(0, Math.floor(Number(qty) || 0));
  return (inventory || []).map((e) => (e.uid === uid ? { ...e, quantity: q } : e));
}

/** True for a raw encyclopedia adventuring-gear item that is ammunition (for the picker filter). */
export function isAmmoItem(item) {
  if (!item) return false;
  if ((item.category || '').toLowerCase() === 'ammunition') return true;
  return ammoEntryType(item) !== null;
}
