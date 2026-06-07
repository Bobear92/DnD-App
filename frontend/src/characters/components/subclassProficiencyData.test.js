import { describe, it, expect } from 'vitest';
import {
  getSubclassProficiencyGrants, availableOptions, applyProficiencyChoice,
  existingProficiencyNames, ARTISAN_TOOL_OPTIONS,
} from './subclassProficiencyData';

describe('getSubclassProficiencyGrants', () => {
  it('returns Battle Master Student of War (1 tool) at level 3 — both editions', () => {
    for (const ed of ['5e', '5.5e']) {
      const grants = getSubclassProficiencyGrants('Fighter', ed, 'Battle Master', 3);
      expect(grants).toHaveLength(1);
      expect(grants[0]).toMatchObject({ key: 'student_of_war', type: 'tool', count: 1 });
    }
  });
  it('returns nothing at a non-grant level', () => {
    expect(getSubclassProficiencyGrants('Fighter', '5e', 'Battle Master', 4)).toEqual([]);
  });
  it('returns nothing for a subclass without a choice grant (Champion)', () => {
    expect(getSubclassProficiencyGrants('Fighter', '5e', 'Champion', 3)).toEqual([]);
  });
  it('returns nothing when no subclass is chosen', () => {
    expect(getSubclassProficiencyGrants('Fighter', '5e', undefined, 3)).toEqual([]);
  });
});

describe('availableOptions — no doubling up', () => {
  const grant = getSubclassProficiencyGrants('Fighter', '5e', 'Battle Master', 3)[0];

  it('lists every artisan tool when the character has none', () => {
    expect(availableOptions(grant, { charClass: 'Fighter', characterData: {} })).toEqual(ARTISAN_TOOL_OPTIONS);
  });
  it('hides a tool already granted by the background', () => {
    const opts = availableOptions(grant, { charClass: 'Fighter', characterData: { background_tool_choice: "Smith's Tools" } });
    expect(opts).not.toContain("Smith's Tools");
    expect(opts).toContain("Brewer's Supplies");
  });
  it('hides a tool already chosen from a prior subclass grant', () => {
    const opts = availableOptions(grant, { charClass: 'Fighter', characterData: { subclass_tool_proficiencies: ["Mason's Tools"] } });
    expect(opts).not.toContain("Mason's Tools");
  });
});

describe('applyProficiencyChoice', () => {
  it('stores tools in subclass_tool_proficiencies (deduped)', () => {
    expect(applyProficiencyChoice('tool', ["Smith's Tools"], { subclass_tool_proficiencies: ["Mason's Tools"] }))
      .toEqual({ subclass_tool_proficiencies: ["Mason's Tools", "Smith's Tools"] });
  });
  it('merges skills into skill_proficiencies', () => {
    expect(applyProficiencyChoice('skill', ['Arcana'], { skill_proficiencies: ['Athletics'] }))
      .toEqual({ skill_proficiencies: ['Athletics', 'Arcana'] });
  });
  it('stores languages in subclass_languages', () => {
    expect(applyProficiencyChoice('language', ['Giant'], {})).toEqual({ subclass_languages: ['Giant'] });
  });
});

describe('existingProficiencyNames', () => {
  it('tool set includes gathered tool grants', () => {
    const s = existingProficiencyNames('tool', { charClass: 'Fighter', characterData: { tool_choice: 'Lute' } });
    expect(s.has('lute')).toBe(true);
  });
  it('skill set from skill_proficiencies', () => {
    expect(existingProficiencyNames('skill', { characterData: { skill_proficiencies: ['Stealth'] } }).has('stealth')).toBe(true);
  });
  it('language set from race + background + subclass languages', () => {
    const s = existingProficiencyNames('language', {
      characterData: { race_languages: ['Common'], background_languages: ['Elvish'], subclass_languages: ['Giant'] },
    });
    expect([...s].sort()).toEqual(['common', 'elvish', 'giant']);
  });
});
