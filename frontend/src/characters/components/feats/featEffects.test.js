import { describe, it, expect } from 'vitest';
import {
  allFeatEffects, getFeatStatMods, getFeatStatModSources, getFeatActions,
  getFeatUnarmedDice, featAbilityChoices, featFixedAbilityScores, isMechanized,
  getFeatResources, getFeatProficiencyGrants, getFeatSaveProficiencies, getFeatAcMods,
  getSpellGrantSpecs, getFeatGrantedSpells, featFreeCastUsedKey, featGrantRedundant,
  featAbilityChoiceOptions, abilityChoiceGrantsSave,
  getManeuverGrantSpec, maneuverGrantComplete, getFeatManeuvers,
  martialAdeptDieCount, martialAdeptManeuverCount,
} from '@/characters/components/feats/featEffects';

const MARTIAL_ADEPT = {
  id: 20, name: 'Martial Adept', level: 4,
  effects: [
    { kind: 'maneuver_grant', count: 2, die: 'd6', label: '2 maneuvers' },
    { kind: 'resource', key: 'martial_adept_superiority', label: 'Superiority Die (d6)', total: 1, recharge: 'short' },
    { kind: 'note', text: 'If already a Battle Master…' },
  ],
  choices: { maneuvers: ['Trip Attack', 'Riposte'] },
};

const MAGIC_INITIATE = {
  id: 9, name: 'Magic Initiate', level: 4,
  effects: [
    { kind: 'spell_grant', source_kind: 'class', cantrips: 2, leveled: [{ level: 1, count: 1 }], free_cast: 'long_rest', ability: 'class', label: 'Magic Initiate' },
    { kind: 'note', text: 'Castable once per long rest.' },
  ],
  // A snapshot of the player's picks, recorded at acquisition.
  choices: { spell_grant: { source: 'Wizard', ability: 'intelligence', cantrips: ['Fire Bolt', 'Light'], leveled: [{ name: 'Mage Armor', level: 1 }], free_casts: ['Mage Armor'] } },
};

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

  it('getFeatProficiencyGrants surfaces Tavern Brawler improvised-weapon proficiency', () => {
    const tavernBrawler = { name: 'Tavern Brawler', effects: [
      { kind: 'attack_mod', target: 'unarmed', dice: '1d4' },
      { kind: 'proficiency', prof_type: 'weapon', items: ['Improvised weapons'] },
    ] };
    expect(getFeatProficiencyGrants([tavernBrawler]).weapons).toEqual(['Improvised weapons']);
  });

  it('featGrantRedundant locks half-feats whose proficiency the character already has', () => {
    const heavilyArmored = { name: 'Heavily Armored', effects: [
      { kind: 'ability_score', ability: 'strength', amount: 1 },
      { kind: 'proficiency', prof_type: 'armor', items: ['Heavy'] },
    ] };
    const modArmored = { name: 'Moderately Armored', effects: [
      { kind: 'proficiency', prof_type: 'armor', items: ['Medium', 'Shields'] },
    ] };
    const weaponMaster = { name: 'Weapon Master', effects: [
      { kind: 'ability_choice', abilities: ['strength', 'dexterity'], amount: 1 },
      { kind: 'proficiency', prof_type: 'weapon', count: 4 },
    ] };
    const martialTraining = { name: 'Martial Weapon Training', effects: [
      { kind: 'ability_choice', abilities: ['strength', 'dexterity'], amount: 1 },
      { kind: 'proficiency', prof_type: 'weapon', items: ['Martial weapons'] },
    ] };
    const ALL = { simple: true, martial: true };
    // Armor already held → redundant (the +1 ASI is ignored).
    expect(featGrantRedundant(heavilyArmored, { armorProficiencies: ['light', 'medium', 'heavy'] })).toMatch(/already proficient with heavy armor/);
    // Lacks heavy → grants something new → selectable.
    expect(featGrantRedundant(heavilyArmored, { armorProficiencies: ['light', 'medium'] })).toBeNull();
    // Moderately Armored locks on medium (shields ignored per the medium-armor rule).
    expect(featGrantRedundant(modArmored, { armorProficiencies: ['light', 'medium'] })).toMatch(/already proficient with medium armor/);
    // Weapon Master (count, any weapon): all weapons → redundant; missing a category → selectable.
    expect(featGrantRedundant(weaponMaster, { weapons: ALL })).toMatch(/all weapon proficiencies/);
    expect(featGrantRedundant(weaponMaster, { weapons: { simple: true, martial: false } })).toBeNull();
    // Martial Weapon Training (fixed martial grant): locked when the class has martial weapons.
    expect(featGrantRedundant(martialTraining, { weapons: { simple: true, martial: true } })).toMatch(/already proficient with martial weapons/);
    expect(featGrantRedundant(martialTraining, { weapons: { simple: true, martial: false } })).toBeNull(); // Cleric → grants martial (new)
    // Feats without an armor/weapon grant are never flagged.
    expect(featGrantRedundant(ALERT, { armorProficiencies: ['light', 'medium', 'heavy'], weapons: ALL })).toBeNull();
    expect(featGrantRedundant(NO_EFFECTS)).toBeNull();
  });

  it('featAbilityChoiceOptions filters a save-granting choice (Resilient) to abilities not already proficient', () => {
    const resilient = { name: 'Resilient', effects: [
      { kind: 'ability_choice', abilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], amount: 1 },
      { kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true },
    ] };
    const tavernBrawler = { name: 'Tavern Brawler', effects: [{ kind: 'ability_choice', abilities: ['strength', 'constitution'], amount: 1 }] };
    expect(abilityChoiceGrantsSave(resilient)).toBe(true);
    expect(abilityChoiceGrantsSave(tavernBrawler)).toBe(false);
    const choice = featAbilityChoices(resilient)[0];
    // Fighter has STR + CON saves → those are removed from Resilient's chooser.
    expect(featAbilityChoiceOptions(resilient, choice, { saveProficiencies: ['strength', 'constitution'] }))
      .toEqual(['dexterity', 'intelligence', 'wisdom', 'charisma']);
    // A non-save half-feat is never filtered (the choice is just a +1 stat).
    expect(featAbilityChoiceOptions(tavernBrawler, featAbilityChoices(tavernBrawler)[0], { saveProficiencies: ['strength'] }))
      .toEqual(['strength', 'constitution']);
  });

  it('getFeatSaveProficiencies resolves from_ability_choice via the feat choice', () => {
    const resilient = { name: 'Resilient', choices: { ability: 'constitution' },
      effects: [{ kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true }] };
    expect(getFeatSaveProficiencies([resilient])).toEqual(['constitution']);
    // explicit ability + no-choice-yet
    expect(getFeatSaveProficiencies([{ name: 'X', effects: [{ kind: 'proficiency', prof_type: 'saving_throw', ability: 'wisdom' }] }])).toEqual(['wisdom']);
    expect(getFeatSaveProficiencies([{ name: 'Y', effects: [{ kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true }] }])).toEqual([]);
  });

  it('getFeatAcMods returns conditional AC effects', () => {
    const defense = { name: 'Defense', effects: [{ kind: 'ac_mod', amount: 1, condition: 'armor' }] };
    const mam = { name: 'Medium Armor Master', effects: [{ kind: 'ac_mod', condition: 'medium_armor_dex_cap', dex_cap: 3 }] };
    expect(getFeatAcMods([defense])).toEqual([{ amount: 1, condition: 'armor', dexCap: 0, source: 'Defense' }]);
    expect(getFeatAcMods([mam])[0]).toMatchObject({ condition: 'medium_armor_dex_cap', dexCap: 3 });
    expect(getFeatAcMods([NO_EFFECTS])).toEqual([]);
  });

  it('isMechanized: true when a non-note effect exists', () => {
    expect(isMechanized(ALERT)).toBe(true);
    expect(isMechanized(TAVERN_BRAWLER)).toBe(true);
    expect(isMechanized(MAGIC_INITIATE)).toBe(true); // spell_grant counts
    expect(isMechanized(PROSE_ONLY)).toBe(false); // note-only
    expect(isMechanized(NO_EFFECTS)).toBe(false);
  });

  it('getSpellGrantSpecs reads the grant spec the player must fulfil at acquisition', () => {
    expect(getSpellGrantSpecs(MAGIC_INITIATE)).toEqual([{
      source_kind: 'class', cantrips: 2, leveled: [{ level: 1, count: 1 }],
      fixed: [], free_cast: 'long_rest', ability: 'class', label: 'Magic Initiate',
    }]);
    expect(getSpellGrantSpecs(ALERT)).toEqual([]); // no spell_grant effect
    expect(getSpellGrantSpecs(NO_EFFECTS)).toEqual([]);
  });

  it('getFeatGrantedSpells flattens the picked spells from each feat instance', () => {
    const out = getFeatGrantedSpells([MAGIC_INITIATE, ALERT]);
    expect(out.cantrips).toEqual([
      { name: 'Fire Bolt', level: 0, source: 'Magic Initiate' },
      { name: 'Light', level: 0, source: 'Magic Initiate' },
    ]);
    expect(out.leveled).toEqual([{ name: 'Mage Armor', level: 1, source: 'Magic Initiate' }]);
    expect(out.freeCasts).toEqual([{ name: 'Mage Armor', level: 1, source: 'Magic Initiate', ability: 'intelligence', usedKey: 'feat_freecast_mage_armor_used' }]);
  });

  it('getFeatGrantedSpells includes always-granted fixed spells (Telekinetic/Telepathic)', () => {
    const telepathic = { id: 11, name: 'Telepathic', choices: { spell_grant: {
      fixed: [{ name: 'Detect Thoughts', level: 2 }], cantrips: [], leveled: [], free_casts: ['Detect Thoughts'],
    } } };
    const telekinetic = { id: 12, name: 'Telekinetic', choices: { spell_grant: {
      fixed: [{ name: 'Mage Hand', level: 0 }], cantrips: [], leveled: [], free_casts: [],
    } } };
    const out = getFeatGrantedSpells([telepathic, telekinetic]);
    expect(out.leveled).toEqual([{ name: 'Detect Thoughts', level: 2, source: 'Telepathic' }]);
    expect(out.cantrips).toEqual([{ name: 'Mage Hand', level: 0, source: 'Telekinetic' }]);
    expect(out.freeCasts).toEqual([{ name: 'Detect Thoughts', level: 2, source: 'Telepathic', ability: undefined, usedKey: 'feat_freecast_detect_thoughts_used' }]);
  });

  it('getFeatGrantedSpells is empty for feats without a spell_grant snapshot', () => {
    expect(getFeatGrantedSpells([ALERT, NO_EFFECTS])).toEqual({ cantrips: [], leveled: [], freeCasts: [], ritualBooks: [] });
    expect(getFeatGrantedSpells()).toEqual({ cantrips: [], leveled: [], freeCasts: [], ritualBooks: [] });
  });

  it('getFeatGrantedSpells returns an editable ritual book (Ritual Caster), excluded from leveled', () => {
    const ritualCaster = { id: 13, name: 'Ritual Caster', choices: { spell_grant: {
      source: 'Wizard', ability: 'intelligence', ritual: true, ritual_book: ['Detect Magic', 'Identify'],
    } } };
    const out = getFeatGrantedSpells([{ name: 'Alert' }, ritualCaster]);
    expect(out.ritualBooks).toEqual([{ featIndex: 1, source: 'Ritual Caster', spells: ['Detect Magic', 'Identify'] }]);
    expect(out.leveled).toEqual([]); // ritual spells aren't lumped into the generic leveled list
    expect(out.freeCasts).toEqual([]); // cast as rituals only, no free cast
  });

  it('featFreeCastUsedKey slugifies the spell name (must match the backend key)', () => {
    expect(featFreeCastUsedKey('Mage Armor')).toBe('feat_freecast_mage_armor_used');
    expect(featFreeCastUsedKey("Tasha's Hideous Laughter")).toBe('feat_freecast_tasha_s_hideous_laughter_used');
    expect(featFreeCastUsedKey('')).toBe('feat_freecast__used');
  });

  it('getManeuverGrantSpec extracts the maneuver_grant clause (Martial Adept)', () => {
    expect(getManeuverGrantSpec(MARTIAL_ADEPT)).toEqual({ count: 2, die: 'd6', label: '2 maneuvers' });
    expect(getManeuverGrantSpec(ALERT)).toBeNull();
    expect(getManeuverGrantSpec(null)).toBeNull();
  });

  it('maneuverGrantComplete gates on exactly count picks', () => {
    const spec = getManeuverGrantSpec(MARTIAL_ADEPT);
    expect(maneuverGrantComplete(spec, [])).toBe(false);
    expect(maneuverGrantComplete(spec, ['Trip Attack'])).toBe(false);
    expect(maneuverGrantComplete(spec, ['Trip Attack', 'Riposte'])).toBe(true);
    expect(maneuverGrantComplete(null, [])).toBe(true); // no spec → nothing to satisfy
  });

  it('getFeatManeuvers reads choices.maneuvers from each feat instance', () => {
    expect(getFeatManeuvers([MARTIAL_ADEPT])).toEqual([
      { name: 'Trip Attack', die: 'd6', source: 'Martial Adept' },
      { name: 'Riposte', die: 'd6', source: 'Martial Adept' },
    ]);
    expect(getFeatManeuvers([ALERT])).toEqual([]); // no maneuvers chosen
    expect(getFeatManeuvers([{ name: 'Martial Adept', effects: MARTIAL_ADEPT.effects }])).toEqual([]); // no choices snapshot
  });

  it('martialAdeptDieCount / martialAdeptManeuverCount sum the Battle Master boosts', () => {
    expect(martialAdeptDieCount([MARTIAL_ADEPT])).toBe(1);
    expect(martialAdeptManeuverCount([MARTIAL_ADEPT])).toBe(2);
    expect(martialAdeptDieCount([ALERT, TAVERN_BRAWLER])).toBe(0);
    expect(martialAdeptManeuverCount([])).toBe(0);
  });

  it('isMechanized counts a maneuver_grant feat', () => {
    expect(isMechanized(MARTIAL_ADEPT)).toBe(true);
  });

  it('getFeatResources still surfaces the Martial Adept d6 (consumer suppresses it for a Battle Master)', () => {
    const res = getFeatResources([MARTIAL_ADEPT]);
    expect(res).toEqual([
      { key: 'martial_adept_superiority', usedKey: 'martial_adept_superiority_used', label: 'Superiority Die (d6)', total: 1, recharge: 'short', source: 'Martial Adept' },
    ]);
  });
});
