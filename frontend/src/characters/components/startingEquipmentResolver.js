/**
 * Resolves starting-equipment refs (startingEquipmentData.js) into character
 * inventory entries, matching names against the encyclopedia and falling back to
 * a plain entry when an item isn't found.
 *
 * Slot keys (for `choose` refs the player must pick) are generated identically
 * here and in enumerateChooseSlots so the wizard UI and the resolver agree.
 */
import { buildEntry } from './inventoryData';
import { PACK_CONTENTS } from './startingEquipmentData';
import { isGenericToolName } from './toolsData';

const lc = (s) => (s || '').toLowerCase();

/** Build { category: { nameLower: item } } lookup from fetched encyclopedia items. */
export function buildItemIndex(itemsByCategory = {}) {
  const index = {};
  for (const [cat, items] of Object.entries(itemsByCategory)) {
    const map = {};
    for (const it of items || []) map[lc(it.name)] = it;
    index[cat] = map;
  }
  return index;
}

/** Names of all weapons of a given category ('simple' | 'martial'), sorted. */
export function weaponNamesOfCategory(weapons = [], category) {
  return (weapons || [])
    .filter((wpn) => lc(wpn.weapon_category) === category)
    .map((wpn) => wpn.name)
    .sort();
}

function refSlotKey(prefix, refIndex) {
  return `${prefix}:${refIndex}`;
}

// Resolve one ref to inventory entries (a list — equipment packs expand into their
// contents). Real encyclopedia item → full snapshot; otherwise a plain named entry.
function resolveRefToEntries(ref, slotKey, index, picks) {
  const name = ref.choose ? picks[slotKey] : ref.name;
  if (!name) return []; // a `choose` slot not yet picked
  const contents = PACK_CONTENTS[name];
  if (contents) {
    return contents.map((c) => buildEntry(c.category, index[c.category]?.[lc(c.name)] || { name: c.name }, c.quantity || 1));
  }
  const item = index[ref.category]?.[lc(name)];
  return [buildEntry(ref.category, item || { name }, ref.quantity || 1)];
}

/**
 * Every `choose` slot the player must resolve, given the selected options.
 * Returns [{ slotKey, label, category, filter }] (filter = 'simple' | 'martial').
 */
export function enumerateChooseSlots(classEquip, selectedOptions = {}) {
  const slots = [];
  (classEquip?.groups || []).forEach((grp, gi) => {
    if (grp.fixed) {
      grp.fixed.forEach((ref, ri) => {
        if (ref.choose) slots.push({ slotKey: refSlotKey(`g${gi}:fixed`, ri), label: ref.label, category: ref.category, filter: ref.choose });
      });
    } else {
      const optKey = selectedOptions[grp.id];
      const opt = grp.options.find((o) => o.key === optKey);
      (opt?.refs || []).forEach((ref, ri) => {
        if (ref.choose) slots.push({ slotKey: refSlotKey(`${grp.id}:${optKey}`, ri), label: ref.label, category: ref.category, filter: ref.choose });
      });
    }
  });
  return slots;
}

/** Default first-option selection for each choice group. */
export function defaultSelectedOptions(classEquip) {
  const sel = {};
  (classEquip?.groups || []).forEach((grp) => {
    if (!grp.fixed && grp.options?.length) sel[grp.id] = grp.options[0].key;
  });
  return sel;
}

/**
 * Resolve the full starting inventory (class options + picks + background items).
 * `bgToolChoice` substitutes the chosen tool name for a background's generic tool
 * placeholder (e.g. Guild Artisan "Artisan's Tools" → "Mason's Tools").
 */
export function buildStartingInventory({ classEquip, bgEquip = [], selectedOptions = {}, picks = {}, index = {}, bgToolChoice = '' }) {
  const entries = [];
  (classEquip?.groups || []).forEach((grp, gi) => {
    if (grp.fixed) {
      grp.fixed.forEach((ref, ri) => {
        entries.push(...resolveRefToEntries(ref, refSlotKey(`g${gi}:fixed`, ri), index, picks));
      });
    } else {
      const optKey = selectedOptions[grp.id];
      const opt = grp.options.find((o) => o.key === optKey);
      (opt?.refs || []).forEach((ref, ri) => {
        entries.push(...resolveRefToEntries(ref, refSlotKey(`${grp.id}:${optKey}`, ri), index, picks));
      });
    }
  });
  (bgEquip || []).forEach((ref, ri) => {
    const r = bgToolChoice && isGenericToolName(ref.name) ? { ...ref, name: bgToolChoice } : ref;
    entries.push(...resolveRefToEntries(r, refSlotKey('bg', ri), index, picks));
  });
  return entries;
}
