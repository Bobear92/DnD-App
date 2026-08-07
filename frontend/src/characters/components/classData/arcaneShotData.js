// Arcane Shot reference data (Fighter → Arcane Archer, XGE). Pure data — mirrors the
// maneuversData / subclassData pattern.
//
// Each option is { name, description, improvement }. `improvement` is the 18th-level
// upgrade ("Superior Arcane Shot" in the app's feature table); it is a SEPARATE field so
// consumers can level-gate it instead of baking a level tag into the description.
//
// RAW notes (XGE p.28 — the subclass feature blurb in subclassData is looser than this):
//   • Uses are a flat TWO at every level, regained on a short OR long rest. There is no
//     "extra use at 10th level" — that clause in the old feature text was not RAW.
//   • Options known: 2, then +1 at 7th, 10th, 15th, and 18th level (6 total).
//   • Each time you gain a Fighter level you may replace one option you know.
//   • Save DC = 8 + proficiency bonus + INTELLIGENCE modifier (Intelligence, even though
//     the Fighter has no spellcasting ability of its own).
//   • Applying an option costs no action — it rides on an arrow fired from a shortbow or
//     longbow as part of the Attack action, one option per attack.

import { abilityMod, profBonus } from '@/characters/components/inventory/inventoryData';

export const ARCANE_SHOT_OPTIONS = [
  {
    name: 'Banishing Arrow',
    description: "Abjuration magic tries to banish the target to a harmless location in the Feywild. The creature must succeed on a Charisma saving throw or be banished: its speed becomes 0 and it is incapacitated. At the end of its next turn it reappears in the space it left, or the nearest unoccupied space.",
    improvement: 'The arrow also deals 2d6 force damage to the target.',
  },
  {
    name: 'Beguiling Arrow',
    description: "Enchantment magic beguiles the target. It takes an extra 2d6 psychic damage, and you choose one ally within 30 feet of it. The target must succeed on a Wisdom saving throw or be charmed by that ally until the start of your next turn. The charm ends early if the chosen ally attacks the target, damages it, or forces it to make a saving throw.",
    improvement: 'The psychic damage increases to 4d6.',
  },
  {
    name: 'Bursting Arrow',
    description: 'The arrow is imbued with force energy drawn from the school of evocation and detonates on impact. The target and every other creature within 10 feet of it each take 2d6 force damage.',
    improvement: 'The force damage increases to 4d6.',
  },
  {
    name: 'Enfeebling Arrow',
    description: 'Necromantic magic saps the target. It takes an extra 2d6 necrotic damage and must succeed on a Constitution saving throw or the damage dealt by its weapon attacks is halved until the start of your next turn.',
    improvement: 'The necrotic damage increases to 4d6.',
  },
  {
    name: 'Grasping Arrow',
    description: "Conjuration magic wraps the target in grasping, poisonous brambles. It takes 2d6 poison damage, its speed is reduced by 10 feet, and it takes 2d6 slashing damage the first time on each turn it moves 1 foot or more without teleporting. The target — or any creature that can reach it — can use its action to remove the brambles with a Strength (Athletics) check against your Arcane Shot save DC. Otherwise the brambles last 1 minute, or until you use this option again.",
    improvement: 'The poison damage and the slashing damage each increase to 4d6.',
  },
  {
    name: 'Piercing Arrow',
    description: "Transmutation magic gives the arrow an ethereal quality. You make no attack roll: the arrow shoots forward in a line 1 foot wide and 30 feet long, passing harmlessly through objects and ignoring cover. Each creature in the line makes a Dexterity saving throw, taking damage as if hit by the arrow plus an extra 1d6 piercing damage on a failure, or half as much on a success.",
    improvement: 'The extra piercing damage increases to 2d6.',
  },
  {
    name: 'Seeking Arrow',
    description: "Divination magic lets the arrow seek its mark. You make no attack roll: choose a creature you have seen in the past minute. The arrow flies to it, moving around corners and ignoring half and three-quarters cover. If the target is within range and a path exists, it makes a Dexterity saving throw — on a failure it takes damage as if hit by the arrow plus an extra 1d6 force damage and you learn its location; on a success it takes half damage and you learn nothing.",
    improvement: 'The extra force damage increases to 2d6.',
  },
  {
    name: 'Shadow Arrow',
    description: "Illusion magic occludes your foe's vision with shadow. The target takes an extra 2d6 psychic damage and must succeed on a Wisdom saving throw or be unable to see anything farther than 5 feet away until the start of your next turn.",
    improvement: 'The psychic damage increases to 4d6.',
  },
];

/** Uses of Arcane Shot per short or long rest — a flat 2 at every level (RAW). */
export const ARCANE_SHOT_USES = 2;

/** The level at which every Arcane Shot option gains its improved effect. */
export const ARCANE_SHOT_IMPROVE_LEVEL = 18;

/** Arcane Shot options known at a Fighter level (2 / 3 / 4 / 5 / 6 at 3 / 7 / 10 / 15 / 18). */
export function arcaneShotKnownAtLevel(level = 1) {
  const l = Number(level) || 0;
  if (l >= 18) return 6;
  if (l >= 15) return 5;
  if (l >= 10) return 4;
  if (l >= 7) return 3;
  if (l >= 3) return 2;
  return 0;
}

/** True once the options' improved effects apply. */
export function arcaneShotImproved(level = 1) {
  return (Number(level) || 0) >= ARCANE_SHOT_IMPROVE_LEVEL;
}

/** Arcane Shot save DC = 8 + proficiency bonus + Intelligence modifier. */
export function arcaneShotSaveDc(level = 1, intelligenceScore = 10) {
  return 8 + profBonus(level) + abilityMod(intelligenceScore);
}

/** The DC broken into its parts, so a surface can show the math rather than a bare number. */
export function arcaneShotSaveDcParts(level = 1, intelligenceScore = 10) {
  const pb = profBonus(level);
  const mod = abilityMod(intelligenceScore);
  return { dc: 8 + pb + mod, pb, mod };
}

/** The full option objects for a list of known names, in the canonical pool order. */
export function getArcaneShotOptions(names = []) {
  const known = new Set(names.filter(Boolean));
  return ARCANE_SHOT_OPTIONS.filter((o) => known.has(o.name));
}
