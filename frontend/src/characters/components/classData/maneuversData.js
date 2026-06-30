// Battle Master combat maneuvers reference data (Fighter subclass + the Martial
// Adept feat). Pure data — mirrors the subclassData / classChoicesData pattern.
//
// Each maneuver is { name, description }. The superiority die size scales with
// the source (Battle Master: d8 → d10 → d12; Martial Adept feat: d6). The
// descriptions below say "the superiority die" rather than a fixed size so the
// same text is accurate for both sources.

export const MANEUVERS_5E = [
  { name: "Commander's Strike", description: "When you take the Attack action, you can forgo one of your attacks and use a bonus action to direct one of your companions to strike. When you do so, choose a friendly creature who can see or hear you and expend one superiority die. That creature can immediately use its reaction to make one weapon attack, adding the superiority die to the attack's damage roll." },
  { name: "Disarming Attack", description: "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to disarm the target, adding the superiority die to the attack's damage roll. The target must make a Strength saving throw. On a failed save, it drops one item it is holding of your choice; the item lands at its feet." },
  { name: "Distracting Strike", description: "When you hit a creature with a weapon attack, you can expend one superiority die to distract the creature, adding the superiority die to the attack's damage roll. The next attack roll against the target by an attacker other than you has advantage if the attack is made before the start of your next turn." },
  { name: "Evasive Footwork", description: "When you move, you can expend one superiority die, rolling the die and adding the number rolled to your AC until you stop moving." },
  { name: "Feinting Attack", description: "You can expend one superiority die and use a bonus action on your turn to feint, choosing one creature within 5 feet of you as your target. You have advantage on your next attack roll against that creature this turn. If that attack hits, add the superiority die to the attack's damage roll." },
  { name: "Goading Attack", description: "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to goad the target into attacking you, adding the superiority die to the attack's damage roll. The target must make a Wisdom saving throw. On a failed save, the target has disadvantage on all attack rolls against targets other than you until the end of your next turn." },
  { name: "Lunging Attack", description: "When you make a melee weapon attack on your turn, you can expend one superiority die to increase your reach for that attack by 5 feet. If you hit, you add the superiority die to the attack's damage roll." },
  { name: "Maneuvering Attack", description: "When you hit a creature with a weapon attack, you can expend one superiority die to maneuver one of your comrades into a more advantageous position, adding the superiority die to the attack's damage roll. You then choose a friendly creature who can see or hear you. That creature can use its reaction to move up to half its speed without provoking opportunity attacks from the target of your attack." },
  { name: "Menacing Attack", description: "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to frighten the target, adding the superiority die to the attack's damage roll. The target must make a Wisdom saving throw. On a failed save, it is frightened of you until the end of your next turn." },
  { name: "Parry", description: "When another creature damages you with a melee attack, you can use your reaction and expend one superiority die to reduce the damage by the number you roll on your superiority die + your Dexterity modifier." },
  { name: "Precision Attack", description: "When you make a weapon attack roll against a creature, you can expend one superiority die to add it to the roll. You can use this maneuver before or after making the attack roll, but before any effects of the attack are applied." },
  { name: "Pushing Attack", description: "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to drive the target back, adding the superiority die to the attack's damage roll. If the target is Large or smaller, it must make a Strength saving throw. On a failed save, you push the target up to 15 feet away from you." },
  { name: "Rally", description: "On your turn, you can use a bonus action and expend one superiority die to bolster the resolve of one of your companions. When you do so, choose a friendly creature who can see or hear you. That creature gains temporary hit points equal to the superiority die roll + your Charisma modifier." },
  { name: "Riposte", description: "When a creature misses you with a melee attack, you can use your reaction and expend one superiority die to make a melee weapon attack against the creature. If you hit, you add the superiority die to the attack's damage roll." },
  { name: "Sweeping Attack", description: "When you hit a creature with a melee weapon attack, you can expend one superiority die to attempt to damage another creature with the same attack. Choose another creature within 5 feet of the original target and within your reach. If the original attack roll would hit the second creature, it takes damage equal to the number you roll on your superiority die. The damage is of the same type dealt by the original attack." },
  { name: "Trip Attack", description: "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to knock the target down, adding the superiority die to the attack's damage roll. If the target is Large or smaller, it must make a Strength saving throw. On a failed save, you knock the target prone." },
];

// 2024 PHB Battle Master maneuver list. The 2024 ruleset folds in several
// maneuvers that were Tasha's-only under 2014 (Ambush, Bait and Switch,
// Commanding Presence, Tactical Assessment) and rewords damage to "use the
// die's roll, dealt once per turn" — wording here is paraphrased; verify
// against the 2024 PHB.
export const MANEUVERS_2024 = [
  { name: "Ambush", description: "When you make a Dexterity (Stealth) check or an Initiative roll, you can expend one superiority die and add the die to the roll, provided you aren't Incapacitated." },
  { name: "Bait and Switch", description: "When you're within 5 feet of a creature on your turn, you can expend one superiority die and switch places with that creature, provided you spend at least 5 feet of movement and the creature is willing and isn't Incapacitated. This movement doesn't provoke Opportunity Attacks. Roll the superiority die: until the start of your next turn, you or the other creature (your choice) gains a bonus to AC equal to the number rolled." },
  { name: "Commander's Strike", description: "When you take the Attack action, you can replace one of your attacks to direct an ally to strike. Expend one superiority die and choose a willing creature other than yourself who can see or hear you. That creature can immediately use its Reaction to make one attack with a weapon or an Unarmed Strike, adding the superiority die to the attack's damage roll." },
  { name: "Commanding Presence", description: "When you make a Charisma (Intimidation), a Charisma (Performance), or a Charisma (Persuasion) check, you can expend one superiority die and add the die to the roll." },
  { name: "Disarming Attack", description: "When you hit a creature with an attack roll, you can expend one superiority die to attempt to disarm the target, adding the die to the attack's damage roll. The target must succeed on a Strength saving throw or drop one item of your choice that it's holding, with the item landing in its space." },
  { name: "Distracting Strike", description: "When you hit a creature with an attack roll, you can expend one superiority die to distract the target, adding the die to the attack's damage roll. The next attack roll against the target by an attacker other than you has Advantage if the attack is made before the start of your next turn." },
  { name: "Evasive Footwork", description: "When you make a Dexterity saving throw or an Acrobatics check, you can expend one superiority die and add the die to the roll." },
  { name: "Feinting Attack", description: "You can expend one superiority die and use a Bonus Action to feint, choosing a creature within 5 feet of yourself as your target. You have Advantage on your next attack roll against that target this turn. If the attack hits, add the superiority die to the attack's damage roll." },
  { name: "Goading Attack", description: "When you hit a creature with an attack roll, you can expend one superiority die to attempt to goad the target into attacking you, adding the die to the attack's damage roll. The target must succeed on a Wisdom saving throw or have Disadvantage on attack rolls against creatures other than you until the end of your next turn." },
  { name: "Lunging Attack", description: "When you move at least 5 feet in a straight line toward a target and then hit it with a melee attack on the same turn, you can expend one superiority die to add the die to the attack's damage roll." },
  { name: "Maneuvering Attack", description: "When you hit a creature with an attack roll, you can expend one superiority die to maneuver an ally into a better position, adding the die to the attack's damage roll. You then choose a willing creature other than yourself who can see or hear you. That creature can use its Reaction to move up to half its Speed without provoking an Opportunity Attack from the target of your attack." },
  { name: "Menacing Attack", description: "When you hit a creature with an attack roll, you can expend one superiority die to attempt to frighten the target, adding the die to the attack's damage roll. The target must succeed on a Wisdom saving throw or have the Frightened condition until the end of your next turn." },
  { name: "Parry", description: "When another creature hits you with a melee attack roll, you can take a Reaction and expend one superiority die to reduce the damage by the number rolled on the die + your Strength or Dexterity modifier (your choice)." },
  { name: "Precision Attack", description: "When you miss with an attack roll, you can expend one superiority die and add it to the roll, potentially turning the miss into a hit." },
  { name: "Pushing Attack", description: "When you hit a creature with an attack roll using a weapon or an Unarmed Strike, you can expend one superiority die to attempt to drive the target back, adding the die to the attack's damage roll. If the target is Large or smaller, it must succeed on a Strength saving throw or be pushed up to 15 feet straight away from you." },
  { name: "Rally", description: "As a Bonus Action, you can expend one superiority die to bolster a willing creature other than yourself within 30 feet of yourself. The creature gains Temporary Hit Points equal to the superiority die roll + your Constitution modifier." },
  { name: "Riposte", description: "When a creature misses you with a melee attack roll, you can take a Reaction and expend one superiority die to make a melee attack with a weapon or an Unarmed Strike against the creature, adding the die to the attack's damage roll on a hit." },
  { name: "Sweeping Attack", description: "When you hit a creature with a melee attack roll using a weapon or an Unarmed Strike, you can expend one superiority die to attempt to damage another creature. Choose a second creature within 5 feet of the first that is also within your reach. If the original attack roll would hit the second creature, it takes damage equal to the number you roll on your superiority die. Its type is the same as the original attack's." },
  { name: "Tactical Assessment", description: "When you make an Intelligence (History), an Intelligence (Investigation), or a Wisdom (Insight) check, you can expend one superiority die and add the die to the ability check." },
  { name: "Trip Attack", description: "When you hit a creature with an attack roll using a weapon or an Unarmed Strike, you can expend one superiority die to attempt to knock the target down, adding the die to the attack's damage roll. If the target is Large or smaller, it must succeed on a Strength saving throw or have the Prone condition." },
];

/**
 * Return the Battle Master maneuver list for an edition.
 * @param {string} edition '5e' | '5.5e'
 * @returns {{name: string, description: string}[]}
 */
export function getManeuvers(edition) {
  return edition === '5.5e' ? MANEUVERS_2024 : MANEUVERS_5E;
}

/** Maneuvers a Battle Master knows at a given level (3 / 5 / 7 / 9 at 3 / 7 / 10 / 15). */
export function maneuversKnownAtLevel(level = 1) {
  const l = Number(level) || 1;
  if (l >= 15) return 9;
  if (l >= 10) return 7;
  if (l >= 7) return 5;
  if (l >= 3) return 3;
  return 0;
}

/** Superiority die size: d8, then d10 at 10 (Improved Combat Superiority), d12 at 18. */
export function superiorityDie(level = 1) {
  const l = Number(level) || 1;
  if (l >= 18) return 'd12';
  if (l >= 10) return 'd10';
  return 'd8';
}

/** Number of superiority dice: 4 at level 3, 5 at level 7, 6 at level 15 (fixed, not PB). */
export function superiorityDiceCount(level = 1) {
  const l = Number(level) || 1;
  if (l >= 15) return 6;
  if (l >= 7) return 5;
  if (l >= 3) return 4;
  return 0;
}
