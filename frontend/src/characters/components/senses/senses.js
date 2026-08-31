/**
 * Senses — "how far can I see in the dark?"
 *
 * The sheet could not answer this at all. Darkvision was granted in three places and displayed
 * in none: the racial `Darkvision` trait, the Drow's `Superior Darkvision`, and the Rune Knight's
 * Stone Rune all carried it as prose inside a description, so a player had to read three feature
 * blurbs and work out which range won. Found in QA on the Stone Rune, whose 120 ft appeared
 * nowhere on the sheet.
 *
 * Sibling of `defenses.js` (incoming damage), `saveFeatures.js` (your own saves) and
 * `skillAdvantage.js` (skill checks): one module owns one question, entries are declarative,
 * and adding a source is a data row rather than a change to the panel.
 *
 * ── Ranges do not stack, they SUPERSEDE ──────────────────────────────────────────────────
 * A Drow Rune Knight with a carved Stone Rune has darkvision 120 ft, not 180. RAW a second
 * source of the same sense simply gives you that sense at its own radius, so the largest wins.
 * The losing sources are still returned (as `superseded`) rather than dropped, because a player
 * who unequips the rune-bearing axe needs to know they fall back to 60 ft rather than to nothing.
 *
 * NOT in scope: light sources (a torch is equipment, not a sense), the blinded condition (a
 * Conditions panel is the follow-up), and anything about what a creature can see of YOU
 * (Sunlight Sensitivity is here only because it changes how your own sight works).
 */

import { activeRunes } from '@/characters/components/inventory/runeCarving';

/**
 * Racial traits that grant a ranged sense, and the radius each gives. Keyed by the exact trait
 * string stored in `character_data.race_traits`, the same way RACE_TRAIT_DESCRIPTIONS is.
 */
export const RACE_SENSE_TRAITS = {
  Darkvision: { sense: 'Darkvision', rangeFt: 60 },
  'Superior Darkvision': { sense: 'Darkvision', rangeFt: 120 },
};

/**
 * @typedef {Object} SenseSource
 * @property {string} key
 * @property {(ctx: object) => {sense: string, rangeFt: number, source: string}[]} resolve
 */

/** @type {SenseSource[]} */
export const SENSE_SOURCES = [
  {
    key: 'race-traits',
    resolve: ({ characterData, race, subrace }) => {
      const traits = Array.isArray(characterData?.race_traits) ? characterData.race_traits : [];
      // Labelled with the race rather than the trait: "Darkvision — Darkvision" says nothing,
      // and the reader's question is which part of the character gave it to them.
      const label = subrace || race || 'Race';
      return traits
        .filter((t) => RACE_SENSE_TRAITS[t])
        .map((t) => ({ ...RACE_SENSE_TRAITS[t], source: label }));
    },
  },
  {
    key: 'rune-carving',
    // A rune grants its passive only while carved onto an object you wear or hold, so this
    // resolves through activeRunes() — put the axe away and the 120 ft goes with it.
    resolve: ({ characterData, level }) =>
      activeRunes({ characterData, level })
        .filter(({ rune }) => rune.passive?.vision)
        .map(({ rune, entry }) => ({
          ...rune.passive.vision,
          source: rune.name,
          note: `Carved on ${entry.name}`,
        })),
  },
];

/**
 * Every ranged sense the character currently has, largest radius first.
 *
 * @returns {{ sense: string, rangeFt: number, source: string, note?: string,
 *             superseded: {rangeFt: number, source: string, note?: string}[] }[]}
 */
export function getSenses(ctx = {}) {
  const all = SENSE_SOURCES.flatMap((s) => s.resolve(ctx) ?? []);
  const bySense = new Map();
  for (const entry of all) {
    const list = bySense.get(entry.sense) ?? [];
    list.push(entry);
    bySense.set(entry.sense, list);
  }
  return [...bySense.entries()]
    .map(([sense, list]) => {
      const sorted = [...list].sort((a, b) => b.rangeFt - a.rangeFt);
      const [best, ...rest] = sorted;
      return { ...best, sense, superseded: rest };
    })
    .sort((a, b) => b.rangeFt - a.rangeFt);
}

/**
 * Traits that change how the character's own sight works without granting a radius — shown
 * beside the senses because "darkvision 120 ft" and "disadvantage on sight in sunlight" are the
 * same question asked from two directions. Trait names only; the panel reads the rules text out
 * of RACE_TRAIT_DESCRIPTIONS so nothing here retypes it.
 */
export const SIGHT_NOTE_TRAITS = ['Sunlight Sensitivity'];

/** The sight-affecting traits this character has, in the order they are listed above. */
export function getSightNotes({ characterData } = {}) {
  const traits = Array.isArray(characterData?.race_traits) ? characterData.race_traits : [];
  return SIGHT_NOTE_TRAITS.filter((t) => traits.includes(t));
}

/**
 * Is there anything to show? Gates the panel, so a character with ordinary vision gets no card
 * rather than one saying "nothing special" — the same call the Defenses card makes.
 */
export function hasSenses(ctx = {}) {
  return getSenses(ctx).length > 0 || getSightNotes(ctx).length > 0;
}
