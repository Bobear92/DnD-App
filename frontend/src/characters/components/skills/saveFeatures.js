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

/**
 * @typedef {Object} SaveFeatureEntry
 * @property {string}  name       Feature name, exactly as it appears in the feature table.
 * @property {string}  charClass  Class the feature comes from.
 * @property {string} [subclass]  Subclass, when the feature is a subclass feature.
 * @property {number}  minLevel   Level the character gains it.
 * @property {string[]} [editions] Editions it exists in. Omit = both.
 * @property {string} [description] Fallback text when the feature is not in a feature table.
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
function matches(entry, { charClass, subclass, level, edition }) {
  if (entry.charClass !== charClass) return false;
  if (entry.subclass && entry.subclass !== subclass) return false;
  if ((level ?? 1) < entry.minLevel) return false;
  if (entry.editions && !entry.editions.includes(edition)) return false;
  return true;
}

/**
 * The save-affecting features this character actually has, in level order.
 *
 * @param {{ charClass?: string, subclass?: string, level?: number, edition?: string }} ctx
 * @returns {{ key: string, name: string, source: string, level: number, description: string|null }[]}
 */
export function getSaveFeatures({ charClass, subclass, level = 1, edition = '5e' } = {}) {
  return SAVE_FEATURES
    .filter((entry) => matches(entry, { charClass, subclass, level, edition }))
    .map((entry) => ({
      key: saveFeatureKey(entry),
      name: entry.name,
      source: sourceLabel(entry),
      level: entry.minLevel,
      description: lookupDescription(entry, edition),
    }))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}
