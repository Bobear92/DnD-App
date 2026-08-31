// Skill arithmetic, kept in one place so the number on the sheet and the breakdown
// shown when you click it can never disagree — the breakdown IS the calculation.

export const ABILITY_ABBREV = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

/**
 * Every skill and the ability it keys off. Lives here rather than in the sheet that renders it
 * because it is not only a rendering order: a feature that grants advantage on an ABILITY's
 * checks (Giant's Might → Strength) has to know which skills that covers, and a second copy of
 * this list is how the sheet and that answer would drift.
 */
export const SKILL_MAP = [
  { skill: 'Acrobatics', ability: 'dexterity' },
  { skill: 'Animal Handling', ability: 'wisdom' },
  { skill: 'Arcana', ability: 'intelligence' },
  { skill: 'Athletics', ability: 'strength' },
  { skill: 'Deception', ability: 'charisma' },
  { skill: 'History', ability: 'intelligence' },
  { skill: 'Insight', ability: 'wisdom' },
  { skill: 'Intimidation', ability: 'charisma' },
  { skill: 'Investigation', ability: 'intelligence' },
  { skill: 'Medicine', ability: 'wisdom' },
  { skill: 'Nature', ability: 'intelligence' },
  { skill: 'Perception', ability: 'wisdom' },
  { skill: 'Performance', ability: 'charisma' },
  { skill: 'Persuasion', ability: 'charisma' },
  { skill: 'Religion', ability: 'intelligence' },
  { skill: 'Sleight of Hand', ability: 'dexterity' },
  { skill: 'Stealth', ability: 'dexterity' },
  { skill: 'Survival', ability: 'wisdom' },
];

/** The skills that use a given ability — the skill half of "advantage on Strength checks". */
export function skillsForAbility(ability) {
  return SKILL_MAP.filter((s) => s.ability === ability).map((s) => s.skill);
}

/** A D&D ability modifier: (score − 10) halved, rounded down. */
export const abilityMod = (score) => Math.floor(((Number(score) || 10) - 10) / 2);

/** "+3" / "−1" — a signed bonus with a real minus sign. */
export const formatBonus = (n) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

/**
 * The generic shape every "click the number to see the math" surface uses:
 * an ordered list of labelled parts that sum to `total`, plus non-numeric riders
 * (advantage / disadvantage) as `notes`.
 *
 * Falsy parts and notes are dropped, so callers can inline conditionals
 * (`isProficient && {...}`) instead of building arrays imperatively.
 *
 * A part may set `signed: false` to render as a plain number rather than a signed
 * bonus — used for a passive score's flat base of 10.
 */
export function buildBreakdown({ parts = [], notes = [] } = {}) {
  const kept = parts.filter(Boolean);
  return {
    parts: kept,
    notes: notes.filter(Boolean),
    total: kept.reduce((sum, p) => sum + (Number(p.value) || 0), 0),
  };
}

/** The proficiency-shaped term for a check, or null when none applies.
 *
 * Only ONE can apply: expertise (2 × PB) beats proficiency (PB), which beats a
 * half-proficiency bonus like Remarkable Athlete — that feature explicitly only helps
 * checks that don't already use your proficiency bonus.
 */
export function proficiencyPart({ pb = 0, isProficient = false, isExpert = false, halfProficiency = 0 } = {}) {
  if (isExpert) return { key: 'expertise', label: `Expertise (2 × proficiency ${formatBonus(pb)})`, value: pb * 2 };
  if (isProficient) return { key: 'proficiency', label: 'Proficiency bonus', value: pb };
  if (halfProficiency > 0) return { key: 'half-proficiency', label: 'Remarkable Athlete (½ proficiency)', value: halfProficiency };
  return null;
}

/** The ability-modifier part of any check, e.g. "WIS modifier −1". */
export function abilityPart(ability, abilityScore) {
  return { key: 'ability', label: `${ABILITY_ABBREV[ability] ?? ability} modifier`, value: abilityMod(abilityScore) };
}

/**
 * The full arithmetic behind one skill's bonus. Also used for saving throws, which are
 * the same calculation (ability modifier + proficiency) with a different label.
 */
export function skillBreakdown({
  skill,
  ability,
  abilityScore,
  pb = 0,
  isProficient = false,
  isExpert = false,
  halfProficiency = 0,
  notes = [],
  extras = [],
} = {}) {
  const { parts, notes: keptNotes, total } = buildBreakdown({
    parts: [
      abilityPart(ability, abilityScore),
      proficiencyPart({ pb, isProficient, isExpert, halfProficiency }),
      // Flat terms from anything that is neither the ability nor proficiency — today a running
      // active effect (Channel Rune: Frost, +2 to Strength/Constitution checks and saves). They
      // are appended as labelled parts rather than folded into the total, so a raised number
      // always has a source next to it in the panel.
      ...extras,
    ],
    notes,
  });

  return {
    skill,
    ability,
    abilityAbbrev: ABILITY_ABBREV[ability] ?? ability,
    parts,
    notes: keptNotes,
    total,
  };
}

/** A saving throw: identical math to a skill, so it reuses the same builder. */
export function saveBreakdown({
  ability, abilityScore, pb = 0, isProficient = false, notes = [], extras = [],
} = {}) {
  return skillBreakdown({ ability, abilityScore, pb, isProficient, notes, extras });
}
