// Rune reference data (Fighter → Rune Knight, TCoE). Pure data — the arcaneShotData sibling.
//
// A rune is TWO mechanics under one name: a PASSIVE benefit that runs while the rune is
// carved on something you wear or hold, and an ACTIVE "Channel Rune" effect usable once per
// short or long rest (twice from Master of Runes at 15th level).
//
// RAW notes (TCoE p.44):
//   • Runes known: 2 at 3rd level, then +1 at 7th, 10th and 15th (5 total).
//   • Hill Rune requires 7th level; Storm Rune requires 15th. The other four are available
//     from 3rd. Enforced as option `minLevel`, which availablePoolOptions already honors —
//     the subclass feature blurb's "Cloud, Fire, Frost, Hill, Stone, or Storm" is the FULL
//     list, not the level-3 list.
//   • Each time you gain a Fighter level you may replace one rune you know with another
//     (the level-choices step's ReplaceOneSelect).
//   • A rune's save DC = 8 + proficiency bonus + CONSTITUTION modifier (Constitution, not
//     Intelligence — the Rune Knight's magic is carved, not studied).
//   • Both halves require the rune to be CARVED on an object you wear or hold. Knowing a rune
//     does nothing on its own, so every consumer gates on `activeRunes()` — carved AND the
//     bearing item equipped — rather than on `character_data.runes`. See runeCarving.js.

import { abilityMod, profBonus } from '@/characters/components/inventory/inventoryData';
import { buildBreakdown } from '@/characters/components/skills/skillMath';

/** Level from which Master of Runes doubles every rune's Channel Rune uses. */
export const MASTER_OF_RUNES_LEVEL = 15;

/**
 * The six runes. Each carries THREE things:
 *   • `description` — the one-paragraph prose the pool picker and KnownOptionsBlock show.
 *     Kept verbatim: those surfaces show one paragraph per option, and the player choosing a
 *     rune is choosing both halves together.
 *   • `passive` — the structured half, so the benefit can be APPLIED rather than read. Each
 *     field is claimed by exactly one subsystem, and a rune states only the fields it changes:
 *       skills[]      → skillAdvantage.js (the 'adv' tag in Abilities & Skills)
 *       resistances[] → defenses.js (the Defenses card)
 *       saveAdvantage → saveFeatures.js (the panel under the Saving Throws grid)
 *       toolBonus     → the Items tab's Tools sub-tab
 *       note          → prose, for the parts the app has no model for (darkvision, surprise)
 *   • `channel` — the Channel Rune active: its action cost and the tab it files under.
 */
export const RUNE_OPTIONS = [
  {
    name: 'Cloud Rune',
    key: 'cloud',
    passive: {
      skills: ['Sleight of Hand', 'Deception'],
      text: 'Advantage on Sleight of Hand and Deception checks.',
    },
    channel: {
      cost: 'reaction',
      tab: 'reaction',
      description: 'When you or a creature you can see within 30 feet is hit by an attack roll,'
        + ' choose a different creature within 30 feet other than the attacker — that creature'
        + ' becomes the target of the attack, using the same roll. This works regardless of the'
        + " attack's range.",
    },
    description: 'Passive: you have advantage on Sleight of Hand checks and Deception checks. Channel Rune (reaction, when you or a creature you can see within 30 feet is hit by an attack roll): choose a different creature within 30 feet of you, other than the attacker — that creature becomes the target of the attack, using the same roll. This works regardless of the attack\'s range.',
  },
  {
    name: 'Fire Rune',
    key: 'fire',
    passive: {
      toolBonus: true,
      text: 'Whenever you use a tool, add your proficiency bonus to the check.',
    },
    channel: {
      // Rides on a weapon attack you were making anyway — the Arcane Shot shape — so it costs
      // no action of its own, but it does spend the rune's use.
      cost: 'no action',
      tab: 'no_action',
      description: 'When you hit a creature with a weapon attack, the target takes an extra 2d6 fire'
        + ' damage and must succeed on a Strength saving throw or be restrained by fiery shackles for'
        + ' 1 minute, taking 2d6 fire damage at the start of each of its turns. It repeats the save at'
        + ' the end of each of its turns, ending the effect on a success.',
    },
    description: 'Passive: whenever you use a tool, you can add your proficiency bonus to the check. Channel Rune (when you hit a creature with a weapon attack): the target takes an extra 2d6 fire damage and must succeed on a Strength saving throw or be restrained by fiery shackles for 1 minute, taking 2d6 fire damage at the start of each of its turns. It repeats the save at the end of each of its turns, ending the effect on a success.',
  },
  {
    name: 'Frost Rune',
    key: 'frost',
    passive: {
      skills: ['Animal Handling', 'Intimidation'],
      text: 'Advantage on Animal Handling and Intimidation checks.',
    },
    channel: {
      cost: 'bonus action',
      tab: 'bonus',
      description: 'For 10 minutes you gain a +2 bonus to all ability checks and saving throws that'
        + ' use Strength or Constitution.',
    },
    description: 'Passive: you have advantage on Animal Handling checks and Intimidation checks. Channel Rune (bonus action): for 10 minutes you gain a +2 bonus to all ability checks and saving throws that use Strength or Constitution.',
  },
  {
    name: 'Stone Rune',
    key: 'stone',
    passive: {
      skills: ['Insight'],
      // Darkvision has no model anywhere in the app (race traits carry it as prose too), so the
      // range stays a note rather than half-wiring a vision system for one rune.
      note: 'Darkvision out to 120 feet.',
      text: 'Advantage on Insight checks, and darkvision out to 120 feet.',
    },
    channel: {
      cost: 'reaction',
      tab: 'reaction',
      description: 'When a creature you can see ends its turn within 30 feet, it must succeed on a'
        + ' Wisdom saving throw or be charmed by you for 1 minute. While charmed this way its speed'
        + ' is 0 and it is incapacitated, contentedly swaying. It repeats the save at the end of each'
        + ' of its turns, ending the effect on a success.',
    },
    description: 'Passive: you have advantage on Insight checks, and you have darkvision out to 120 feet. Channel Rune (reaction, when a creature you can see ends its turn within 30 feet): it must succeed on a Wisdom saving throw or be charmed by you for 1 minute. While charmed this way its speed is 0 and it is incapacitated, contentedly swaying. It repeats the save at the end of each of its turns, ending the effect on a success.',
  },
  {
    name: 'Hill Rune',
    key: 'hill',
    minLevel: 7,
    passive: {
      resistances: ['poison'],
      saveAdvantage: 'being poisoned',
      text: 'Advantage on saving throws against being poisoned, and resistance to poison damage.',
    },
    channel: {
      cost: 'bonus action',
      tab: 'bonus',
      description: 'For 1 minute you gain resistance to bludgeoning, piercing, and slashing damage.',
    },
    description: 'Passive: you have advantage on saving throws against being poisoned, and you have resistance to poison damage. Channel Rune (bonus action): for 1 minute you gain resistance to bludgeoning, piercing, and slashing damage.',
  },
  {
    name: 'Storm Rune',
    key: 'storm',
    minLevel: 15,
    passive: {
      skills: ['Arcana'],
      // The app models no surprise state, so this half stays prose for the same reason Stone's
      // darkvision does.
      note: 'You cannot be surprised as long as you are not incapacitated.',
      text: 'Advantage on Arcana checks, and you cannot be surprised as long as you are not incapacitated.',
    },
    channel: {
      cost: 'bonus action',
      tab: 'bonus',
      description: 'You enter a prophetic state for 1 minute or until you are incapacitated. Until it'
        + ' ends, when you or another creature you can see within 60 feet makes an attack roll, saving'
        + ' throw, or ability check, you can use your reaction to give that roll advantage or'
        + ' disadvantage.',
    },
    description: 'Passive: you have advantage on Arcana checks, and you can\'t be surprised as long as you aren\'t incapacitated. Channel Rune (bonus action): you enter a prophetic state for 1 minute or until you are incapacitated. Until it ends, when you or another creature you can see within 60 feet makes an attack roll, saving throw, or ability check, you can use your reaction to give that roll advantage or disadvantage.',
  },
];

/** Runes known at a level: 2 / 3 / 4 / 5 at levels 3 / 7 / 10 / 15. */
export function runesKnownAtLevel(level = 1) {
  const l = Number(level) || 0;
  if (l >= 15) return 5;
  if (l >= 10) return 4;
  if (l >= 7) return 3;
  if (l >= 3) return 2;
  return 0;
}

/** Channel Rune uses per rune per short or long rest — one, or two from Master of Runes. */
export function channelRuneUses(level = 1) {
  return (Number(level) || 0) >= MASTER_OF_RUNES_LEVEL ? 2 : 1;
}

/** A rune's save DC = 8 + proficiency bonus + Constitution modifier, broken into its parts. */
export function runeSaveDcParts(level = 1, constitutionScore = 10) {
  const pb = profBonus(level);
  const mod = abilityMod(constitutionScore);
  return { dc: 8 + pb + mod, pb, mod };
}

/**
 * The same DC in the shared click-to-see-the-math shape, so a rune DC expands into its
 * arithmetic exactly like a skill or a saving throw. The displayed value IS `total`.
 */
export function runeSaveDcBreakdown(level = 1, constitutionScore = 10) {
  const { pb, mod } = runeSaveDcParts(level, constitutionScore);
  return buildBreakdown({
    parts: [
      { key: 'base', label: 'Base', value: 8, signed: false },
      { key: 'proficiency', label: 'Proficiency bonus', value: pb },
      { key: 'ability', label: 'CON modifier', value: mod },
    ],
  });
}

/** The full option objects for a list of known names, in the canonical pool order. */
export function getRuneOptions(names = []) {
  const known = new Set((names || []).filter(Boolean));
  return RUNE_OPTIONS.filter((o) => known.has(o.name));
}

/** Look a rune up by its display name. */
export function getRune(name) {
  return RUNE_OPTIONS.find((o) => o.name === name) ?? null;
}

/** Look a rune up by its short key ('hill'). */
export function getRuneByKey(key) {
  return RUNE_OPTIONS.find((o) => o.key === key) ?? null;
}

/**
 * The rest-resource / action-economy key for a rune's Channel Rune use.
 * Each rune recharges INDEPENDENTLY — RAW is "you can't use it again until you finish a short
 * or long rest" per rune — so they get a key each rather than sharing one pool.
 */
export function channelRuneKey(name) {
  const rune = typeof name === 'string' ? getRune(name) : name;
  return rune ? `channel_rune_${rune.key}_used` : null;
}

/** Every Channel Rune key, in pool order — the list the rest flow resets. */
export const CHANNEL_RUNE_KEYS = RUNE_OPTIONS.map((o) => `channel_rune_${o.key}_used`);
