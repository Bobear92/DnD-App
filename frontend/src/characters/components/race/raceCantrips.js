/**
 * Cantrips granted by race/subrace choices, read from a character record.
 * Single source of truth shared by CharacterDetail (Spells tab Racial source,
 * hasSpells detection) and the LevelUpWizard New Spells step (so a class
 * cantrip pick can't duplicate a race-granted one).
 */

export const SUBRACE_CANTRIPS = { 'Forest Gnome': 'Minor Illusion', 'Drow': 'Dancing Lights' };
export const RACE_CANTRIPS = { 'Tiefling': 'Thaumaturgy' };

export function computeRaceGrantedCantrips(character) {
  const cd = character?.character_data ?? {};
  const cantrips = [];
  if (cd.high_elf_cantrip) cantrips.push(cd.high_elf_cantrip);
  if (SUBRACE_CANTRIPS[cd.subrace]) cantrips.push(SUBRACE_CANTRIPS[cd.subrace]);
  if (RACE_CANTRIPS[character?.race]) cantrips.push(RACE_CANTRIPS[character.race]);
  return cantrips;
}

export default computeRaceGrantedCantrips;
