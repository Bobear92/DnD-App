/**
 * Features that change how the CHARACTER'S OWN saving throws work.
 *
 * The Saving Throws grid can only show a number: ability modifier + proficiency. Plenty of
 * class and subclass features change a save without changing that number — advantage in a
 * situation, a reroll, an auto-success, a bonus that only applies sometimes. Those used to
 * live only in the Features tab, several clicks away from the saves a player is looking at
 * when it matters. This registry surfaces them right under the grid.
 *
 * ONLY features that affect your own saves belong here. A feature that makes an ENEMY save
 * (a spell save DC) or gives an enemy disadvantage on ITS save (Eldritch Knight's Eldritch
 * Strike) is not a save feature for this panel — it belongs on the surface where the effect
 * originates, which is where those already live.
 *
 * An entry declares only how to FIND the feature; its text is read back out of the feature
 * tables (`SUBCLASS_DATA`, `CLASS_FEATURES_*`) that the Features tab and the encyclopedia
 * already render, so the panel can never drift from the rules text elsewhere in the app.
 * A `description` on the entry is a fallback for sources with no table (races, feats).
 *
 * Adding another feature is one line. Matching is declarative — every key present on the
 * entry must match the character — so race/feat sources can be added later by giving an
 * entry a `race` key and teaching `matches` about it, with no change to the panel.
 */

import { SUBCLASS_DATA } from '@/characters/components/classData/subclassData';
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import { isRuneActive } from '@/characters/components/inventory/runeCarving';
import { getRune } from '@/characters/components/classData/runesData';
import { isEffectActive } from '@/characters/components/effects/activeEffects';

/**
 * @typedef {Object} SaveFeatureEntry
 * @property {string}  name       Feature name, exactly as it appears in the feature table.
 * @property {string}  charClass  Class the feature comes from.
 * @property {string} [subclass]  Subclass, when the feature is a subclass feature.
 * @property {number}  minLevel   Level the character gains it.
 * @property {string[]} [editions] Editions it exists in. Omit = both.
 * @property {string} [description] Fallback text when the feature is not in a feature table.
 * @property {string[]} [advantageAbilities] Abilities whose saves this grants ADVANTAGE on, when
 *   the feature is that specific. The grid tags those rows; a feature whose advantage is scoped
 *   by situation rather than by ability (Born to the Saddle — falling off a mount; Hill Rune —
 *   against poison) deliberately omits it and stays panel-only, because a tag on a save row
 *   asserts "roll this twice" with no room for the condition that makes it true.
 */

/** @type {SaveFeatureEntry[]} */
export const SAVE_FEATURES = [
  {
    name: 'Born to the Saddle',
    charClass: 'Fighter',
    subclass: 'Cavalier',
    minLevel: 3,
    editions: ['5e'],
  },
  // Rune Knight, Hill Rune — advantage on saves against being poisoned. Gated on the rune
  // being CARVED onto an equipped object, not on knowing it, so the row appears exactly when
  // the advantage is real. Its text comes from RUNE_OPTIONS rather than the subclass feature
  // table, because the feature there is "Rune Carving" and describes all six runes at once.
  {
    name: 'Hill Rune',
    charClass: 'Fighter',
    subclass: 'Rune Knight',
    minLevel: 7,
    editions: ['5e'],
    applies: (ctx) => isRuneActive('Hill Rune', ctx),
    description: getRune('Hill Rune')?.passive?.text ?? null,
  },
  // Rune Knight, Giant's Might — advantage on Strength saves while the effect is RUNNING. It is
  // the first entry gated on an active effect rather than on what the character permanently has,
  // and the first with `advantageAbilities`: RAW names Strength specifically, so the grid can tag
  // the STR row instead of leaving the advantage as prose the reader applies by hand.
  {
    name: "Giant's Might",
    charClass: 'Fighter',
    subclass: 'Rune Knight',
    minLevel: 3,
    editions: ['5e'],
    advantageAbilities: ['strength'],
    applies: ({ characterData }) => isEffectActive(characterData, 'giants_might'),
  },
];

/** Stable, DOM-safe id for an entry — used for test ids and React keys. */
export function saveFeatureKey(entry) {
  return [entry.charClass, entry.subclass, entry.name]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Where the feature comes from, for the "from X" label. */
function sourceLabel(entry) {
  return entry.subclass || entry.charClass;
}

/** The feature's rules text, read out of whichever feature table owns it. */
function lookupDescription(entry, edition) {
  if (entry.subclass) {
    const features = SUBCLASS_DATA[entry.charClass]?.[edition]?.[entry.subclass]?.features ?? [];
    const found = features.find((f) => f.name === entry.name);
    if (found) return found.description;
  } else {
    const table = edition === '5.5e' ? CLASS_FEATURES_2024 : CLASS_FEATURES_5E;
    const byLevel = table[entry.charClass] ?? {};
    for (const level of Object.keys(byLevel)) {
      const found = (byLevel[level] ?? []).find((f) => f.name === entry.name);
      if (found) return found.description;
    }
  }
  return entry.description ?? null;
}

/** True when every gate the entry declares is satisfied by this character. */
function matches(entry, ctx) {
  const { charClass, subclass, level, edition } = ctx;
  if (entry.charClass !== charClass) return false;
  if (entry.subclass && entry.subclass !== subclass) return false;
  if ((level ?? 1) < entry.minLevel) return false;
  if (entry.editions && !entry.editions.includes(edition)) return false;
  // Escape hatch for gates the declarative keys cannot express — a rune depends on whether it
  // is carved onto an EQUIPPED item, which is character_data state. See defenses.js, same shape.
  if (entry.applies && !entry.applies(ctx)) return false;
  return true;
}

/**
 * The save-affecting features this character actually has, in level order.
 *
 * @param {{ charClass?: string, subclass?: string, level?: number, edition?: string }} ctx
 * @returns {{ key: string, name: string, source: string, level: number, description: string|null,
 *             advantageAbilities: string[] }[]}
 */
export function getSaveFeatures({
  charClass, subclass, level = 1, edition = '5e', characterData = {},
} = {}) {
  return SAVE_FEATURES
    .filter((entry) => matches(entry, { charClass, subclass, level, edition, characterData }))
    .map((entry) => ({
      key: saveFeatureKey(entry),
      name: entry.name,
      source: sourceLabel(entry),
      level: entry.minLevel,
      description: lookupDescription(entry, edition),
      advantageAbilities: entry.advantageAbilities ?? [],
    }))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

/**
 * The features granting advantage on ONE ability's saving throws — what the Saving Throws grid
 * needs to tag a row and name why. Empty for an ability nothing covers, and empty for every
 * ability when the only live features are situational ones (which carry no `advantageAbilities`).
 */
export function saveAdvantageSourcesFor(ability, ctx = {}) {
  return getSaveFeatures(ctx).filter((f) => f.advantageAbilities.includes(ability));
}

/** Just the abilities, deduped — the cheap lookup for rendering the 'adv' tag. */
export function getSaveAdvantageAbilities(ctx = {}) {
  return [...new Set(getSaveFeatures(ctx).flatMap((f) => f.advantageAbilities))];
}
