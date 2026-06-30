/**
 * Class config registry + bound ClassSheet wrappers.
 *
 * Each wrapper is a drop-in replacement for the legacy per-class sheet components: it has
 * the same prop contract and simply binds the matching config to the universal ClassSheet.
 * `getClassConfig(charClass, edition)` returns the config object (null when unsupported).
 */
import React from 'react';
import ClassSheet from '@/characters/components/sheets/classSheet/ClassSheet';
import { FIGHTER_5E, FIGHTER_2024 } from '@/characters/components/sheets/classSheet/configs/fighter';
import { WIZARD_5E, WIZARD_2024 } from '@/characters/components/sheets/classSheet/configs/wizard';

const CONFIGS = {
  '5e': { Fighter: FIGHTER_5E, Wizard: WIZARD_5E },
  '5.5e': { Fighter: FIGHTER_2024, Wizard: WIZARD_2024 },
};

export function getClassConfig(charClass, edition = '5e') {
  return CONFIGS[edition]?.[charClass] ?? null;
}

const bind = (config) => function BoundClassSheet(props) {
  return <ClassSheet config={config} {...props} />;
};

export const FighterSheet5e = bind(FIGHTER_5E);
export const FighterSheet2024 = bind(FIGHTER_2024);
export const WizardSheet5e = bind(WIZARD_5E);
export const WizardSheet2024 = bind(WIZARD_2024);

export { ClassSheet };
