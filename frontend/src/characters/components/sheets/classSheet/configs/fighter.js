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
import BattleMasterPanel from '@/characters/components/subclass/BattleMasterPanel';
import WeaponBondPanel from '@/characters/components/subclass/WeaponBondPanel';

// Interactive per-subclass panels (maneuver picker + superiority dice, bonded weapons, etc.).
const FIGHTER_SUBCLASS_PANELS = {
  'Battle Master': BattleMasterPanel,
  'Eldritch Knight': WeaponBondPanel,
};

const FIGHTER_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Athletics', 'History',
  'Insight', 'Intimidation', 'Perception', 'Survival',
];

const actionSurgeTotal = (level) => (level >= 17 ? 2 : level >= 2 ? 1 : 0);
const indomitableTotal = (level) => (level >= 17 ? 3 : level >= 13 ? 2 : level >= 9 ? 1 : 0);
const extraAttacks = (level) => (level >= 20 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1);
const weaponMasteryMax = (level) => (level >= 16 ? 6 : level >= 10 ? 5 : level >= 4 ? 4 : 3);

const REST_RESOURCES = [
  {
    key: 'second_wind_used', label: 'Second Wind (Short Rest)', total: () => 1, recharge: 'short', minLevel: 1,
    description: 'Bonus action: regain 1d10 + your Fighter level HP.',
  },
  {
    key: 'action_surge_used', label: 'Action Surge (Short Rest)', total: actionSurgeTotal, recharge: 'short', minLevel: 2,
    description: 'Take one additional action on your turn.',
  },
  {
    key: 'indomitable_used', label: 'Indomitable (Long Rest)', total: indomitableTotal, recharge: 'long', minLevel: 9,
    description: 'Reroll a failed saving throw — you must use the new roll.',
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
