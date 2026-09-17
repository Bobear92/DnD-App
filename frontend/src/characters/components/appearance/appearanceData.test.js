import { describe, it, expect } from 'vitest';
import {
  APPEARANCE_GROUPS, APPEARANCE_FIELDS, APPEARANCE_FEATURE_NOTES, appearanceFieldKeys,
  appearanceNotesFor, hasAppearance, filledAppearanceGroups, cleanAppearance,
} from './appearanceData';

describe('the appearance field catalog', () => {
  it('has no duplicate field keys — they are the JSONB keys the column stores', () => {
    const keys = appearanceFieldKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every field a label and a placeholder, so no box is unexplained', () => {
    for (const f of APPEARANCE_FIELDS) {
      expect(f.label, f.key).toBeTruthy();
      expect(f.placeholder, f.key).toBeTruthy();
    }
  });

  it('groups the fields rather than presenting one long wall of inputs', () => {
    expect(APPEARANCE_GROUPS.map((g) => g.key))
      .toEqual(['body', 'features', 'presentation', 'overall']);
    expect(APPEARANCE_GROUPS.every((g) => g.fields.length > 0)).toBe(true);
  });

  // It is meant to be richer than the NPC set (age/gender/height/weight/appearance): a player
  // character's description is used for a whole campaign, not for one scene.
  it('covers more than the five NPC fields', () => {
    expect(APPEARANCE_FIELDS.length).toBeGreaterThan(15);
    for (const k of ['age', 'gender', 'height', 'weight']) {
      expect(appearanceFieldKeys()).toContain(k);
    }
  });

  // Half the races in the compendium are not human-shaped.
  it('has somewhere to put horns, tusks, wings and a tail', () => {
    expect(appearanceFieldKeys()).toContain('distinctiveFeatures');
  });

  it('separates colour from style, so "black" and "braided" are not one box', () => {
    const keys = appearanceFieldKeys();
    expect(keys).toContain('hairColor');
    expect(keys).toContain('hairStyle');
    expect(keys).toContain('eyes');
    expect(keys).toContain('eyeDetail');
  });

  // Suggestions are a starting point for an empty box, never a menu to choose from — every field
  // stays free text, so a `suggestions` list must never read as exhaustive.
  it('offers suggestions on some fields and forces them on none', () => {
    const withSuggestions = APPEARANCE_FIELDS.filter((f) => f.suggestions);
    expect(withSuggestions.length).toBeGreaterThan(3);
    for (const f of withSuggestions) {
      expect(Array.isArray(f.suggestions)).toBe(true);
      expect(f.suggestions.length).toBeGreaterThan(1);
    }
    // No field declares a closed option set.
    expect(APPEARANCE_FIELDS.some((f) => f.options)).toBe(false);
  });
});

describe('appearanceNotesFor', () => {
  const runeKnight = (level) => ({
    charClass: 'Fighter', subclass: 'Rune Knight', level, edition: '5e',
  });

  // The feature that started all this: Great Stature adds 3d4 inches of height.
  it('notes Great Stature beside height for a Rune Knight who has it', () => {
    const notes = appearanceNotesFor('height', runeKnight(10));
    expect(notes).toHaveLength(1);
    expect(notes[0].source).toBe('Great Stature');
    expect(notes[0].text).toMatch(/3d4/);
  });

  // The whole reason it is a note: 3–12 inches never crosses a size category, so nothing about
  // grappling, Heavy weapons or the damage rider may change.
  it('says plainly that the size category is unchanged', () => {
    expect(appearanceNotesFor('height', runeKnight(10))[0].text)
      .toMatch(/size category is unchanged/i);
  });

  it('is silent below the level that grants it', () => {
    expect(appearanceNotesFor('height', runeKnight(9))).toEqual([]);
  });

  it('is silent for another subclass, another class, and another edition', () => {
    expect(appearanceNotesFor('height', { charClass: 'Fighter', subclass: 'Champion', level: 20, edition: '5e' })).toEqual([]);
    expect(appearanceNotesFor('height', { charClass: 'Wizard', level: 20, edition: '5e' })).toEqual([]);
    expect(appearanceNotesFor('height', { ...runeKnight(10), edition: '5.5e' })).toEqual([]);
  });

  it('attaches a note only to its own field', () => {
    expect(appearanceNotesFor('weight', runeKnight(10))).toEqual([]);
  });

  it('gives almost every character no notes at all', () => {
    for (const f of APPEARANCE_FIELDS) {
      expect(appearanceNotesFor(f.key, { charClass: 'Rogue', level: 5, edition: '5e' })).toEqual([]);
    }
  });

  // A note that wrote a value would be the app rolling your dice and inventing your height.
  it('never carries a value to write — only text to read', () => {
    for (const n of APPEARANCE_FEATURE_NOTES) {
      expect(n.value).toBeUndefined();
      expect(typeof n.text).toBe('string');
    }
  });
});

describe('hasAppearance / filledAppearanceGroups / cleanAppearance', () => {
  it('treats nothing, empty objects and whitespace as unwritten', () => {
    expect(hasAppearance()).toBe(false);
    expect(hasAppearance({})).toBe(false);
    expect(hasAppearance({ eyes: '   ' })).toBe(false);
  });

  it('counts a single filled field as written', () => {
    expect(hasAppearance({ eyes: 'grey' })).toBe(true);
  });

  // The read view shows the description, not a form with holes in it.
  it('drops empty fields and empty groups from the read view', () => {
    const groups = filledAppearanceGroups({ eyes: 'grey', hairColor: 'black' });
    expect(groups.map((g) => g.key)).toEqual(['features']);
    expect(groups[0].fields.map((f) => f.key)).toEqual(['eyes', 'hairColor']);
  });

  it('returns nothing to render when nothing was written', () => {
    expect(filledAppearanceGroups({})).toEqual([]);
  });

  it('strips blanks and trims before saving, so an untouched field never persists as ""', () => {
    expect(cleanAppearance({ eyes: '  grey  ', hairColor: '', build: '   ' }))
      .toEqual({ eyes: 'grey' });
  });

  it('ignores keys that are not in the catalog', () => {
    expect(cleanAppearance({ eyes: 'grey', notAField: 'x' })).toEqual({ eyes: 'grey' });
  });
});
