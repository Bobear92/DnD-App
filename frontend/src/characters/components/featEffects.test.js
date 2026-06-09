import { describe, it, expect } from 'vitest';
import {
  allFeatEffects, getFeatStatMods, getFeatStatModSources, getFeatActions,
  getFeatUnarmedDice, featAbilityChoices, featFixedAbilityScores, isMechanized,
  getFeatResources, getFeatProficiencyGrants, getFeatSaveProficiencies,
} from './featEffects';

const ALERT = {
  id: 1, name: 'Alert', level: 4,
  effects: [
    { kind: 'stat_mod', stat: 'initiative', amount: 5, label: '+5 initiative' },
    { kind: 'note', text: "Can't be surprised." },
  ],
};
const TAVERN_BRAWLER = {
  id: 2, name: 'Tavern Brawler', level: 1,
  effects: [
    { kind: 'ability_choice', abilities: ['strength', 'constitution'], amount: 1 },
    { kind: 'attack_mod', target: 'unarmed', dice: '1d4' },
    { kind: 'action', name: 'Grapple (Tavern Brawler)', economy: 'bonus', description: 'Grapple after a hit.', trigger: 'After an unarmed hit' },
  ],
};
const DURABLE = { id: 3, name: 'Durable', effects: [{ kind: 'ability_score', ability: 'constitution', amount: 1 }] };
const PROSE_ONLY = { id: 4, name: 'Mysterious', effects: [{ kind: 'note', text: 'Flavor only.' }] };
const NO_EFFECTS = { id: 5, name: 'Legacy Feat' }; // pre-effects feat

describe('featEffects resolver', () => {
  it('flattens effects across feats and tags the source feat', () => {
    const all = allFeatEffects([ALERT, TAVERN_BRAWLER]);
    expect(all).toHaveLength(5);
    expect(all.find((e) => e.kind === 'stat_mod')._featName).toBe('Alert');
  });

  it('handles feats without effects safely', () => {
    expect(allFeatEffects([NO_EFFECTS])).toEqual([]);
    expect(getFeatStatMods([NO_EFFECTS], 'initiative')).toBe(0);
    expect(getFeatActions([NO_EFFECTS])).toEqual([]);
    expect(getFeatUnarmedDice([NO_EFFECTS])).toBeNull();
  });

  it('sums stat_mods for a stat (Alert +5 initiative)', () => {
    expect(getFeatStatMods([ALERT, TAVERN_BRAWLER], 'initiative')).toBe(5);
    expect(getFeatStatMods([ALERT], 'armor_class')).toBe(0);
  });

  it('reports stat_mod sources for display', () => {
    expect(getFeatStatModSources([ALERT], 'initiative')).toEqual([
      { source: 'Alert', amount: 5, label: '+5 initiative' },
    ]);
  });

  it("resolves a 'pb' stat_mod amount with the proficiency bonus (2024 Alert)", () => {
    const alert2024 = { name: 'Alert', effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 'pb', label: '+PB initiative' }] };
    expect(getFeatStatMods([alert2024], 'initiative', { pb: 3 })).toBe(3);
    expect(getFeatStatMods([alert2024], 'initiative')).toBe(0); // no pb provided → contributes nothing
    expect(getFeatStatModSources([alert2024], 'initiative', { pb: 4 })[0].amount).toBe(4);
  });

  it("resolves a 'pb' resource total with the proficiency bonus (2024 Lucky)", () => {
    const lucky2024 = { name: 'Lucky', effects: [{ kind: 'resource', key: 'luck_points', total: 'pb', recharge: 'long', label: 'Luck Points' }] };
    expect(getFeatResources([lucky2024], { pb: 3 })[0].total).toBe(3);
    expect(getFeatResources([lucky2024], { pb: 5 })[0].total).toBe(5);
  });

  it('extracts feat actions for the Action Economy tab', () => {
    const actions = getFeatActions([TAVERN_BRAWLER]);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ name: 'Grapple (Tavern Brawler)', economy: 'bonus', source: 'Tavern Brawler' });
    expect(actions[0].key).toContain('Tavern Brawler');
  });

  it('returns the unarmed-strike die (largest when several apply)', () => {
    expect(getFeatUnarmedDice([TAVERN_BRAWLER])).toBe('1d4');
    const both = [TAVERN_BRAWLER, { name: 'X', effects: [{ kind: 'attack_mod', target: 'unarmed', dice: '1d6' }] }];
    expect(getFeatUnarmedDice(both)).toBe('1d6');
  });

  it('extracts ability_choice requirements from a feat being picked', () => {
    expect(featAbilityChoices(TAVERN_BRAWLER)).toEqual([{ abilities: ['strength', 'constitution'], amount: 1 }]);
    expect(featAbilityChoices(ALERT)).toEqual([]);
    expect(featAbilityChoices(NO_EFFECTS)).toEqual([]);
  });

  it('extracts fixed ability scores', () => {
    expect(featFixedAbilityScores(DURABLE)).toEqual([{ ability: 'constitution', amount: 1 }]);
    expect(featFixedAbilityScores(TAVERN_BRAWLER)).toEqual([]); // choice, not fixed
  });

  it('getFeatResources returns rest-rechargeable pools (deduped, largest total)', () => {
    const lucky = { id: 30, name: 'Lucky', effects: [{ kind: 'resource', key: 'luck_points', label: 'Luck Points', total: 3, recharge: 'long' }] };
    const adept = { id: 31, name: 'Martial Adept', effects: [{ kind: 'resource', key: 'martial_adept_superiority', label: 'Superiority Die (d6)', total: 1, recharge: 'short' }] };
    expect(getFeatResources([lucky])).toEqual([
      { key: 'luck_points', usedKey: 'luck_points_used', label: 'Luck Points', total: 3, recharge: 'long', source: 'Lucky' },
    ]);
    const both = getFeatResources([lucky, adept]);
    expect(both).toHaveLength(2);
    expect(both.find((r) => r.key === 'martial_adept_superiority').recharge).toBe('short');
    expect(getFeatResources([NO_EFFECTS])).toEqual([]);
  });

  it('getFeatProficiencyGrants buckets fixed grants (items only, not count choices)', () => {
    const heavy = { name: 'Heavily Armored', effects: [{ kind: 'proficiency', prof_type: 'armor', items: ['Heavy'] }] };
    const skilled = { name: 'Skilled', effects: [{ kind: 'proficiency', prof_type: 'skill_or_tool', count: 3 }] };
    const grants = getFeatProficiencyGrants([heavy, skilled]);
    expect(grants.armor).toEqual(['Heavy']);
    expect(grants.weapons).toEqual([]); // count-choice (Skilled) not included
  });

  it('getFeatSaveProficiencies resolves from_ability_choice via the feat choice', () => {
    const resilient = { name: 'Resilient', choices: { ability: 'constitution' },
      effects: [{ kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true }] };
    expect(getFeatSaveProficiencies([resilient])).toEqual(['constitution']);
    // explicit ability + no-choice-yet
    expect(getFeatSaveProficiencies([{ name: 'X', effects: [{ kind: 'proficiency', prof_type: 'saving_throw', ability: 'wisdom' }] }])).toEqual(['wisdom']);
    expect(getFeatSaveProficiencies([{ name: 'Y', effects: [{ kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true }] }])).toEqual([]);
  });

  it('isMechanized: true when a non-note effect exists', () => {
    expect(isMechanized(ALERT)).toBe(true);
    expect(isMechanized(TAVERN_BRAWLER)).toBe(true);
    expect(isMechanized(PROSE_ONLY)).toBe(false); // note-only
    expect(isMechanized(NO_EFFECTS)).toBe(false);
  });
});
