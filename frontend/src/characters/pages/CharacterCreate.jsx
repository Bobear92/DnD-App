import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Search } from 'lucide-react';
import { StandardSpreadAssignment, PointBuyAssignment, DiceRollAssignment } from '../components/AbilityScoreAssignment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import MainLayout from '../../shared/components/layout/MainLayout';
import characterService from '../characterService';
import referenceService from '../referenceService';
import { useCampaign } from '../../campaigns/CampaignContext';
import {
  BarbarianSheet, BardSheet, ClericSheet, DruidSheet,
  FighterSheet, MonkSheet, PaladinSheet, RangerSheet,
  RogueSheet, SorcererSheet, WarlockSheet, WizardSheet,
  SUPPORTED_CLASSES_5E, CLASS_DESCRIPTIONS, CLASS_HIT_DICE,
} from '../components';
import { HIT_DICE_5E } from '../components/classFeatures5e';
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
} from '../components/5e2024';
import { HIT_DICE_2024 } from '../components/classFeatures2024';
import { cn } from '@/lib/utils';

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

const CLASS_PROFICIENCIES_5E = {
  Barbarian: { armor: 'Light armor, medium armor, shields', weapons: 'Simple weapons, martial weapons', tools: null, saving_throws: ['Strength', 'Constitution'] },
  Bard:      { armor: 'Light armor', weapons: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords', tools: 'Three musical instruments of your choice', saving_throws: ['Dexterity', 'Charisma'] },
  Cleric:    { armor: 'Light armor, medium armor, shields', weapons: 'Simple weapons', tools: null, saving_throws: ['Wisdom', 'Charisma'] },
  Druid:     { armor: 'Light armor, medium armor, shields (no metal)', weapons: 'Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears', tools: 'Herbalism kit', saving_throws: ['Intelligence', 'Wisdom'] },
  Fighter:   { armor: 'All armor, shields', weapons: 'Simple weapons, martial weapons', tools: null, saving_throws: ['Strength', 'Constitution'] },
  Monk:      { armor: 'None', weapons: 'Simple weapons, shortswords', tools: "One type of artisan's tools or one musical instrument", saving_throws: ['Strength', 'Dexterity'] },
  Paladin:   { armor: 'All armor, shields', weapons: 'Simple weapons, martial weapons', tools: null, saving_throws: ['Wisdom', 'Charisma'] },
  Ranger:    { armor: 'Light armor, medium armor, shields', weapons: 'Simple weapons, martial weapons', tools: null, saving_throws: ['Strength', 'Dexterity'] },
  Rogue:     { armor: 'Light armor', weapons: "Simple weapons, hand crossbows, longswords, rapiers, shortswords", tools: "Thieves' tools", saving_throws: ['Dexterity', 'Intelligence'] },
  Sorcerer:  { armor: 'None', weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows', tools: null, saving_throws: ['Constitution', 'Charisma'] },
  Warlock:   { armor: 'Light armor', weapons: 'Simple weapons', tools: null, saving_throws: ['Wisdom', 'Charisma'] },
  Wizard:    { armor: 'None', weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows', tools: null, saving_throws: ['Intelligence', 'Wisdom'] },
};

const CLASS_COLORS = {
  Barbarian: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 hover:border-orange-600',
  Bard:      'border-pink-500 bg-pink-50 dark:bg-pink-950/30 hover:border-pink-600',
  Cleric:    'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 hover:border-yellow-600',
  Druid:     'border-green-500 bg-green-50 dark:bg-green-950/30 hover:border-green-600',
  Fighter:   'border-red-500 bg-red-50 dark:bg-red-950/30 hover:border-red-600',
  Monk:      'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 hover:border-cyan-600',
  Paladin:   'border-amber-500 bg-amber-50 dark:bg-amber-950/30 hover:border-amber-600',
  Ranger:    'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 hover:border-emerald-600',
  Rogue:     'border-purple-500 bg-purple-50 dark:bg-purple-950/30 hover:border-purple-600',
  Sorcerer:  'border-rose-500 bg-rose-50 dark:bg-rose-950/30 hover:border-rose-600',
  Warlock:   'border-violet-500 bg-violet-50 dark:bg-violet-950/30 hover:border-violet-600',
  Wizard:    'border-blue-500 bg-blue-50 dark:bg-blue-950/30 hover:border-blue-600',
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

function StepIndicator({ current }) {
  const steps = ['Class', 'Identity', 'Features', 'Review'];
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
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Racial Traits</div>
          <div className="flex flex-wrap gap-1.5">
            {race.traits.map(t => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
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
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Subrace Traits</div>
          <div className="flex flex-wrap gap-1.5">
            {subrace.traits.map(t => (
              <Badge key={t} variant="outline" className="text-xs border-primary/30">{t}</Badge>
            ))}
          </div>
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

function AbilityScoreSection({ method, allowRerollOnes, scores, onChange }) {
  if (method === 'point_buy') return <PointBuyAssignment scores={scores} onChange={onChange} />;
  if (method === 'roll') return <DiceRollAssignment scores={scores} onChange={onChange} allowRerollOnes={allowRerollOnes} />;
  return <StandardSpreadAssignment scores={scores} onChange={onChange} />;
}

function ProficienciesCard({ cls }) {
  const profs = CLASS_PROFICIENCIES_5E[cls];
  if (!profs) return null;
  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold">Proficiencies</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Armor</div>
          <div>{profs.armor === 'None' ? <span className="text-muted-foreground italic">None</span> : profs.armor}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weapons</div>
          <div>{profs.weapons}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tools</div>
          <div>{profs.tools ?? <span className="text-muted-foreground italic">None</span>}</div>
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

  const [step, setStep] = useState('class'); // 'class' | 'identity' | 'details' | 'overview'
  const [selectedClass, setSelectedClass] = useState('');

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

  // Identity step state
  const [apiRaces, setApiRaces] = useState([]);
  const [apiBackgrounds, setApiBackgrounds] = useState([]);
  const [selectedRaceObj, setSelectedRaceObj] = useState(null);
  const [selectedSubraceObj, setSelectedSubraceObj] = useState(null);
  const [selectedBgObj, setSelectedBgObj] = useState(null);
  const [customRace, setCustomRace] = useState('');
  const [raceSearch, setRaceSearch] = useState('');

  // Fetch races + backgrounds when entering identity step
  useEffect(() => {
    if (step !== 'identity') return;
    const load = async () => {
      const [races, bgs] = await Promise.all([
        referenceService.getRaces(campaignId),
        referenceService.getBackgrounds(campaignId),
      ]);
      if (races.length) setApiRaces(races.map(normalizeApiRace));
      if (bgs.length) setApiBackgrounds(bgs.map(normalizeApiBg));
    };
    load();
  }, [step, campaignId]);

  useEffect(() => {
    if ((campaign?.ability_score_method ?? 'standard_spread') === 'point_buy') {
      setForm(f => ({ ...f, strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 }));
    }
  }, [campaign?.ability_score_method]);

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
    Barbarian: BarbarianSheet, Bard: BardSheet, Cleric: ClericSheet, Druid: DruidSheet,
    Fighter: FighterSheet, Monk: MonkSheet, Paladin: PaladinSheet, Ranger: RangerSheet,
    Rogue: RogueSheet, Sorcerer: SorcererSheet, Warlock: WarlockSheet, Wizard: WizardSheet,
  })[selectedClass];

  // Races to display: API races if available, else hardcoded
  const baseRaces = apiRaces.length > 0 ? apiRaces : RACES_5E;
  const displayedRaces = raceSearch.trim()
    ? baseRaces.filter(r => r.name.toLowerCase().includes(raceSearch.toLowerCase()))
    : baseRaces;

  // Backgrounds to display: hardcoded always + any extra API ones not in hardcoded list
  const extraApiBgs = apiBackgrounds.filter(b => !BACKGROUNDS_5E.find(h => h.name === b.name));
  const displayedBackgrounds = [...BACKGROUNDS_5E, ...extraApiBgs];

  // Background skills passed to class sheet in step 3
  const backgroundSkills = selectedBgObj?.skills ?? [];

  // Combined racial ASI (base race + subrace) — used in submit and previews
  const combinedRaceAsi = mergeAsi(selectedRaceObj?.asiBonus, selectedSubraceObj?.asiBonus);

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    setClassData({});
    setForm(initialForm(campaign?.ability_score_method));
    setSelectedRaceObj(null);
    setSelectedSubraceObj(null);
    setSelectedBgObj(null);
    setCustomRace('');
    setRaceSearch('');
    setStep('identity');
  };

  const handleRaceSelect = (race) => {
    setSelectedRaceObj(race);
    setSelectedSubraceObj(null);
    setCustomRace('');
    setForm(f => ({ ...f, race: race.name }));
  };

  const handleSubraceSelect = (subrace) => {
    setSelectedSubraceObj(subrace);
  };

  const handleCustomRaceChange = (val) => {
    setCustomRace(val);
    setSelectedRaceObj(null);
    setSelectedSubraceObj(null);
    setForm(f => ({ ...f, race: val }));
  };

  const handleBgSelect = (bg) => {
    if (selectedBgObj?.name === bg.name) {
      setSelectedBgObj(null);
      setForm(f => ({ ...f, background: '' }));
    } else {
      setSelectedBgObj(bg);
      setForm(f => ({ ...f, background: bg.name }));
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    const numericHitDice = is2024 ? HIT_DICE_2024 : HIT_DICE_5E;
    const hitDie = numericHitDice[selectedClass] ?? 8;

    // Apply racial ASIs (base race + subrace) to player-assigned scores
    const finalScores = {
      strength:     form.strength     + (combinedRaceAsi.strength     ?? 0),
      dexterity:    form.dexterity    + (combinedRaceAsi.dexterity    ?? 0),
      constitution: form.constitution + (combinedRaceAsi.constitution ?? 0),
      intelligence: form.intelligence + (combinedRaceAsi.intelligence ?? 0),
      wisdom:       form.wisdom       + (combinedRaceAsi.wisdom       ?? 0),
      charisma:     form.charisma     + (combinedRaceAsi.charisma     ?? 0),
    };

    const conMod = Math.floor((finalScores.constitution - 10) / 2);
    const hp_max = hitDie + Math.max(0, conMod);

    const allRaceTraits = [
      ...(selectedRaceObj?.traits ?? []),
      ...(selectedSubraceObj?.traits ?? []),
    ];
    const allRaceLanguages = [
      ...(selectedRaceObj?.languages ?? []),
      ...(selectedSubraceObj?.languages ?? []),
    ];

    const result = await characterService.createCharacter({
      ...form,
      ...finalScores,
      level: 1,
      char_class: selectedClass,
      campaign_id: parseInt(campaignId),
      character_data: {
        ...classData,
        hp_max,
        subrace: selectedSubraceObj?.name ?? null,
        race_traits: allRaceTraits,
        race_languages: allRaceLanguages,
      },
    });

    if (result.success) {
      navigate(`/campaigns/${campaignId}/characters/${result.data.id}`);
    } else {
      setError(result.error);
      setSaving(false);
    }
  };

  const stepNum = step === 'class' ? 1 : step === 'identity' ? 2 : step === 'details' ? 3 : 4;

  const handleBack = () => {
    if (step === 'overview') { setStep('details'); return; }
    if (step === 'details') { setStep('identity'); return; }
    if (step === 'identity') { setStep('class'); return; }
    navigate(`/campaigns/${campaignId}/characters`);
  };

  const headerTitle = step === 'class'
    ? 'Choose Your Class'
    : `Create ${selectedClass}`;

  const headerSub = step === 'class'
    ? `${campaign?.edition?.toUpperCase() ?? '5E'} · Select a class to continue`
    : step === 'identity'
    ? 'Step 2 of 4 — Race, Background & Identity'
    : step === 'details'
    ? 'Step 3 of 4 — Class Features & Ability Scores'
    : 'Step 4 of 4 — Review & Create';

  // Next is blocked when name is missing, or a race with subraces is selected but no subrace chosen
  const identityNextBlocked = !form.name.trim() ||
    (selectedRaceObj?.subraces?.length > 0 && !selectedSubraceObj);

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

        {/* Step indicator (steps 2 + 3) */}
        {step !== 'class' && (
          <StepIndicator current={stepNum} />
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
                <p className="text-sm text-foreground/70">{DESCRIPTIONS[cls]}</p>
                <div className={cn('mt-3 flex items-center text-sm font-semibold', CLASS_ACCENT[cls])}>
                  Select <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Identity ─────────────────────────────────────────────── */}
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
                <p className="text-xs text-muted-foreground mt-0.5">Click a race to learn more — or type a custom race below</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search races…"
                  value={raceSearch}
                  onChange={e => setRaceSearch(e.target.value)}
                  data-testid="race-search"
                />
              </div>

              {/* Race card grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {displayedRaces.map(race => (
                  <RaceCard
                    key={race.name}
                    race={race}
                    selected={selectedRaceObj?.name === race.name}
                    onSelect={handleRaceSelect}
                  />
                ))}
                {displayedRaces.length === 0 && (
                  <p className="col-span-3 text-sm text-muted-foreground italic py-4 text-center">No races match your search.</p>
                )}
              </div>

              {/* Selected race detail */}
              {selectedRaceObj && <RaceDetail race={selectedRaceObj} />}

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

              {/* Custom race input */}
              <div className="space-y-1 pt-1 border-t">
                <Label className="text-xs text-muted-foreground">Custom / Homebrew Race</Label>
                <Input
                  value={customRace}
                  onChange={e => handleCustomRaceChange(e.target.value)}
                  placeholder="Type a custom race name…"
                  data-testid="custom-race-input"
                />
                {customRace && (
                  <p className="text-xs text-muted-foreground">Using custom race: <span className="font-medium text-foreground">{customRace}</span></p>
                )}
              </div>
            </section>

            {/* Background */}
            <section className="rounded-lg border bg-card p-4 space-y-4">
              <div>
                <h2 className="font-semibold">Background</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Click a background to see full details — click again to deselect</p>
              </div>

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

              {/* Selected background detail */}
              {selectedBgObj && <BgDetail bg={selectedBgObj} />}
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
            <ProficienciesCard cls={selectedClass} />

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
                          return (
                            <div key={stat} className="flex items-center gap-1.5 text-xs">
                              <span className="w-7 font-medium text-muted-foreground uppercase">{STAT_ABBREV[stat]}</span>
                              <span className="text-muted-foreground">{base}</span>
                              <span className="text-green-600 dark:text-green-400 font-medium">+{bonus}</span>
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
                  {(() => {
                    const numericHitDice = is2024 ? HIT_DICE_2024 : HIT_DICE_5E;
                    const hitDieVal = numericHitDice[selectedClass] ?? 8;
                    const finalCon = form.constitution + (combinedRaceAsi.constitution ?? 0);
                    const conMod = Math.floor((finalCon - 10) / 2);
                    const startingHp = hitDieVal + Math.max(0, conMod);
                    const formula = conMod > 0 ? `d${hitDieVal} + ${conMod} CON` : `d${hitDieVal}`;
                    return (
                      <div className="text-sm text-muted-foreground">
                        Starting HP: <span className="font-bold text-foreground">{startingHp}</span>
                        <span className="ml-1 text-xs">({formula})</span>
                      </div>
                    );
                  })()}
                </div>
                <ClassSheet
                  data={classData}
                  onChange={patch => setClassData(prev => ({ ...prev, ...patch }))}
                  readOnly={false}
                  level={1}
                  creation={true}
                  scores={form}
                  backgroundSkills={backgroundSkills}
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
            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('identity')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="button" onClick={() => setStep('overview')} data-testid="details-next">
                Next: Review <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
        {/* ── Step 4: Overview / Review ────────────────────────────────────── */}
        {step === 'overview' && (() => {
          const numericHitDice = is2024 ? HIT_DICE_2024 : HIT_DICE_5E;
          const hitDie = numericHitDice[selectedClass] ?? 8;
          const finalScores = {
            strength:     form.strength     + (combinedRaceAsi.strength     ?? 0),
            dexterity:    form.dexterity    + (combinedRaceAsi.dexterity    ?? 0),
            constitution: form.constitution + (combinedRaceAsi.constitution ?? 0),
            intelligence: form.intelligence + (combinedRaceAsi.intelligence ?? 0),
            wisdom:       form.wisdom       + (combinedRaceAsi.wisdom       ?? 0),
            charisma:     form.charisma     + (combinedRaceAsi.charisma     ?? 0),
          };
          const conMod = Math.floor((finalScores.constitution - 10) / 2);
          const dexMod = Math.floor((finalScores.dexterity - 10) / 2);
          const wisMod = Math.floor((finalScores.wisdom - 10) / 2);
          const startingHp = hitDie + Math.max(0, conMod);
          const passivePerception = 10 + wisMod;
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
                  {selectedBgObj?.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-xs text-muted-foreground self-center mr-1">Background skills:</span>
                      {selectedBgObj.skills.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </section>

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
                    <div className="text-2xl font-bold">{startingHp}</div>
                    <div className="text-xs text-muted-foreground">
                      d{hitDie}{conMod > 0 ? ` + ${conMod}` : ''}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Prof. Bonus</div>
                    <div className="text-2xl font-bold">+2</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Initiative</div>
                    <div className="text-2xl font-bold">{dexMod >= 0 ? `+${dexMod}` : `${dexMod}`}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Passive Perc.</div>
                    <div className="text-2xl font-bold">{passivePerception}</div>
                  </div>
                </div>
              </section>

              {/* Proficiencies */}
              <ProficienciesCard cls={selectedClass} />

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
                    data={classData}
                    onChange={() => {}}
                    readOnly={true}
                    level={1}
                    creation={true}
                    scores={finalScores}
                    backgroundSkills={backgroundSkills}
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
