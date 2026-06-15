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

// ── Warlock Eldritch Invocations ──────────────────────────────────────────────
// Second pool wired into the generic mechanism (the breadth-before-vertical test). Unlike
// Metamagic, invocations carry a `minLevel` prereq, so the pool supports option-level gating
// (availablePoolOptions filters by the character's level). NOTE: full prerequisite gating —
// Pact Boon (Blade/Chain/Tome), a specific cantrip (Eldritch Blast), or another invocation —
// is NOT modeled yet; those are noted in each description but not enforced. RAW invocation
// REPLACEMENT on level-up is also not modeled (the mechanism is append-only). The Warlock
// sheets keep their free-text input as the fallback for anything missing here. Descriptions
// are paraphrased — verify against the PHB. This list is the common PHB-2014 set; extend it.
export const ELDRITCH_INVOCATIONS_5E = [
  { name: 'Agonizing Blast', minLevel: 2, description: 'Add your Charisma modifier to Eldritch Blast damage. (Prereq: Eldritch Blast cantrip)' },
  { name: 'Armor of Shadows', minLevel: 2, description: 'Cast Mage Armor on yourself at will, without a spell slot.' },
  { name: 'Beast Speech', minLevel: 2, description: 'Cast Speak with Animals at will, without a spell slot.' },
  { name: 'Beguiling Influence', minLevel: 2, description: 'Gain proficiency in the Deception and Persuasion skills.' },
  { name: 'Book of Ancient Secrets', minLevel: 2, description: 'Inscribe and cast ritual spells from your Book of Shadows. (Prereq: Pact of the Tome)' },
  { name: "Devil's Sight", minLevel: 2, description: 'See normally in darkness, magical and nonmagical, to 120 feet.' },
  { name: 'Eldritch Sight', minLevel: 2, description: 'Cast Detect Magic at will, without a spell slot.' },
  { name: 'Eldritch Spear', minLevel: 2, description: 'Eldritch Blast range becomes 300 feet. (Prereq: Eldritch Blast cantrip)' },
  { name: 'Eyes of the Rune Keeper', minLevel: 2, description: 'You can read all writing.' },
  { name: 'Fiendish Vigor', minLevel: 2, description: 'Cast False Life on yourself at will as a 1st-level spell, without a slot.' },
  { name: 'Mask of Many Faces', minLevel: 2, description: 'Cast Disguise Self at will, without a spell slot.' },
  { name: 'Repelling Blast', minLevel: 2, description: 'Push a creature up to 10 feet on an Eldritch Blast hit. (Prereq: Eldritch Blast cantrip)' },
  { name: 'Thief of Five Fates', minLevel: 2, description: 'Cast Bane once using a warlock spell slot; regain on a long rest.' },
  { name: 'Mire the Mind', minLevel: 5, description: 'Cast Slow once using a warlock spell slot; regain on a long rest. (Level 5+)' },
  { name: 'One with Shadows', minLevel: 5, description: 'In dim light or darkness, become invisible until you move or act. (Level 5+)' },
  { name: 'Sign of Ill Omen', minLevel: 5, description: 'Cast Bestow Curse once using a warlock spell slot; regain on a long rest. (Level 5+)' },
  { name: 'Thirsting Blade', minLevel: 5, description: 'Attack twice with your pact weapon when you take the Attack action. (Prereq: Pact of the Blade, Level 5+)' },
  { name: 'Bewitching Whispers', minLevel: 7, description: 'Cast Compulsion once using a warlock spell slot; regain on a long rest. (Level 7+)' },
  { name: 'Dreadful Word', minLevel: 7, description: 'Cast Confusion once using a warlock spell slot; regain on a long rest. (Level 7+)' },
  { name: 'Sculptor of Flesh', minLevel: 7, description: 'Cast Polymorph once using a warlock spell slot; regain on a long rest. (Level 7+)' },
  { name: 'Ascendant Step', minLevel: 9, description: 'Cast Levitate on yourself at will, without a spell slot. (Level 9+)' },
  { name: 'Otherworldly Leap', minLevel: 9, description: 'Cast Jump on yourself at will, without a spell slot. (Level 9+)' },
  { name: 'Lifedrinker', minLevel: 12, description: 'Your pact weapon deals extra necrotic damage equal to your Charisma modifier. (Prereq: Pact of the Blade, Level 12+)' },
  { name: 'Chains of Carceri', minLevel: 15, description: 'Cast Hold Monster at will against celestials/fiends/elementals, no slot. (Prereq: Pact of the Chain, Level 15+)' },
  { name: 'Master of Myriad Forms', minLevel: 15, description: 'Cast Alter Self at will, without a spell slot. (Level 15+)' },
  { name: 'Visions of Distant Realms', minLevel: 15, description: 'Cast Arcane Eye at will, without a spell slot. (Level 15+)' },
  { name: 'Witch Sight', minLevel: 15, description: 'See the true form of any shapechanger or creature concealed by illusion/transmutation within 30 feet. (Level 15+)' },
];

// 2024 PHB invocation list (paraphrased — verify against the 2024 PHB). The 2024 ruleset folds
// the Pact Boons (Pact of the Blade/Chain/Tome) into invocations and adjusts some prereqs.
export const ELDRITCH_INVOCATIONS_2024 = [
  { name: 'Pact of the Blade', minLevel: 1, description: 'Conjure a pact weapon you are proficient with and can attack with using Charisma.' },
  { name: 'Pact of the Chain', minLevel: 1, description: 'Cast Find Familiar; your familiar can take special forms (imp, pseudodragon, etc.).' },
  { name: 'Pact of the Tome', minLevel: 1, description: 'Gain a Book of Shadows with extra cantrips and ritual spells.' },
  { name: 'Agonizing Blast', minLevel: 2, description: 'Add your Charisma modifier to a chosen damaging cantrip. (Prereq: a warlock cantrip that deals damage)' },
  { name: 'Armor of Shadows', minLevel: 1, description: 'Cast Mage Armor on yourself at will, without a spell slot.' },
  { name: 'Devil\'s Sight', minLevel: 1, description: 'See normally in darkness, magical and nonmagical, to 120 feet.' },
  { name: 'Eldritch Spear', minLevel: 1, description: 'Increase the range of a chosen damaging cantrip. (Prereq: a warlock cantrip that deals damage)' },
  { name: 'Fiendish Vigor', minLevel: 1, description: 'Cast False Life on yourself at will without a slot (always treated as max).' },
  { name: 'Mask of Many Faces', minLevel: 1, description: 'Cast Disguise Self at will, without a spell slot.' },
  { name: 'Repelling Blast', minLevel: 2, description: 'Push a creature up to 10 feet on a hit with a chosen damaging cantrip. (Prereq: a warlock cantrip that deals damage)' },
  { name: 'Thirsting Blade', minLevel: 5, description: 'Attack twice with your pact weapon when you take the Attack action. (Prereq: Pact of the Blade, Level 5+)' },
  { name: 'Gift of the Protectors', minLevel: 9, description: 'When a creature recorded in your Book of Shadows would drop to 0 HP, it drops to 1 instead. (Prereq: Pact of the Tome, Level 9+)' },
  { name: 'Lifedrinker', minLevel: 9, description: 'Your pact weapon deals extra necrotic damage and you gain temporary HP on a hit. (Prereq: Pact of the Blade, Level 9+)' },
  { name: 'Master of Myriad Forms', minLevel: 15, description: 'Cast Alter Self at will, without a spell slot. (Level 15+)' },
];

/** Eldritch Invocations known at a level (5e: none until L2; 2024: 1 from L1). */
export function eldritchInvocationsKnownAtLevel(level, edition) {
  const l = Number(level) || 0;
  const is2024 = edition === '5.5e' || edition === '2024';
  if (l >= 15) return 8;
  if (l >= 12) return 7;
  if (l >= 9) return 6;
  if (l >= 7) return 5;
  if (l >= 5) return 4;
  if (l >= 3) return 3;
  if (l >= 2) return 2;
  return is2024 ? 1 : 0;
}

export const LEVEL_CHOICES = {
  Sorcerer: {
    '5e': [SORCERER_METAMAGIC],
    '5.5e': [SORCERER_METAMAGIC],
  },
  Warlock: {
    '5e': [{
      key: 'eldritch_invocations',
      label: 'Eldritch Invocations',
      storeField: 'eldritch_invocations',
      knownAtLevel: (lvl) => eldritchInvocationsKnownAtLevel(lvl, '5e'),
      pool: ELDRITCH_INVOCATIONS_5E,
    }],
    '5.5e': [{
      key: 'eldritch_invocations',
      label: 'Eldritch Invocations',
      storeField: 'eldritch_invocations',
      knownAtLevel: (lvl) => eldritchInvocationsKnownAtLevel(lvl, '5.5e'),
      pool: ELDRITCH_INVOCATIONS_2024,
    }],
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

/**
 * A choice's pool minus options the character already has (no doubling up) and minus options
 * gated above the character's level. `level` is optional — pass it to honor option `minLevel`
 * prereqs (e.g. Eldritch Invocations); Metamagic options carry no minLevel, so omitting it is
 * a no-op and keeps existing 2-arg callers working.
 */
export function availablePoolOptions(choice, characterData = {}, level = null) {
  const have = new Set((characterData[choice.storeField] || []).map(lc));
  return (choice.pool || []).filter(
    (o) => !have.has(lc(o.name)) && (level == null || (o.minLevel ?? 0) <= Number(level)),
  );
}

/** character_data patch merging the chosen NAMES into the choice's storeField. */
export function applyLevelChoice(choice, chosen, characterData = {}) {
  return {
    [choice.storeField]: dedup([...(characterData[choice.storeField] || []), ...(chosen || [])]),
  };
}
