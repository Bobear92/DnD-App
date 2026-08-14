/**
 * Features that answer "what does carrying THIS unlock?" on an Items-tab row.
 *
 * A lot of class, subclass, race and feat features are gated on the equipment you're holding —
 * a shield, a melee weapon, a finesse weapon. Those live in the Features tab, one screen away
 * from the item list where the player is actually deciding what to hold. This table puts the
 * short version on the item itself.
 *
 * It exists because the Items-tab row had grown five hand-written note blocks of exactly this
 * shape (Savage Attacks, the Great Weapon Master bonus attack, Eldritch Strike, the 2024
 * Remarkable Athlete move) and the Cavalier's Warding Maneuver would have been the sixth. Now
 * a new one is a single entry.
 *
 * NOT in scope — these stay where they are because they are a different kind of thing:
 *   • Notes derived from the ITEM's own properties, not from a feature you have (the Heavy /
 *     Strength-requirement / Stealth / Loading / within-5-ft warnings). Those come from
 *     inventoryData helpers and apply to anyone holding the item.
 *   • Numbers a feature FOLDS IN rather than annotates (fighting-style to-hit/damage, feat AC
 *     mods, the crit range). Those belong in the arithmetic and its breakdown, not a note.
 *
 * Sibling of `ATTACK_RIDERS` (actionEconomyData) — same "gate + scope + text" idea, but that
 * one annotates ATTACK entries on the Action Economy tab, this one annotates OWNED ITEMS here.
 * Keeping them apart is deliberate: the scope vocabularies (melee/ranged vs. weapon/shield/
 * armor) and the surfaces have nothing in common but the shape.
 */

import { hasFeat, greatWeaponMasterNote } from '@/characters/components/combat/combatBonuses';
import { profBonus } from '@/characters/components/inventory/inventoryData';
import { getFeatDamageReductions } from '@/characters/components/feats/featEffects';
import { SAVAGE_ATTACKS_NOTE, hasSavageAttacks } from '@/characters/components/race/raceCombatNotes';
import {
  eldritchStrikeNote, remarkableAthleteMoveNote,
} from '@/characters/components/subclass/subclassCombatNotes';

const lc = (v) => (v || '').toLowerCase();

/**
 * The item kinds an entry can be matched against. Named predicates rather than free-form
 * matchers so the set stays enumerable and testable, and an entry can list several (OR).
 */
export const ITEM_SCOPES = {
  weapon: (e) => e.category === 'weapons',
  meleeWeapon: (e) => e.category === 'weapons' && lc(e.weapon_type) === 'melee',
  rangedWeapon: (e) => e.category === 'weapons' && lc(e.weapon_type) === 'ranged',
  finesseWeapon: (e) => e.category === 'weapons' && /finesse/i.test(e.properties || ''),
  shield: (e) => e.category === 'armor' && lc(e.armor_type) === 'shield',
  bodyArmor: (e) => e.category === 'armor' && lc(e.armor_type) !== 'shield',
  heavyArmor: (e) => e.category === 'armor' && lc(e.armor_type) === 'heavy',
};

/**
 * @typedef {Object} EquipmentFeature
 * @property {string}   source  Feature name; the note's identity and React key.
 * @property {string}   testId  data-testid prefix (`{testId}-{uid}`). Explicit rather than
 *                              slugged from `source` so the ids that shipped before this table
 *                              existed (gwm-bonus, remarkable-move) survived the consolidation.
 * @property {string[]} scopes  ITEM_SCOPES keys; the note shows when ANY matches.
 * @property {(ctx) => boolean} applies  Does this character have the feature?
 * @property {(ctx) => string}  text     The note. A function so it can fold in real numbers.
 * @property {'emerald'|'violet'|'amber'} [tone]  Defaults to emerald (a benefit).
 */

/** @type {EquipmentFeature[]} */
export const EQUIPMENT_FEATURES = [
  {
    source: 'Warding Maneuver',
    testId: 'warding-maneuver',
    scopes: ['meleeWeapon', 'shield'],
    applies: ({ charClass, subclass, level }) =>
      charClass === 'Fighter' && subclass === 'Cavalier' && (level ?? 1) >= 7,
    // RAW requires wielding a melee weapon OR a shield, which is exactly why it belongs on
    // these rows: the item IS the prerequisite. The uses (CON modifier, long rest) live on the
    // Action Economy reaction card that spends them — repeating a counter here would be a
    // second number to keep in sync.
    text: () =>
      'Warding Maneuver: while wielding this, when you or a creature you can see within 5 ft is'
      + " hit by an attack, you can use your reaction to roll a d8 and add it to the target's AC"
      + ' against that attack. If it still hits, the target has resistance to its damage.',
  },
  {
    // The ONE place the reduction is answered as "should I wear this?" rather than "what am
    // I resistant to?" — the Defenses panel carries the standing answer. Both read the same
    // structured `damage_reduction` feat effect, so the number can't drift between them.
    //
    // Scoped to heavyArmor rather than bodyArmor because the feat is worthless in anything
    // else: showing it on leather would state a benefit the wearer does not have.
    source: 'Heavy Armor Master',
    testId: 'heavy-armor-master',
    scopes: ['heavyArmor'],
    applies: ({ feats, level }) =>
      getFeatDamageReductions(feats, { pb: profBonus(level ?? 1) }).length > 0,
    text: ({ feats, level }) => {
      const [r] = getFeatDamageReductions(feats, { pb: profBonus(level ?? 1) });
      if (!r) return '';
      // Spelled out rather than abbreviated — this is a sentence, not the panel's type column.
      const types = r.damageTypes.length > 1
        ? `${r.damageTypes.slice(0, -1).join(', ')} and ${r.damageTypes.at(-1)}`
        : r.damageTypes[0];
      const magic = r.nonmagicalOnly ? ' from nonmagical attacks' : '';
      return `Heavy Armor Master: while wearing this, ${types} damage${magic} you take is reduced by ${r.amount}.`;
    },
  },
  {
    source: 'Savage Attacks',
    testId: 'savage-attacks',
    scopes: ['meleeWeapon'],
    applies: ({ characterData }) => hasSavageAttacks(characterData?.race_traits),
    text: () => SAVAGE_ATTACKS_NOTE,
  },
  {
    source: 'Great Weapon Master',
    testId: 'gwm-bonus',
    scopes: ['meleeWeapon'],
    applies: ({ feats }) => hasFeat(feats, 'Great Weapon Master'),
    text: ({ feats }) => greatWeaponMasterNote(feats),
  },
  {
    source: 'Eldritch Strike',
    testId: 'eldritch-strike',
    scopes: ['weapon'],
    applies: ({ charClass, subclass, level }) =>
      !!eldritchStrikeNote({ charClass, subclass, level }),
    text: ({ charClass, subclass, level }) => eldritchStrikeNote({ charClass, subclass, level }),
    tone: 'violet',
  },
  {
    source: 'Remarkable Athlete',
    testId: 'remarkable-move',
    scopes: ['weapon'],
    applies: ({ charClass, subclass, level, edition }) =>
      !!remarkableAthleteMoveNote({ charClass, subclass, level, edition }),
    text: ({ charClass, subclass, level, edition }) =>
      remarkableAthleteMoveNote({ charClass, subclass, level, edition }),
  },
];

/**
 * The feature notes to show on one inventory row.
 *
 * @param {object} entry  The inventory entry (an item snapshot).
 * @param {{charClass?, subclass?, level?, edition?, characterData?}} ctx
 * @returns {{source: string, text: string, tone: string}[]}
 */
export function getEquipmentFeatures(entry, ctx = {}) {
  if (!entry) return [];
  const full = { ...ctx, feats: ctx.characterData?.feats ?? ctx.feats ?? [] };
  return EQUIPMENT_FEATURES
    .filter((f) => f.scopes.some((s) => ITEM_SCOPES[s]?.(entry)))
    .filter((f) => f.applies(full))
    .map((f) => ({ source: f.source, testId: f.testId, text: f.text(full), tone: f.tone || 'emerald' }))
    // A feature whose note resolver returned nothing contributes no empty row.
    .filter((f) => !!f.text);
}
