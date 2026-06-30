import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { StandardSpreadAssignment, PointBuyAssignment, DiceRollAssignment } from '@/characters/components/shared/AbilityScoreAssignment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import MainLayout from '../../shared/components/layout/MainLayout';
import characterService from '../characterService';
import referenceService from '../referenceService';
import featService from '../../encyclopedia/featService';
import classService from '../classService';
import ClassOverview from '@/characters/components/classData/ClassOverview';
import FeatPicker from '@/characters/components/feats/FeatPicker';
import { checkFeatPrerequisite } from '@/characters/components/feats/featPrerequisites';
import { featAbilityChoices, featFixedAbilityScores, getSpellGrantSpecs, getFeatGrantedSpells, featGrantRedundant, featAbilityChoiceOptions, getManeuverGrantSpec, maneuverGrantComplete, getFeatStatMods, getFeatStatModSources } from '@/characters/components/feats/featEffects';
import FeatSpellGrantPicker, { spellGrantComplete, resolveSpellGrantValue } from '@/characters/components/feats/FeatSpellGrantPicker';
import FeatManeuverPicker from '@/characters/components/feats/FeatManeuverPicker';
import { getFeatProficiencyChoices, availableFeatOptions, applyFeatProficiencyChoice, groupFeatProfOptions, FEAT_SKILL_OPTIONS } from '@/characters/components/feats/featProficiencyData';

const FEAT_SKILL_NAME_SET = new Set(FEAT_SKILL_OPTIONS.map(s => s.toLowerCase()));
import { useCampaign } from '../../campaigns/CampaignContext';
import {
  ArtificerSheet,
  BarbarianSheet, BardSheet, ClericSheet, DruidSheet,
  FighterSheet, MonkSheet, PaladinSheet, RangerSheet,
  RogueSheet, SorcererSheet, WarlockSheet, WizardSheet,
  SUPPORTED_CLASSES_5E, CLASS_DESCRIPTIONS, CLASS_HIT_DICE,
} from '@/characters/components/sheets';
import { HIT_DICE_5E } from '@/characters/components/classData/classFeatures5e';
import {
  BarbarianSheet as BarbarianSheet2024,
  BardSheet as BardSheet2024,
  ClericSheet as ClericSheet2024,
  DruidSheet as DruidSheet2024,
  FighterSheet as FighterSheet2024,
  MonkSheet as MonkSheet2024,
  PaladinSheet as PaladinSheet2024,
  RangerSheet as RangerSheet2024,
  RogueSheet as RogueSheet2024,
  SorcererSheet as SorcererSheet2024,
  WarlockSheet as WarlockSheet2024,
  WizardSheet as WizardSheet2024,
  SUPPORTED_CLASSES_2024, CLASS_DESCRIPTIONS_2024, CLASS_HIT_DICE_2024,
} from '@/characters/components/sheets/2024';
import { HIT_DICE_2024 } from '@/characters/components/classData/classFeatures2024';
import { cn } from '@/lib/utils';
import TraitBadgeList from '@/characters/components/race/TraitBadge';
import { getRaceGrantedSkills, getRaceSkillSources, getRaceGrantedTools, getRaceGrantedWeapons, getRaceGrantedArmor } from '@/characters/components/race/raceProficienciesData';
import { totalHpBonus } from '@/characters/components/combat/combatBonuses';
import SpellList from '@/characters/components/spells/SpellList';
import { getClassConfig } from '@/characters/components/sheets/classSheet/configs';
import { SUBCLASS_UNLOCK_LEVEL_5E, SUBCLASS_UNLOCK_LEVEL_2024 } from '@/characters/components/classData/classChoicesData';
import { startingGoldForBackground, EMPTY_WALLET } from '@/characters/components/inventory/currencyData';
import { CLASS_PROFICIENCIES_5E } from '@/characters/components/classData/classProficienciesData';
import StartingEquipmentStep from '@/characters/components/inventory/StartingEquipmentStep';

// ─── Ability score validation constants ──────────────────────────────────────

const SCORE_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const STANDARD_SPREAD_VALUES = [15, 14, 13, 12, 10, 8];
const POINT_BUY_COSTS = [0, 1, 2, 3, 4, 5, 7, 9]; // index = score - 8
const POINT_BUY_TOTAL = 27;
const EMPTY_DICE_ASSIGNMENT = Object.fromEntries(SCORE_KEYS.map(k => [k, null]));

// ─── Static data ────────────────────────────────────────────────────────────

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

const RACES_5E = [
  {
    name: 'Dragonborn', size: 'Medium', speed: 30,
    asi: '+2 STR, +1 CHA',
    asiBonus: { strength: 2, charisma: 1 },
    traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
    languages: ['Common', 'Draconic'],
    description: 'Born of dragons, dragonborn walk proudly through a world that greets them with fear and wonder. Shaped by draconic magic, they bear little resemblance to their dragon ancestors but carry an unmistakable presence.',
    subraces: [],
  },
  {
    name: 'Dwarf', size: 'Medium', speed: 25,
    asi: '+2 CON',
    asiBonus: { constitution: 2 },
    traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Tool Proficiency'],
    languages: ['Common', 'Dwarvish'],
    description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. Though they stand well under 5 feet tall, dwarves are so broad and compact that they can weigh as much as a human standing nearly two feet taller.',
    subraces: [
      {
        name: 'Hill Dwarf',
        asi: '+1 WIS',
        asiBonus: { wisdom: 1 },
        traits: ['Dwarven Toughness'],
        description: 'As a hill dwarf, you have keen senses, deep intuition, and remarkable resilience. Combined with the Dwarf base +2 CON, you end up with a hardy character.',
      },
      {
        name: 'Mountain Dwarf',
        asi: '+2 STR',
        asiBonus: { strength: 2 },
        traits: ['Dwarven Armor Training'],
        description: "As a mountain dwarf, you're strong and hardy, accustomed to a difficult life in rugged terrain. Combined with the Dwarf base +2 CON, you're built for the front line.",
      },
    ],
  },
  {
    name: 'Elf', size: 'Medium', speed: 30,
    asi: '+2 DEX',
    asiBonus: { dexterity: 2 },
    traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'],
    languages: ['Common', 'Elvish'],
    description: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. They live in places of ethereal beauty, in the midst of ancient forests or in silvery spires glittering with faerie light.',
    subraces: [
      {
        name: 'High Elf',
        asi: '+1 INT',
        asiBonus: { intelligence: 1 },
        traits: ['Elf Weapon Training', 'Cantrip', 'Extra Language'],
        description: 'As a high elf, you have a keen mind and a mastery of at least the basics of magic. You know one cantrip of your choice from the wizard spell list.',
      },
      {
        name: 'Wood Elf',
        asi: '+1 WIS',
        asiBonus: { wisdom: 1 },
        traits: ['Elf Weapon Training', 'Fleet of Foot', 'Mask of the Wild'],
        speedBonus: 5,
        description: 'As a wood elf, you have keen senses and intuition, and your fleet feet carry you quickly through your native forests. Your speed increases to 35 feet.',
      },
      {
        name: 'Dark Elf (Drow)',
        asi: '+1 CHA',
        asiBonus: { charisma: 1 },
        traits: ['Superior Darkvision', 'Sunlight Sensitivity', 'Drow Magic', 'Drow Weapon Training'],
        description: 'Descended from an earlier subrace of dark-skinned elves, the drow were banished from the surface world for following the goddess Lolth down the path to evil and corruption.',
      },
    ],
  },
  {
    name: 'Gnome', size: 'Small', speed: 25,
    asi: '+2 INT',
    asiBonus: { intelligence: 2 },
    traits: ['Darkvision', 'Gnome Cunning'],
    languages: ['Common', 'Gnomish'],
    description: "A gnome's energy and enthusiasm for living shines through every inch of their tiny body. Gnomes take delight in life, enjoying every moment of invention, exploration, investigation, creation, and play.",
    subraces: [
      {
        name: 'Forest Gnome',
        asi: '+1 DEX',
        asiBonus: { dexterity: 1 },
        traits: ['Natural Illusionist', 'Speak with Small Beasts'],
        description: 'As a forest gnome, you have a natural knack for illusion and inherent quickness and stealth. You know the minor illusion cantrip.',
      },
      {
        name: 'Rock Gnome',
        asi: '+1 CON',
        asiBonus: { constitution: 1 },
        traits: ["Artificer's Lore", 'Tinker'],
        description: "As a rock gnome, you have a natural inventiveness and hardiness beyond that of other gnomes. You can tinker with tools to create minor constructs.",
      },
    ],
  },
  {
    name: 'Half-Elf', size: 'Medium', speed: 30,
    asi: '+2 CHA, +1 to Two Others',
    asiBonus: { charisma: 2 },
    asiNote: 'Also grants +1 to two ability scores of your choice — apply these manually when assigning scores.',
    traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility', 'Extra Language'],
    languages: ['Common', 'Elvish'],
    description: 'Walking in two worlds but truly belonging to neither, half-elves combine what some say are the best qualities of their elf and human parents: human curiosity and ambition tempered by the refined senses and artistic tastes of the elves.',
    subraces: [],
  },
  {
    name: 'Half-Orc', size: 'Medium', speed: 30,
    asi: '+2 STR, +1 CON',
    asiBonus: { strength: 2, constitution: 1 },
    traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks'],
    languages: ['Common', 'Orc'],
    description: 'Whether united under the leadership of a mighty warlock or having fought to a place of some renown, half-orcs have endured a rough existence that has left its mark on their bodies and souls.',
    subraces: [],
  },
  {
    name: 'Halfling', size: 'Small', speed: 25,
    asi: '+2 DEX',
    asiBonus: { dexterity: 2 },
    traits: ['Lucky', 'Brave', 'Halfling Nimbleness'],
    languages: ['Common', 'Halfling'],
    description: "The comforts of home are the goals of most halflings' lives: a place to settle in peace and quiet, far from marauding monsters and clashing armies. They are practical, cheerful, and resilient.",
    subraces: [
      {
        name: 'Lightfoot Halfling',
        asi: '+1 CHA',
        asiBonus: { charisma: 1 },
        traits: ['Naturally Stealthy'],
        description: 'As a lightfoot halfling, you can easily hide from notice, even using other people as cover. You are inclined to be affable and get along well with others.',
      },
      {
        name: 'Stout Halfling',
        asi: '+1 CON',
        asiBonus: { constitution: 1 },
        traits: ['Stout Resilience'],
        description: "As a stout halfling, you're hardier than average and have some resistance to poison. Some say that stout halflings have dwarven blood.",
      },
    ],
  },
  {
    name: 'Human', size: 'Medium', speed: 30,
    asi: '+1 to All Stats',
    asiBonus: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    traits: ['Extra Language', 'Variant: +1 to Two, one Feat, one extra Skill'],
    languages: ['Common'],
    description: 'Humans are the most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds.',
    subraces: [],
  },
  {
    name: 'Tiefling', size: 'Medium', speed: 30,
    asi: '+2 CHA, +1 INT',
    asiBonus: { charisma: 2, intelligence: 1 },
    traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
    languages: ['Common', 'Infernal'],
    description: 'To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the tiefling. Their infernal heritage marks them indelibly.',
    subraces: [],
  },
];

const BACKGROUNDS_5E = [
  {
    name: 'Acolyte', skills: ['Insight', 'Religion'], tools: null,
    feature: 'Shelter of the Faithful',
    equipment: 'Holy symbol, prayer book, 5 sticks of incense, vestments, common clothes, 15 gp',
    description: 'You have spent your life in service to a temple, learning its sacred rites and lending your aid to the faithful. You and your adventuring companions can expect to receive free healing and care at a temple whose faith you share.',
  },
  {
    name: 'Charlatan', skills: ['Deception', 'Sleight of Hand'], tools: 'Disguise kit, forgery kit',
    feature: 'False Identity',
    equipment: 'Fine clothes, disguise kit, forged documents, 15 gp',
    description: 'You have always had a way with people. You know what makes them tick, you can tease out their innermost desires after a few minutes of conversation, and with a few leading questions you can read them like they were children\'s books.',
  },
  {
    name: 'Criminal', skills: ['Deception', 'Stealth'], tools: "Thieves' tools, one gaming set",
    feature: 'Criminal Contact',
    equipment: 'Crowbar, dark common clothes with hood, 15 gp',
    description: 'You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld.',
  },
  {
    name: 'Entertainer', skills: ['Acrobatics', 'Performance'], tools: 'Disguise kit, one musical instrument',
    feature: 'By Popular Demand',
    equipment: 'Musical instrument, the favor of an admirer, costume, 15 gp',
    description: 'You thrive in front of an audience. You know how to entrance them, to make them laugh or weep or fall silent, and to inspire them. Your life\'s work is performance, and the reward is applause.',
  },
  {
    name: 'Folk Hero', skills: ['Animal Handling', 'Survival'], tools: "Artisan's tools, vehicles (land)",
    feature: 'Rustic Hospitality',
    equipment: "Artisan's tools, shovel, iron pot, common clothes, 10 gp",
    description: 'You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion, and your destiny calls you to stand against the tyrants and monsters that threaten the common folk.',
  },
  {
    name: 'Guild Artisan', skills: ['Insight', 'Persuasion'], tools: "One type of artisan's tools",
    feature: 'Guild Membership',
    equipment: "Artisan's tools, a letter of introduction from your guild, traveler's clothes, 15 gp",
    description: "You are a member of an artisan's guild, skilled in a particular field and closely associated with other artisans. You are well established in the mercantile world, freed by talent and wealth from the constraints of a feudal social order.",
  },
  {
    name: 'Hermit', skills: ['Medicine', 'Religion'], tools: 'Herbalism kit',
    feature: 'Discovery',
    equipment: 'Scroll case stuffed with notes, blanket, herbalism kit, 5 gp',
    description: 'You lived in seclusion — either in a sheltered community such as a monastery, or entirely alone — for a formative part of your life. In your time apart from the clamor of society, you found quiet, solitude, and perhaps some of the answers you were looking for.',
  },
  {
    name: 'Noble', skills: ['History', 'Persuasion'], tools: 'One gaming set',
    feature: 'Position of Privilege',
    equipment: 'Fine clothes, signet ring, scroll of pedigree, purse with 25 gp',
    description: 'You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence. You might be a pampered aristocrat unfamiliar with work or discomfort, or you might be a humbled minor noble who grew up in poverty.',
  },
  {
    name: 'Outlander', skills: ['Athletics', 'Survival'], tools: 'One musical instrument',
    feature: 'Wanderer',
    equipment: "Staff, a hunting trap, a trophy from an animal you killed, traveler's clothes, 10 gp",
    description: 'You grew up in the wilds, far from civilization and the comforts of town and technology. You have witnessed the migration of herds larger than forests, survived weather more extreme than any city-dweller could comprehend, and enjoyed the solitude of being the only thinking creature for miles in any direction.',
  },
  {
    name: 'Sage', skills: ['Arcana', 'History'], tools: null,
    feature: 'Researcher',
    equipment: 'Bottle of black ink, quill, small knife, letter from a dead colleague, common clothes, 10 gp',
    description: 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied under sages, and apprenticed with a librarian or archivist. Your efforts paid off when you gained mastery over a field of study.',
  },
  {
    name: 'Sailor', skills: ['Athletics', 'Perception'], tools: "Navigator's tools, vehicles (water)",
    feature: "Ship's Passage",
    equipment: "Belaying pin, 50 feet of silk rope, lucky charm such as a rabbit foot, common clothes, 10 gp",
    description: 'You sailed on a seagoing vessel for years. In that time, you faced down mighty storms, pirates, and monstrous creatures from the deep. Your first love is the distant line of the horizon, but the time has come to try your hand at something new.',
  },
  {
    name: 'Soldier', skills: ['Athletics', 'Intimidation'], tools: 'One gaming set, vehicles (land)',
    feature: 'Military Rank',
    equipment: 'Insignia of rank, trophy from fallen enemy, gaming set, common clothes, 10 gp',
    description: 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, including how to stay alive on the battlefield. You might have been part of a standing national army or a mercenary company.',
  },
  {
    name: 'Urchin', skills: ['Sleight of Hand', 'Stealth'], tools: "Thieves' tools, disguise kit",
    feature: 'City Secrets',
    equipment: 'Small knife, map of the city you grew up in, pet mouse, token to remember your parents, common clothes, 10 gp',
    description: 'You grew up on the streets alone, orphaned, and poor. You had no one to watch over you or to provide for you, so you learned to provide for yourself. You fought fiercely over food and kept a constant watch out for other desperate souls who might take what little you had.',
  },
];

const CLASS_SKILL_REQUIRED = {
  Artificer: 2,
  Barbarian: 2, Bard: 3, Cleric: 2, Druid: 2, Fighter: 2,
  Monk: 2, Paladin: 2, Ranger: 3, Rogue: 4, Sorcerer: 2,
  Warlock: 2, Wizard: 2,
};

const CLASS_COLORS = {
  Barbarian: 'border-orange-500 bg-card hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-600',
  Bard:      'border-pink-500 bg-card hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:border-pink-600',
  Cleric:    'border-yellow-500 bg-card hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-600',
  Druid:     'border-green-500 bg-card hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-600',
  Fighter:   'border-red-500 bg-card hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-600',
  Monk:      'border-cyan-500 bg-card hover:bg-cyan-50 dark:hover:bg-cyan-950/20 hover:border-cyan-600',
  Paladin:   'border-amber-500 bg-card hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-600',
  Ranger:    'border-emerald-500 bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-600',
  Rogue:     'border-purple-500 bg-card hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-600',
  Sorcerer:  'border-rose-500 bg-card hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-600',
  Warlock:   'border-violet-500 bg-card hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:border-violet-600',
  Wizard:    'border-blue-500 bg-card hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-600',
};

const CLASS_ACCENT = {
  Barbarian: 'text-orange-700 dark:text-orange-400',
  Bard:      'text-pink-700 dark:text-pink-400',
  Cleric:    'text-yellow-700 dark:text-yellow-400',
  Druid:     'text-green-700 dark:text-green-400',
  Fighter:   'text-red-700 dark:text-red-400',
  Monk:      'text-cyan-700 dark:text-cyan-400',
  Paladin:   'text-amber-700 dark:text-amber-400',
  Ranger:    'text-emerald-700 dark:text-emerald-400',
  Rogue:     'text-purple-700 dark:text-purple-400',
  Sorcerer:  'text-rose-700 dark:text-rose-400',
  Warlock:   'text-violet-700 dark:text-violet-400',
  Wizard:    'text-blue-700 dark:text-blue-400',
};

// ─── ASI helpers ─────────────────────────────────────────────────────────────

function mergeAsi(...asiObjects) {
  const result = {};
  for (const obj of asiObjects) {
    if (!obj) continue;
    for (const [stat, val] of Object.entries(obj)) {
      result[stat] = (result[stat] ?? 0) + val;
    }
  }
  return result;
}

const STAT_ABBREV = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};

function formatAsiBonus(asiObj) {
  return Object.entries(asiObj)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${STAT_ABBREV[k] ?? k}`)
    .join(', ');
}

// ─── Race / background choice data ──────────────────────────────────────────

const SUBRACE_GRANTED_CANTRIPS = {
  'Forest Gnome': 'Minor Illusion',
  'Dark Elf (Drow)': 'Dancing Lights',
};

const RACE_GRANTED_CANTRIPS_MAP = {
  'Tiefling': 'Thaumaturgy',
};

const DRACONIC_ANCESTRIES = [
  { name: 'Black',  damage: 'Acid',      breath: '5×30 ft line' },
  { name: 'Blue',   damage: 'Lightning', breath: '5×30 ft line' },
  { name: 'Brass',  damage: 'Fire',      breath: '5×30 ft line' },
  { name: 'Bronze', damage: 'Lightning', breath: '5×30 ft line' },
  { name: 'Copper', damage: 'Acid',      breath: '5×30 ft line' },
  { name: 'Gold',   damage: 'Fire',      breath: '15 ft cone' },
  { name: 'Green',  damage: 'Poison',    breath: '15 ft cone' },
  { name: 'Red',    damage: 'Fire',      breath: '15 ft cone' },
  { name: 'Silver', damage: 'Cold',      breath: '15 ft cone' },
  { name: 'White',  damage: 'Cold',      breath: '15 ft cone' },
];

const WIZARD_CANTRIPS_5E = [
  'Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Fire Bolt',
  'Friends', 'Light', 'Mage Hand', 'Mending', 'Message', 'Minor Illusion',
  'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shocking Grasp', 'True Strike',
];

const STANDARD_LANGUAGES_LIST = [
  'Abyssal', 'Celestial', 'Deep Speech', 'Draconic', 'Dwarvish', 'Elvish',
  'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Infernal', 'Orc',
  'Primordial', 'Sylvan', 'Undercommon',
];

const ALL_SKILLS_18 = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
];

const GAMING_SETS = ['Dice set', 'Dragonchess set', 'Playing card set', 'Three-Dragon Ante set'];

const MUSICAL_INSTRUMENTS_BG = [
  'Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Lute', 'Lyre', 'Horn', 'Pan flute', 'Shawm', 'Viol',
];

const ARTISANS_TOOLS_LIST = [
  "Alchemist's supplies", "Brewer's supplies", "Calligrapher's supplies",
  "Carpenter's tools", "Cartographer's tools", "Cobbler's tools",
  "Cook's utensils", "Glassblower's tools", "Jeweler's tools",
  "Leatherworker's tools", "Mason's tools", "Painter's supplies",
  "Potter's tools", "Smith's tools", "Tinker's tools",
  "Weaver's tools", "Woodcarver's tools",
];

// Dwarf "Tool Proficiency" racial trait: one artisan's tool of the player's choice.
const DWARF_TOOL_OPTIONS = ["Smith's tools", "Brewer's supplies", "Mason's tools"];

const BACKGROUND_CHOICES_MAP = {
  'Acolyte':       { languages: 2 },
  'Criminal':      { tool: 'gaming_set' },
  'Entertainer':   { tool: 'musical_instrument' },
  'Folk Hero':     { tool: 'artisans_tools' },
  'Guild Artisan': { tool: 'artisans_tools' },
  'Hermit':        { languages: 1 },
  'Noble':         { tool: 'gaming_set' },
  'Outlander':     { tool: 'musical_instrument' },
  'Sage':          { languages: 2 },
  'Soldier':       { tool: 'gaming_set' },
};

// The keyword that identifies the "choose one" placeholder inside a background's
// tools string for each choice type — that segment is resolved separately via
// bgChoices.tool_choice, so it must be dropped from the fixed-tools list.
const TOOL_CHOICE_KEYWORD = {
  gaming_set: 'gaming set',
  musical_instrument: 'musical instrument',
  artisans_tools: "artisan's tools",
};

// Concrete tool proficiencies a background grants outright (e.g. Hermit's
// "Herbalism kit"), excluding any "choose one" placeholder captured by tool_choice.
function backgroundFixedTools(bg) {
  if (!bg?.tools) return [];
  const keyword = TOOL_CHOICE_KEYWORD[BACKGROUND_CHOICES_MAP[bg.name]?.tool];
  return bg.tools
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(seg => !(keyword && seg.toLowerCase().includes(keyword)));
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeApiRace(r) {
  const asi = r.ability_score_increases;
  let asiStr = '';
  if (typeof asi === 'string') asiStr = asi;
  else if (Array.isArray(asi)) asiStr = asi.join(', ');
  else if (asi && typeof asi === 'object') asiStr = Object.entries(asi).map(([k, v]) => `+${v} ${k}`).join(', ');

  const asiBonus = (asi && typeof asi === 'object' && !Array.isArray(asi)) ? asi : {};

  const traits = Array.isArray(r.traits)
    ? r.traits.map(t => (typeof t === 'string' ? t : t.name ?? String(t))).filter(Boolean)
    : [];

  const languages = Array.isArray(r.languages) ? r.languages : [];

  return {
    name: r.name,
    size: r.size ?? 'Medium',
    speed: r.speed ?? 30,
    asi: asiStr,
    asiBonus,
    traits,
    languages,
    description: r.description ?? '',
    subraces: [],
  };
}

function normalizeApiBg(bg) {
  const skills = Array.isArray(bg.skill_proficiencies) ? bg.skill_proficiencies : (bg.skills ?? []);
  const tools = Array.isArray(bg.tool_proficiencies) ? bg.tool_proficiencies.join(', ') : (bg.tool_proficiencies ?? null);
  const feature = typeof bg.feature === 'object' ? (bg.feature?.name ?? '') : (bg.feature ?? '');
  const equipment = Array.isArray(bg.equipment) ? bg.equipment.join(', ') : (bg.equipment ?? '');
  return { name: bg.name, skills, tools, feature, equipment, description: bg.description ?? '' };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StepIndicator({ current, steps = ['Class', 'Overview', 'Identity', 'Features', 'Review'] }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className="h-px w-6 bg-border" />}
            <div className={cn(
              'flex items-center gap-1.5',
              active && 'text-foreground font-semibold',
              done && 'text-muted-foreground',
              !active && !done && 'text-muted-foreground/50',
            )}>
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border',
                active && 'bg-primary text-primary-foreground border-primary',
                done && 'bg-muted border-muted-foreground/30',
                !active && !done && 'border-muted-foreground/30',
              )}>
                {done ? <Check className="w-3 h-3" /> : idx}
              </div>
              {label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function RaceCard({ race, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(race)}
      data-testid={`race-card-${race.name}`}
      className={cn(
        'rounded-lg border-2 p-3 text-left transition-all hover:shadow-sm w-full',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-bold text-sm">{race.name}</span>
        {selected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{race.size} · {race.speed} ft</div>
      {race.asi && <div className="text-xs font-medium text-primary mt-1">{race.asi}</div>}
    </button>
  );
}

function RaceDetail({ race }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="font-bold text-base">{race.name}</h3>
          <div className="text-xs text-muted-foreground">{race.size} · Speed {race.speed} ft · {race.asi}</div>
        </div>
      </div>
      {race.description && <p className="text-sm text-muted-foreground leading-relaxed">{race.description}</p>}
      {race.traits.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Racial Traits <span className="font-normal normal-case text-muted-foreground/70">(click a trait to learn more)</span></div>
          <TraitBadgeList traits={race.traits} />
        </div>
      )}
      {race.languages?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Languages</div>
          <div className="flex flex-wrap gap-1.5">
            {race.languages.map(l => (
              <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubraceCard({ subrace, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(subrace)}
      data-testid={`subrace-card-${subrace.name}`}
      className={cn(
        'rounded-lg border-2 p-3 text-left transition-all hover:shadow-sm w-full',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-bold text-sm">{subrace.name}</span>
        {selected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
      </div>
      {subrace.asi && <div className="text-xs font-medium text-primary mt-1">{subrace.asi}</div>}
    </button>
  );
}

function SubraceDetail({ subrace }) {
  return (
    <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 space-y-3">
      <div>
        <h3 className="font-bold text-base">{subrace.name}</h3>
        {subrace.asi && <div className="text-xs font-medium text-primary">{subrace.asi}</div>}
      </div>
      {subrace.description && <p className="text-sm text-muted-foreground leading-relaxed">{subrace.description}</p>}
      {subrace.traits?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Subrace Traits <span className="font-normal normal-case text-muted-foreground/70">(click a trait to learn more)</span></div>
          <TraitBadgeList traits={subrace.traits} variant="outline" badgeClassName="border-primary/30" />
        </div>
      )}
    </div>
  );
}

function BgCard({ bg, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(bg)}
      data-testid={`bg-card-${bg.name}`}
      className={cn(
        'rounded-lg border-2 p-3 text-left transition-all hover:shadow-sm w-full',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-bold text-sm">{bg.name}</span>
        {selected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
      </div>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {bg.skills.map(s => (
          <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
        ))}
      </div>
      <div className="text-xs text-muted-foreground italic mt-1">{bg.feature}</div>
      {bg.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{bg.description}</p>
      )}
    </button>
  );
}

function BgDetail({ bg }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div>
        <h3 className="font-bold text-base">{bg.name}</h3>
        <div className="text-xs text-muted-foreground italic">{bg.feature}</div>
      </div>
      {bg.description && <p className="text-sm text-muted-foreground leading-relaxed">{bg.description}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Skill Proficiencies</div>
          <div className="flex flex-wrap gap-1">
            {bg.skills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
          </div>
        </div>
        {bg.tools && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Tool Proficiencies</div>
            <div className="text-sm">{bg.tools}</div>
          </div>
        )}
        {bg.equipment && (
          <div className="sm:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Starting Equipment</div>
            <div className="text-sm">{bg.equipment}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function RaceChoicesSection({ race, subrace, choices, onChange, knownLanguages = [], backgroundGrants = null, backgroundSkills = [], feats = [], featDisabledReason = null, proficientSkills = [], featProfCharacterData = {}, charClass = null, campaignId = null, edition = '5e' }) {
  const isDragonborn = race?.name === 'Dragonborn';
  const isHighElf    = subrace?.name === 'High Elf';
  const isHalfElf    = race?.name === 'Half-Elf';
  const isHuman      = race?.name === 'Human';
  const isDwarf      = race?.name === 'Dwarf';
  if (!isDragonborn && !isHighElf && !isHalfElf && !isHuman && !isDwarf) return null;

  const bgChosenTool = backgroundGrants?.chosenTool || '';

  return (
    <div className="space-y-4 pt-3 border-t" data-testid="race-choices-section">
      <div>
        <p className="text-sm font-semibold">Racial Choices</p>
        <p className="text-xs text-muted-foreground mt-0.5">Additional options from your race or subrace</p>
      </div>

      {/* Dragonborn: Draconic Ancestry */}
      {isDragonborn && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Draconic Ancestry <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            Choose your draconic ancestry — determines your breath weapon damage type and resistance.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DRACONIC_ANCESTRIES.map(anc => (
              <button
                key={anc.name}
                type="button"
                data-testid={`draconic-ancestry-${anc.name}`}
                onClick={() => onChange({ ...choices, draconic_ancestry: anc })}
                className={cn(
                  'rounded-lg border-2 p-2.5 text-left transition-all',
                  choices.draconic_ancestry?.name === anc.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50',
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-sm">{anc.name} Dragon</span>
                  {choices.draconic_ancestry?.name === anc.name && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{anc.damage} · {anc.breath}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* High Elf: Wizard cantrip (required) */}
      {isHighElf && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Wizard Cantrip <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            High elves know one cantrip of their choice from the wizard spell list.
          </p>
          <select
            data-testid="high-elf-cantrip-select"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={choices.high_elf_cantrip || ''}
            onChange={e => onChange({ ...choices, high_elf_cantrip: e.target.value })}
          >
            <option value="">Select a cantrip…</option>
            {WIZARD_CANTRIPS_5E.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* High Elf: Extra language (optional) */}
      {isHighElf && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Extra Language</Label>
          <p className="text-xs text-muted-foreground">High elves speak one additional language of your choice.</p>
          <select
            data-testid="high-elf-language-select"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={choices.high_elf_language || '__none__'}
            onChange={e => onChange({ ...choices, high_elf_language: e.target.value === '__none__' ? '' : e.target.value })}
          >
            <option value="__none__">Select a language… (optional)</option>
            {STANDARD_LANGUAGES_LIST.filter(l => !knownLanguages.includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}

      {/* Half-Elf: +1 to 2 different ability scores (required) */}
      {isHalfElf && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Ability Score Increases <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">Choose 2 different ability scores to each gain +1.</p>
          <div className="grid grid-cols-3 gap-2">
            {SCORE_KEYS.map(stat => {
              const selected = choices.half_elf_asi_stats?.includes(stat);
              const atLimit  = (choices.half_elf_asi_stats?.length ?? 0) >= 2 && !selected;
              return (
                <button
                  key={stat}
                  type="button"
                  data-testid={`half-elf-asi-${stat}`}
                  disabled={atLimit}
                  onClick={() => {
                    const cur  = choices.half_elf_asi_stats ?? [];
                    const next = selected ? cur.filter(s => s !== stat) : [...cur, stat];
                    onChange({ ...choices, half_elf_asi_stats: next });
                  }}
                  className={cn(
                    'rounded-lg border-2 p-2 text-sm font-medium transition-all text-center',
                    selected ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card',
                    atLimit ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary/50',
                  )}
                >
                  {STAT_ABBREV[stat]}
                  {selected && <Check className="h-3 w-3 inline ml-1" />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{choices.half_elf_asi_stats?.length ?? 0}/2 chosen</p>
        </div>
      )}

      {/* Half-Elf: Skill Versatility — 2 skill proficiencies (required) */}
      {isHalfElf && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Skill Versatility <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">Choose 2 skill proficiencies from any skills.</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SKILLS_18.map(skill => {
              const selected = choices.half_elf_skills?.includes(skill);
              const atLimit  = (choices.half_elf_skills?.length ?? 0) >= 2 && !selected;
              const fromBg   = backgroundSkills.includes(skill);
              // Background skills are flagged amber. Un-picked ones are disabled (don't waste a slot);
              // an already-picked overlap stays clickable so it can be removed (the Next gate blocks it).
              const blocked  = (fromBg && !selected) || atLimit;
              return (
                <button
                  key={skill}
                  type="button"
                  data-testid={`half-elf-skill-${skill.replace(/\s+/g, '-')}`}
                  disabled={blocked}
                  onClick={() => {
                    if (blocked) return;
                    const cur  = choices.half_elf_skills ?? [];
                    const next = selected ? cur.filter(s => s !== skill) : [...cur, skill];
                    onChange({ ...choices, half_elf_skills: next });
                  }}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium border transition-all',
                    fromBg
                      ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600'
                      : selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border',
                    blocked && !selected ? 'opacity-40 cursor-not-allowed' : !fromBg ? 'hover:border-primary' : '',
                  )}
                >
                  {skill}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{choices.half_elf_skills?.length ?? 0}/2 chosen</p>
          {backgroundSkills.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400">Amber = already granted by your background — pick something else.</p>
          )}
        </div>
      )}

      {/* Half-Elf: Extra Language (one of choice) */}
      {isHalfElf && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Extra Language</Label>
          <p className="text-xs text-muted-foreground">Half-elves speak one additional language of your choice.</p>
          <select
            data-testid="half-elf-language-select"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={choices.half_elf_language || '__none__'}
            onChange={e => onChange({ ...choices, half_elf_language: e.target.value === '__none__' ? '' : e.target.value })}
          >
            <option value="__none__">Select a language… (optional)</option>
            {STANDARD_LANGUAGES_LIST.filter(l => !knownLanguages.includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}

      {/* Human: Standard vs Variant */}
      {isHuman && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Human Type</Label>
          <p className="text-xs text-muted-foreground">
            Choose the standard human (+1 to all ability scores) or the variant human (+1 to two scores, one skill, and one feat).
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { variant: false, title: 'Standard Human', sub: '+1 to all ability scores' },
              { variant: true, title: 'Variant Human', sub: '+1 to two scores · 1 skill · 1 feat' },
            ].map(opt => {
              const selected = !!choices.human_variant === opt.variant;
              return (
                <button
                  key={opt.title}
                  type="button"
                  data-testid={`human-type-${opt.variant ? 'variant' : 'standard'}`}
                  onClick={() => onChange({
                    ...choices,
                    human_variant: opt.variant,
                    // Clear variant-only picks when switching back to standard
                    ...(opt.variant ? {} : { human_variant_asi: [], human_variant_skill: '', human_feat: null, human_feat_ability: '', human_feat_prof: {}, human_feat_spell: null, human_feat_maneuvers: [] }),
                  })}
                  className={cn(
                    'rounded-lg border-2 p-2.5 text-left transition-all',
                    selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50',
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-sm">{opt.title}</span>
                    {selected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Variant Human: +1 to 2 different ability scores (required) */}
      {isHuman && choices.human_variant && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Ability Score Increases <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">Choose 2 different ability scores to each gain +1.</p>
          <div className="grid grid-cols-3 gap-2">
            {SCORE_KEYS.map(stat => {
              const selected = choices.human_variant_asi?.includes(stat);
              const atLimit  = (choices.human_variant_asi?.length ?? 0) >= 2 && !selected;
              return (
                <button
                  key={stat}
                  type="button"
                  data-testid={`human-variant-asi-${stat}`}
                  disabled={atLimit}
                  onClick={() => {
                    const cur  = choices.human_variant_asi ?? [];
                    const next = selected ? cur.filter(s => s !== stat) : [...cur, stat];
                    onChange({ ...choices, human_variant_asi: next });
                  }}
                  className={cn(
                    'rounded-lg border-2 p-2 text-sm font-medium transition-all text-center',
                    selected ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card',
                    atLimit ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary/50',
                  )}
                >
                  {STAT_ABBREV[stat]}
                  {selected && <Check className="h-3 w-3 inline ml-1" />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{choices.human_variant_asi?.length ?? 0}/2 chosen</p>
        </div>
      )}

      {/* Variant Human: one skill proficiency (required) */}
      {isHuman && choices.human_variant && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Skill Proficiency <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">Choose 1 skill proficiency from any skills.</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SKILLS_18.map(skill => {
              const selected = choices.human_variant_skill === skill;
              const fromBg   = backgroundSkills.includes(skill);
              // Background skills are flagged amber and disabled so the single pick isn't wasted.
              const blocked  = fromBg && !selected;
              return (
                <button
                  key={skill}
                  type="button"
                  data-testid={`human-variant-skill-${skill.replace(/\s+/g, '-')}`}
                  disabled={blocked}
                  onClick={() => {
                    if (blocked) return;
                    onChange({ ...choices, human_variant_skill: selected ? '' : skill });
                  }}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium border transition-all',
                    fromBg
                      ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600'
                      : selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border',
                    blocked ? 'opacity-40 cursor-not-allowed' : !fromBg ? 'hover:border-primary' : '',
                  )}
                >
                  {skill}
                </button>
              );
            })}
          </div>
          {backgroundSkills.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400">Amber = already granted by your background — pick something else.</p>
          )}
        </div>
      )}

      {/* Variant Human: one feat (required) */}
      {isHuman && choices.human_variant && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Feat <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            Variant humans gain one feat of their choice. Browse all feats in the Encyclopedia → Feats tab.
          </p>
          {feats.length === 0 ? (
            <p className="text-xs text-muted-foreground italic" data-testid="human-feat-empty">
              No feats available for this edition yet.
            </p>
          ) : (
            <FeatPicker
              feats={feats}
              value={choices.human_feat}
              onChange={feat => onChange({ ...choices, human_feat: feat, human_feat_ability: '', human_feat_prof: {}, human_feat_spell: null, human_feat_maneuvers: [] })}
              testIdPrefix="human-feat"
              getDisabledReason={featDisabledReason}
            />
          )}
          {/* Half-feat ability-score choice (e.g. Tavern Brawler / Resilient at level 1) */}
          {(() => {
            const picked = feats.find(f => f.id === choices.human_feat?.id);
            const ac = featAbilityChoices(picked)[0];
            if (!ac) return null;
            // Resilient: only offer abilities whose saving throw the class doesn't already grant.
            const classSaves = (CLASS_PROFICIENCIES_5E[charClass]?.saving_throws ?? []).map(s => s.toLowerCase());
            const abilityOptions = featAbilityChoiceOptions(picked, ac, { saveProficiencies: classSaves });
            return (
              <div className="space-y-1.5 rounded-md border bg-muted/30 p-2" data-testid="human-feat-ability-choice">
                <p className="text-xs font-medium">This feat increases an ability score by {ac.amount}. Choose one:</p>
                <div className="flex flex-wrap gap-1.5">
                  {abilityOptions.map(ab => (
                    <button
                      key={ab}
                      type="button"
                      data-testid={`human-feat-ability-${ab}`}
                      onClick={() => onChange({ ...choices, human_feat_ability: ab })}
                      className={cn(
                        'rounded-md border px-2 py-1 text-xs',
                        choices.human_feat_ability === ab ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50',
                      )}
                    >
                      +{ac.amount} {ab.charAt(0).toUpperCase() + ab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          {/* Count-choice proficiency picks (Skilled / Linguist / Weapon Master) at level 1 */}
          {(() => {
            const picked = feats.find(f => f.id === choices.human_feat?.id);
            const grants = getFeatProficiencyChoices(picked, { proficientSkills });
            if (grants.length === 0) return null;
            const profChoices = choices.human_feat_prof || {};
            const toggle = (profType, name, max) => {
              const cur = profChoices[profType] || [];
              const next = cur.includes(name)
                ? cur.filter(n => n !== name)
                : (cur.length >= max ? cur : [...cur, name]);
              onChange({ ...choices, human_feat_prof: { ...profChoices, [profType]: next } });
            };
            return grants.map(g => {
              const chosen = profChoices[g.prof_type] || [];
              const opts = availableFeatOptions(g, { charClass, characterData: featProfCharacterData });
              if (opts.length === 0) return null; // nothing pickable (e.g. Expertise pre-skills)
              return (
                <div key={g.key} className="space-y-1.5 rounded-md border bg-muted/30 p-2" data-testid={`human-feat-prof-grant-${g.prof_type}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{g.label}</span>
                    <span className={cn('text-xs', chosen.length === g.count ? 'text-muted-foreground' : 'text-amber-600')}>{chosen.length}/{g.count}</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                    {groupFeatProfOptions(g.prof_type, opts).map(({ category, options }) => (
                      <div key={category || '_'} className="space-y-1">
                        {category && (
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{category}</div>
                        )}
                        <div className="grid grid-cols-2 gap-1.5">
                          {options.map(o => {
                            const isSel = chosen.includes(o);
                            const atLimit = chosen.length >= g.count && !isSel;
                            return (
                              <button
                                key={o}
                                type="button"
                                disabled={atLimit}
                                onClick={() => toggle(g.prof_type, o, g.count)}
                                data-testid={`human-feat-prof-opt-${g.prof_type}-${o}`}
                                className={cn(
                                  'rounded-md border px-2 py-1 text-xs text-left',
                                  isSel ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50',
                                  atLimit && 'opacity-40 cursor-not-allowed',
                                )}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
          {/* Spell-grant picker (Magic Initiate): choose a list + cantrips + a 1st-level spell */}
          {(() => {
            const picked = feats.find(f => f.id === choices.human_feat?.id);
            const spec = getSpellGrantSpecs(picked)[0] || null;
            if (!spec) return null;
            return (
              <FeatSpellGrantPicker
                spec={spec}
                value={choices.human_feat_spell}
                onChange={v => onChange({ ...choices, human_feat_spell: v })}
                campaignId={campaignId}
                testIdPrefix="human-feat-spell"
              />
            );
          })()}
          {/* Maneuver-grant picker (Martial Adept): choose 2 Battle Master maneuvers + a d6 die */}
          {(() => {
            const picked = feats.find(f => f.id === choices.human_feat?.id);
            const spec = getManeuverGrantSpec(picked);
            if (!spec) return null;
            return (
              <FeatManeuverPicker
                spec={spec}
                value={choices.human_feat_maneuvers}
                onChange={v => onChange({ ...choices, human_feat_maneuvers: v })}
                edition={edition}
                testIdPrefix="human-feat-maneuver"
              />
            );
          })()}
        </div>
      )}

      {/* Human: Extra Language (both standard and variant) */}
      {isHuman && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Extra Language</Label>
          <p className="text-xs text-muted-foreground">
            Humans can speak, read, and write one extra language of their choice.
          </p>
          <select
            data-testid="human-language-select"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={choices.human_language || '__none__'}
            onChange={e => onChange({ ...choices, human_language: e.target.value === '__none__' ? '' : e.target.value })}
          >
            <option value="__none__">Select a language… (optional)</option>
            {STANDARD_LANGUAGES_LIST.filter(l => !knownLanguages.includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}

      {/* Dwarf: Tool Proficiency — one artisan's tool of choice */}
      {isDwarf && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Tool Proficiency <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            Dwarves gain proficiency with one type of artisan's tools: smith's tools, brewer's supplies, or mason's tools.
          </p>
          {backgroundGrants && (backgroundGrants.chosenTool || backgroundGrants.toolText || backgroundGrants.skills?.length > 0) && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-0.5" data-testid="dwarf-tool-bg-grants">
              <div className="font-medium text-foreground">
                From your background{backgroundGrants.name ? ` (${backgroundGrants.name})` : ''} — don't pick these twice:
              </div>
              {backgroundGrants.chosenTool
                ? <div>Tool: <span className="font-medium">{backgroundGrants.chosenTool}</span></div>
                : backgroundGrants.toolText && <div>Tools: {backgroundGrants.toolText}</div>}
              {backgroundGrants.skills?.length > 0 && <div>Skills: {backgroundGrants.skills.join(', ')}</div>}
            </div>
          )}
          <select
            data-testid="dwarf-tool-select"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={choices.dwarf_tool || '__none__'}
            onChange={e => onChange({ ...choices, dwarf_tool: e.target.value === '__none__' ? '' : e.target.value })}
          >
            <option value="__none__">Select a tool…</option>
            {DWARF_TOOL_OPTIONS.map(t => {
              const dup = t === bgChosenTool;
              return <option key={t} value={t} disabled={dup}>{t}{dup ? ' (already from background)' : ''}</option>;
            })}
          </select>
        </div>
      )}
    </div>
  );
}

function BackgroundChoicesSection({ bg, choices, onChange, knownLanguages = [], excludeTools = [] }) {
  if (!bg) return null;
  const spec = BACKGROUND_CHOICES_MAP[bg.name];
  if (!spec) return null;

  const toolOptions = {
    gaming_set:         GAMING_SETS,
    musical_instrument: MUSICAL_INSTRUMENTS_BG,
    artisans_tools:     ARTISANS_TOOLS_LIST,
  };
  const toolLabel = {
    gaming_set:         'Gaming Set',
    musical_instrument: 'Musical Instrument',
    artisans_tools:     "Artisan's Tools",
  };

  return (
    <div className="space-y-3 pt-3 border-t" data-testid="bg-choices-section">
      <p className="text-sm font-semibold text-muted-foreground">Background Choices</p>

      {spec.tool && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{toolLabel[spec.tool]} <span className="text-destructive">*</span></Label>
          <p className="text-xs text-muted-foreground">Choose which type you gain proficiency with.</p>
          <select
            data-testid="bg-tool-choice-select"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={choices.tool_choice || '__none__'}
            onChange={e => onChange({ ...choices, tool_choice: e.target.value === '__none__' ? '' : e.target.value })}
          >
            <option value="__none__">Select…</option>
            {toolOptions[spec.tool].map(o => {
              const dup = excludeTools.includes(o);
              return <option key={o} value={o} disabled={dup}>{o}{dup ? ' (already from race)' : ''}</option>;
            })}
          </select>
        </div>
      )}

      {spec.languages && Array.from({ length: spec.languages }).map((_, i) => {
        const otherSlots = (choices.language_choices ?? []).filter((v, idx) => idx !== i && v);
        const excluded   = [...knownLanguages, ...otherSlots];
        return (
          <div key={i} className="space-y-1.5">
            <Label className="text-sm font-medium">Language{spec.languages > 1 ? ` ${i + 1}` : ''} <span className="text-destructive">*</span></Label>
            <select
              data-testid={`bg-language-${i}-select`}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={choices.language_choices?.[i] || '__none__'}
              onChange={e => {
                const val  = e.target.value === '__none__' ? '' : e.target.value;
                const next = [...(choices.language_choices ?? [])];
                next[i]   = val;
                onChange({ ...choices, language_choices: next });
              }}
            >
              <option value="__none__">Select a language…</option>
              {STANDARD_LANGUAGES_LIST.filter(l => !excluded.includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        );
      })}
    </div>
  );
}

function AbilityScoreSection({ method, allowRerollOnes, scores, onChange, diceRolls, onDiceRollsChange, diceAssignment, onDiceAssignmentChange }) {
  if (method === 'point_buy') return <PointBuyAssignment scores={scores} onChange={onChange} />;
  if (method === 'roll') return (
    <DiceRollAssignment
      scores={scores}
      onChange={onChange}
      allowRerollOnes={allowRerollOnes}
      rolls={diceRolls}
      onRollsChange={onDiceRollsChange}
      assignment={diceAssignment}
      onAssignmentChange={onDiceAssignmentChange}
    />
  );
  return <StandardSpreadAssignment scores={scores} onChange={onChange} />;
}

function ProficienciesCard({ cls, chosenTools = [], raceWeapons = [], raceArmor = [] }) {
  const profs = CLASS_PROFICIENCIES_5E[cls];
  if (!profs) return null;
  const tools = [...new Set(chosenTools.filter(Boolean))];
  const weapons = [...new Set(raceWeapons.filter(Boolean))];
  const armor = [...new Set(raceArmor.filter(Boolean))];
  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold">Proficiencies</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Armor</div>
          <div>{profs.armor === 'None' ? <span className="text-muted-foreground italic">None</span> : profs.armor}</div>
          {armor.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-1" data-testid="race-armor-proficiencies">
              {armor.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}
            </div>
          )}
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weapons</div>
          <div>{profs.weapons}</div>
          {weapons.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-1" data-testid="race-weapon-proficiencies">
              {weapons.map(w => <Badge key={w} variant="secondary">{w}</Badge>)}
            </div>
          )}
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tools</div>
          {profs.tools && <div>{profs.tools}</div>}
          {tools.length > 0 ? (
            <div className="flex gap-1.5 flex-wrap mt-1" data-testid="chosen-tool-proficiencies">
              {tools.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          ) : (!profs.tools && <span className="text-muted-foreground italic">None</span>)}
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saving Throws</div>
          <div className="flex gap-1.5 flex-wrap">
            {profs.saving_throws.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CharacterCreate() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { campaign } = useCampaign();

  const [step, setStep] = useState('class'); // 'class' | 'class_overview' | 'identity' | 'details' | 'equipment' | 'overview'
  const [selectedClass, setSelectedClass] = useState('');
  // Starting-equipment mode is a GM campaign setting.
  const startingEquipmentMode = campaign?.starting_equipment ?? 'equipment';
  const hasEquipmentStep = startingEquipmentMode !== 'none';
  const [equipmentResult, setEquipmentResult] = useState({ inventory: [], bonusGold: 0 });
  const [classOverviewData, setClassOverviewData] = useState(null);
  const [classOverviewLoading, setClassOverviewLoading] = useState(false);

  const initialForm = (method) => {
    const base = method === 'point_buy' ? 8 : 10;
    return {
      name: '', race: '', background: '', alignment: '',
      strength: base, dexterity: base, constitution: base,
      intelligence: base, wisdom: base, charisma: base,
      notes: '',
    };
  };

  const [form, setForm] = useState(() => initialForm(campaign?.ability_score_method));
  const [classData, setClassData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Dice roll assignment state (lifted here so it survives step navigation)
  const [diceRolls, setDiceRolls] = useState([null, null, null, null, null, null]);
  const [diceAssignment, setDiceAssignment] = useState(EMPTY_DICE_ASSIGNMENT);

  // Identity step state
  const [apiRaces, setApiRaces] = useState([]);
  const [apiBackgrounds, setApiBackgrounds] = useState([]);
  const [apiFeats, setApiFeats] = useState([]);
  const [selectedRaceObj, setSelectedRaceObj] = useState(null);
  const [selectedSubraceObj, setSelectedSubraceObj] = useState(null);
  const [selectedBgObj, setSelectedBgObj] = useState(null);


  const EMPTY_RACE_CHOICES = { draconic_ancestry: null, high_elf_cantrip: '', high_elf_language: '', half_elf_asi_stats: [], half_elf_skills: [], half_elf_language: '', human_language: '', dwarf_tool: '', human_variant: false, human_variant_asi: [], human_variant_skill: '', human_feat: null, human_feat_ability: '', human_feat_prof: {}, human_feat_spell: null, human_feat_maneuvers: [] };
  const EMPTY_BG_CHOICES   = { tool_choice: '', language_choices: [] };
  const [raceChoices, setRaceChoices] = useState(EMPTY_RACE_CHOICES);
  const [bgChoices,   setBgChoices]   = useState(EMPTY_BG_CHOICES);

  // Fetch races + backgrounds + feats when entering identity step
  useEffect(() => {
    if (step !== 'identity') return;
    const ed = campaign?.edition === '5.5e' ? '5.5e' : '5e';
    const load = async () => {
      const [races, bgs, feats] = await Promise.all([
        referenceService.getRaces(campaignId),
        referenceService.getBackgrounds(campaignId),
        featService.getFeats(campaignId, ed),
      ]);
      if (races.length) setApiRaces(races.map(normalizeApiRace));
      if (bgs.length) setApiBackgrounds(bgs.map(normalizeApiBg));
      setApiFeats(feats);
    };
    load();
  }, [step, campaignId, campaign?.edition]);

  useEffect(() => {
    if ((campaign?.ability_score_method ?? 'standard_spread') === 'point_buy') {
      setForm(f => ({ ...f, strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 }));
    }
  }, [campaign?.ability_score_method]);

  // Each wizard step should start at the top of the screen, not wherever the previous step scrolled to.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  const edition = campaign?.edition || '5e';
  const is2024 = edition === '5.5e';
  const CLASSES = is2024 ? SUPPORTED_CLASSES_2024 : SUPPORTED_CLASSES_5E;
  const DESCRIPTIONS = is2024 ? CLASS_DESCRIPTIONS_2024 : CLASS_DESCRIPTIONS;
  const HIT_DICE = is2024 ? CLASS_HIT_DICE_2024 : CLASS_HIT_DICE;

  const ClassSheet = (is2024 ? {
    Barbarian: BarbarianSheet2024, Bard: BardSheet2024, Cleric: ClericSheet2024, Druid: DruidSheet2024,
    Fighter: FighterSheet2024, Monk: MonkSheet2024, Paladin: PaladinSheet2024, Ranger: RangerSheet2024,
    Rogue: RogueSheet2024, Sorcerer: SorcererSheet2024, Warlock: WarlockSheet2024, Wizard: WizardSheet2024,
  } : {
    Artificer: ArtificerSheet,
    Barbarian: BarbarianSheet, Bard: BardSheet, Cleric: ClericSheet, Druid: DruidSheet,
    Fighter: FighterSheet, Monk: MonkSheet, Paladin: PaladinSheet, Ranger: RangerSheet,
    Rogue: RogueSheet, Sorcerer: SorcererSheet, Warlock: WarlockSheet, Wizard: WizardSheet,
  })[selectedClass];

  // Races to display: API races if available, else hardcoded
  const baseRaces = apiRaces.length > 0 ? apiRaces : RACES_5E;

  // Backgrounds to display: hardcoded always + any extra API ones not in hardcoded list
  const extraApiBgs = apiBackgrounds.filter(b => !BACKGROUNDS_5E.find(h => h.name === b.name));
  const displayedBackgrounds = [...BACKGROUNDS_5E, ...extraApiBgs];

  // Background skills passed to class sheet in step 3
  const backgroundSkills = selectedBgObj?.skills ?? [];

  // Skill proficiencies granted by racial traits (Keen Senses → Perception,
  // Menacing → Intimidation). Passed to class sheet alongside backgroundSkills
  // and merged into the final character_data.skill_proficiencies on submit.
  const raceSkills = getRaceGrantedSkills(selectedRaceObj, selectedSubraceObj);
  const raceSkillSources = getRaceSkillSources(selectedRaceObj, selectedSubraceObj);
  // All skills the race grants the character — trait-based (Keen Senses, …) PLUS the Half-Elf
  // Skill Versatility picks. Passed to the class sheet so they show emerald + non-clickable, and
  // used by the de-dup prune so a class skill can't shadow one already granted by the race.
  const raceGrantedSkillsAll = [...new Set([
    ...raceSkills,
    ...(raceChoices.half_elf_skills ?? []),
    ...(raceChoices.human_variant_skill ? [raceChoices.human_variant_skill] : []),
  ])];

  // Fixed proficiencies granted by race/subrace traits (e.g. Rock Gnome "Tinker" → Tinker's tools,
  // Elf Weapon Training, Mountain Dwarf armor). Surfaced in the review Proficiencies card + saved.
  const raceTools = getRaceGrantedTools(selectedRaceObj, selectedSubraceObj);
  const raceWeapons = getRaceGrantedWeapons(selectedRaceObj, selectedSubraceObj);
  const raceArmor = getRaceGrantedArmor(selectedRaceObj, selectedSubraceObj);

  // Combined racial ASI (base race + subrace + Half-Elf chosen stats) — used in submit and previews
  const halfElfExtraAsi = (selectedRaceObj?.name === 'Half-Elf' && raceChoices.half_elf_asi_stats.length > 0)
    ? Object.fromEntries(raceChoices.half_elf_asi_stats.map(s => [s, 1]))
    : {};
  // Variant Human: +1 to two chosen scores REPLACES the standard Human "+1 to all" asiBonus.
  const isVariantHuman = selectedRaceObj?.name === 'Human' && raceChoices.human_variant;
  const humanVariantAsi = isVariantHuman
    ? Object.fromEntries((raceChoices.human_variant_asi ?? []).map(s => [s, 1]))
    : {};
  const baseRaceAsi = isVariantHuman ? null : selectedRaceObj?.asiBonus;
  // A Variant Human's level-1 feat may be a half-feat (fixed +1, e.g. Actor, or a choice,
  // e.g. Tavern Brawler/Resilient). Fold its ability bump into the racial ASI so it applies
  // to the final scores at submit. (humanFeatObj is reused below as selectedFeatObj.)
  const humanFeatObj = (isVariantHuman && raceChoices.human_feat)
    ? (apiFeats.find(f => f.id === raceChoices.human_feat.id) ?? null)
    : null;
  const humanFeatAbilityChoice = featAbilityChoices(humanFeatObj)[0] || null;
  // Skills the character is proficient in when the Variant Human feat is chosen (Identity step) —
  // the Expertise (Skill Expert) pool. Class skills are picked later (Features step) so they're not
  // available here; the player expertises a background/race/feat-granted skill (incl. the skill this
  // very feat grants — Skill Expert grants 1 skill then expertises one you're proficient in).
  const humanFeatOwnSkills = [
    ...((raceChoices.human_feat_prof?.skill) || []),
    ...((raceChoices.human_feat_prof?.skill_or_tool) || []).filter(s => FEAT_SKILL_NAME_SET.has(String(s).toLowerCase())),
  ];
  const humanProficientSkills = [...new Set([
    ...backgroundSkills, ...raceSkills,
    ...(raceChoices.half_elf_skills ?? []),
    ...(isVariantHuman && raceChoices.human_variant_skill ? [raceChoices.human_variant_skill] : []),
    ...humanFeatOwnSkills,
  ])];
  const humanFeatProfGrants = getFeatProficiencyChoices(humanFeatObj, { proficientSkills: humanProficientSkills });
  // The proficiencies the character already has from race/background/class choices at the Identity
  // step — passed to the feat proficiency picker (via availableFeatOptions) so a feat (Skilled,
  // Linguist, …) can't re-grant a skill / tool / language already chosen elsewhere (no double-dip).
  const featProfCharacterData = {
    skill_proficiencies: [...new Set([...backgroundSkills, ...raceGrantedSkillsAll])],
    race_languages: [
      ...(selectedRaceObj?.languages ?? []), ...(selectedSubraceObj?.languages ?? []),
      ...(raceChoices.high_elf_language ? [raceChoices.high_elf_language] : []),
      ...(raceChoices.human_language ? [raceChoices.human_language] : []),
      ...(raceChoices.half_elf_language ? [raceChoices.half_elf_language] : []),
    ],
    background_languages: (bgChoices.language_choices ?? []).filter(Boolean),
    race_tool_proficiency: raceChoices.dwarf_tool || null,
    race_tool_proficiencies: raceTools,
    background_tool_choice: bgChoices.tool_choice || null,
    tool_choice: classData.tool_choice || null,
  };
  // required = min(count, available) so a grant with no pickable options (e.g. Expertise with no
  // proficient skills assembled yet at creation) auto-completes instead of blocking Next.
  const humanFeatProfComplete = humanFeatProfGrants.every(
    g => (raceChoices.human_feat_prof?.[g.prof_type]?.length || 0) >= Math.min(g.count, availableFeatOptions(g, { charClass: selectedClass, characterData: featProfCharacterData }).length),
  );
  // Spell-grant spec (Magic Initiate) the chosen Variant Human feat asks the player to fulfil.
  const humanFeatSpellSpec = getSpellGrantSpecs(humanFeatObj)[0] || null;
  const humanFeatSpellComplete = !humanFeatSpellSpec || spellGrantComplete(humanFeatSpellSpec, raceChoices.human_feat_spell);
  // Maneuver-grant spec (Martial Adept) the chosen Variant Human feat asks the player to fulfil.
  const humanFeatManeuverSpec = getManeuverGrantSpec(humanFeatObj);
  const humanFeatManeuverComplete = maneuverGrantComplete(humanFeatManeuverSpec, raceChoices.human_feat_maneuvers);
  const humanFeatAsi = (() => {
    if (!humanFeatObj) return {};
    const out = {};
    featFixedAbilityScores(humanFeatObj).forEach(({ ability, amount }) => { out[ability] = (out[ability] || 0) + amount; });
    if (humanFeatAbilityChoice && raceChoices.human_feat_ability) {
      out[raceChoices.human_feat_ability] = (out[raceChoices.human_feat_ability] || 0) + humanFeatAbilityChoice.amount;
    }
    return out;
  })();
  const combinedRaceAsi = mergeAsi(baseRaceAsi, selectedSubraceObj?.asiBonus, halfElfExtraAsi, humanVariantAsi, humanFeatAsi);

  // Per-stat breakdown of where each ability bonus comes from, so the ability-score
  // previews can label e.g. a Variant Human's +1s ("Human") vs a half-feat's +1 ("Tavern Brawler").
  // The per-source amounts always sum to combinedRaceAsi[stat].
  const asiSourceMap = (() => {
    const map = {}; // stat -> [{ label, amount }]
    const add = (obj, label) => {
      if (!obj) return;
      Object.entries(obj).forEach(([stat, amount]) => {
        if (!amount) return;
        (map[stat] ||= []).push({ label, amount });
      });
    };
    if (isVariantHuman) {
      add(humanVariantAsi, 'Human');
      add(humanFeatAsi, humanFeatObj?.name || 'Feat');
    } else {
      add(baseRaceAsi, selectedRaceObj?.name || 'Race');
      add(selectedSubraceObj?.asiBonus, selectedSubraceObj?.name || 'Subrace');
      add(halfElfExtraAsi, 'Half-Elf');
    }
    return map;
  })();

  // Variant Human count-choice proficiency picks (Skilled/Linguist/Weapon Master). Skill picks
  // merge into the final skill_proficiencies set; languages/tools/weapons go to their own fields.
  const humanFeatProfPatch = (() => {
    let patch = {};
    if (!isVariantHuman) return patch;
    for (const g of humanFeatProfGrants) {
      patch = { ...patch, ...applyFeatProficiencyChoice(g.prof_type, raceChoices.human_feat_prof?.[g.prof_type] || [], patch) };
    }
    return patch;
  })();
  const { skill_proficiencies: humanFeatSkillPicks = [], ...humanFeatProfRest } = humanFeatProfPatch;

  // Skills the class picker must treat as already-granted (non-clickable) so a Variant Human's
  // feat skills (Skilled / Skill Expert) can't be double-dipped as class skill proficiencies.
  // Merged into the race-granted set passed to every class sheet (one place, no 24-sheet fan-out).
  const grantedSkillsForPicker = [...new Set([...raceGrantedSkillsAll, ...humanFeatSkillPicks])];

  // Spells the chosen Variant Human feat grants (Magic Initiate / Fey Touched / Ritual Caster /
  // …), resolved for the review display so the player sees every spell they picked.
  const humanFeatGrantedSpells = (isVariantHuman && humanFeatSpellSpec)
    ? getFeatGrantedSpells([{ name: humanFeatObj?.name, choices: { spell_grant: resolveSpellGrantValue(humanFeatSpellSpec, raceChoices.human_feat_spell) } }])
    : { cantrips: [], leveled: [], freeCasts: [], ritualBooks: [] };

  // Race/subrace passive HP bonuses (e.g. Hill Dwarf "Dwarven Toughness", Draconic Resilience)
  // folded into starting HP — mirrors the CharacterDetail Stats-tab MaxHpValue. Level is 1 at creation.
  // The Human race definition always carries the "Variant: +1 to Two…" marker trait; only keep it
  // when Variant Human was actually chosen, so Standard Human never shows (or stores) it and Variant
  // never shows the "+1 to All Stats" badge.
  const allRaceTraits = [
    ...(selectedRaceObj?.traits ?? []),
    ...(selectedSubraceObj?.traits ?? []),
  ].filter(t => isVariantHuman || !String(t).startsWith('Variant:'));
  // Passive HP bonuses (Dwarven Toughness, Draconic Resilience, AND the Tough feat) are
  // DISPLAY-ONLY — added on top of the stored hp_max to show effective HP, never written into
  // hp_max (combatBonuses.js invariant; the sheet's MaxHpValue re-adds them per level, so storing
  // them here would double-count). The Variant Human's level-1 feat is folded in so Tough's +2 shows.
  const creationFeats = (isVariantHuman && raceChoices.human_feat) ? [raceChoices.human_feat] : [];
  const creationHpBonus = totalHpBonus({
    charClass: selectedClass,
    subclass: classData?.subclass,
    raceTraits: allRaceTraits,
    feats: creationFeats,
    level: 1,
  });

  // Stored HP = hit die + CON only (floored at 1) — matches the LevelUpWizard. The effective
  // starting HP shown to the player (review + features-step preview) adds the passive bonus.
  const creationHitDie = (is2024 ? HIT_DICE_2024 : HIT_DICE_5E)[selectedClass] ?? 8;
  const creationConMod = Math.floor(((form.constitution + (combinedRaceAsi.constitution ?? 0)) - 10) / 2);
  const creationBaseHp = Math.max(1, creationHitDie + Math.max(0, creationConMod));
  const creationStartingHp = creationBaseHp + creationHpBonus;
  // HP breakdown shown under the value, e.g. "d10 + 1 + 2".
  const creationHpFormula = `d${creationHitDie}`
    + (creationConMod > 0 ? ` + ${creationConMod} CON` : '')
    + (creationHpBonus > 0 ? ` + ${creationHpBonus} bonus` : '');

  // Base walking speed = race speed + any subrace bonus (e.g. Wood Elf "Fleet of Foot" +5 → 35).
  const creationSpeed = (selectedRaceObj?.speed ?? 30) + (selectedSubraceObj?.speedBonus ?? 0);

  // Starting wealth comes from the chosen background (5e: a pouch of gp in its equipment).
  const startingGold = startingGoldForBackground(selectedBgObj?.name);

  const raceGrantedCantrips = [
    ...(raceChoices.high_elf_cantrip ? [raceChoices.high_elf_cantrip] : []),
    ...(selectedSubraceObj?.name && SUBRACE_GRANTED_CANTRIPS[selectedSubraceObj.name]
      ? [SUBRACE_GRANTED_CANTRIPS[selectedSubraceObj.name]] : []),
    ...(selectedRaceObj?.name && RACE_GRANTED_CANTRIPS_MAP[selectedRaceObj.name]
      ? [RACE_GRANTED_CANTRIPS_MAP[selectedRaceObj.name]] : []),
  ];

  // Targeted, non-destructive de-dup: when the race/subrace/background (or High Elf cantrip)
  // changes, drop any skill or cantrip those sources now GRANT from the manual class picks, so a
  // proficiency is never represented twice (a stuck manual pick + an emerald/violet grant). Other
  // class choices (fighting style, spells, ability scores) are left untouched. Switching CLASS
  // already resets classData entirely in handleClassSelect, so it needs no handling here.
  useEffect(() => {
    const grantedSkills = new Set([...grantedSkillsForPicker, ...backgroundSkills]);
    const grantedCantrips = new Set(raceGrantedCantrips);
    setClassData(prev => {
      const curSkills = prev.skill_proficiencies ?? [];
      const curCantrips = prev.cantrips ?? [];
      const nextSkills = curSkills.filter(s => !grantedSkills.has(s));
      const nextCantrips = curCantrips.filter(c => !grantedCantrips.has(c));
      if (nextSkills.length === curSkills.length && nextCantrips.length === curCantrips.length) return prev;
      return { ...prev, skill_proficiencies: nextSkills, cantrips: nextCantrips };
    });
    // Keyed on the grant *sources* (stable primitives), not the derived arrays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRaceObj?.name, selectedSubraceObj?.name, selectedBgObj?.name, raceChoices.high_elf_cantrip, (raceChoices.half_elf_skills ?? []).join('|'), raceChoices.human_variant_skill, humanFeatSkillPicks.join('|')]);

  const handleClassSelect = async (cls) => {
    setSelectedClass(cls);
    setClassData({});
    setForm(initialForm(campaign?.ability_score_method));
    setSelectedRaceObj(null);
    setSelectedSubraceObj(null);
    setSelectedBgObj(null);
    setDiceRolls([null, null, null, null, null, null]);
    setDiceAssignment(EMPTY_DICE_ASSIGNMENT);
    setRaceChoices(EMPTY_RACE_CHOICES);
    setBgChoices(EMPTY_BG_CHOICES);
    setClassOverviewData(null);
    setClassOverviewLoading(true);
    setStep('class_overview');
    const edition = campaign?.edition === '5.5e' ? '5.5e' : '5e';
    const data = await classService.getClassByName(cls, edition, campaign?.id);
    setClassOverviewData(data);
    setClassOverviewLoading(false);
  };

  const handleRaceSelect = (race) => {
    setSelectedRaceObj(race);
    setSelectedSubraceObj(null);
    setForm(f => ({ ...f, race: race.name }));
    setRaceChoices(EMPTY_RACE_CHOICES);
  };

  const handleSubraceSelect = (subrace) => {
    setSelectedSubraceObj(subrace);
    // Clear subrace-specific choices when switching subraces
    setRaceChoices(prev => ({ ...prev, high_elf_cantrip: '', high_elf_language: '' }));
  };

  const handleBgSelect = (bg) => {
    if (selectedBgObj?.name === bg.name) {
      setSelectedBgObj(null);
      setForm(f => ({ ...f, background: '' }));
      setBgChoices(EMPTY_BG_CHOICES);
    } else {
      setSelectedBgObj(bg);
      setForm(f => ({ ...f, background: bg.name }));
      setBgChoices(EMPTY_BG_CHOICES);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    // Apply racial ASIs (base race + subrace) to player-assigned scores
    const finalScores = {
      strength:     form.strength     + (combinedRaceAsi.strength     ?? 0),
      dexterity:    form.dexterity    + (combinedRaceAsi.dexterity    ?? 0),
      constitution: form.constitution + (combinedRaceAsi.constitution ?? 0),
      intelligence: form.intelligence + (combinedRaceAsi.intelligence ?? 0),
      wisdom:       form.wisdom       + (combinedRaceAsi.wisdom       ?? 0),
      charisma:     form.charisma     + (combinedRaceAsi.charisma     ?? 0),
    };

    // Store die+CON only — passive bonuses (race trait / subclass / Tough feat) are display-only
    // and re-added by the sheet's MaxHpValue, so storing creationStartingHp would double-count.
    const hp_max = creationBaseHp;

    const allRaceLanguages = [
      ...(selectedRaceObj?.languages ?? []),
      ...(selectedSubraceObj?.languages ?? []),
      ...(raceChoices.high_elf_language ? [raceChoices.high_elf_language] : []),
      ...(raceChoices.half_elf_language ? [raceChoices.half_elf_language] : []),
      ...(raceChoices.human_language ? [raceChoices.human_language] : []),
    ];
    const bgLanguages = (bgChoices.language_choices ?? []).filter(Boolean);

    const result = await characterService.createCharacter({
      ...form,
      ...finalScores,
      level: 1,
      char_class: selectedClass,
      campaign_id: parseInt(campaignId),
      character_data: {
        ...classData,
        hp_max,
        speed: creationSpeed,
        skill_proficiencies: [...new Set([
          ...(classData.skill_proficiencies ?? []),
          ...backgroundSkills,
          ...raceSkills,
          ...(raceChoices.half_elf_skills ?? []),
          ...(isVariantHuman && raceChoices.human_variant_skill ? [raceChoices.human_variant_skill] : []),
          ...humanFeatSkillPicks, // Skilled (skill_or_tool) skill picks
        ])],
        ...humanFeatProfRest, // feat_languages / feat_tool_proficiencies / feat_weapon_proficiencies (Variant Human)
        // Starting wealth + equipment per the campaign's starting_equipment setting:
        //   none → empty wallet + empty inventory; otherwise background gold (+ class
        //   gold if the player swapped equipment for gold) and the resolved inventory.
        currency: startingEquipmentMode === 'none'
          ? { ...EMPTY_WALLET }
          : { ...EMPTY_WALLET, gp: startingGold + (equipmentResult.bonusGold || 0) },
        inventory: startingEquipmentMode === 'none' ? [] : (equipmentResult.inventory || []),
        subrace: selectedSubraceObj?.name ?? null,
        size: selectedRaceObj?.size ?? 'Medium',
        race_traits: allRaceTraits,
        race_languages: allRaceLanguages,
        draconic_ancestry: raceChoices.draconic_ancestry ?? null,
        high_elf_cantrip: raceChoices.high_elf_cantrip || null,
        race_tool_proficiency: raceChoices.dwarf_tool || null,
        ...(raceTools.length ? { race_tool_proficiencies: raceTools } : {}),
        ...(raceWeapons.length ? { race_weapon_proficiencies: raceWeapons } : {}),
        ...(raceArmor.length ? { race_armor_proficiencies: raceArmor } : {}),
        background_tool_choice: bgChoices.tool_choice || null,
        ...(bgLanguages.length > 0 ? { background_languages: bgLanguages } : {}),
        ...(isVariantHuman ? {
          human_variant: true,
          // Variant Human's free feat is gained at level 1; every other feat is gained at
          // the ASI level it was chosen (LevelUpWizard tags those). Record the level, snapshot
          // the feat's structured effects, and store any half-feat ability choice (its +1 is
          // already folded into the scores via humanFeatAsi/combinedRaceAsi).
          feats: raceChoices.human_feat ? [{
            ...raceChoices.human_feat,
            level: 1,
            ...(humanFeatObj?.effects ? { effects: humanFeatObj.effects } : {}),
            ...(() => {
              // Record the feat's ability + skill + spell-grant picks so the sheet/Stats panel can attribute them.
              const c = {
                ...(humanFeatAbilityChoice && raceChoices.human_feat_ability ? { ability: raceChoices.human_feat_ability } : {}),
                ...(humanFeatSkillPicks.length ? { skills: humanFeatSkillPicks } : {}),
                ...(humanFeatSpellSpec ? { spell_grant: resolveSpellGrantValue(humanFeatSpellSpec, raceChoices.human_feat_spell) } : {}),
                ...(humanFeatManeuverSpec ? { maneuvers: raceChoices.human_feat_maneuvers || [] } : {}),
              };
              return Object.keys(c).length ? { choices: c } : {};
            })(),
          }] : [],
        } : {}),
      },
    });

    if (result.success) {
      navigate(`/campaigns/${campaignId}/characters/${result.data.id}`);
    } else {
      setError(result.error);
      setSaving(false);
    }
  };

  const totalSteps = hasEquipmentStep ? 6 : 5;
  const stepNum = step === 'class' ? 1
    : step === 'class_overview' ? 2
    : step === 'identity' ? 3
    : step === 'details' ? 4
    : step === 'equipment' ? 5
    : totalSteps;

  const handleBack = () => {
    if (step === 'overview') { setStep(hasEquipmentStep ? 'equipment' : 'details'); return; }
    if (step === 'equipment') { setStep('details'); return; }
    if (step === 'details') { setStep('identity'); return; }
    if (step === 'identity') { setStep('class_overview'); return; }
    if (step === 'class_overview') { setStep('class'); return; }
    navigate(`/campaigns/${campaignId}/characters`);
  };

  const headerTitle = step === 'class'
    ? 'Choose Your Class'
    : `Create ${selectedClass}`;

  const headerSub = step === 'class'
    ? `${campaign?.edition?.toUpperCase() ?? '5E'} · Select a class to continue`
    : step === 'class_overview'
    ? `Step 2 of ${totalSteps} — Class Overview`
    : step === 'identity'
    ? `Step 3 of ${totalSteps} — Race, Background & Identity`
    : step === 'details'
    ? `Step 4 of ${totalSteps} — Class Features & Ability Scores`
    : step === 'equipment'
    ? `Step 5 of ${totalSteps} — Starting Equipment`
    : `Step ${totalSteps} of ${totalSteps} — Review & Create`;

  // Next is blocked when name is missing, subrace not chosen, or required race/background choices incomplete
  const bgSpec = selectedBgObj ? BACKGROUND_CHOICES_MAP[selectedBgObj.name] : null;
  const bgLanguagesChosen = (bgChoices.language_choices ?? []).filter(Boolean).length;

  // Skill overlap between background and race. Player-chosen Half-Elf versatility picks that
  // duplicate a background skill BLOCK progression (the player can simply pick something else);
  // automatic trait grants (Keen Senses, Menacing) that overlap a background skill only WARN
  // (the player can't deselect a trait, so we let them continue but flag the wasted overlap).
  const bgSkillSet = selectedBgObj?.skills ?? [];
  const halfElfSkillDoubles = (raceChoices.half_elf_skills ?? []).filter(s => bgSkillSet.includes(s));
  const traitSkillOverlap = raceSkills.filter(s => bgSkillSet.includes(s));

  // ── Feat prerequisite gating (Variant Human picks a feat at creation) ──────
  // The chosen feat may carry a prerequisite (ability score, spellcasting, armor
  // proficiency, level). We evaluate it twice: an "identity" context (class/level/
  // armor/spell — known as soon as the class is picked) gates Identity → Features,
  // and a "features" context (adds the assigned ability scores) gates Features →
  // Review. Unparseable prerequisites are ignored (fail-open).
  const selectedFeatObj = humanFeatObj; // computed above (with effects), reused for prereq gating

  // Can this class cast a spell at level 1? Casters have a spellcasting_ability;
  // the 5e Paladin is the lone exception (no spells until level 2).
  const KNOWN_CASTERS = new Set(['Artificer', 'Bard', 'Cleric', 'Druid', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']);
  const featSpellcaster = classOverviewData
    ? (!!classOverviewData.spellcasting_ability && !(selectedClass === 'Paladin' && edition === '5e'))
    : (KNOWN_CASTERS.has(selectedClass) || (selectedClass === 'Paladin' && is2024));

  // Armor proficiency categories from the class table + any race-granted armor.
  const featArmorProfs = (() => {
    const cats = new Set();
    const classArmor = (CLASS_PROFICIENCIES_5E[selectedClass]?.armor || '').toLowerCase();
    if (classArmor.includes('all armor')) ['light', 'medium', 'heavy'].forEach(c => cats.add(c));
    ['light', 'medium', 'heavy'].forEach(c => { if (classArmor.includes(c)) cats.add(c); });
    raceArmor.forEach(a => ['light', 'medium', 'heavy'].forEach(c => { if (String(a).toLowerCase().includes(c)) cats.add(c); }));
    return [...cats];
  })();

  const featPrereqIdentity = selectedFeatObj
    ? checkFeatPrerequisite(selectedFeatObj, {
        level: 1, className: selectedClass,
        scores: null, abilityScoresKnown: false,
        spellcaster: featSpellcaster, armorProficiencies: featArmorProfs,
      })
    : { met: true, unmet: [] };

  // Lock feats in the Variant Human picker whose prerequisites can't be met (mirrors the
  // LevelUpWizard feat step). Uses the identity context — class/level/armor/spellcasting are
  // knowable here; ability-score prerequisites are NOT (scores aren't assigned yet), so feats
  // gated only on a score stay selectable and are caught by the Features-step note instead.
  // The simple/martial weapon proficiencies the class confers — drives the redundancy lock for
  // Weapon Master (needs all) and Martial Weapon Training (needs martial).
  const featClassWeapons = (CLASS_PROFICIENCIES_5E[selectedClass]?.weapons || '').toLowerCase();
  const featWeaponProfs = { simple: featClassWeapons.includes('simple'), martial: featClassWeapons.includes('martial') };

  const featDisabledReason = (f) => {
    const { met, unmet } = checkFeatPrerequisite(f, {
      level: 1, className: selectedClass,
      scores: null, abilityScoresKnown: false,
      spellcaster: featSpellcaster, armorProficiencies: featArmorProfs,
    });
    if (!met) return unmet.map(u => u.reason).join('; ');
    // Prereq met — but a half-feat whose proficiency the character already has is a trap pick.
    return featGrantRedundant(f, { armorProficiencies: featArmorProfs, weapons: featWeaponProfs });
  };

  const identityNextBlocked = !form.name.trim() ||
    (selectedRaceObj?.subraces?.length > 0 && !selectedSubraceObj) ||
    (selectedRaceObj?.name === 'Dragonborn' && !raceChoices.draconic_ancestry) ||
    (selectedSubraceObj?.name === 'High Elf' && !raceChoices.high_elf_cantrip) ||
    (selectedRaceObj?.name === 'Half-Elf' && raceChoices.half_elf_asi_stats.length < 2) ||
    (selectedRaceObj?.name === 'Half-Elf' && raceChoices.half_elf_skills.length < 2) ||
    (isVariantHuman && (raceChoices.human_variant_asi.length < 2 || !raceChoices.human_variant_skill || !raceChoices.human_feat)) ||
    (isVariantHuman && humanFeatAbilityChoice && !raceChoices.human_feat_ability) ||
    (isVariantHuman && !humanFeatProfComplete) ||
    (isVariantHuman && !humanFeatSpellComplete) ||
    (isVariantHuman && !humanFeatManeuverComplete) ||
    (selectedRaceObj?.name === 'Dwarf' && !raceChoices.dwarf_tool) ||
    (!!bgSpec?.tool && !bgChoices.tool_choice) ||
    (!!bgSpec?.languages && bgLanguagesChosen < bgSpec.languages) ||
    halfElfSkillDoubles.length > 0 ||
    !featPrereqIdentity.met;

  // Ability scores are complete when all 6 values are fully assigned per the campaign method
  const abilityScoresReady = (() => {
    const method = campaign?.ability_score_method ?? 'standard_spread';
    if (method === 'standard_spread') {
      const vals = SCORE_KEYS.map(k => form[k]).sort((a, b) => a - b);
      const spread = [...STANDARD_SPREAD_VALUES].sort((a, b) => a - b);
      return vals.join(',') === spread.join(',');
    }
    if (method === 'point_buy') {
      const spent = SCORE_KEYS.reduce((sum, k) => {
        const s = form[k];
        return (s >= 8 && s <= 15) ? sum + POINT_BUY_COSTS[s - 8] : sum;
      }, 0);
      return spent === POINT_BUY_TOTAL;
    }
    // roll: all 6 slots rolled and all 6 stats assigned
    return diceRolls.every(r => r !== null) && SCORE_KEYS.every(k => diceAssignment[k] !== null);
  })();

  const skillsRequired = CLASS_SKILL_REQUIRED[selectedClass] ?? 0;
  const skillsChosen = (classData.skill_proficiencies ?? []).length;
  const skillsReady = skillsChosen >= skillsRequired;
  const skillsNeeded = skillsRequired - skillsChosen;

  // Discrete class choices that must be made at level 1 before leaving the Features step — a
  // character must never be created with a required pick (Fighting Style, an L1 subclass like the
  // Cleric's Divine Domain / Sorcerer Origin / Warlock Patron, etc.) left unset. Driven by the
  // class config (lockedChoices + subclass) for migrated classes, falling back to the subclass
  // unlock-level map for the rest. (creation level is always 1.)
  const classConfig = getClassConfig(selectedClass, edition);
  const subclassUnlock = classConfig?.subclass?.unlockLevel
    ?? (is2024 ? SUBCLASS_UNLOCK_LEVEL_2024 : SUBCLASS_UNLOCK_LEVEL_5E)[selectedClass];
  const missingClassChoices = [];
  if (subclassUnlock != null && subclassUnlock <= 1 && !classData.subclass) {
    missingClassChoices.push(classConfig?.subclass?.label ?? 'Subclass');
  }
  (classConfig?.lockedChoices ?? []).forEach(lc => {
    if ((lc.minLevel ?? 1) <= 1 && !classData[lc.key]) missingClassChoices.push(lc.label);
  });
  const classChoicesReady = missingClassChoices.length === 0;

  // Features-step feat-prerequisite check: now that ability scores are assigned,
  // re-evaluate the chosen feat's prerequisites including the final scores. This
  // gates Features → Review (ability-score prerequisites can only be checked here).
  const featFinalScores = {
    strength:     form.strength     + (combinedRaceAsi.strength     ?? 0),
    dexterity:    form.dexterity    + (combinedRaceAsi.dexterity    ?? 0),
    constitution: form.constitution + (combinedRaceAsi.constitution ?? 0),
    intelligence: form.intelligence + (combinedRaceAsi.intelligence ?? 0),
    wisdom:       form.wisdom       + (combinedRaceAsi.wisdom       ?? 0),
    charisma:     form.charisma     + (combinedRaceAsi.charisma     ?? 0),
  };
  const featPrereqFeatures = selectedFeatObj
    ? checkFeatPrerequisite(selectedFeatObj, {
        level: 1, className: selectedClass,
        scores: featFinalScores, abilityScoresKnown: abilityScoresReady,
        spellcaster: featSpellcaster, armorProficiencies: featArmorProfs,
      })
    : { met: true, unmet: [] };
  const featPrereqReady = featPrereqFeatures.met;

  return (
    <MainLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 rounded hover:bg-muted" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{headerTitle}</h1>
            <p className="text-sm text-muted-foreground">{headerSub}</p>
          </div>
        </div>

        {/* Step indicator */}
        {step !== 'class' && (
          <StepIndicator
            current={stepNum}
            steps={hasEquipmentStep
              ? ['Class', 'Overview', 'Identity', 'Features', 'Equipment', 'Review']
              : ['Class', 'Overview', 'Identity', 'Features', 'Review']}
          />
        )}

        {/* ── Step 1: Class picker ─────────────────────────────────────────── */}
        {step === 'class' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CLASSES.map(cls => (
              <button
                key={cls}
                onClick={() => handleClassSelect(cls)}
                className={cn('rounded-lg border-2 p-5 text-left transition-all hover:shadow-md', CLASS_COLORS[cls])}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('font-extrabold text-xl', CLASS_ACCENT[cls])}>{cls}</span>
                  <span className={cn('text-sm font-semibold', CLASS_ACCENT[cls])}>{HIT_DICE[cls]}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{DESCRIPTIONS[cls]}</p>
                <div className={cn('mt-3 flex items-center text-sm font-semibold', CLASS_ACCENT[cls])}>
                  Select <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Class Overview ──────────────────────────────────────── */}
        {step === 'class_overview' && (
          <div className="space-y-4">
            <ClassOverview classData={classOverviewData} loading={classOverviewLoading} />
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="button" onClick={() => setStep('identity')} data-testid="overview-next">
                Continue to Identity <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Identity ─────────────────────────────────────────────── */}
        {step === 'identity' && (
          <div className="space-y-6">
            {/* Character Name */}
            <section className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="font-semibold">Character Name <span className="text-destructive">*</span></h2>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Enter a name…"
                autoFocus
              />
            </section>

            {/* Race / Species */}
            <section className="rounded-lg border bg-card p-4 space-y-4">
              <div>
                <h2 className="font-semibold">Race / Species</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Click a race to learn more</p>
              </div>

              {/* Race card grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {baseRaces.map(race => (
                  <RaceCard
                    key={race.name}
                    race={race}
                    selected={selectedRaceObj?.name === race.name}
                    onSelect={handleRaceSelect}
                  />
                ))}
              </div>

              {/* Selected race detail */}
              {selectedRaceObj && (
                <>
                  <RaceDetail race={selectedRaceObj} />
                  {/* Skill proficiencies granted by race traits (e.g. Keen Senses → Perception) */}
                  {raceSkillSources.length > 0 && (
                    <div
                      data-testid="race-skill-grants"
                      className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-900/30 dark:border-emerald-700"
                    >
                      <div className="font-medium text-emerald-900 dark:text-emerald-200 mb-1">
                        Skill Proficiencies from Race
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {raceSkillSources.map(({ skill, trait }) => (
                          <Badge
                            key={`${skill}-${trait}`}
                            variant="outline"
                            className="border-emerald-400 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-600"
                          >
                            {skill} <span className="opacity-70 ml-1">(from {trait})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Subrace picker — shown only when the selected race has subraces */}
              {selectedRaceObj?.subraces?.length > 0 && (
                <div className="space-y-3 pt-2 border-t" data-testid="subrace-section">
                  <div>
                    <Label className="font-semibold text-sm">
                      Subrace <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose your {selectedRaceObj.name} subrace to continue
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedRaceObj.subraces.map(sr => (
                      <SubraceCard
                        key={sr.name}
                        subrace={sr}
                        selected={selectedSubraceObj?.name === sr.name}
                        onSelect={handleSubraceSelect}
                      />
                    ))}
                  </div>
                  {selectedSubraceObj && <SubraceDetail subrace={selectedSubraceObj} />}
                </div>
              )}

              {/* Race-specific choices (cantrip, ancestry, Half-Elf ASI/skills) */}
              <RaceChoicesSection
                race={selectedRaceObj}
                subrace={selectedSubraceObj}
                choices={raceChoices}
                onChange={setRaceChoices}
                knownLanguages={[
                  ...(selectedRaceObj?.languages ?? []),
                  ...(selectedSubraceObj?.languages ?? []),
                ]}
                backgroundGrants={selectedBgObj ? {
                  name: selectedBgObj.name,
                  toolText: selectedBgObj.tools || '',
                  chosenTool: bgChoices.tool_choice || '',
                  skills: selectedBgObj.skills ?? [],
                } : null}
                backgroundSkills={selectedBgObj?.skills ?? []}
                feats={apiFeats}
                featDisabledReason={featDisabledReason}
                proficientSkills={humanProficientSkills}
                featProfCharacterData={featProfCharacterData}
                charClass={selectedClass}
                campaignId={campaignId}
                edition={edition}
              />


            </section>

            {/* Background */}
            <section className="rounded-lg border bg-card p-4 space-y-4">
              <div>
                <h2 className="font-semibold">Background</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Click a background to see full details — click again to deselect</p>
              </div>

              {/* Selected background detail + its choices — shown above the grid so they're
                  visible without scrolling past every card */}
              {selectedBgObj && <BgDetail bg={selectedBgObj} />}
              {selectedBgObj && (
                <BackgroundChoicesSection
                  bg={selectedBgObj}
                  choices={bgChoices}
                  onChange={setBgChoices}
                  knownLanguages={[
                    ...(selectedRaceObj?.languages ?? []),
                    ...(selectedSubraceObj?.languages ?? []),
                    ...(raceChoices.high_elf_language ? [raceChoices.high_elf_language] : []),
                    ...(raceChoices.half_elf_language ? [raceChoices.half_elf_language] : []),
                    ...(raceChoices.human_language ? [raceChoices.human_language] : []),
                  ]}
                  excludeTools={raceChoices.dwarf_tool ? [raceChoices.dwarf_tool] : []}
                />
              )}

              {/* Background card grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {displayedBackgrounds.map(bg => (
                  <BgCard
                    key={bg.name}
                    bg={bg}
                    selected={selectedBgObj?.name === bg.name}
                    onSelect={handleBgSelect}
                  />
                ))}
              </div>
            </section>

            {/* Alignment */}
            {campaign?.use_alignment !== false && (
              <section className="rounded-lg border bg-card p-4 space-y-3">
                <h2 className="font-semibold">Alignment</h2>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.alignment}
                  onChange={e => setForm(f => ({ ...f, alignment: e.target.value }))}
                >
                  <option value="">Select alignment…</option>
                  {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </section>
            )}

            {/* Skill-overlap notices */}
            {halfElfSkillDoubles.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm" data-testid="skill-double-error">
                {halfElfSkillDoubles.join(' and ')} {halfElfSkillDoubles.length > 1 ? 'are' : 'is'} granted by your background
                — pick {halfElfSkillDoubles.length > 1 ? 'different Half-Elf skills' : 'a different Half-Elf skill'} so you don't double up.
              </div>
            )}
            {halfElfSkillDoubles.length === 0 && traitSkillOverlap.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 px-3 py-2 text-sm" data-testid="skill-overlap-warning">
                Heads up: your race already grants {traitSkillOverlap.join(' and ')} and so does your background.
                You can continue, but you won't get a replacement skill for the overlap.
              </div>
            )}

            {/* Feat prerequisite note (class/level/armor/spell — known at this step) */}
            {!featPrereqIdentity.met && (
              <div
                className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                data-testid="feat-prereq-identity-note"
              >
                <span className="font-medium">{selectedFeatObj?.name}</span> {featPrereqIdentity.unmet.map(u => u.reason).join('; ')}. Choose a different feat or change your class.
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={handleBack} data-testid="identity-back">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep('details')}
                disabled={identityNextBlocked}
                data-testid="identity-next"
              >
                Next: Class Features <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Class features + ability scores ──────────────────────── */}
        {step === 'details' && (
          <div className="space-y-6">

            {/* Selected identity summary */}
            <section className="rounded-lg border bg-muted/30 p-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span><span className="text-muted-foreground">Name: </span><span className="font-medium">{form.name}</span></span>
                {form.race && <span><span className="text-muted-foreground">Race: </span><span className="font-medium">{form.race}</span></span>}
                {selectedSubraceObj && <span><span className="text-muted-foreground">Subrace: </span><span className="font-medium">{selectedSubraceObj.name}</span></span>}
                {form.background && <span><span className="text-muted-foreground">Background: </span><span className="font-medium">{form.background}</span></span>}
                {form.alignment && <span><span className="text-muted-foreground">Alignment: </span><span className="font-medium">{form.alignment}</span></span>}
                <button
                  type="button"
                  className="text-primary text-xs underline underline-offset-2"
                  onClick={() => setStep('identity')}
                >
                  Edit
                </button>
              </div>
            </section>

            {/* Class proficiencies */}
            <ProficienciesCard cls={selectedClass} chosenTools={[raceChoices.dwarf_tool, ...raceTools, ...backgroundFixedTools(selectedBgObj), bgChoices.tool_choice, classData.tool_choice]} raceWeapons={raceWeapons} raceArmor={raceArmor} />

            {/* Monk-specific: choose one artisan's tool or one musical instrument */}
            {selectedClass === 'Monk' && (
              <section className="rounded-lg border bg-card p-4 space-y-3">
                <h2 className="font-semibold">Tool Proficiency</h2>
                <p className="text-sm text-muted-foreground">
                  Monks gain proficiency with one type of artisan's tools <em>or</em> one musical instrument of their choice.
                </p>
                <select
                  data-testid="monk-tool-choice-select"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={classData.tool_choice || '__none__'}
                  onChange={e => setClassData(prev => ({ ...prev, tool_choice: e.target.value === '__none__' ? '' : e.target.value }))}
                >
                  <option value="__none__">Select a tool or instrument… (optional)</option>
                  <optgroup label="Artisan's Tools">
                    {ARTISANS_TOOLS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="Musical Instruments">
                    {MUSICAL_INSTRUMENTS_BG.map(i => <option key={i} value={i}>{i}</option>)}
                  </optgroup>
                </select>
              </section>
            )}

            {/* Ability scores */}
            <section className="rounded-lg border bg-card p-4 space-y-4">
              <h2 className="font-semibold">Ability Scores</h2>

              <AbilityScoreSection
                method={campaign?.ability_score_method ?? 'standard_spread'}
                allowRerollOnes={campaign?.allow_reroll_ones ?? false}
                scores={{
                  strength: form.strength, dexterity: form.dexterity, constitution: form.constitution,
                  intelligence: form.intelligence, wisdom: form.wisdom, charisma: form.charisma,
                }}
                onChange={updated => setForm(f => ({ ...f, ...updated }))}
                diceRolls={diceRolls}
                onDiceRollsChange={setDiceRolls}
                diceAssignment={diceAssignment}
                onDiceAssignmentChange={setDiceAssignment}
              />

              {/* Racial ASI totals — shown when a race with bonuses is selected */}
              {(Object.keys(combinedRaceAsi).length > 0 || selectedRaceObj?.asiNote) && (
                <div className="rounded-md bg-muted/40 border text-sm px-3 py-2 space-y-2">
                  {Object.keys(combinedRaceAsi).length > 0 && (
                    <>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Final scores with racial bonuses
                        {selectedRaceObj?.name && (
                          <span className="normal-case ml-1 font-normal">
                            ({selectedRaceObj.name}{selectedSubraceObj ? ` · ${selectedSubraceObj.name}` : ''})
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                        {Object.entries(combinedRaceAsi).map(([stat, bonus]) => {
                          const base = form[stat] ?? 0;
                          const total = base + bonus;
                          const totalMod = Math.floor((total - 10) / 2);
                          const totalModStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
                          const sources = asiSourceMap[stat] ?? [{ label: '', amount: bonus }];
                          return (
                            <div key={stat} className="flex items-center flex-wrap gap-1.5 text-xs">
                              <span className="w-7 font-medium text-muted-foreground uppercase">{STAT_ABBREV[stat]}</span>
                              <span className="text-muted-foreground">{base}</span>
                              {sources.map((s, i) => (
                                <span key={i} className="text-green-600 dark:text-green-400 font-medium" data-testid={`asi-source-${stat}-${i}`}>
                                  +{s.amount}
                                  {s.label && <span className="font-normal text-muted-foreground"> {s.label}</span>}
                                </span>
                              ))}
                              <span className="text-foreground">= </span>
                              <span data-testid={`racial-asi-preview-${stat}`} className="font-bold text-foreground">{total}</span>
                              <span className="text-muted-foreground">({totalModStr})</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {selectedRaceObj?.asiNote && (
                    <div className="text-xs text-amber-600 dark:text-amber-400">{selectedRaceObj.asiNote}</div>
                  )}
                </div>
              )}
              {/* Hidden testid anchor for tests that check any racial ASI exists */}
              {Object.keys(combinedRaceAsi).length > 0 && (
                <span data-testid="racial-asi-preview" className="sr-only">{formatAsiBonus(combinedRaceAsi)}</span>
              )}
            </section>

            {/* Class-specific sheet */}
            {ClassSheet && (
              <section className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{selectedClass} Features</h2>
                  <div className="text-sm text-muted-foreground">
                    Starting HP: <span className="font-bold text-foreground">{creationStartingHp}</span>
                    <span className="ml-1 text-xs">({creationHpFormula})</span>
                  </div>
                </div>
                <ClassSheet
                  data={classData}
                  onChange={patch => setClassData(prev => ({ ...prev, ...patch }))}
                  readOnly={false}
                  level={1}
                  creation={true}
                  scores={form}
                  backgroundSkills={backgroundSkills}
                  raceSkills={grantedSkillsForPicker}
                  raceGrantedCantrips={raceGrantedCantrips}
                />
              </section>
            )}

            {/* Notes */}
            <section className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="font-semibold">Personal Notes</h2>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Personal notes…"
                rows={4}
              />
            </section>

            {/* Actions */}
            <div className="space-y-2">
              {!abilityScoresReady && (
                <p className="text-xs text-muted-foreground text-right">
                  Complete ability score assignment to continue.
                </p>
              )}
              {abilityScoresReady && !skillsReady && (
                <p className="text-xs text-muted-foreground text-right">
                  Select {skillsNeeded} more skill{skillsNeeded !== 1 ? 's' : ''} to continue.
                </p>
              )}
              {abilityScoresReady && skillsReady && !classChoicesReady && (
                <p className="text-xs text-muted-foreground text-right" data-testid="class-choice-hint">
                  Choose your {missingClassChoices.join(' and ')} to continue.
                </p>
              )}
              {abilityScoresReady && skillsReady && classChoicesReady && !featPrereqReady && (
                <div
                  className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                  data-testid="feat-prereq-features-note"
                >
                  <span className="font-medium">{selectedFeatObj?.name}</span> {featPrereqFeatures.unmet.map(u => u.reason).join('; ')}. Adjust your ability scores or pick a different feat on the Identity step.
                </div>
              )}
              <div className="flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('identity')} data-testid="details-back">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button type="button" onClick={() => setStep(hasEquipmentStep ? 'equipment' : 'overview')} disabled={!abilityScoresReady || !skillsReady || !classChoicesReady || !featPrereqReady} data-testid="details-next">
                  {hasEquipmentStep ? 'Next: Equipment' : 'Next: Review'} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* ── Step 5: Starting Equipment ───────────────────────────────────── */}
        {step === 'equipment' && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold">Starting Equipment</h2>
                <p className="text-sm text-muted-foreground">Choose your class equipment options. Everything is added to your character's inventory — you can change it later.</p>
              </div>
              <StartingEquipmentStep
                charClass={selectedClass}
                backgroundName={selectedBgObj?.name}
                backgroundToolChoice={bgChoices.tool_choice}
                campaignId={campaignId}
                mode={startingEquipmentMode}
                size={selectedRaceObj?.size ?? 'Medium'}
                edition={edition}
                scores={{
                  strength: form.strength + (combinedRaceAsi.strength ?? 0),
                  dexterity: form.dexterity + (combinedRaceAsi.dexterity ?? 0),
                }}
                onResult={setEquipmentResult}
              />
            </div>
            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('details')} data-testid="equipment-back">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="button" onClick={() => setStep('overview')} data-testid="equipment-next">
                Next: Review <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
        {/* ── Step 6: Overview / Review ────────────────────────────────────── */}
        {step === 'overview' && (() => {
          const finalScores = {
            strength:     form.strength     + (combinedRaceAsi.strength     ?? 0),
            dexterity:    form.dexterity    + (combinedRaceAsi.dexterity    ?? 0),
            constitution: form.constitution + (combinedRaceAsi.constitution ?? 0),
            intelligence: form.intelligence + (combinedRaceAsi.intelligence ?? 0),
            wisdom:       form.wisdom       + (combinedRaceAsi.wisdom       ?? 0),
            charisma:     form.charisma     + (combinedRaceAsi.charisma     ?? 0),
          };
          const dexMod = Math.floor((finalScores.dexterity - 10) / 2);
          const wisMod = Math.floor((finalScores.wisdom - 10) / 2);
          // Feats acquired at creation (Variant Human's free feat) contribute stat_mod bonuses
          // — Alert → +5 initiative, Observant → +5 passive perception — matching CharacterDetail.
          const creationFeats = humanFeatObj ? [humanFeatObj] : [];
          const creationPb = 2; // proficiency bonus at level 1 (for PB-scaled 2024 feats)
          const initiativeBonus = getFeatStatMods(creationFeats, 'initiative', { pb: creationPb });
          const initiativeTotal = dexMod + initiativeBonus;
          const initiativeSources = getFeatStatModSources(creationFeats, 'initiative', { pb: creationPb });
          const passivePerceptionBonus = getFeatStatMods(creationFeats, 'passive_perception', { pb: creationPb });
          const passivePerception = 10 + wisMod + passivePerceptionBonus;
          const passivePerceptionSources = getFeatStatModSources(creationFeats, 'passive_perception', { pb: creationPb });
          const abilityKeys = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

          return (
            <div className="space-y-6">
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* Character identity summary */}
              <section className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Character Summary</h2>
                  <button
                    type="button"
                    className="text-primary text-xs underline underline-offset-2"
                    onClick={() => setStep('identity')}
                  >
                    Edit Identity
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-bold">{form.name}</h3>
                    <Badge variant="outline" className="text-xs">{edition === '5.5e' ? '2024 Rules' : '5E'}</Badge>
                  </div>
                  <div className={cn('text-sm font-semibold', CLASS_ACCENT[selectedClass])}>
                    {selectedClass} · {HIT_DICE[selectedClass]} · Level 1
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm pt-1">
                    {form.race && (
                      <div>
                        <span className="text-muted-foreground">Race: </span>
                        <span className="font-medium">{form.race}</span>
                        {selectedSubraceObj && (
                          <span className="text-muted-foreground"> · {selectedSubraceObj.name}</span>
                        )}
                      </div>
                    )}
                    {form.background && (
                      <div>
                        <span className="text-muted-foreground">Background: </span>
                        <span className="font-medium">{form.background}</span>
                      </div>
                    )}
                    {form.alignment && campaign?.use_alignment !== false && (
                      <div>
                        <span className="text-muted-foreground">Alignment: </span>
                        <span className="font-medium">{form.alignment}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Race details */}
              {selectedRaceObj && (
                <section className="rounded-lg border bg-card p-4 space-y-3">
                  <h2 className="font-semibold">Race Details</h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{selectedRaceObj.name}</span>
                    {selectedSubraceObj && <span className="text-muted-foreground">· {selectedSubraceObj.name}</span>}
                    <span className="text-xs text-muted-foreground">{selectedRaceObj.size} · {selectedRaceObj.speed}{selectedSubraceObj?.speedBonus ? ` (+${selectedSubraceObj.speedBonus})` : ''} ft</span>
                    {selectedRaceObj.asi && !isVariantHuman && <Badge variant="secondary" className="text-xs">{selectedRaceObj.asi}</Badge>}
                    {selectedSubraceObj?.asi && <Badge variant="secondary" className="text-xs">{selectedSubraceObj.asi}</Badge>}
                  </div>
                  {selectedRaceObj.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedRaceObj.description}</p>
                  )}
                  {selectedSubraceObj?.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 italic">{selectedSubraceObj.description}</p>
                  )}
                  {(() => {
                    const allTraits = allRaceTraits;
                    return allTraits.length > 0 ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Racial Traits <span className="font-normal normal-case text-muted-foreground/70">(click a trait to learn more)</span></div>
                        <TraitBadgeList traits={allTraits} />
                      </div>
                    ) : null;
                  })()}
                  {(() => {
                    const allLangs = [
                      ...(selectedRaceObj.languages ?? []),
                      ...(selectedSubraceObj?.languages ?? []),
                      ...(raceChoices.high_elf_language ? [raceChoices.high_elf_language] : []),
                      ...(raceChoices.half_elf_language ? [raceChoices.half_elf_language] : []),
                      ...(raceChoices.human_language ? [raceChoices.human_language] : []),
                    ];
                    return allLangs.length > 0 ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Languages</div>
                        <div className="flex flex-wrap gap-1.5">
                          {allLangs.map(l => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}
                        </div>
                      </div>
                    ) : null;
                  })()}
                  {raceChoices.draconic_ancestry && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Draconic Ancestry</div>
                      <div className="text-sm">
                        <span className="font-medium">{raceChoices.draconic_ancestry.name} Dragon</span>
                        <span className="text-muted-foreground ml-2">{raceChoices.draconic_ancestry.damage} · {raceChoices.draconic_ancestry.breath}</span>
                      </div>
                    </div>
                  )}
                  {raceChoices.dwarf_tool && (
                    <div data-testid="review-dwarf-tool">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Tool Proficiency (from Race)</div>
                      <div className="text-sm"><span className="font-medium">{raceChoices.dwarf_tool}</span></div>
                    </div>
                  )}
                  {raceGrantedCantrips.length > 0 && (
                    <div data-testid="review-race-cantrips">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Race-Granted Cantrips</div>
                      {/* Clickable — opens the spell detail dialog (same as CharacterDetail) */}
                      <SpellList spells={raceGrantedCantrips} isCantrips readOnly label="Click a cantrip to see its details" placeholder="" />
                    </div>
                  )}
                  {raceChoices.half_elf_skills?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Skill Versatility</div>
                      <div className="flex flex-wrap gap-1.5">
                        {raceChoices.half_elf_skills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    </div>
                  )}
                  {isVariantHuman && (raceChoices.human_feat || raceChoices.human_variant_skill) && (
                    <div data-testid="review-variant-human">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Variant Human</div>
                      <div className="flex flex-wrap gap-1.5">
                        {raceChoices.human_feat && (
                          <Badge variant="secondary" className="text-xs">Feat: {raceChoices.human_feat.name}</Badge>
                        )}
                        {raceChoices.human_variant_skill && (
                          <Badge variant="secondary" className="text-xs">Skill: {raceChoices.human_variant_skill}</Badge>
                        )}
                      </div>
                      {selectedFeatObj?.description && (
                        <div className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed" data-testid="review-variant-human-feat-desc">
                          {selectedFeatObj.prerequisites?.text && (
                            <div className="mb-1 font-medium text-amber-700 dark:text-amber-400">
                              Prerequisite: {selectedFeatObj.prerequisites.text}
                            </div>
                          )}
                          {selectedFeatObj.description}
                        </div>
                      )}
                      {/* Everything the player picked AS PART OF the feat — surfaced so nothing is lost at review */}
                      {(() => {
                        const rows = [
                          ['Skills', humanFeatSkillPicks],
                          ['Expertise', humanFeatProfRest.expertise_skills],
                          ['Tools', humanFeatProfRest.feat_tool_proficiencies],
                          ['Languages', humanFeatProfRest.feat_languages],
                          ['Weapons', humanFeatProfRest.feat_weapon_proficiencies],
                          ['Maneuvers', humanFeatManeuverSpec ? raceChoices.human_feat_maneuvers : []],
                        ].filter(([, items]) => (items?.length ?? 0) > 0);
                        const fg = humanFeatGrantedSpells;
                        const spellNames = [
                          ...fg.cantrips.map(s => `${s.name} (cantrip)`),
                          ...fg.leveled.map(s => s.name),
                          ...fg.ritualBooks.flatMap(b => b.spells),
                        ];
                        if (rows.length === 0 && spellNames.length === 0) return null;
                        return (
                          <div className="mt-2 space-y-1" data-testid="review-feat-choices">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Feat Choices</div>
                            {rows.map(([label, items]) => (
                              <div key={label} className="text-xs flex flex-wrap items-center gap-1">
                                <span className="text-muted-foreground">{label}:</span>
                                {items.map(it => <Badge key={it} variant="secondary" className="text-xs">{it}</Badge>)}
                              </div>
                            ))}
                            {spellNames.length > 0 && (
                              <div className="text-xs flex flex-wrap items-center gap-1" data-testid="review-feat-spells">
                                <span className="text-muted-foreground">Spells:</span>
                                {spellNames.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {raceSkillSources.length > 0 && (
                    <div data-testid="review-race-skill-grants">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Skill Proficiencies (from Race)</div>
                      <div className="flex flex-wrap gap-1.5">
                        {raceSkillSources.map(({ skill, trait }) => (
                          <Badge
                            key={`${skill}-${trait}`}
                            className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600"
                          >
                            {skill} <span className="opacity-70 ml-1">· {trait}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Background details */}
              {selectedBgObj && (
                <section className="rounded-lg border bg-card p-4 space-y-3">
                  <h2 className="font-semibold">Background Details</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{selectedBgObj.name}</span>
                    {selectedBgObj.feature && (
                      <span className="text-xs text-muted-foreground italic">· {selectedBgObj.feature}</span>
                    )}
                  </div>
                  {selectedBgObj.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedBgObj.description}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedBgObj.skills?.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Skill Proficiencies</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedBgObj.skills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                        </div>
                      </div>
                    )}
                    {selectedBgObj.tools && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Tool Proficiencies</div>
                        <div className="text-sm text-muted-foreground">{selectedBgObj.tools}</div>
                      </div>
                    )}
                    {bgChoices.tool_choice && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Chosen Tool</div>
                        <div className="text-sm text-muted-foreground">{bgChoices.tool_choice}</div>
                      </div>
                    )}
                    {(bgChoices.language_choices ?? []).filter(Boolean).length > 0 && (
                      <div className="sm:col-span-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Chosen Languages</div>
                        <div className="flex flex-wrap gap-1">
                          {bgChoices.language_choices.filter(Boolean).map(l => (
                            <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedBgObj.equipment && (
                      <div className="sm:col-span-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Starting Equipment</div>
                        <div className="text-sm text-muted-foreground">{selectedBgObj.equipment}</div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Ability scores */}
              <section className="rounded-lg border bg-card p-4 space-y-3">
                <h2 className="font-semibold">Ability Scores</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  {abilityKeys.map(stat => {
                    const total = finalScores[stat];
                    const racial = combinedRaceAsi[stat] ?? 0;
                    const base = form[stat] ?? 10;
                    const mod = Math.floor((total - 10) / 2);
                    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                    return (
                      <div key={stat} className="flex flex-col items-center gap-0.5 rounded-lg border bg-muted/30 p-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {STAT_ABBREV[stat]}
                        </div>
                        <div className="text-2xl font-bold leading-tight">{total}</div>
                        <div className="text-sm font-medium text-muted-foreground">{modStr}</div>
                        {racial !== 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400">{base}+{racial}</div>
                        )}
                        {(asiSourceMap[stat] ?? []).map((s, i) => (
                          <div key={i} className="text-[10px] leading-tight text-muted-foreground" data-testid={`review-asi-source-${stat}-${i}`}>
                            +{s.amount} {s.label}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Starting stats */}
              <section className="rounded-lg border bg-card p-4 space-y-3">
                <h2 className="font-semibold">Starting Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Starting HP</div>
                    <div className="text-2xl font-bold">{creationStartingHp}</div>
                    <div className="text-xs text-muted-foreground">{creationHpFormula}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Prof. Bonus</div>
                    <div className="text-2xl font-bold">+2</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Initiative</div>
                    <div className="text-2xl font-bold" data-testid="review-initiative">{initiativeTotal >= 0 ? `+${initiativeTotal}` : `${initiativeTotal}`}</div>
                    {initiativeSources.length > 0 && (
                      <div className="text-[10px] leading-tight text-emerald-600 dark:text-emerald-400" data-testid="review-initiative-feat-note">
                        {initiativeSources.map((s) => `+${s.amount} ${s.source}`).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Passive Perc.</div>
                    <div className="text-2xl font-bold" data-testid="review-passive-perception">{passivePerception}</div>
                    {passivePerceptionSources.length > 0 && (
                      <div className="text-[10px] leading-tight text-emerald-600 dark:text-emerald-400" data-testid="review-passive-perception-feat-note">
                        {passivePerceptionSources.map((s) => `+${s.amount} ${s.source}`).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3" data-testid="review-speed">
                    <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Speed</div>
                    <div className="text-2xl font-bold">{creationSpeed} ft</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3" data-testid="review-starting-gold">
                    <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Starting Gold</div>
                    <div className="text-2xl font-bold">{startingEquipmentMode === 'none' ? 0 : startingGold + (equipmentResult.bonusGold || 0)} gp</div>
                    <div className="text-xs text-muted-foreground">{equipmentResult.bonusGold ? 'background + class' : 'from background'}</div>
                  </div>
                  {startingEquipmentMode !== 'none' && (
                    <div className="rounded-lg border bg-muted/30 p-3" data-testid="review-starting-items">
                      <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Starting Items</div>
                      <div className="text-2xl font-bold">{(equipmentResult.inventory || []).length}</div>
                      <div className="text-xs text-muted-foreground">in inventory</div>
                    </div>
                  )}
                </div>
              </section>

              {/* Starting Equipment & Wallet — the full list of what the character begins with */}
              {startingEquipmentMode !== 'none' && (
                <section className="rounded-lg border bg-card p-4 space-y-3" data-testid="review-equipment">
                  <h2 className="font-semibold">Starting Equipment &amp; Wallet</h2>
                  <div className="text-sm">
                    <span className="font-medium">Wallet:</span>{' '}
                    {startingGold + (equipmentResult.bonusGold || 0)} gp
                    <span className="text-muted-foreground"> {equipmentResult.bonusGold ? '(background + class gold)' : '(from background)'}</span>
                  </div>
                  {(equipmentResult.inventory || []).length > 0 ? (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Items ({equipmentResult.inventory.length})</div>
                      <ul className="text-sm text-muted-foreground grid sm:grid-cols-2 gap-x-6 gap-y-0.5 list-disc pl-5">
                        {equipmentResult.inventory.map((e) => (
                          <li key={e.uid}>
                            {e.name}{e.quantity > 1 ? ` ×${e.quantity}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items{equipmentResult.bonusGold ? ' — you took starting gold instead' : ''}.</p>
                  )}
                </section>
              )}

              {/* Proficiencies */}
              <ProficienciesCard cls={selectedClass} chosenTools={[raceChoices.dwarf_tool, ...raceTools, ...backgroundFixedTools(selectedBgObj), bgChoices.tool_choice, classData.tool_choice]} raceWeapons={raceWeapons} raceArmor={raceArmor} />

              {/* Class features (read-only review) */}
              {ClassSheet && (
                <section className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">{selectedClass} Features</h2>
                    <button
                      type="button"
                      className="text-primary text-xs underline underline-offset-2"
                      onClick={() => setStep('details')}
                    >
                      Edit Features
                    </button>
                  </div>
                  <ClassSheet
                    data={{
                      ...classData,
                      skill_proficiencies: [...new Set([...(classData.skill_proficiencies ?? []), ...backgroundSkills, ...grantedSkillsForPicker])],
                    }}
                    onChange={() => {}}
                    readOnly={true}
                    level={1}
                    creation={true}
                    scores={finalScores}
                    backgroundSkills={backgroundSkills}
                    raceSkills={grantedSkillsForPicker}
                    raceGrantedCantrips={raceGrantedCantrips}
                  />
                </section>
              )}

              {/* Notes (only shown when entered) */}
              {form.notes?.trim() && (
                <section className="rounded-lg border bg-card p-4 space-y-2">
                  <h2 className="font-semibold">Personal Notes</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{form.notes}</p>
                </section>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('details')}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate(`/campaigns/${campaignId}/characters`)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Creating…' : 'Create Character'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </MainLayout>
  );
}
