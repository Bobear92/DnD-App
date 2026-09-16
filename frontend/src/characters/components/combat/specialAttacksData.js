/**
 * Special melee attacks — Grapple and Shove.
 *
 * These are the two things you can do *instead of* one of your attacks during the Attack action.
 * Neither is an action of its own in either edition, which is why they live here beside the
 * universal action menu rather than being invented as a new cost: in 2014 they are "special melee
 * attacks" made in place of an attack, and in 2024 they are two of the three options on an
 * Unarmed Strike, which is itself part of the Attack action.
 *
 * The rule this module exists for is the SIZE LIMIT — you can only grapple or shove a creature at
 * most one size larger than you. That is the one number on these cards that changes per character,
 * and it is the reason a Rune Knight's Giant's Might matters here: the effect makes you Large, so
 * the limit moves from Large to Huge on its own. Nothing here mentions the rune. The note is
 * computed from whatever `creatureSize` resolves, so it is true for every character and updates
 * itself when an active effect grows one — which is also the display that `creatureSize` has
 * otherwise lacked since the active-effects banner was removed.
 *
 * Consumed by BOTH the Action Economy tab (as the Grapple/Shove cards) and the Special Melee
 * Attacks mechanics page, so the rules text and the sheet cannot drift.
 */

import { SIZE_ORDER } from '@/characters/components/effects/activeEffects';

const is2024 = (edition) => edition === '5.5e' || edition === '2024';

/**
 * The next size up, for the "no more than one size larger than you" limit.
 * Gargantuan is the top of the track, so it returns itself rather than running off the end.
 */
export function oneSizeLarger(size = 'Medium') {
  const i = SIZE_ORDER.indexOf(size);
  if (i === -1) return SIZE_ORDER[SIZE_ORDER.length - 1];
  return SIZE_ORDER[Math.min(i + 1, SIZE_ORDER.length - 1)];
}

/**
 * The size line shown on a Grapple or Shove card: the character's own size and what it lets them
 * reach. Phrased with the character's size FIRST, because the limit is a consequence of it — a
 * player who grows should be able to see why the ceiling moved.
 */
export function sizeLimitNote(size = 'Medium', verb = 'grapple') {
  const max = oneSizeLarger(size);
  if (max === size) return `You are ${size} — you can ${verb} a creature of any size.`;
  return `You are ${size} — you can ${verb} a creature up to ${max}.`;
}

const FREE_HAND_WARNING = (verb) =>
  `A ${verb} needs at least one free hand — drop or stow something first.`;

/**
 * The special melee attacks, per edition. `verb` drives the size note; `needsFreeHand` drives the
 * warning shown when both hands are full.
 *
 * 2014 and 2024 genuinely differ in how the attempt is resolved — a contested ability check versus
 * a saving throw against your own DC — which is why the page carries an edition toggle rather than
 * one shared description.
 */
export const SPECIAL_MELEE_ATTACKS_5E = [
  {
    key: 'Grapple',
    name: 'Grapple',
    verb: 'grapple',
    needsFreeHand: true,
    contest: 'Strength (Athletics) vs. the target\'s Strength (Athletics) or Dexterity (Acrobatics)',
    detail: 'Replace one attack of your Attack action. Make a Strength (Athletics) check contested by the '
      + "target's Athletics or Acrobatics. On a success the target is Grappled: its speed becomes 0, and it "
      + 'moves with you (your speed is halved unless it is two or more sizes smaller).',
  },
  {
    key: 'Shove',
    name: 'Shove',
    verb: 'shove',
    needsFreeHand: false,
    contest: 'Strength (Athletics) vs. the target\'s Strength (Athletics) or Dexterity (Acrobatics)',
    detail: 'Replace one attack of your Attack action. Make a Strength (Athletics) check contested by the '
      + "target's Athletics or Acrobatics. On a success you either knock the target Prone or push it 5 feet away.",
  },
];

export const SPECIAL_MELEE_ATTACKS_2024 = [
  {
    key: 'Grapple',
    name: 'Grapple',
    verb: 'grapple',
    needsFreeHand: true,
    contest: 'the target saves against your Unarmed Strike DC (8 + Strength modifier + proficiency bonus)',
    detail: 'An option of an Unarmed Strike, which you make as part of the Attack action. The target makes a '
      + 'Strength or Dexterity saving throw (its choice) against your Unarmed Strike DC; on a failure it has '
      + 'the Grappled condition.',
  },
  {
    key: 'Shove',
    name: 'Shove',
    verb: 'shove',
    needsFreeHand: true,
    contest: 'the target saves against your Unarmed Strike DC (8 + Strength modifier + proficiency bonus)',
    detail: 'An option of an Unarmed Strike, which you make as part of the Attack action. The target makes a '
      + 'Strength or Dexterity saving throw (its choice) against your Unarmed Strike DC; on a failure you '
      + 'either push it 5 feet away or knock it Prone.',
  },
];

export function specialMeleeAttacks(edition = '5e') {
  return is2024(edition) ? SPECIAL_MELEE_ATTACKS_2024 : SPECIAL_MELEE_ATTACKS_5E;
}

/**
 * The Grapple/Shove cards for the Action Economy tab's Actions bucket.
 *
 * The `cost` badge reads "replaces one attack" rather than "action": filing them as plain actions
 * would teach the wrong economy (you can grapple AND still swing if you have Extra Attack), and
 * the badge is the first thing read on a card.
 *
 * @param {{size?: string, edition?: string, handFree?: boolean}} ctx
 */
export function specialAttackEntries({ size = 'Medium', edition = '5e', handFree = true } = {}) {
  return specialMeleeAttacks(edition).map((a) => ({
    key: `universal:${a.key}`,
    name: a.name,
    cost: 'replaces one attack',
    detail: a.detail,
    sizeNote: sizeLimitNote(size, a.verb),
    warning: a.needsFreeHand && !handFree ? FREE_HAND_WARNING(a.verb) : null,
    mechanicsSlug: 'special-attacks',
    mechanicsLabel: 'How grappling & shoving work',
  }));
}
