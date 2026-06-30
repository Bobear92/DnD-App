// Maps each PHB background to the skill proficiencies it grants.
// Used to identify which of a character's skill proficiencies came from their
// background so they can be highlighted distinctly from class-chosen ones.
// Keep in sync with BACKGROUNDS_5E in CharacterCreate.jsx.
export const BACKGROUND_SKILLS = {
  Acolyte: ['Insight', 'Religion'],
  Charlatan: ['Deception', 'Sleight of Hand'],
  Criminal: ['Deception', 'Stealth'],
  Entertainer: ['Acrobatics', 'Performance'],
  'Folk Hero': ['Animal Handling', 'Survival'],
  'Guild Artisan': ['Insight', 'Persuasion'],
  Hermit: ['Medicine', 'Religion'],
  Noble: ['History', 'Persuasion'],
  Outlander: ['Athletics', 'Survival'],
  Sage: ['Arcana', 'History'],
  Sailor: ['Athletics', 'Perception'],
  Soldier: ['Athletics', 'Intimidation'],
  Urchin: ['Sleight of Hand', 'Stealth'],
};

// Returns the skills granted by the named background, or [] when the background
// is unknown (custom/homebrew backgrounds are not in the map).
export function getBackgroundSkills(backgroundName) {
  if (!backgroundName) return [];
  return BACKGROUND_SKILLS[backgroundName] ?? [];
}
