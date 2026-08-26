/**
 * Damage resistances, immunities and flat reductions — "how much does this hurt me?"
 *
 * The sheet could answer "how hard am I to hit" (AC) and "how much can I take" (HP) but had
 * nowhere at all for "is this fire damage halved?". Every resistance in the app was prose
 * buried in a class/subclass/race feature description, several clicks from the HP the player
 * is watching when it matters.
 *
 * ── The rule that shapes this whole module ───────────────────────────────────────────────
 * The app has NO active-effect model. There is no `isRaging`, no concentration state, no
 * buff duration anywhere (deliberately — the app displays what a character CAN do rather
 * than simulating a battlefield; same line companions, Encounters V1 and spell-granted magic
 * weapons all draw). So a resistance that only applies while raging, while transformed, or
 * while wearing heavy armor MUST carry its condition as visible text. A bare "Bludgeoning"
 * row for a Barbarian would be false most of the time.
 *
 * Hence every entry is either ALWAYS ON (`condition: null`) or SITUATIONAL (`condition` is
 * the short phrase shown under it). The panel renders those as two separate groups and never
 * flattens them together.
 *
 * ── Where entries come from ──────────────────────────────────────────────────────────────
 * Class / subclass / race features are rows in this table, gated declaratively (every key
 * present on the entry must match). Their rules text is read back out of the feature tables
 * the Features tab and encyclopedia already render, so this panel can never drift from the
 * wording elsewhere; `description` on an entry is the fallback for sources with no table.
 *
 * FEATS are different: they come through the structured `damage_reduction` feat effect
 * (featEffects.getFeatDamageReductions), not through this table, so a feat keeps ONE
 * mechanization route and the backend coverage report stays the source of truth for it.
 * A feat that grants a *resistance* has no effect kind yet (Dungeon Delver, the two 2024
 * Epic Boons) — those would want a sibling `resistance` effect kind rather than a row here.
 *
 * NOT in scope — a defense belonging to something that is not the character:
 *   • A summoned companion's (the Echo Knight echo's condition immunity) — that is the
 *     echo's defense and lives on the companion panel, the same boundary saveFeatures draws
 *     when it excludes an enemy-facing save.
 *   • A defense you grant to OTHERS (Aura of Warding's allies, Warding Maneuver's target) —
 *     it belongs on the surface that fires it. An aura that covers you TOO is in scope.
 */

import { SUBCLASS_DATA } from '@/characters/components/classData/subclassData';
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import { RACE_TRAIT_DESCRIPTIONS } from '@/characters/components/race/raceTraitsData';
import { hasRaceTrait } from '@/characters/components/race/raceCombatNotes';
import { getFeatDamageReductions } from '@/characters/components/feats/featEffects';
import { isRuneActive } from '@/characters/components/inventory/runeCarving';
import { getRune } from '@/characters/components/classData/runesData';

/** The three things a defense can do to incoming damage. */
export const DEFENSE_KINDS = ['resistance', 'immunity', 'reduction'];

const BPS = ['bludgeoning', 'piercing', 'slashing'];
/** "Resistance to all damage" — a real RAW shape, narrowed by a `qualifier` where it applies. */
const ALL = ['all'];

/** The Sorcerer's stored draconic bloodline damage type — distinct from the Dragonborn race's. */
const draconicBloodlineType = ({ characterData }) => {
  const dmg = characterData?.draconic_bloodline?.damage;
  return dmg ? [String(dmg).toLowerCase()] : [];
};

/**
 * @typedef {Object} DefenseEntry
 * @property {string}   name         Feature/trait name, exactly as the feature table spells it.
 * @property {'resistance'|'immunity'|'reduction'} kind
 * @property {string[]|(ctx)=>string[]} damageTypes  A function when the type is a stored player
 *                                   choice (Dragonborn ancestry) rather than fixed.
 * @property {string|null} condition Short phrase ("while raging"); null = always on.
 * @property {string}  [charClass]   Gate: class the feature comes from.
 * @property {string}  [subclass]    Gate: subclass, when it is a subclass feature.
 * @property {string}  [race]        Gate: a race TRAIT name held in character_data.race_traits.
 * @property {number}  [minLevel]    Gate: level gained. Defaults to 1.
 * @property {string[]} [editions]   Gate: editions it exists in. Omit = both.
 * @property {number}  [amount]      Reduction only: how much is subtracted.
 * @property {string}  [qualifier]   Narrows WHICH damage of that type is covered — "from
 *                                   spells", "from nonmagical weapons", "except force". Some
 *                                   defenses key on the damage's SOURCE rather than its type
 *                                   and the type column alone would overstate them.
 * @property {string}  [typeLabel]   Overrides the type column. For a defense whose type is a
 *                                   player choice the app does not persist (the Fiend's
 *                                   rest-chosen type, the Genie's patron) — better to name the
 *                                   choice than to invent a type or drop the row.
 * @property {string}  [description] Fallback text when no feature table owns it.
 */

/** @type {DefenseEntry[]} */
export const DEFENSES = [
  // ── Race traits ───────────────────────────────────────────────────────────────────────
  {
    name: 'Dwarven Resilience',
    race: 'Dwarven Resilience',
    kind: 'resistance',
    damageTypes: ['poison'],
    condition: null,
  },
  {
    name: 'Stout Resilience',
    race: 'Stout Resilience',
    kind: 'resistance',
    damageTypes: ['poison'],
    condition: null,
  },
  {
    name: 'Hellish Resistance',
    race: 'Hellish Resistance',
    kind: 'resistance',
    damageTypes: ['fire'],
    condition: null,
  },
  {
    // The one race entry whose damage TYPE is a stored player choice — the ancestry picked at
    // creation, kept as {name, damage} on character_data.draconic_ancestry. Reading it here
    // (rather than hardcoding a type) is what makes a Silver Dragonborn show Cold, not Fire.
    name: 'Damage Resistance',
    race: 'Damage Resistance',
    kind: 'resistance',
    damageTypes: ({ characterData }) => {
      const dmg = characterData?.draconic_ancestry?.damage;
      return dmg ? [String(dmg).toLowerCase()] : [];
    },
    condition: null,
  },

  // ── Class features ────────────────────────────────────────────────────────────────────
  // Rune Knight, Hill Rune. Gated on the rune being CARVED onto an equipped object rather
  // than on merely knowing it — knowing a rune grants nothing (see runeCarving.js). Because
  // the gate already proves the rune is live, this is an ALWAYS ON row: it appears exactly
  // when it is true and disappears when the bearing item comes off, so it never needs the
  // "while ..." text a condition would carry. Its rules text comes from RUNE_OPTIONS, the
  // table that owns rune wording, so the two can't drift.
  {
    name: 'Hill Rune',
    charClass: 'Fighter',
    subclass: 'Rune Knight',
    kind: 'resistance',
    damageTypes: ['poison'],
    minLevel: 7,
    editions: ['5e'],
    applies: (ctx) => isRuneActive('Hill Rune', ctx),
    // The row is named for the RUNE, which is what a player looks for, but the subclass
    // feature that grants it is "Rune Carving" — `featureName` keeps the drift guard pointed
    // at the real feature. The rules text comes from RUNE_OPTIONS rather than that feature,
    // whose blurb describes all six runes at once and would say almost nothing about poison.
    featureName: 'Rune Carving',
    description: getRune('Hill Rune')?.passive?.text ?? null,
    condition: null,
  },
  {
    name: 'Rage',
    charClass: 'Barbarian',
    kind: 'resistance',
    damageTypes: BPS,
    minLevel: 1,
    condition: 'while raging',
  },
  {
    name: 'Purity of Body',
    charClass: 'Monk',
    kind: 'immunity',
    damageTypes: ['poison'],
    minLevel: 10,
    editions: ['5e'],
    condition: null,
  },
  {
    name: 'Empty Body',
    charClass: 'Monk',
    kind: 'resistance',
    damageTypes: ALL,
    qualifier: 'except force',
    minLevel: 18,
    editions: ['5e'],
    condition: 'while invisible via Empty Body',
  },
  {
    name: 'Superior Defense',
    charClass: 'Monk',
    kind: 'resistance',
    damageTypes: ALL,
    minLevel: 18,
    editions: ['5.5e'],
    condition: 'while spending 3 Focus Points on your turn',
  },

  // ── Subclass features ─────────────────────────────────────────────────────────────────
  {
    name: 'Chemical Mastery',
    charClass: 'Artificer',
    subclass: 'Alchemist',
    kind: 'resistance',
    damageTypes: ['acid', 'poison'],
    minLevel: 15,
    editions: ['5e'],
    condition: null,
  },
  {
    name: 'Avatar of Battle',
    charClass: 'Cleric',
    subclass: 'War Domain',
    kind: 'resistance',
    damageTypes: BPS,
    qualifier: 'from nonmagical weapons',
    minLevel: 17,
    condition: null,
  },
  {
    name: 'Soul of the Forge',
    charClass: 'Cleric',
    subclass: 'Forge Domain',
    kind: 'resistance',
    damageTypes: ['fire'],
    minLevel: 6,
    condition: null,
  },
  {
    // Deliberately listed alongside Soul of the Forge rather than replacing it — RAW you have
    // both, and the panel reports SOURCES, not a computed net defense.
    name: 'Saint of Forge and Fire',
    charClass: 'Cleric',
    subclass: 'Forge Domain',
    kind: 'immunity',
    damageTypes: ['fire'],
    minLevel: 17,
    condition: null,
  },
  {
    name: "Nature's Ward",
    charClass: 'Druid',
    subclass: 'Circle of the Land',
    kind: 'immunity',
    damageTypes: ['poison'],
    minLevel: 10,
    condition: null,
  },
  {
    name: 'Stormborn',
    charClass: 'Druid',
    subclass: 'Circle of the Sea',
    kind: 'resistance',
    damageTypes: ['cold', 'lightning'],
    minLevel: 10,
    editions: ['5.5e'],
    condition: null,
  },
  {
    // The subclass is spelled differently per edition ('Circle of Stars' → 'Circle of the
    // Stars'), so this is two entries rather than one with a shared gate.
    name: 'Full of Stars',
    charClass: 'Druid',
    subclass: 'Circle of Stars',
    kind: 'resistance',
    damageTypes: BPS,
    minLevel: 14,
    editions: ['5e'],
    condition: 'while in Starry Form',
  },
  {
    name: 'Full of Stars',
    charClass: 'Druid',
    subclass: 'Circle of the Stars',
    kind: 'resistance',
    damageTypes: BPS,
    minLevel: 14,
    editions: ['5.5e'],
    condition: 'while in Starry Form',
  },
  {
    name: 'Guarded Mind',
    charClass: 'Fighter',
    subclass: 'Psi Warrior',
    kind: 'resistance',
    damageTypes: ['psychic'],
    minLevel: 10,
    condition: null,
  },
  {
    name: 'Aura of Warding',
    charClass: 'Paladin',
    subclass: 'Oath of the Ancients',
    kind: 'resistance',
    damageTypes: ALL,
    qualifier: 'from spells',
    minLevel: 7,
    condition: null,
  },
  {
    name: 'Invincible Conqueror',
    charClass: 'Paladin',
    subclass: 'Oath of Conquest',
    kind: 'resistance',
    damageTypes: ALL,
    minLevel: 20,
    condition: 'while your aspect of conquest is active',
  },
  {
    name: 'Emissary of Redemption',
    charClass: 'Paladin',
    subclass: 'Oath of Redemption',
    kind: 'resistance',
    damageTypes: ALL,
    qualifier: 'from other creatures, not the environment',
    minLevel: 20,
    // RAW this switches off the moment you attack, so it is not an always-on defense.
    condition: 'until you attack or harm a creature',
  },
  {
    name: 'Supernatural Resistance',
    charClass: 'Paladin',
    subclass: 'Oathbreaker',
    kind: 'resistance',
    damageTypes: BPS,
    qualifier: 'from nonmagical weapons',
    minLevel: 15,
    condition: null,
  },
  {
    // The type comes from the Sorcerer's stored draconic bloodline — a DIFFERENT stored
    // choice from the Dragonborn race's draconic_ancestry above.
    name: 'Elemental Affinity',
    charClass: 'Sorcerer',
    subclass: 'Draconic Bloodline',
    kind: 'resistance',
    damageTypes: draconicBloodlineType,
    minLevel: 6,
    editions: ['5e'],
    condition: 'for 1 hour, costs 1 sorcery point',
  },
  {
    name: 'Elemental Affinity',
    charClass: 'Sorcerer',
    subclass: 'Draconic Sorcery',
    kind: 'resistance',
    damageTypes: draconicBloodlineType,
    minLevel: 6,
    editions: ['5.5e'],
    condition: 'for 1 hour, costs 1 sorcery point',
  },
  {
    name: 'Umbral Form',
    charClass: 'Sorcerer',
    subclass: 'Shadow Magic',
    kind: 'resistance',
    damageTypes: ALL,
    qualifier: 'except force and radiant',
    minLevel: 18,
    condition: 'while in umbral form',
  },
  {
    name: 'Heart of the Storm',
    charClass: 'Sorcerer',
    subclass: 'Storm Sorcery',
    kind: 'resistance',
    damageTypes: ['lightning', 'thunder'],
    minLevel: 6,
    condition: null,
  },
  {
    name: 'Wind Soul',
    charClass: 'Sorcerer',
    subclass: 'Storm Sorcery',
    kind: 'immunity',
    damageTypes: ['lightning', 'thunder'],
    minLevel: 18,
    condition: null,
  },
  {
    name: 'Psychic Defenses',
    charClass: 'Sorcerer',
    subclass: 'Aberrant Mind',
    kind: 'resistance',
    damageTypes: ['psychic'],
    minLevel: 6,
    condition: null,
  },
  {
    // Re-chosen on every rest and never persisted, so the type column names the choice
    // instead of inventing an answer. Levels differ per edition → two entries.
    name: 'Fiendish Resilience',
    charClass: 'Warlock',
    subclass: 'The Fiend',
    kind: 'resistance',
    damageTypes: ['chosen'],
    typeLabel: 'Your choice',
    qualifier: 'chosen at your last rest; magical and silvered weapons ignore it',
    minLevel: 10,
    editions: ['5e'],
    condition: null,
  },
  {
    name: 'Fiendish Resilience',
    charClass: 'Warlock',
    subclass: 'The Fiend',
    kind: 'resistance',
    damageTypes: ['chosen'],
    typeLabel: 'Your choice',
    qualifier: 'chosen at your last rest; magical and silvered weapons ignore it',
    minLevel: 6,
    editions: ['5.5e'],
    condition: null,
  },
  {
    name: 'Radiant Soul',
    charClass: 'Warlock',
    subclass: 'The Celestial',
    kind: 'resistance',
    damageTypes: ['radiant'],
    minLevel: 6,
    condition: null,
  },
  {
    name: 'Oceanic Soul',
    charClass: 'Warlock',
    subclass: 'The Fathomless',
    kind: 'resistance',
    damageTypes: ['cold'],
    minLevel: 6,
    condition: null,
  },
  {
    // Determined by the patron's kind (dao/djinni/efreeti/marid), which the app does not
    // store — so the row names where the answer comes from rather than guessing it.
    name: 'Elemental Gift',
    charClass: 'Warlock',
    subclass: 'The Genie',
    kind: 'resistance',
    damageTypes: ['by patron'],
    typeLabel: 'By patron',
    qualifier: 'bludgeoning (dao), thunder (djinni), fire (efreeti) or cold (marid)',
    minLevel: 6,
    editions: ['5e'],
    condition: null,
  },
  {
    name: 'Necrotic Husk',
    charClass: 'Warlock',
    subclass: 'The Undead',
    kind: 'resistance',
    damageTypes: ['necrotic'],
    minLevel: 10,
    condition: null,
  },
  {
    name: 'Inured to Undeath',
    charClass: 'Wizard',
    subclass: 'School of Necromancy',
    kind: 'resistance',
    damageTypes: ['necrotic'],
    minLevel: 10,
    editions: ['5e'],
    condition: null,
  },
  {
    name: 'Inured to Undeath',
    charClass: 'Wizard',
    subclass: 'Necromancer',
    kind: 'resistance',
    damageTypes: ['necrotic'],
    minLevel: 10,
    editions: ['5.5e'],
    condition: null,
  },
  {
    name: 'Spell Resistance',
    charClass: 'Wizard',
    subclass: 'School of Abjuration',
    kind: 'resistance',
    damageTypes: ALL,
    qualifier: 'from spells',
    minLevel: 14,
    editions: ['5e'],
    condition: null,
  },
  {
    name: 'Spell Resistance',
    charClass: 'Wizard',
    subclass: 'Abjurer',
    kind: 'resistance',
    damageTypes: ALL,
    qualifier: 'from spells',
    minLevel: 14,
    editions: ['5.5e'],
    condition: null,
  },
];

/**
 * Stable, DOM-safe id for an entry — used for test ids and React keys.
 *
 * The edition is part of the key ONLY for edition-scoped entries, because a feature can exist
 * in both editions under the same class, subclass and name at different levels (the Fiend's
 * Fiendish Resilience is L10 in 2014 and L6 in 2024) — without it those two collide.
 */
export function defenseKey(entry) {
  return [entry.charClass, entry.subclass, entry.race && 'race', entry.name,
    entry.editions?.join('-')]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Where the defense comes from, for the "from X" label. */
function sourceLabel(entry) {
  return entry.subclass || entry.charClass || (entry.race ? 'Race' : 'Feat');
}

/** The feature's rules text, read out of whichever table owns it. */
function lookupDescription(entry, edition) {
  if (entry.race) return RACE_TRAIT_DESCRIPTIONS[entry.race] ?? entry.description ?? null;
  if (entry.subclass) {
    const features = SUBCLASS_DATA[entry.charClass]?.[edition]?.[entry.subclass]?.features ?? [];
    const found = features.find((f) => f.name === entry.name);
    if (found) return found.description;
  } else if (entry.charClass) {
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
  const { charClass, subclass, level, edition, raceTraits } = ctx;
  if (entry.charClass && entry.charClass !== charClass) return false;
  if (entry.subclass && entry.subclass !== subclass) return false;
  if (entry.race && !hasRaceTrait(raceTraits, entry.race)) return false;
  if ((level ?? 1) < (entry.minLevel ?? 1)) return false;
  if (entry.editions && !entry.editions.includes(edition)) return false;
  // `applies` is the escape hatch for a gate the declarative keys cannot express — the Hill
  // Rune depends on whether a rune is carved onto an EQUIPPED item, which is character_data
  // state rather than class/level/edition. Entries without one are unaffected.
  if (entry.applies && !entry.applies(ctx)) return false;
  return true;
}

const titleCase = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

/**
 * The damage-type column. Types are spelled out in full — the column is the first thing a
 * player scans to answer "is this damage halved?", and an initialism ("B / P / S") makes them
 * decode it. The row has the width for the words.
 */
export function formatDamageTypes(types = []) {
  return types.map((t) => titleCase(String(t).toLowerCase())).join(' / ');
}

/** The value column — what the defense actually does to the damage. */
export function formatDefenseValue(kind, amount) {
  if (kind === 'reduction') return `−${amount}`;
  if (kind === 'immunity') return 'Immunity';
  return 'Resistance';
}

/**
 * Every damage defense this character has, split by whether it is always on.
 *
 * @param {object} ctx
 * @param {string} ctx.charClass
 * @param {string} [ctx.subclass]
 * @param {number} [ctx.level]
 * @param {string} [ctx.edition]
 * @param {object} [ctx.characterData]  Read for race_traits, feats and stored choices.
 * @param {number} [ctx.pb]             Proficiency bonus, for PB-scaled feat reductions.
 * @returns {{alwaysOn: object[], situational: object[]}}
 */
export function getDefenses({
  charClass, subclass, level = 1, edition = '5e', characterData = {}, pb = 0,
} = {}) {
  const raceTraits = characterData?.race_traits ?? [];
  const feats = characterData?.feats ?? [];
  const ctx = { charClass, subclass, level, edition, characterData, raceTraits, pb };

  const fromTable = DEFENSES
    .filter((entry) => matches(entry, ctx))
    .map((entry) => {
      const types = typeof entry.damageTypes === 'function'
        ? entry.damageTypes(ctx)
        : entry.damageTypes;
      return {
        key: defenseKey(entry),
        name: entry.name,
        source: sourceLabel(entry),
        kind: entry.kind,
        damageTypes: types,
        typeLabel: entry.typeLabel ?? formatDamageTypes(types),
        valueLabel: formatDefenseValue(entry.kind, entry.amount),
        qualifier: entry.qualifier ?? null,
        condition: entry.condition ?? null,
        description: lookupDescription(entry, edition),
      };
    })
    // A choice-driven entry whose choice was never made resolves to no damage types; an
    // empty row would say a Dragonborn resists nothing in particular.
    .filter((row) => row.damageTypes.length > 0);

  // Feats arrive through the structured effect, already level- and edition-correct (the
  // snapshot on the character IS the edition's authored effect), so they need no gating here.
  const fromFeats = getFeatDamageReductions(feats, { pb }).map((r) => ({
    key: `feat-${r.source.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: r.source,
    source: 'Feat',
    kind: 'reduction',
    damageTypes: r.damageTypes,
    typeLabel: formatDamageTypes(r.damageTypes),
    valueLabel: formatDefenseValue('reduction', r.amount),
    // The 2014 feat covers only nonmagical attacks; the 2024 rewrite dropped that clause,
    // so the qualifier is present or absent per edition rather than always shown.
    qualifier: r.nonmagicalOnly ? 'from nonmagical attacks' : null,
    condition: conditionText(r.condition),
    description: null,
  }));

  const all = [...fromTable, ...fromFeats]
    .sort((a, b) => a.typeLabel.localeCompare(b.typeLabel) || a.name.localeCompare(b.name));

  return {
    alwaysOn: all.filter((r) => !r.condition),
    situational: all.filter((r) => !!r.condition),
  };
}

/**
 * Resolve one instance of incoming damage through the RAW order of operations.
 *
 * The order is the whole point and it is the thing people get wrong: every other modifier is
 * applied first, THEN vulnerability doubles, THEN resistance halves (rounding down), and only
 * then does a flat reduction like Heavy Armor Master subtract. Halving before subtracting and
 * subtracting before halving give different answers, and a raging Barbarian in heavy armor
 * hits both rules at once.
 *
 * Resistance and vulnerability are booleans, not counts, deliberately: neither stacks with
 * itself (two sources of fire resistance is still half), and having both cancels out entirely.
 *
 * Currently consumed by the Taking Damage reference page rather than the sheet — the app
 * displays what a character can do rather than resolving hits, so nothing rolls damage yet.
 * It lives here so the page's worked example is executed rather than typed, and so it is the
 * obvious home if damage resolution is ever built.
 *
 * @returns {{final: number, steps: {label: string, value: number}[]}}
 */
export function applyDamage({ amount = 0, resistant = false, vulnerable = false, reduction = 0 } = {}) {
  const steps = [{ label: 'Damage rolled', value: amount }];
  let value = amount;

  // Both at once cancel — they are not applied in sequence.
  if (vulnerable && !resistant) {
    value *= 2;
    steps.push({ label: 'Vulnerable — doubled', value });
  } else if (resistant && !vulnerable) {
    value = Math.floor(value / 2);
    steps.push({ label: 'Resistant — halved, rounded down', value });
  } else if (resistant && vulnerable) {
    steps.push({ label: 'Resistant and vulnerable — they cancel', value });
  }

  if (reduction > 0) {
    value = Math.max(0, value - reduction);
    steps.push({ label: `Flat reduction — ${reduction}`, value });
  }

  return { final: value, steps };
}

/**
 * Does this character have any damage defense at all?
 *
 * Exists so a caller can decide whether to render the surrounding card BEFORE mounting the
 * panel — the panel returning null still leaves an empty titled card behind it. Pure and
 * cheap, so calling it alongside getDefenses costs nothing worth avoiding.
 */
export function hasDefenses(ctx = {}) {
  const { alwaysOn, situational } = getDefenses(ctx);
  return alwaysOn.length > 0 || situational.length > 0;
}

/** Machine-readable feat conditions → the phrase shown under the row. */
function conditionText(condition) {
  if (!condition) return null;
  return { heavy_armor: 'while wearing heavy armor' }[condition] ?? condition;
}

export default getDefenses;
