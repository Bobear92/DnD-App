/**
 * Rune carving — which of your runes is on which object, and which of them are LIVE.
 *
 * The Rune Knight knows runes (character_data.runes, chosen at level-up) but knowing one does
 * nothing: RAW a rune only works while it is carved onto an object you are wearing or holding.
 * So there are two separate questions, and every consumer wants the second:
 *
 *   1. Which runes do you know?        → runesData / character_data.runes
 *   2. Which runes are actually ON?    → activeRunes() — carved AND the bearing item equipped
 *
 * ── Storage ──────────────────────────────────────────────────────────────────────────────
 * `character_data.rune_items = { '<Rune Name>': '<inventory entry uid>' }`.
 *
 * Keyed by RUNE, not by item, because the rune is the scarce resource — you have 2–5 of them
 * and an unbounded number of objects. That direction also makes "one rune per object" a
 * uniqueness check over the values, and "this rune is on exactly one thing" free.
 *
 * This is the third instance of the designate-an-inventory-item pattern (Eldritch Knight
 * `bonded_weapon_uids`, Hexblade `hex_weapon_uid`) but deliberately NOT built on their shared
 * WeaponDesignationPanel: those are ONE feature → N items, with the picker living in a feature
 * panel and weapons only. Runes are N runes → N items, 1:1, the control lives on the ITEM card,
 * and armor and shields qualify. Forcing it through that panel would mean six panels.
 *
 * ── Scope limit (deliberate) ─────────────────────────────────────────────────────────────
 * RAW a rune may go on "a weapon, a suit of armor, a shield, a piece of jewelry, or something
 * else you can wear or hold in a hand". We offer weapons, armor and shields ONLY — the only
 * wearable/holdable things the inventory models as equippable. Jewelry lives in adventuring
 * gear / magic items with no worn state, so a rune on one could never be known to be "held".
 * Revisit when items gain a worn model.
 *
 * ── Re-inscribing ────────────────────────────────────────────────────────────────────────
 * RAW you re-inscribe your runes when you finish a long rest. We let a rune be moved at any
 * time and do NOT clear the map on a rest: the app has no "you already inscribed today" state,
 * and wiping every assignment each morning would mean re-picking five runes before play. The
 * end state is identical to RAW for any character who would have re-inscribed the same objects.
 */

import { RUNE_OPTIONS, getRune, runesKnownAtLevel } from '@/characters/components/classData/runesData';

/** Inventory categories that can bear a rune. Shields are `armor` entries (armor_type Shield). */
export const RUNE_ITEM_CATEGORIES = new Set(['weapons', 'armor']);

/** True when this inventory entry is something a rune can be carved onto. */
export function isRuneCarvable(entry) {
  return !!entry && RUNE_ITEM_CATEGORIES.has(entry.category);
}

/** True when the character is a Rune Knight who has the Rune Carving feature. */
export function hasRuneCarving({ charClass, subclass, level = 1, edition = '5e' } = {}) {
  // Rune Knight is 5e-only — the 2024 PHB ships no Rune Knight — but a campaign can hold a
  // 5e-built character while set to 2024, so gate on the subclass rather than the edition.
  return charClass === 'Fighter' && subclass === 'Rune Knight' && (level ?? 1) >= 3;
}

/** The stored map, always an object. */
export function runeItems(characterData) {
  const map = characterData?.rune_items;
  return map && typeof map === 'object' ? map : {};
}

/** The rune carved on a given inventory entry, or null. */
export function runeOnItem(uid, characterData) {
  if (!uid) return null;
  const map = runeItems(characterData);
  const name = Object.keys(map).find((rune) => map[rune] === uid);
  return name ?? null;
}

/** The inventory uid a given rune is carved on, or null. */
export function itemUidForRune(runeName, characterData) {
  return runeItems(characterData)[runeName] ?? null;
}

/**
 * The runes this character KNOWS, as full option objects, filtered to those actually earned.
 * `character_data.runes` is the authority; the level cap guards a character who kept extra
 * picks from a since-reduced level.
 */
export function knownRunes(characterData, level = 1) {
  const names = Array.isArray(characterData?.runes) ? characterData.runes : [];
  const cap = runesKnownAtLevel(level);
  return names.slice(0, Math.max(0, cap)).map(getRune).filter(Boolean);
}

/**
 * Runes selectable for a given item: every known rune that is either already on this item or
 * not carved anywhere. A rune carved on ANOTHER object is excluded rather than silently moved
 * — moving it would quietly strip a passive off a different item.
 */
export function availableRunesForItem(entry, characterData, level = 1) {
  const map = runeItems(characterData);
  return knownRunes(characterData, level).filter(
    (rune) => !map[rune.name] || map[rune.name] === entry?.uid,
  );
}

/**
 * Patch carving `runeName` onto `uid`. Enforces both halves of the 1:1 rule — the rune leaves
 * whatever it was on, and any OTHER rune already on this object is displaced (one rune per
 * object). Returns the whole map, since character_data patches replace the key wholesale.
 */
export function assignRunePatch(runeName, uid, characterData) {
  const next = { ...runeItems(characterData) };
  for (const [rune, itemUid] of Object.entries(next)) {
    if (itemUid === uid) delete next[rune]; // one rune per object
  }
  next[runeName] = uid;
  return { rune_items: next };
}

/** Patch removing a rune from whatever it is carved on. */
export function clearRunePatch(runeName, characterData) {
  const next = { ...runeItems(characterData) };
  delete next[runeName];
  return { rune_items: next };
}

/**
 * Patch dropping any rune carved on `uid` — used when an item leaves the inventory, so a
 * deleted sword can't leave a rune permanently stranded on a uid nothing resolves to.
 */
export function clearRunesOnItemPatch(uid, characterData) {
  const next = { ...runeItems(characterData) };
  let changed = false;
  for (const [rune, itemUid] of Object.entries(next)) {
    if (itemUid === uid) { delete next[rune]; changed = true; }
  }
  return changed ? { rune_items: next } : null;
}

/**
 * The runes that are actually working right now: known, carved onto an item still in the
 * inventory, and that item equipped. THIS is what every passive/Channel Rune consumer gates on.
 *
 * @returns {{ rune: object, entry: object }[]} in canonical pool order
 */
export function activeRunes({ characterData, level = 1 } = {}) {
  const inventory = Array.isArray(characterData?.inventory) ? characterData.inventory : [];
  const map = runeItems(characterData);
  const known = new Set(knownRunes(characterData, level).map((r) => r.name));
  return RUNE_OPTIONS.filter((rune) => known.has(rune.name))
    .map((rune) => {
      const entry = inventory.find((e) => e.uid && e.uid === map[rune.name]);
      // `equipped` is kept in sync with hand assignment for weapons and shields, and is the
      // plain toggle for body armor — so it is the one flag that answers "worn or held".
      return entry && entry.equipped ? { rune, entry } : null;
    })
    .filter(Boolean);
}

/** True when a named rune is live (known + carved + the bearing item equipped). */
export function isRuneActive(runeName, { characterData, level = 1 } = {}) {
  return activeRunes({ characterData, level }).some((a) => a.rune.name === runeName);
}

/**
 * Known runes that are NOT live, with the reason — so a surface can say "carve it" or "equip
 * the axe" instead of silently omitting the rune the player is looking for.
 */
export function inactiveRunes({ characterData, level = 1 } = {}) {
  const inventory = Array.isArray(characterData?.inventory) ? characterData.inventory : [];
  const map = runeItems(characterData);
  return knownRunes(characterData, level)
    .map((rune) => {
      const uid = map[rune.name];
      if (!uid) return { rune, reason: 'Not carved onto anything yet.' };
      const entry = inventory.find((e) => e.uid === uid);
      if (!entry) return { rune, reason: 'Carved onto an item you no longer have.' };
      if (!entry.equipped) return { rune, reason: `Carved on ${entry.name}, which is not equipped.` };
      return null;
    })
    .filter(Boolean);
}
