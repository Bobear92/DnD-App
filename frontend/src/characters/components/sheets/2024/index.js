export { default as BarbarianSheet } from '@/characters/components/sheets/2024/BarbarianSheet';
export { default as BardSheet } from '@/characters/components/sheets/2024/BardSheet';
export { default as ClericSheet } from '@/characters/components/sheets/2024/ClericSheet';
export { default as DruidSheet } from '@/characters/components/sheets/2024/DruidSheet';
export { FighterSheet2024 as FighterSheet } from '@/characters/components/sheets/classSheet/configs';
export { default as MonkSheet } from '@/characters/components/sheets/2024/MonkSheet';
export { default as PaladinSheet } from '@/characters/components/sheets/2024/PaladinSheet';
export { default as RangerSheet } from '@/characters/components/sheets/2024/RangerSheet';
export { default as RogueSheet } from '@/characters/components/sheets/2024/RogueSheet';
export { default as SorcererSheet } from '@/characters/components/sheets/2024/SorcererSheet';
export { default as WarlockSheet } from '@/characters/components/sheets/2024/WarlockSheet';
export { WizardSheet2024 as WizardSheet } from '@/characters/components/sheets/classSheet/configs';

export const SUPPORTED_CLASSES_2024 = [
  'Barbarian', 'Bard', 'Cleric', 'Druid',
  'Fighter', 'Monk', 'Paladin', 'Ranger',
  'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
];

export const CLASS_DESCRIPTIONS_2024 = {
  Barbarian: 'Fierce warriors driven by primal rage, channeling raw emotion into devastating power.',
  Bard:      'Versatile performers who weave magic through music, words, and wit.',
  Cleric:    'Divine servants of the gods, healing allies and smiting enemies with holy power.',
  Druid:     'Guardians of nature who shapeshift and command the elements.',
  Fighter:   'Masters of martial combat, skilled with a variety of weapons and armor.',
  Monk:      'Disciplined martial artists who harness inner energy called Focus Points.',
  Paladin:   'Holy warriors bound by sacred oaths, blending martial prowess with divine magic.',
  Ranger:    'Skilled hunters and trackers at home in the wilderness, with a touch of magic.',
  Rogue:     'Skilled tricksters and infiltrators who excel at stealth, deception, and precision strikes.',
  Sorcerer:  'Innate spellcasters who channel magical power from within their very blood.',
  Warlock:   'Magic-users who struck a pact with a powerful otherworldly being.',
  Wizard:    'Scholarly magic-users who command the forces of nature through careful study and preparation.',
};

export const CLASS_HIT_DICE_2024 = {
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
