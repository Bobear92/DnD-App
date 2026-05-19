export { default as BarbarianSheet } from './BarbarianSheet';
export { default as BardSheet } from './BardSheet';
export { default as ClericSheet } from './ClericSheet';
export { default as DruidSheet } from './DruidSheet';
export { default as FighterSheet } from './FighterSheet';
export { default as MonkSheet } from './MonkSheet';
export { default as PaladinSheet } from './PaladinSheet';
export { default as RangerSheet } from './RangerSheet';
export { default as RogueSheet } from './RogueSheet';
export { default as SorcererSheet } from './SorcererSheet';
export { default as WarlockSheet } from './WarlockSheet';
export { default as WizardSheet } from './WizardSheet';

export const SUPPORTED_CLASSES_5E = [
  'Barbarian', 'Bard', 'Cleric', 'Druid',
  'Fighter', 'Monk', 'Paladin', 'Ranger',
  'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
];

export function getClassSheet(charClass) {
  const map = {
    Barbarian: () => import('./BarbarianSheet').then(m => m.default),
    Bard:      () => import('./BardSheet').then(m => m.default),
    Cleric:    () => import('./ClericSheet').then(m => m.default),
    Druid:     () => import('./DruidSheet').then(m => m.default),
    Fighter:   () => import('./FighterSheet').then(m => m.default),
    Monk:      () => import('./MonkSheet').then(m => m.default),
    Paladin:   () => import('./PaladinSheet').then(m => m.default),
    Ranger:    () => import('./RangerSheet').then(m => m.default),
    Rogue:     () => import('./RogueSheet').then(m => m.default),
    Sorcerer:  () => import('./SorcererSheet').then(m => m.default),
    Warlock:   () => import('./WarlockSheet').then(m => m.default),
    Wizard:    () => import('./WizardSheet').then(m => m.default),
  };
  return map[charClass] ?? null;
}

export const CLASS_DESCRIPTIONS = {
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
