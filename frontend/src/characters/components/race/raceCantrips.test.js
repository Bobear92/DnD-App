import { describe, it, expect } from 'vitest';
import { computeRaceGrantedCantrips } from '@/characters/components/race/raceCantrips';

describe('computeRaceGrantedCantrips', () => {
  it('returns empty for a character with no race-granted cantrips', () => {
    expect(computeRaceGrantedCantrips({ race: 'Human', character_data: {} })).toEqual([]);
    expect(computeRaceGrantedCantrips(null)).toEqual([]);
  });

  it('includes the High Elf chosen cantrip', () => {
    const c = { race: 'Elf', character_data: { subrace: 'High Elf', high_elf_cantrip: 'Fire Bolt' } };
    expect(computeRaceGrantedCantrips(c)).toEqual(['Fire Bolt']);
  });

  it('includes subrace-granted cantrips (Forest Gnome, Drow)', () => {
    expect(computeRaceGrantedCantrips({ race: 'Gnome', character_data: { subrace: 'Forest Gnome' } }))
      .toEqual(['Minor Illusion']);
    expect(computeRaceGrantedCantrips({ race: 'Elf', character_data: { subrace: 'Drow' } }))
      .toEqual(['Dancing Lights']);
  });

  it('includes race-granted cantrips (Tiefling)', () => {
    expect(computeRaceGrantedCantrips({ race: 'Tiefling', character_data: {} }))
      .toEqual(['Thaumaturgy']);
  });
});
