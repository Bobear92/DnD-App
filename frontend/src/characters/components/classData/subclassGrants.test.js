import { describe, it, expect } from 'vitest';
import {
  SUBCLASS_GRANTS,
  getSubclassGrants,
  getEarnedSubclassGrants,
  availableGrantOptions,
  applyGrant,
  grantStoreFieldFor,
  grantStoreFields,
} from '@/characters/components/classData/subclassGrants';

const studentOfWar = SUBCLASS_GRANTS.Fighter['5e']['Battle Master'][0];
const additionalStyle5e = SUBCLASS_GRANTS.Fighter['5e'].Champion[0];
const cavalierBonusProf = SUBCLASS_GRANTS.Fighter['5e'].Cavalier[0];

describe('subclassGrants — data integrity', () => {
  it('Battle Master grants Student of War (tool, banner) at L3 both editions', () => {
    expect(SUBCLASS_GRANTS.Fighter['5e']['Battle Master'][0].level).toBe(3);
    expect(SUBCLASS_GRANTS.Fighter['5.5e']['Battle Master'][0].level).toBe(3);
    expect(studentOfWar.storeField).toBe('subclass_tool_proficiencies');
    expect(studentOfWar.surface).toBe('banner');
  });

  it('Champion grants Additional Fighting Style (sheet) at L10 5e / L7 2024', () => {
    expect(SUBCLASS_GRANTS.Fighter['5e'].Champion[0].level).toBe(10);
    expect(SUBCLASS_GRANTS.Fighter['5.5e'].Champion[0].level).toBe(7);
    expect(additionalStyle5e.storeField).toBe('additional_fighting_styles');
    expect(additionalStyle5e.surface).not.toBe('banner'); // shown on the sheet
  });

  it('every grant has the required fields and a non-empty {value} option pool + heldFrom', () => {
    Object.values(SUBCLASS_GRANTS).forEach((byEdition) =>
      Object.values(byEdition).forEach((bySub) =>
        Object.values(bySub).forEach((grants) =>
          grants.forEach((g) => {
            expect(g.key).toBeTruthy();
            expect(g.label).toBeTruthy();
            expect(g.count).toBeGreaterThan(0);
            expect(g.storeField).toBeTruthy();
            expect(g.options.length).toBeGreaterThan(0);
            expect(g.options[0]).toHaveProperty('value');
            expect(typeof g.heldFrom).toBe('function');
          })
        )
      )
    );
  });
});

describe('subclassGrants — Arcane Archer Lore', () => {
  const [loreSkill, loreCantrip] = SUBCLASS_GRANTS.Fighter['5e']['Arcane Archer'];

  it('grants a skill and a cantrip, both at level 3', () => {
    expect(SUBCLASS_GRANTS.Fighter['5e']['Arcane Archer']).toHaveLength(2);
    expect(loreSkill.level).toBe(3);
    expect(loreCantrip.level).toBe(3);
  });

  it('routes the skill to skill_proficiencies and the cantrip to subclass_cantrips', () => {
    expect(loreSkill.storeField).toBe('skill_proficiencies');
    expect(loreSkill.options.map((o) => o.value)).toEqual(['Arcana', 'Nature']);
    expect(loreCantrip.storeField).toBe('subclass_cantrips');
    expect(loreCantrip.options.map((o) => o.value)).toEqual(['Prestidigitation', 'Druidcraft']);
  });

  // Neither is a class-pool pick, so neither should be repeated in the ClassSheet grant block —
  // the Skills panel and the Spells tab already show them.
  it('surfaces on the skills panel and the spells tab, not the sheet block', () => {
    expect(loreSkill.surface).toBe('skills');
    expect(loreCantrip.surface).toBe('spells');
  });

  it('hides a skill the character is already proficient in', () => {
    const opts = availableGrantOptions(loreSkill, { skill_proficiencies: ['Arcana'] });
    expect(opts.map((o) => o.value)).toEqual(['Nature']);
  });

  it('hides a cantrip the character already knows from another source', () => {
    expect(availableGrantOptions(loreCantrip, { high_elf_cantrip: 'Prestidigitation' })
      .map((o) => o.value)).toEqual(['Druidcraft']);
    expect(availableGrantOptions(loreCantrip, { subclass_cantrips: ['Druidcraft'] })
      .map((o) => o.value)).toEqual(['Prestidigitation']);
    expect(availableGrantOptions(loreCantrip, { cantrips: ['Prestidigitation'] })
      .map((o) => o.value)).toEqual(['Druidcraft']);
  });

  // Cross-feature: a feat can grant the same cantrip, and that's invisible from the subclass's
  // own feature text — dedupe against feat spell grants too.
  it('hides a cantrip already granted by a feat (Magic Initiate)', () => {
    const cd = {
      feats: [{ name: 'Magic Initiate', choices: { spell_grant: { source: 'Druid', cantrips: ['Druidcraft'] } } }],
    };
    expect(availableGrantOptions(loreCantrip, cd).map((o) => o.value)).toEqual(['Prestidigitation']);
  });

  it('has no 2024 entry (no 2024 Arcane Archer exists)', () => {
    expect(SUBCLASS_GRANTS.Fighter['5.5e']['Arcane Archer']).toBeUndefined();
    expect(getSubclassGrants('Fighter', '5.5e', 'Arcane Archer', 3)).toHaveLength(0);
  });

  it('fires both grants at level 3 in the wizard', () => {
    expect(getSubclassGrants('Fighter', '5e', 'Arcane Archer', 3)).toHaveLength(2);
    expect(getSubclassGrants('Fighter', '5e', 'Arcane Archer', 4)).toHaveLength(0);
  });
});

describe('getSubclassGrants (exact level — wizard)', () => {
  it('returns a grant only at its exact level', () => {
    expect(getSubclassGrants('Fighter', '5e', 'Champion', 10)).toHaveLength(1);
    expect(getSubclassGrants('Fighter', '5e', 'Champion', 9)).toHaveLength(0);
    expect(getSubclassGrants('Fighter', '5e', 'Battle Master', 3)).toHaveLength(1);
    expect(getSubclassGrants('Fighter', '5e', 'Battle Master', 4)).toHaveLength(0);
  });

  it('2024 fires at its level and 5.5e/2024 alias', () => {
    expect(getSubclassGrants('Fighter', '5.5e', 'Champion', 7)).toHaveLength(1);
    expect(getSubclassGrants('Fighter', '2024', 'Champion', 7)).toHaveLength(1);
    expect(getSubclassGrants('Fighter', '5.5e', 'Champion', 10)).toHaveLength(0);
  });

  it('returns nothing for an unknown subclass/class or no subclass', () => {
    expect(getSubclassGrants('Wizard', '5e', 'Evoker', 10)).toHaveLength(0);
    expect(getSubclassGrants('Fighter', '5e', '', 10)).toHaveLength(0);
  });
});

describe('getEarnedSubclassGrants (<= level — display)', () => {
  it('includes the grant once at or past its level', () => {
    expect(getEarnedSubclassGrants('Fighter', '5e', 'Champion', 9)).toHaveLength(0);
    expect(getEarnedSubclassGrants('Fighter', '5e', 'Champion', 10)).toHaveLength(1);
    expect(getEarnedSubclassGrants('Fighter', '5e', 'Champion', 20)).toHaveLength(1);
  });
});

describe('availableGrantOptions', () => {
  it('proficiency grant: hides tools the character already has (via gatherProficiencies)', () => {
    // background_tool_choice flows through gatherProficiencies → excluded from Student of War.
    const opts = availableGrantOptions(studentOfWar, { background_tool_choice: "Smith's Tools" }, { charClass: 'Fighter' });
    expect(opts.find((o) => o.value === "Smith's Tools")).toBeUndefined();
    expect(opts.find((o) => o.value === "Brewer's Supplies")).toBeDefined();
  });

  it('pool grant: excludes the base fighting_style and any already-picked style', () => {
    const opts = availableGrantOptions(additionalStyle5e, {
      fighting_style: 'Defense',
      additional_fighting_styles: ['Archery'],
    });
    expect(opts.find((o) => o.value === 'Defense')).toBeUndefined();
    expect(opts.find((o) => o.value === 'Archery')).toBeUndefined();
    expect(opts.find((o) => o.value === 'Dueling')).toBeDefined();
  });

  it('returns the full pool when nothing is held', () => {
    expect(availableGrantOptions(additionalStyle5e, {})).toHaveLength(additionalStyle5e.options.length);
  });
});

describe('applyGrant', () => {
  it('merges chosen value-names into the storeField (proficiency)', () => {
    expect(applyGrant(studentOfWar, ["Smith's Tools"], {})).toEqual({
      subclass_tool_proficiencies: ["Smith's Tools"],
    });
  });

  it('appends to and dedupes an existing array (pool)', () => {
    expect(
      applyGrant(additionalStyle5e, ['Dueling', 'Archery'], { additional_fighting_styles: ['Archery'] })
    ).toEqual({ additional_fighting_styles: ['Archery', 'Dueling'] });
  });
});

// ── Cavalier "Bonus Proficiency": one picker, two destinations ───────────────────
// The grant offers "a skill OR a language", so each option carries its own storeField.
// Without the split routing, a chosen language would land in skill_proficiencies and show
// up as a bogus skill proficiency on the Abilities & Skills panel.
describe('subclassGrants — split-destination grant (Cavalier Bonus Proficiency)', () => {
  it('is a L3 5e-only grant offering the five RAW skills plus languages', () => {
    expect(cavalierBonusProf.level).toBe(3);
    expect(SUBCLASS_GRANTS.Fighter['5.5e'].Cavalier).toBeUndefined(); // no 2024 Cavalier
    for (const skill of ['Animal Handling', 'History', 'Insight', 'Performance', 'Persuasion']) {
      expect(cavalierBonusProf.options.find((o) => o.value === skill)).toBeDefined();
    }
    expect(cavalierBonusProf.options.find((o) => o.value === 'Draconic')).toBeDefined();
  });

  it('routes a skill to skill_proficiencies and a language to subclass_languages', () => {
    expect(grantStoreFieldFor(cavalierBonusProf, 'Insight')).toBe('skill_proficiencies');
    expect(grantStoreFieldFor(cavalierBonusProf, 'Draconic')).toBe('subclass_languages');
    expect(grantStoreFields(cavalierBonusProf).sort())
      .toEqual(['skill_proficiencies', 'subclass_languages']);
  });

  it('applyGrant writes a picked language to subclass_languages, not skill_proficiencies', () => {
    expect(applyGrant(cavalierBonusProf, ['Draconic'], {}))
      .toEqual({ subclass_languages: ['Draconic'] });
  });

  it('applyGrant writes a picked skill to skill_proficiencies, preserving existing ones', () => {
    expect(applyGrant(cavalierBonusProf, ['Insight'], { skill_proficiencies: ['Athletics'] }))
      .toEqual({ skill_proficiencies: ['Athletics', 'Insight'] });
  });

  it('excludes both skills already proficient in and languages already spoken', () => {
    const opts = availableGrantOptions(cavalierBonusProf, {
      skill_proficiencies: ['Insight'],
      race_languages: ['Common', 'Draconic'],
    });
    expect(opts.find((o) => o.value === 'Insight')).toBeUndefined();
    expect(opts.find((o) => o.value === 'Draconic')).toBeUndefined();
    expect(opts.find((o) => o.value === 'History')).toBeDefined();
    expect(opts.find((o) => o.value === 'Elvish')).toBeDefined();
  });

  it('a single-destination grant still returns exactly one field', () => {
    expect(grantStoreFields(studentOfWar)).toEqual(['subclass_tool_proficiencies']);
  });
});

// ── Samurai: Bonus Proficiency + Elegant Courtier's conditional fallback ──────────
describe('subclassGrants — Samurai', () => {
  const [bonusProf, courtierSave] = SUBCLASS_GRANTS.Fighter['5e'].Samurai;
  const resilientWis = { feats: [{
    name: 'Resilient', choices: { ability: 'wisdom' },
    effects: [{ kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true }],
  }] };

  it('is 5e only — there is no 2024 Samurai', () => {
    expect(SUBCLASS_GRANTS.Fighter['5.5e'].Samurai).toBeUndefined();
  });

  it('Bonus Proficiency offers the four RAW skills OR a language, split by destination', () => {
    const skills = bonusProf.options.filter((o) => !o.storeField).map((o) => o.value);
    expect(skills).toEqual(['History', 'Insight', 'Performance', 'Persuasion']);
    expect(grantStoreFieldFor(bonusProf, 'Insight')).toBe('skill_proficiencies');
    expect(grantStoreFieldFor(bonusProf, 'Elvish')).toBe('subclass_languages');
    expect(applyGrant(bonusProf, ['Elvish'], {})).toEqual({ subclass_languages: ['Elvish'] });
  });

  it('Bonus Proficiency is offered at level 3', () => {
    expect(getSubclassGrants('Fighter', '5e', 'Samurai', 3, {}).map((g) => g.key)).toEqual(['samurai_bonus_proficiency']);
  });

  it('the INT/CHA fallback is NOT offered at 7 when Wisdom-save proficiency is new', () => {
    expect(getSubclassGrants('Fighter', '5e', 'Samurai', 7, {})).toEqual([]);
    expect(getEarnedSubclassGrants('Fighter', '5e', 'Samurai', 7, {}).map((g) => g.key))
      .toEqual(['samurai_bonus_proficiency']);
  });

  it('the fallback IS offered when Wisdom was already held — from Resilient or a stored flag', () => {
    expect(getSubclassGrants('Fighter', '5e', 'Samurai', 7, resilientWis).map((g) => g.key)).toEqual(['elegant_courtier_save']);
    expect(getSubclassGrants('Fighter', '5e', 'Samurai', 7, { wis_save_prof: true }).map((g) => g.key)).toEqual(['elegant_courtier_save']);
  });

  it('the fallback writes the pick to subclass_save_proficiencies, and hides a save already held', () => {
    expect(applyGrant(courtierSave, ['Charisma'], {})).toEqual({ subclass_save_proficiencies: ['Charisma'] });
    const opts = availableGrantOptions(courtierSave, { ...resilientWis, cha_save_prof: true }, { charClass: 'Fighter' });
    expect(opts.map((o) => o.value)).toEqual(['Intelligence']);
  });

  it('a caller passing no character data still gets every grant (older call sites)', () => {
    expect(getSubclassGrants('Fighter', '5e', 'Samurai', 7).map((g) => g.key)).toEqual(['elegant_courtier_save']);
  });
});
