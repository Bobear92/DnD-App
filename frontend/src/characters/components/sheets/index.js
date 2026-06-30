export { default as ArtificerSheet } from '@/characters/components/sheets/ArtificerSheet';
export { default as BarbarianSheet } from '@/characters/components/sheets/BarbarianSheet';
export { default as BardSheet } from '@/characters/components/sheets/BardSheet';
export { default as ClericSheet } from '@/characters/components/sheets/ClericSheet';
export { default as DruidSheet } from '@/characters/components/sheets/DruidSheet';
export { FighterSheet5e as FighterSheet } from '@/characters/components/sheets/classSheet/configs';
export { default as MonkSheet } from '@/characters/components/sheets/MonkSheet';
export { default as PaladinSheet } from '@/characters/components/sheets/PaladinSheet';
export { default as RangerSheet } from '@/characters/components/sheets/RangerSheet';
export { default as RogueSheet } from '@/characters/components/sheets/RogueSheet';
export { default as SorcererSheet } from '@/characters/components/sheets/SorcererSheet';
export { default as WarlockSheet } from '@/characters/components/sheets/WarlockSheet';
export { WizardSheet5e as WizardSheet } from '@/characters/components/sheets/classSheet/configs';

export const SUPPORTED_CLASSES_5E = [
  'Artificer',
  'Barbarian', 'Bard', 'Cleric', 'Druid',
  'Fighter', 'Monk', 'Paladin', 'Ranger',
  'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
];

export function getClassSheet(charClass) {
  const map = {
    Artificer: () => import('@/characters/components/sheets/ArtificerSheet').then(m => m.default),
    Barbarian: () => import('@/characters/components/sheets/BarbarianSheet').then(m => m.default),
    Bard:      () => import('@/characters/components/sheets/BardSheet').then(m => m.default),
    Cleric:    () => import('@/characters/components/sheets/ClericSheet').then(m => m.default),
    Druid:     () => import('@/characters/components/sheets/DruidSheet').then(m => m.default),
    Fighter:   () => import('@/characters/components/sheets/classSheet/configs').then(m => m.FighterSheet5e),
    Monk:      () => import('@/characters/components/sheets/MonkSheet').then(m => m.default),
    Paladin:   () => import('@/characters/components/sheets/PaladinSheet').then(m => m.default),
    Ranger:    () => import('@/characters/components/sheets/RangerSheet').then(m => m.default),
    Rogue:     () => import('@/characters/components/sheets/RogueSheet').then(m => m.default),
    Sorcerer:  () => import('@/characters/components/sheets/SorcererSheet').then(m => m.default),
    Warlock:   () => import('@/characters/components/sheets/WarlockSheet').then(m => m.default),
    Wizard:    () => import('@/characters/components/sheets/classSheet/configs').then(m => m.WizardSheet5e),
  };
  return map[charClass] ?? null;
}

export const CLASS_DESCRIPTIONS = {
  Artificer: 'Ingenious inventors and magical tinkerers who infuse everyday objects with arcane power.',
  Barbarian: 'Fierce warriors driven by primal rage, channeling raw emotion into devastating power.',
  Bard:      'Versatile performers who weave magic through music, words, and wit.',
  Cleric:    'Divine servants of the gods, healing allies and smiting enemies with holy power.',
  Druid:     'Guardians of nature who shapeshift and command the elements.',
  Fighter:   'Masters of martial combat, skilled with a variety of weapons and armor.',
  Monk:      'Disciplined martial artists who harness inner energy called ki.',
  Paladin:   'Holy warriors bound by sacred oaths, blending martial prowess with divine magic.',
  Ranger:    'Skilled hunters and trackers at home in the wilderness, with a touch of magic.',
  Rogue:     'Skilled tricksters and infiltrators who excel at stealth, deception, and precision strikes.',
  Sorcerer:  'Innate spellcasters who channel magical power from within their very blood.',
  Warlock:   'Magic-users who struck a pact with a powerful otherworldly being.',
  Wizard:    'Scholarly magic-users who command the forces of nature through careful study and preparation.',
};

export const CLASS_HIT_DICE = {
  Artificer: 'd8',
  Barbarian: 'd12',
  Bard:      'd8',
  Cleric:    'd8',
  Druid:     'd8',
  Fighter:   'd10',
  Monk:      'd8',
  Paladin:   'd10',
  Ranger:    'd10',
  Rogue:     'd8',
  Sorcerer:  'd6',
  Warlock:   'd8',
  Wizard:    'd6',
};
