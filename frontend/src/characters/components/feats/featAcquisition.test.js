import { describe, it, expect } from 'vitest';
import {
  resolveFeatAcquisition, toggleFeatProficiency, featAdditionPatch, EMPTY_FEAT_CHOICES,
} from './featAcquisition';

// Feats shaped the way the seeded catalogue shapes them.
const ALERT = { id: 1, name: 'Alert', effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5 }] };
const TOUGH = { id: 2, name: 'Tough' }; // no structured effects at all
const TAVERN_BRAWLER = {
  id: 3, name: 'Tavern Brawler',
  effects: [{ kind: 'ability_choice', abilities: ['strength', 'constitution'], amount: 1 }],
};
const ACTOR = { id: 4, name: 'Actor', effects: [{ kind: 'ability_score', ability: 'charisma', amount: 1 }] };
const RESILIENT = {
  id: 5, name: 'Resilient',
  effects: [
    { kind: 'ability_choice', abilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], amount: 1 },
    { kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true },
  ],
};
const SKILLED = { id: 6, name: 'Skilled', effects: [{ kind: 'proficiency', prof_type: 'skill_or_tool', count: 3 }] };
const LINGUIST = { id: 7, name: 'Linguist', effects: [{ kind: 'proficiency', prof_type: 'language', count: 3 }] };
const SKILL_EXPERT = {
  id: 8, name: 'Skill Expert',
  effects: [
    { kind: 'ability_choice', abilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], amount: 1 },
    { kind: 'proficiency', prof_type: 'skill', count: 1 },
    { kind: 'expertise', count: 1 },
  ],
};
const MAGIC_INITIATE = {
  id: 9, name: 'Magic Initiate',
  effects: [{ kind: 'spell_grant', source_kind: 'class', cantrips: 2, leveled: [{ level: 1, count: 1 }], free_cast: 'long_rest', ability: 'choice' }],
};
const MARTIAL_ADEPT = { id: 10, name: 'Martial Adept', effects: [{ kind: 'maneuver_grant', count: 2, die: 'd6' }] };

const take = (feat, choices, extra = {}) => resolveFeatAcquisition({ feat, choices, ...extra });

describe('resolveFeatAcquisition — a feat that asks nothing', () => {
  it('is complete at once and needs no choices', () => {
    const m = take(ALERT);
    expect(m.needsChoices).toBe(false);
    expect(m.complete).toEqual({ ability: true, prof: true, spell: true, maneuvers: true, all: true });
    expect(m.asi).toEqual({});
    expect(m.profPatch({ skill_proficiencies: ['Athletics'] })).toEqual({});
  });

  it('snapshots the effects onto the entry, with no choices key', () => {
    expect(take(ALERT).entry({ level: 4 })).toEqual({ id: 1, name: 'Alert', level: 4, effects: ALERT.effects });
  });

  it('a feat with no effects is stored as just id + name', () => {
    expect(take(TOUGH).entry()).toEqual({ id: 2, name: 'Tough' });
  });

  it('omits level when none is given (a GM-added feat has no acquisition level)', () => {
    expect(take(ALERT).entry()).not.toHaveProperty('level');
    expect(take(ALERT).entry({ level: 1 }).level).toBe(1);
  });

  it('no feat at all resolves to an inert, complete model', () => {
    const m = resolveFeatAcquisition({ feat: null });
    expect(m.needsChoices).toBe(false);
    expect(m.complete.all).toBe(true);
    expect(m.entry()).toBeNull();
    expect(m.profPatch()).toEqual({});
    expect(resolveFeatAcquisition().entry()).toBeNull();
  });
});

describe('resolveFeatAcquisition — half-feat ability score', () => {
  it('blocks until an ability is chosen', () => {
    const m = take(TAVERN_BRAWLER);
    expect(m.needsChoices).toBe(true);
    expect(m.abilityChoice).toEqual({ abilities: ['strength', 'constitution'], amount: 1 });
    expect(m.abilityOptions).toEqual(['strength', 'constitution']);
    expect(m.complete.ability).toBe(false);
    expect(m.complete.all).toBe(false);
    expect(m.asi).toEqual({});
  });

  it('records the choice, reports the increase and completes', () => {
    const m = take(TAVERN_BRAWLER, { ability: 'constitution' });
    expect(m.complete.all).toBe(true);
    expect(m.asi).toEqual({ constitution: 1 });
    expect(m.entry({ level: 4 })).toEqual({
      id: 3, name: 'Tavern Brawler', level: 4, effects: TAVERN_BRAWLER.effects, choices: { ability: 'constitution' },
    });
  });

  it('a FIXED increase needs no choice but is still reported', () => {
    const m = take(ACTOR);
    expect(m.needsChoices).toBe(false);
    expect(m.complete.all).toBe(true);
    expect(m.asi).toEqual({ charisma: 1 });
    expect(m.entry()).not.toHaveProperty('choices');
  });

  it('Resilient does not offer a save the character already has', () => {
    const m = take(RESILIENT, undefined, { saveProficiencies: ['strength', 'Constitution'] });
    expect(m.abilityOptions).toEqual(['dexterity', 'intelligence', 'wisdom', 'charisma']);
  });

  it('an ordinary half-feat ignores held saves — it only raises a score', () => {
    const m = take(TAVERN_BRAWLER, undefined, { saveProficiencies: ['strength', 'constitution'] });
    expect(m.abilityOptions).toEqual(['strength', 'constitution']);
  });
});

describe('resolveFeatAcquisition — count-choice proficiencies', () => {
  it('blocks until the full count is picked', () => {
    expect(take(LINGUIST, { prof: { language: ['Elvish', 'Dwarvish'] } }).complete.prof).toBe(false);
    expect(take(LINGUIST, { prof: { language: ['Elvish', 'Dwarvish', 'Giant'] } }).complete.prof).toBe(true);
  });

  it('exposes each grant with its options, what is chosen and how many are required', () => {
    const [grant] = take(LINGUIST, { prof: { language: ['Elvish'] } }).profGrants;
    expect(grant.prof_type).toBe('language');
    expect(grant.count).toBe(3);
    expect(grant.required).toBe(3);
    expect(grant.chosen).toEqual(['Elvish']);
    expect(grant.options).toContain('Giant');
  });

  it('does not offer a language the character already has', () => {
    const [grant] = take(LINGUIST, undefined, { characterData: { race_languages: ['Elvish'] } }).profGrants;
    expect(grant.options).not.toContain('Elvish');
  });

  it('does not offer a skill the character is already proficient in', () => {
    const [grant] = take(SKILLED, undefined, { characterData: { skill_proficiencies: ['Athletics'] } }).profGrants;
    expect(grant.options).not.toContain('Athletics');
    expect(grant.options).toContain('Stealth');
  });

  it('profPatch with no base returns only what the feat adds', () => {
    const m = take(LINGUIST, { prof: { language: ['Elvish', 'Dwarvish', 'Giant'] } });
    expect(m.profPatch()).toEqual({ feat_languages: ['Elvish', 'Dwarvish', 'Giant'] });
  });

  it('profPatch over the character merges with what is already there, without duplicates', () => {
    const m = take(LINGUIST, { prof: { language: ['Elvish', 'Giant'] } });
    expect(m.profPatch({ feat_languages: ['Orc', 'Elvish'] })).toEqual({ feat_languages: ['Orc', 'Elvish', 'Giant'] });
  });

  it('Skilled splits its picks: skills to skill_proficiencies, tools to feat_tool_proficiencies', () => {
    const m = take(SKILLED, { prof: { skill_or_tool: ['Stealth', "Thieves' Tools", 'Arcana'] } });
    const patch = m.profPatch({ skill_proficiencies: ['Athletics'] });
    expect(patch.skill_proficiencies).toEqual(['Athletics', 'Stealth', 'Arcana']);
    expect(patch.feat_tool_proficiencies).toEqual(["Thieves' Tools"]);
    // Only the SKILLS are recorded on the feat instance (the skills panel flags them).
    expect(m.skillPicks).toEqual(['Stealth', 'Arcana']);
    expect(m.entry().choices).toEqual({ skills: ['Stealth', 'Arcana'] });
  });

  it('never mutates the base it is merged over', () => {
    const base = { feat_languages: ['Orc'] };
    take(LINGUIST, { prof: { language: ['Elvish'] } }).profPatch(base);
    expect(base).toEqual({ feat_languages: ['Orc'] });
  });
});

describe('resolveFeatAcquisition — Skill Expert (a skill, then expertise in a proficient one)', () => {
  it('the Expertise pool is the skills already proficient', () => {
    const m = take(SKILL_EXPERT, undefined, { proficientSkills: ['Athletics', 'Perception'] });
    const expertise = m.profGrants.find((g) => g.prof_type === 'expertise');
    expect(expertise.options).toEqual(expect.arrayContaining(['Athletics', 'Perception']));
  });

  it('the skill this very feat grants joins its own Expertise pool', () => {
    const m = take(SKILL_EXPERT, { prof: { skill: ['Stealth'] } }, { proficientSkills: ['Athletics'] });
    const expertise = m.profGrants.find((g) => g.prof_type === 'expertise');
    expect(expertise.options).toContain('Stealth');
  });

  it('an Expertise grant with nothing to pick auto-completes instead of blocking', () => {
    const m = take(SKILL_EXPERT, { ability: 'dexterity', prof: { skill: [] } }, { proficientSkills: [] });
    const expertise = m.profGrants.find((g) => g.prof_type === 'expertise');
    expect(expertise.options).toEqual([]);
    expect(expertise.required).toBe(0);
    // …while the skill grant itself still has to be filled.
    expect(m.complete.prof).toBe(false);
  });

  it('is complete once the ability, the skill and the expertise are all chosen', () => {
    const m = take(SKILL_EXPERT, { ability: 'dexterity', prof: { skill: ['Stealth'], expertise: ['Stealth'] } });
    expect(m.complete.all).toBe(true);
    expect(m.profPatch()).toEqual({ skill_proficiencies: ['Stealth'], expertise_skills: ['Stealth'] });
    expect(m.entry().choices).toEqual({ ability: 'dexterity', skills: ['Stealth'] });
  });
});

describe('resolveFeatAcquisition — spell grants', () => {
  const filled = {
    source: 'Wizard', ability: 'intelligence',
    cantrips: ['Fire Bolt', 'Mage Hand'], leveled: [{ name: 'Shield', level: 1 }],
  };

  it('blocks until the grant is filled', () => {
    const m = take(MAGIC_INITIATE);
    expect(m.needsChoices).toBe(true);
    expect(m.spellSpec).toBeTruthy();
    expect(m.complete.spell).toBe(false);
    expect(take(MAGIC_INITIATE, { spell: { ...filled, cantrips: ['Fire Bolt'] } }).complete.spell).toBe(false);
  });

  it('stores the RESOLVED grant (picks plus free casts) on the entry', () => {
    const m = take(MAGIC_INITIATE, { spell: filled });
    expect(m.complete.all).toBe(true);
    const grant = m.entry({ level: 1 }).choices.spell_grant;
    expect(grant.cantrips).toEqual(['Fire Bolt', 'Mage Hand']);
    expect(grant.leveled).toEqual([{ name: 'Shield', level: 1 }]);
    expect(grant.free_casts).toEqual(['Shield']);
  });

  it('a spell feat adds no proficiencies and no ability increase', () => {
    const m = take(MAGIC_INITIATE, { spell: filled });
    expect(m.profPatch({ skill_proficiencies: ['Arcana'] })).toEqual({});
    expect(m.asi).toEqual({});
  });
});

describe('resolveFeatAcquisition — maneuvers', () => {
  it('blocks until exactly the granted count is chosen', () => {
    expect(take(MARTIAL_ADEPT).complete.maneuvers).toBe(false);
    expect(take(MARTIAL_ADEPT, { maneuvers: ['Riposte'] }).complete.maneuvers).toBe(false);
    expect(take(MARTIAL_ADEPT, { maneuvers: ['Riposte', 'Parry'] }).complete.maneuvers).toBe(true);
    expect(take(MARTIAL_ADEPT, { maneuvers: ['Riposte', 'Parry', 'Rally'] }).complete.maneuvers).toBe(false);
  });

  it('records the chosen maneuvers on the entry', () => {
    const entry = take(MARTIAL_ADEPT, { maneuvers: ['Riposte', 'Parry'] }).entry({ level: 4 });
    expect(entry.choices).toEqual({ maneuvers: ['Riposte', 'Parry'] });
  });
});

describe('toggleFeatProficiency', () => {
  it('adds an option, then removes it', () => {
    const one = toggleFeatProficiency(EMPTY_FEAT_CHOICES, 'language', 'Elvish', 3);
    expect(one.prof).toEqual({ language: ['Elvish'] });
    expect(toggleFeatProficiency(one, 'language', 'Elvish', 3).prof).toEqual({ language: [] });
  });

  it('refuses to exceed the grant count', () => {
    const full = { ...EMPTY_FEAT_CHOICES, prof: { language: ['Elvish', 'Giant', 'Orc'] } };
    expect(toggleFeatProficiency(full, 'language', 'Dwarvish', 3).prof.language).toEqual(['Elvish', 'Giant', 'Orc']);
  });

  it('still lets a pick be REMOVED at the limit', () => {
    const full = { ...EMPTY_FEAT_CHOICES, prof: { language: ['Elvish', 'Giant', 'Orc'] } };
    expect(toggleFeatProficiency(full, 'language', 'Giant', 3).prof.language).toEqual(['Elvish', 'Orc']);
  });

  it('leaves the other grants and the other choices alone', () => {
    const start = { ability: 'dexterity', prof: { skill: ['Stealth'] }, spell: { source: 'Wizard' }, maneuvers: ['Parry'] };
    const next = toggleFeatProficiency(start, 'expertise', 'Stealth', 1);
    expect(next).toEqual({ ...start, prof: { skill: ['Stealth'], expertise: ['Stealth'] } });
  });

  it('does not mutate its input, including the frozen empty choices', () => {
    const start = { ...EMPTY_FEAT_CHOICES, prof: { language: ['Elvish'] } };
    toggleFeatProficiency(start, 'language', 'Giant', 3);
    expect(start.prof).toEqual({ language: ['Elvish'] });
    expect(() => toggleFeatProficiency(EMPTY_FEAT_CHOICES, 'language', 'Giant', 3)).not.toThrow();
    expect(EMPTY_FEAT_CHOICES.prof).toEqual({});
  });
});

describe('featAdditionPatch — adding a feat outside the level-up wizard', () => {
  it('appends the entry to the existing feats', () => {
    const patch = featAdditionPatch(take(ALERT), { feats: [{ id: 2, name: 'Tough' }] });
    expect(patch).toEqual({ feats: [{ id: 2, name: 'Tough' }, { id: 1, name: 'Alert', effects: ALERT.effects }] });
  });

  it('carries the proficiency picks merged over the character', () => {
    const m = take(LINGUIST, { prof: { language: ['Elvish', 'Giant', 'Orc'] } });
    const patch = featAdditionPatch(m, { feats: [], feat_languages: ['Dwarvish'] });
    expect(patch.feat_languages).toEqual(['Dwarvish', 'Elvish', 'Giant', 'Orc']);
    expect(patch.feats).toHaveLength(1);
  });

  it('a Battle Master folds the feat maneuvers into the shared known list', () => {
    const m = take(MARTIAL_ADEPT, { maneuvers: ['Riposte', 'Parry'] });
    const patch = featAdditionPatch(m, { subclass: 'Battle Master', maneuvers: ['Parry', 'Rally'], feats: [] });
    expect(patch.maneuvers).toEqual(['Parry', 'Rally', 'Riposte']);
  });

  it("a non-Battle-Master's maneuvers stay on the feat instance only", () => {
    const m = take(MARTIAL_ADEPT, { maneuvers: ['Riposte', 'Parry'] });
    const patch = featAdditionPatch(m, { subclass: 'Champion', feats: [] });
    expect(patch).not.toHaveProperty('maneuvers');
    expect(patch.feats[0].choices.maneuvers).toEqual(['Riposte', 'Parry']);
  });

  it('never writes ability scores — those are reported in model.asi for the page to apply', () => {
    const m = take(TAVERN_BRAWLER, { ability: 'strength' });
    const patch = featAdditionPatch(m, { feats: [] });
    expect(Object.keys(patch)).toEqual(['feats']);
    expect(m.asi).toEqual({ strength: 1 });
  });

  it('adds nothing when there is no feat', () => {
    expect(featAdditionPatch(resolveFeatAcquisition({ feat: null }), { feats: [{ id: 1, name: 'Alert' }] })).toEqual({});
  });
});

describe('one model, three surfaces — the same feat stores the same entry', () => {
  it('creation (level 1), level-up (level 8) and the GM add differ only in the level', () => {
    const choices = { ability: 'dexterity', prof: { skill: ['Stealth'], expertise: ['Stealth'] } };
    const atCreation = take(SKILL_EXPERT, choices).entry({ level: 1 });
    const atLevelUp = take(SKILL_EXPERT, choices).entry({ level: 8 });
    const fromGm = take(SKILL_EXPERT, choices).entry();
    const { level: _a, ...creationRest } = atCreation;
    const { level: _b, ...levelUpRest } = atLevelUp;
    expect(creationRest).toEqual(fromGm);
    expect(levelUpRest).toEqual(fromGm);
  });
});
