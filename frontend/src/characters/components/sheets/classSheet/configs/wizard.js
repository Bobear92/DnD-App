/**
 * Wizard class config (5e + 2024) — drives the data-driven ClassSheet.
 * Full prepared caster: spellbook + prepared list, Arcane Recovery, Portent (Divination),
 * Memorize Spell / Scholar (2024). Spell lists + slot tables match the original sheets.
 */
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import { WIZARD_SUBCLASSES_5E, WIZARD_SUBCLASSES_2024 } from '@/characters/components/classData/classChoicesData';

const FULL_CASTER_SLOTS = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], [3, 0, 0, 0, 0, 0, 0, 0, 0], [4, 2, 0, 0, 0, 0, 0, 0, 0], [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0], [4, 3, 3, 0, 0, 0, 0, 0, 0], [4, 3, 3, 1, 0, 0, 0, 0, 0], [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0], [4, 3, 3, 3, 2, 0, 0, 0, 0], [4, 3, 3, 3, 2, 1, 0, 0, 0], [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0], [4, 3, 3, 3, 2, 1, 1, 0, 0], [4, 3, 3, 3, 2, 1, 1, 1, 0], [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
const slotsForLevel = (level) => FULL_CASTER_SLOTS[Math.min(Math.max(level, 1), 20) - 1];

const WIZARD_CANTRIPS_5E = [
  'Acid Splash', 'Blade Ward', 'Booming Blade', 'Chill Touch', 'Control Flames',
  'Create Bonfire', 'Dancing Lights', 'Fire Bolt', 'Friends', 'Frostbite',
  'Green-Flame Blade', 'Gust', 'Infestation', 'Light', 'Lightning Lure',
  'Mage Hand', 'Mending', 'Message', 'Minor Illusion', 'Mold Earth',
  'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shape Water',
  'Shocking Grasp', 'Sapping Sting', 'Thunderclap', 'Toll the Dead', 'True Strike',
];
const WIZARD_L1_SPELLS_5E = [
  'Absorb Elements', 'Alarm', 'Burning Hands', 'Catapult', 'Cause Fear',
  'Charm Person', 'Chromatic Orb', 'Color Spray', 'Comprehend Languages',
  'Detect Magic', 'Disguise Self', 'Earth Tremor', 'Expeditious Retreat',
  'False Life', 'Feather Fall', 'Find Familiar', 'Fog Cloud', 'Grease',
  'Ice Knife', 'Identify', 'Illusory Script', 'Jump', 'Longstrider',
  'Mage Armor', 'Magic Missile', 'Protection from Evil and Good',
  'Ray of Sickness', 'Shield', 'Silent Image', 'Sleep', 'Snare',
  "Tasha's Caustic Brew", 'Thunderwave', 'Unseen Servant', 'Witch Bolt',
];
const WIZARD_CANTRIPS_2024 = [
  'Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Elementalism',
  'Fire Bolt', 'Friends', 'Light', 'Mage Hand', 'Mending', 'Message',
  'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost',
  'Shocking Grasp', 'Thunderclap', 'Toll the Dead', 'True Strike',
];
const WIZARD_L1_SPELLS_2024 = [
  'Absorb Elements', 'Alarm', 'Burning Hands', 'Charm Person', 'Chromatic Orb',
  'Color Spray', 'Comprehend Languages', 'Detect Magic', 'Disguise Self',
  'Earth Tremor', 'Expeditious Retreat', 'False Life', 'Feather Fall',
  'Find Familiar', 'Fog Cloud', 'Grease', 'Ice Knife', 'Identify',
  'Illusory Script', 'Jump', 'Longstrider', 'Mage Armor', 'Magic Missile',
  'Protection from Evil and Good', 'Ray of Sickness', 'Shield', 'Silent Image',
  'Sleep', 'Thunderwave', 'Unseen Servant', 'Witch Bolt',
];

const WIZARD_SKILLS = ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'];
const ASI_LEVELS = [4, 8, 12, 16, 19];

export const WIZARD_5E = {
  className: 'Wizard',
  edition: '5e',
  hitDie: 6,
  features: CLASS_FEATURES_5E.Wizard,
  extraAttacks: null,
  lockedChoices: [],
  restResources: [],
  notes: [],
  subclass: { label: 'Arcane Tradition (Subclass)', options: WIZARD_SUBCLASSES_5E, unlockLevel: 2, subclassEdition: '5e' },
  asiLevels: ASI_LEVELS,
  skill: { allowed: WIZARD_SKILLS, count: 2 },
  caster: {
    spellcastingAbility: 'intelligence',
    slotsForLevel,
    arcaneRecovery: true,
    portent: true,
    cantrips: { label: 'Cantrips Known (choose 3)', limit: 3, options: WIZARD_CANTRIPS_5E },
    spellbook: { label: 'Starting Spellbook (choose 6 × 1st-level spells)', limit: 6, options: WIZARD_L1_SPELLS_5E },
  },
};

export const WIZARD_2024 = {
  className: 'Wizard',
  edition: '5.5e',
  hitDie: 6,
  features: CLASS_FEATURES_2024.Wizard,
  extraAttacks: null,
  lockedChoices: [],
  restResources: [
    {
      key: 'memorize_spell_used', label: 'Memorize Spell (Long Rest)', total: () => 1, recharge: 'long', minLevel: 1,
      description: 'On a short rest, swap one prepared spell for another from your spellbook.',
    },
  ],
  notes: [
    { label: 'Scholar (L2)', text: '1×/short rest: add d6 + INT modifier to Arcana, History, Nature, or Religion check.', minLevel: 2 },
  ],
  subclass: { label: 'Arcane Tradition (Subclass)', options: WIZARD_SUBCLASSES_2024, unlockLevel: 3, subclassEdition: '5.5e' },
  asiLevels: ASI_LEVELS,
  skill: { allowed: WIZARD_SKILLS, count: 2 },
  caster: {
    spellcastingAbility: 'intelligence',
    slotsForLevel,
    arcaneRecovery: true,
    portent: true,
    cantrips: { label: 'Cantrips Known (choose 3)', limit: 3, options: WIZARD_CANTRIPS_2024 },
    spellbook: { label: 'Starting Spellbook (choose 6 × 1st-level spells)', limit: 6, options: WIZARD_L1_SPELLS_2024 },
  },
};
