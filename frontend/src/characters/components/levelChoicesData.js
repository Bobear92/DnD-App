/**
 * Level-up choices — class features that, at a given level, let the player CHOOSE a fixed
 * number of options from a named pool (Metamagic, Eldritch Invocations, Expertise, Fighting
 * Style for non-Fighters, …). This generalizes the proven subclassProficiencyData + Battle
 * Master maneuver pattern: the LevelUpWizard reads this table, and at any level where the
 * cumulative "known" count rises, prompts the player to pick the delta — hiding options the
 * character already has so they can't double up.
 *
 * Shape: LEVEL_CHOICES[className][edition] = [choice]
 *   choice = {
 *     key,                    // stable id (also the step's test-id suffix)
 *     label,                  // shown in the step header
 *     storeField,             // character_data field the chosen NAMES are written to
 *     knownAtLevel(level)→n,  // cumulative count known at a level (drives the per-level delta)
 *     pool: [{ name, description }],
 *   }
 *
 * Vertical slice: Sorcerer → Metamagic (both editions). Adding another class/choice is a pure
 * data entry here — the wizard step (`level-choices`) is class-agnostic. The chosen names land
 * in `character_data[storeField]`, the same array the class sheet already reads, so the sheet's
 * existing display surfaces them with no extra wiring.
 */

const lc = (s) => (s || '').toLowerCase();
const dedup = (arr) => [...new Set((arr || []).filter(Boolean))];
const normEdition = (edition) => (edition === '5.5e' || edition === '2024' ? '5.5e' : '5e');

// ── Sorcerer Metamagic ────────────────────────────────────────────────────────
// Canonical option list + count (previously duplicated inside both SorcererSheets).
// Seeking/Transmuted are 2024 additions; the existing 5e sheet already offered all ten,
// so both editions share one pool here to preserve current behavior. SP costs are noted
// for reference; the sorcery-point tracker lives on the sheet, not here.
export const METAMAGIC_OPTIONS = [
  { name: 'Careful Spell', description: 'When you cast a spell that forces other creatures to make a saving throw, choose a number of them up to your Charisma modifier; they automatically succeed. (1 sorcery point)' },
  { name: 'Distant Spell', description: 'Double the range of a spell with a range of 5+ feet, or give a touch spell a range of 30 feet. (1 sorcery point)' },
  { name: 'Empowered Spell', description: "Reroll a number of a spell's damage dice up to your Charisma modifier, using the new rolls. (1 sorcery point)" },
  { name: 'Extended Spell', description: "Double a spell's duration, to a maximum of 24 hours. (1 sorcery point)" },
  { name: 'Heightened Spell', description: 'One target of a spell that requires a saving throw has disadvantage on its first save against the spell. (3 sorcery points)' },
  { name: 'Quickened Spell', description: 'Change a spell with a casting time of 1 action into a bonus action for this casting. (2 sorcery points)' },
  { name: 'Seeking Spell', description: 'If you make an attack roll for a spell and miss, you can reroll the d20. (1 sorcery point)' },
  { name: 'Subtle Spell', description: 'Cast a spell without verbal or somatic components. (1 sorcery point)' },
  { name: 'Transmuted Spell', description: "Change a spell's damage type to acid, cold, fire, lightning, poison, or thunder. (1 sorcery point)" },
  { name: 'Twinned Spell', description: 'Target a second creature with a spell that targets only one creature and has no range of self. (sorcery points = the spell\'s level, minimum 1)' },
];

/** Metamagic options known at a level (2 / 3 / 4 at levels 3 / 10 / 17). */
export function metamagicKnownAtLevel(level = 1) {
  const l = Number(level) || 1;
  if (l >= 17) return 4;
  if (l >= 10) return 3;
  if (l >= 3) return 2;
  return 0;
}

const SORCERER_METAMAGIC = {
  key: 'metamagic',
  label: 'Metamagic',
  storeField: 'metamagic',
  knownAtLevel: metamagicKnownAtLevel,
  pool: METAMAGIC_OPTIONS,
};

export const LEVEL_CHOICES = {
  Sorcerer: {
    '5e': [SORCERER_METAMAGIC],
    '5.5e': [SORCERER_METAMAGIC],
  },
};

/**
 * Pool choices the class gains when leveling from `oldLevel` to `newLevel`. Each returned
 * choice carries a resolved `count` = the delta in cumulative known options. Choices with a
 * zero delta at this level are omitted.
 */
export function getLevelChoices(charClass, edition, oldLevel, newLevel) {
  const list = LEVEL_CHOICES[charClass]?.[normEdition(edition)] || [];
  const prev = Number(oldLevel ?? (Number(newLevel) - 1)) || 0;
  const out = [];
  for (const c of list) {
    const count = Math.max(0, c.knownAtLevel(newLevel) - c.knownAtLevel(prev));
    if (count > 0) out.push({ ...c, count });
  }
  return out;
}

/** A choice's pool minus options the character already has (no doubling up). */
export function availablePoolOptions(choice, characterData = {}) {
  const have = new Set((characterData[choice.storeField] || []).map(lc));
  return (choice.pool || []).filter((o) => !have.has(lc(o.name)));
}

/** character_data patch merging the chosen NAMES into the choice's storeField. */
export function applyLevelChoice(choice, chosen, characterData = {}) {
  return {
    [choice.storeField]: dedup([...(characterData[choice.storeField] || []), ...(chosen || [])]),
  };
}
