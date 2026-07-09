// Weapon designation model (pure) — features that mark a specific weapon in the
// character's inventory:
//
//   • Eldritch Knight "Weapon Bond" (Fighter subclass, L3, both editions): bond with up
//     to TWO weapons via a 1-hour ritual (RAW 2014 + 2024). You can't be disarmed of a
//     bonded weapon, and can summon one to your hand as a bonus action.
//     Stored as `character_data.bonded_weapon_uids: string[]` (inventory entry uids).
//
//   • Hexblade "Hex Warrior" (Warlock subclass, L1, 5e only — 2024 has no Hexblade):
//     after a long rest, touch one weapon you're proficient with that LACKS the
//     Two-Handed property; you may use Charisma instead of Strength/Dexterity for its
//     attack and damage rolls. Stored as `character_data.hex_weapon_uid: string|null`.
//
// Both are designations, not resources — the sheet lets the player change them freely
// (the in-fiction ritual/long-rest timing is noted in the UI text, not enforced).

export const WEAPON_BOND_MAX = 2;

export const WEAPON_BOND_NOTE =
  "You can't be disarmed of a bonded weapon while it's on the same plane, and can summon " +
  'it to your hand as a bonus action. Bonding takes a 1-hour ritual; you can bond up to ' +
  'two weapons, but can summon only one at a time.';

export const HEX_WARRIOR_NOTE =
  'Whenever you finish a long rest, touch one weapon you are proficient with that lacks ' +
  'the Two-Handed property. You can use your Charisma modifier, instead of Strength or ' +
  'Dexterity, for attack and damage rolls with that weapon.';

/** How many weapons this character can bond (Eldritch Knight L3+ → 2, else 0). */
export function weaponBondCapacity({ charClass, subclass, level = 1 } = {}) {
  if (charClass !== 'Fighter' || subclass !== 'Eldritch Knight') return 0;
  return Number(level) >= 3 ? WEAPON_BOND_MAX : 0;
}

/** The stored bonded-weapon uids (always an array). */
export function bondedWeaponUids(characterData = {}) {
  return Array.isArray(characterData?.bonded_weapon_uids) ? characterData.bonded_weapon_uids : [];
}

/** Is this inventory entry one of the character's bonded weapons? */
export function isWeaponBonded(entry, characterData = {}) {
  return !!entry?.uid && bondedWeaponUids(characterData).includes(entry.uid);
}

/** The bonded weapons still present in the inventory (stale uids are dropped). */
export function bondedWeapons(inventory = [], characterData = {}) {
  const uids = bondedWeaponUids(characterData);
  return (inventory || []).filter((e) => e.category === 'weapons' && uids.includes(e.uid));
}

/**
 * Bond/unbond a weapon: returns a `{ bonded_weapon_uids }` patch. Unbonding always
 * works; bonding is refused (returns null) when already at `capacity`.
 */
export function toggleBondedWeapon(characterData = {}, uid, capacity = WEAPON_BOND_MAX) {
  const uids = bondedWeaponUids(characterData);
  if (uids.includes(uid)) return { bonded_weapon_uids: uids.filter((u) => u !== uid) };
  if (uids.length >= capacity) return null;
  return { bonded_weapon_uids: [...uids, uid] };
}

// ─── Hex Warrior (Hexblade) ────────────────────────────────────────────────────────

/** Does this character have the Hex Warrior feature? (5e Hexblade Warlock; L1 feature.) */
export function isHexWarrior({ charClass, subclass, edition = '5e' } = {}) {
  if (edition === '5.5e' || edition === '2024') return false; // no Hexblade in 2024
  return charClass === 'Warlock' && subclass === 'The Hexblade';
}

/** Hex Warrior can only designate a weapon that lacks the Two-Handed property. */
export function canBeHexWeapon(entry = {}) {
  if (entry.category && entry.category !== 'weapons') return false;
  return !/two-handed/i.test(entry.properties || '');
}

/** The stored hex weapon uid, or null. */
export function hexWeaponUid(characterData = {}) {
  return characterData?.hex_weapon_uid || null;
}

/** Is this inventory entry the designated Hex Warrior weapon? */
export function isHexWeapon(entry, characterData = {}) {
  return !!entry?.uid && hexWeaponUid(characterData) === entry.uid;
}

/** The designated hex weapon entry, or null when unset / no longer in the inventory. */
export function hexWeapon(inventory = [], characterData = {}) {
  const uid = hexWeaponUid(characterData);
  if (!uid) return null;
  return (inventory || []).find((e) => e.category === 'weapons' && e.uid === uid) || null;
}

/**
 * Designate (or clear) the hex weapon: returns a `{ hex_weapon_uid }` patch. Toggling
 * the current weapon clears it; picking another swaps (only one at a time).
 */
export function setHexWeapon(characterData = {}, uid) {
  const current = hexWeaponUid(characterData);
  return { hex_weapon_uid: !uid || current === uid ? null : uid };
}
