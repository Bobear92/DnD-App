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
} = {}) {
  const { parts, notes: keptNotes, total } = buildBreakdown({
    parts: [
      abilityPart(ability, abilityScore),
      proficiencyPart({ pb, isProficient, isExpert, halfProficiency }),
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
export function saveBreakdown({ ability, abilityScore, pb = 0, isProficient = false, notes = [] } = {}) {
  return skillBreakdown({ ability, abilityScore, pb, isProficient, notes });
}
