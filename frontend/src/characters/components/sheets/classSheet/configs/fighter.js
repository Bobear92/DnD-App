/**
 * Fighter class config (5e + 2024) — drives the data-driven ClassSheet.
 * Martial class: no spellcasting; fighting style (locked choice), rest resources, weapon
 * mastery (2024), extra attacks. All numbers/feature text come from shared data modules.
 */
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import {
  FIGHTER_FIGHTING_STYLES_5E, FIGHTER_FIGHTING_STYLES_2024,
  FIGHTER_SUBCLASSES_5E, FIGHTER_SUBCLASSES_2024,
} from '@/characters/components/classData/classChoicesData';
import { ARCANE_SHOT_USES } from '@/characters/components/classData/arcaneShotData';
import { psionicDie, psionicDiceTotal } from '@/characters/components/classData/psiWarriorData';
import BattleMasterPanel from '@/characters/components/subclass/BattleMasterPanel';
import WeaponBondPanel from '@/characters/components/subclass/WeaponBondPanel';
import PsionicEnergyPanel from '@/characters/components/subclass/PsionicEnergyPanel';

// Interactive per-subclass panels (maneuver picker + superiority dice, bonded weapons, etc.).
const FIGHTER_SUBCLASS_PANELS = {
  'Battle Master': BattleMasterPanel,
  'Eldritch Knight': WeaponBondPanel,
  'Psi Warrior': PsionicEnergyPanel,
};

const FIGHTER_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Athletics', 'History',
  'Insight', 'Intimidation', 'Perception', 'Survival',
];

// Some pools are sized by an ability modifier rather than by level (both Cavalier pools, two of
// the three Echo Knight ones) — hence the `ctx` argument useRestResource passes in. RAW floors
// them at one use, so a dump-stat modifier still gets the feature rather than an empty tracker.
const abilityModUses = (ability) => (_level, { scores = {} } = {}) =>
  Math.max(1, Math.floor(((scores[ability] ?? 10) - 10) / 2));

const actionSurgeTotal = (level) => (level >= 17 ? 2 : level >= 2 ? 1 : 0);
const indomitableTotal = (level) => (level >= 17 ? 3 : level >= 13 ? 2 : level >= 9 ? 1 : 0);
const extraAttacks = (level) => (level >= 20 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1);
const weaponMasteryMax = (level) => (level >= 16 ? 6 : level >= 10 ? 5 : level >= 4 ? 4 : 3);

const REST_RESOURCES = [
  {
    key: 'second_wind_used', label: 'Second Wind (Short Rest)', total: () => 1, recharge: 'short', minLevel: 1,
    description: 'Bonus action: regain 1d10 + your Fighter level HP.',
  },
  // Subclass-gated: only an Arcane Archer sees this row (useRestResource filters on `subclass`).
  // RAW is a flat two uses at every level — see arcaneShotData for why the feature blurb's
  // "extra use at 10th level" was dropped.
  {
    key: 'arcane_shot_used', label: 'Arcane Shot (Short Rest)', total: () => ARCANE_SHOT_USES,
    recharge: 'short', minLevel: 3, subclass: 'Arcane Archer',
    description: 'Apply one known Arcane Shot option to an arrow fired from a shortbow or longbow.',
  },
  {
    key: 'action_surge_used', label: 'Action Surge (Short Rest)', total: actionSurgeTotal, recharge: 'short', minLevel: 2,
    description: 'Take one additional action on your turn.',
  },
  // Subclass-gated: only a Cavalier sees these two. Both hold ability-modifier uses (minimum
  // one) rather than a flat count, which is why their totals read the ability scores.
  {
    key: 'unwavering_mark_used', label: 'Unwavering Mark (Long Rest)', total: abilityModUses('strength'),
    recharge: 'long', minLevel: 3, subclass: 'Cavalier',
    description: "Bonus action: a special melee attack against a creature you marked that damaged someone else — with advantage, dealing extra damage equal to half your Fighter level. Marking itself is free and unlimited; these uses are the follow-up attack.",
  },
  {
    key: 'warding_maneuver_used', label: 'Warding Maneuver (Long Rest)', total: abilityModUses('constitution'),
    recharge: 'long', minLevel: 7, subclass: 'Cavalier',
    description: "Reaction: add 1d8 to the AC of yourself or a creature within 5 ft against one attack. If it still hits, the target resists that attack's damage. Requires a melee weapon or shield in hand.",
  },
  // Subclass-gated: only an Echo Knight sees these three. Two hold ability-modifier uses (the
  // Cavalier shape); Shadow Martyr is a flat single use, and it is the only Echo Knight pool
  // that comes back on a SHORT rest.
  {
    key: 'unleash_incarnation_used', label: 'Unleash Incarnation (Long Rest)', total: abilityModUses('constitution'),
    recharge: 'long', minLevel: 3, subclass: 'Echo Knight',
    description: "When you take the Attack action, make one additional melee attack from your echo's position.",
  },
  {
    key: 'shadow_martyr_used', label: 'Shadow Martyr (Short Rest)', total: () => 1,
    recharge: 'short', minLevel: 10, subclass: 'Echo Knight',
    description: 'Reaction: teleport your echo next to a creature about to be attacked and make the attack target the echo instead.',
  },
  // `hpAdjacent` moves the tracker out of the features area and up beside Max/Current/Temp
  // HP: what this feature DOES is grant temporary hit points, so it belongs where the player
  // is already looking when they gain them — next to the box they type the number into.
  {
    key: 'reclaim_potential_used', label: 'Reclaim Potential (Long Rest)', total: abilityModUses('constitution'),
    recharge: 'long', minLevel: 15, subclass: 'Echo Knight', hpAdjacent: true,
    description: 'When an echo of yours is destroyed by damage, gain 2d6 + your Constitution modifier temporary hit points — provided you have none already.',
  },
  {
    key: 'indomitable_used', label: 'Indomitable (Long Rest)', total: indomitableTotal, recharge: 'long', minLevel: 9,
    description: 'Reroll a failed saving throw — you must use the new roll.',
  },
  // Subclass-gated: only a Psi Warrior sees these five. Psionic Energy is the app's first
  // ONE POOL, MANY CONSUMERS resource — six separate features spend the same dice — so it is a
  // single row here and every Action Economy card that spends it carries the same `resourceKey`
  // rather than each feature getting a pool of its own. The die SIZE scales with level, so it is
  // read out of psiWarriorData instead of being written into the label.
  {
    key: 'psionic_energy_used',
    label: (level) => `Psionic Energy Dice — ${psionicDie(level)} (Long Rest)`,
    total: (level) => psionicDiceTotal(level),
    recharge: 'long', minLevel: 3, subclass: 'Psi Warrior',
    description: 'The pool that fuels Protective Field, Psionic Strike, Telekinetic Movement and your other psionic powers. All of it returns on a long rest.',
  },
  // The bonus-action regain is its own once-per-short-rest charge rather than a property of the
  // pool: RAW you can do it again only after a rest, whatever the pool is doing. `restoresKey`
  // makes the Use button actually hand a die back — the ONE place a player restores a resource
  // in this app, because here the restore IS the feature firing, not a player editing a counter,
  // and it is gated behind this row's own charge. `hidden` drops the row while the pool is full,
  // since regaining a die you haven't spent does nothing.
  {
    key: 'psionic_energy_regain_used', label: 'Regain a Psionic Energy Die (Short Rest)',
    total: () => 1, recharge: 'short', minLevel: 3, subclass: 'Psi Warrior',
    restoresKey: 'psionic_energy_used',
    hidden: ({ data }) => (data?.psionic_energy_used ?? 0) <= 0,
    description: 'Bonus action: recover one expended Psionic Energy die.',
  },
  // Telekinetic Movement, Psi-Powered Leap and Bulwark of Force are each FREE once per rest and
  // cost a Psionic Energy die every time after that. These rows track the free use; `fallbackKey`
  // points the Use button at the pool above once the free use is gone, so the control keeps
  // working instead of going dead while the character can still legally use the feature.
  {
    key: 'telekinetic_movement_used', label: 'Telekinetic Movement — free use (Short Rest)',
    total: () => 1, recharge: 'short', minLevel: 3, subclass: 'Psi Warrior',
    fallbackKey: 'psionic_energy_used',
    description: 'Action: move one Large or smaller object, or one willing creature, up to 30 feet. Once the free use is spent, spend a Psionic Energy die instead.',
  },
  {
    key: 'psi_powered_leap_used', label: 'Psi-Powered Leap — free use (Long Rest)',
    total: () => 1, recharge: 'long', minLevel: 7, subclass: 'Psi Warrior',
    fallbackKey: 'psionic_energy_used',
    description: 'Bonus action: gain a flying speed equal to twice your walking speed until the end of the turn. Once the free use is spent, spend a Psionic Energy die instead.',
  },
  {
    key: 'bulwark_of_force_used', label: 'Bulwark of Force — free use (Long Rest)',
    total: () => 1, recharge: 'long', minLevel: 15, subclass: 'Psi Warrior',
    fallbackKey: 'psionic_energy_used',
    description: 'Bonus action: give yourself and other creatures within 30 feet half cover for 1 minute. Once the free use is spent, spend a Psionic Energy die instead.',
  },
  // Subclass-gated: only a Samurai sees this. Three uses per long rest; the temporary hit points
  // scale, which is progression information rather than a "when you got it" tag, so it is spelled
  // out in words in the description.
  {
    key: 'fighting_spirit_used', label: 'Fighting Spirit (Long Rest)', total: () => 3,
    recharge: 'long', minLevel: 3, subclass: 'Samurai',
    description: 'Bonus action: advantage on your weapon attack rolls until the end of the turn, plus temporary hit points — five of them, rising to ten at tenth level and fifteen at fifteenth.',
  },
];

const ASI_LEVELS = [4, 6, 8, 12, 14, 16, 19];

export const FIGHTER_5E = {
  className: 'Fighter',
  edition: '5e',
  hitDie: 10,
  features: CLASS_FEATURES_5E.Fighter,
  extraAttacks,
  lockedChoices: [
    { key: 'fighting_style', label: 'Fighting Style', options: FIGHTER_FIGHTING_STYLES_5E, minLevel: 1 },
  ],
  restResources: REST_RESOURCES,
  notes: [],
  subclass: { label: 'Martial Archetype (Subclass)', options: FIGHTER_SUBCLASSES_5E, unlockLevel: 3, subclassEdition: '5e' },
  subclassPanels: FIGHTER_SUBCLASS_PANELS,
  asiLevels: ASI_LEVELS,
  skill: { allowed: FIGHTER_SKILLS, count: 2 },
  caster: null,
};

export const FIGHTER_2024 = {
  className: 'Fighter',
  edition: '5.5e',
  hitDie: 10,
  features: CLASS_FEATURES_2024.Fighter,
  extraAttacks,
  lockedChoices: [
    { key: 'fighting_style', label: 'Fighting Style', options: FIGHTER_FIGHTING_STYLES_2024, minLevel: 1 },
  ],
  weaponMastery: { label: 'Weapon Mastery', max: weaponMasteryMax, note: 'weapons, change on long rest' },
  restResources: REST_RESOURCES,
  notes: [
    { label: 'Tactical Mind', text: 'When you fail an ability check, expend one Action Surge use to add 1d10 to the check.', minLevel: 2 },
  ],
  subclass: { label: 'Warrior Subclass', options: FIGHTER_SUBCLASSES_2024, unlockLevel: 3, subclassEdition: '5.5e' },
  subclassPanels: FIGHTER_SUBCLASS_PANELS,
  asiLevels: ASI_LEVELS,
  skill: { allowed: FIGHTER_SKILLS, count: 2 },
  caster: null,
};
