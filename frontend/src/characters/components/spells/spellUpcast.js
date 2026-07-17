/**
 * spellUpcast.js — best-effort upcast summary for the Cast dialog.
 *
 * The app displays rules rather than rolling dice, so "what does upcasting do?" is answered
 * two ways here:
 *   1. Text — every spell's own `higher_level` prose (or an explicit "no extra effect" note).
 *   2. Numbers — where the prose is UNAMBIGUOUS we compute the exact figures the player wants:
 *      the save DC / spell attack bonus (from the character's stats), and the damage/healing
 *      dice at the chosen slot level.
 *
 * The hard promise: we NEVER show a guessed number. When a spell's upcast text isn't cleanly
 * parseable (more targets, duration, DC thresholds, irregular dice), `damage` is null and the
 * UI falls back to the verbatim rules text. `report-upcast-coverage.mjs` runs this same parser
 * over the whole catalog to list the spells that fall through — the review worklist.
 *
 * Pure module (no React, no imports) so both the SpellList dialog and the Node report can use it.
 */

const SAVE_RE = /\b(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+saving\s+throw/i;
const ATTACK_RE = /\b(?:ranged|melee)?\s*spell\s+attack\b/i;

const ABBR = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};

/** The saving-throw ability a spell forces (3-letter tag), or null if it has none. */
export function spellSaveAbility(description = '') {
  const m = (description || '').match(SAVE_RE);
  return m ? ABBR[m[1].toLowerCase()] : null;
}

/** Whether a spell resolves with a spell attack roll (vs a save or auto-hit). */
export function spellUsesAttackRoll(description = '') {
  return ATTACK_RE.test(description || '');
}

/**
 * Parse the per-slot-level increment out of a spell's `higher_level` text.
 * Matches the classic "increases by 1d6 for each slot level above 3rd" shape.
 * @returns {{ inc:number, die:number, fromLevel:number, kind:'damage'|'healing' } | null}
 */
function parseIncrement(higherLevel = '') {
  const text = higherLevel || '';
  const m = text.match(
    /(damage|healing|hit points)\s+increases?\s+by\s+(\d+)d(\d+)\s+for\s+each\s+slot\s+level\s+above\s+(?:the\s+)?(\d+)/i,
  );
  if (!m) return null;
  const kind = /damage/i.test(m[1]) ? 'damage' : 'healing';
  return { kind, inc: Number(m[2]), die: Number(m[3]), fromLevel: Number(m[4]) };
}

/**
 * Compute the dice at a chosen slot level, or null when it can't be done unambiguously.
 *
 * Strategy: find the increment (die size D + per-level count) in `higher_level`, then find the
 * BASE dice of that SAME die size D in the description. Matching on die size is what keeps this
 * honest — a spell that scales d6 is read against its d6 base, ignoring unrelated dice.
 *
 * Bails (returns null) — leaving the UI to show prose — when:
 *   - the increment isn't the "Nd_ per slot level" shape (count-based, duration, DC threshold…),
 *   - no base die of the increment's size appears in the description,
 *   - the description has MULTIPLE differing base dice of that size (ambiguous which one scales).
 *
 * @returns {{ base:string, atLevel:string, die:number, kind:string, ambiguous?:boolean } | null}
 */
export function computeUpcastDice(spell = {}, chosenLevel) {
  const incr = parseIncrement(spell.higher_level);
  if (!incr) return null;

  const desc = spell.description || '';
  const matches = [...desc.matchAll(new RegExp(`(\\d+)d${incr.die}\\b`, 'g'))].map(m => Number(m[1]));
  if (matches.length === 0) return null;

  // Ambiguous when several DIFFERENT base counts share the scaling die size — refuse to guess.
  const distinct = [...new Set(matches)];
  if (distinct.length > 1) return { ambiguous: true };

  const baseCount = distinct[0];
  const fromLevel = incr.fromLevel;
  const steps = Math.max(0, (chosenLevel ?? fromLevel) - fromLevel);
  const totalCount = baseCount + incr.inc * steps;
  return {
    base: `${baseCount}d${incr.die}`,
    atLevel: `${totalCount}d${incr.die}`,
    die: incr.die,
    kind: incr.kind,
  };
}

/**
 * Build the full cast-dialog summary for a spell at a chosen slot level.
 *
 * @param {object} spell        catalog entry ({ level, description, higher_level })
 * @param {number} chosenLevel  the slot level being spent
 * @param {object} ctx          { saveDc, attackBonus } — the character's numbers (optional)
 * @returns {{
 *   isUpcast: boolean,
 *   hasHigherLevel: boolean,
 *   higherLevelText: string,
 *   noExtraEffect: boolean,
 *   save: { ability:string, dc:number } | null,
 *   attackBonus: number | null,
 *   damage: { base:string, atLevel:string, kind:string } | null,
 * }}
 */
export function summarizeUpcast(spell = {}, chosenLevel, ctx = {}) {
  const higherLevelText = (spell.higher_level || '').trim();
  const hasHigherLevel = higherLevelText.length > 0;
  const baseLevel = spell.level ?? chosenLevel;

  const saveAbility = spellSaveAbility(spell.description);
  const usesAttack = spellUsesAttackRoll(spell.description);

  const dice = computeUpcastDice(spell, chosenLevel);
  const damage = dice && !dice.ambiguous ? dice : null;

  return {
    isUpcast: chosenLevel > baseLevel,
    hasHigherLevel,
    higherLevelText,
    noExtraEffect: !hasHigherLevel,
    save: saveAbility != null && ctx.saveDc != null
      ? { ability: saveAbility, dc: ctx.saveDc }
      : null,
    attackBonus: usesAttack && ctx.attackBonus != null ? ctx.attackBonus : null,
    damage,
  };
}

/**
 * Cantrip damage at a given CHARACTER level (cantrips scale with character level, not slots).
 *
 * Reads the standard scaling sentence — "…damage increases by 1d10 when you reach 5th level
 * (2d10), 11th level (3d10), and 17th level (4d10)." — LITERALLY: the base die from
 * "increases by NdD", then each "{level}th level (MdD)" tier straight out of the parentheses
 * (matching die size D). Picks the highest tier whose level ≤ the character's level.
 *
 * Returns null (→ no computed figure) when there's no such sentence: count-based cantrips
 * (Eldritch Blast scales BEAMS, not dice) and non-damage cantrips fall through honestly.
 *
 * @returns {{ base:string, atLevel:string, die:number } | null}
 */
export function cantripDamageAtLevel(spell = {}, characterLevel = 1) {
  const desc = spell.description || '';
  const baseM = desc.match(/damage\s+increases?\s+by\s+(\d+)d(\d+)\s+when\s+you\s+reach/i);
  if (!baseM) return null;
  const baseCount = Number(baseM[1]);
  const die = Number(baseM[2]);

  const tiers = [{ level: 1, count: baseCount }];
  const re = /(\d+)(?:st|nd|rd|th)\s+level\s*\((\d+)d(\d+)\)/gi;
  let m;
  while ((m = re.exec(desc)) !== null) {
    if (Number(m[3]) === die) tiers.push({ level: Number(m[1]), count: Number(m[2]) });
  }
  tiers.sort((a, b) => a.level - b.level);

  let chosen = tiers[0];
  for (const t of tiers) if (characterLevel >= t.level) chosen = t;
  return { base: `${baseCount}d${die}`, atLevel: `${chosen.count}d${die}`, die };
}

/**
 * Cantrip row summary: the computed damage at the character's level plus the save DC / attack
 * bonus (constant character numbers), so the player doesn't have to open the description.
 *
 * @param {object} spell        catalog entry
 * @param {number} characterLevel
 * @param {object} ctx          { saveDc, attackBonus } (optional)
 * @returns {{ damage:{base,atLevel,die}|null, save:{ability,dc}|null, attackBonus:number|null }}
 */
export function summarizeCantrip(spell = {}, characterLevel = 1, ctx = {}) {
  const saveAbility = spellSaveAbility(spell.description);
  const usesAttack = spellUsesAttackRoll(spell.description);
  return {
    damage: cantripDamageAtLevel(spell, characterLevel),
    save: saveAbility != null && ctx.saveDc != null ? { ability: saveAbility, dc: ctx.saveDc } : null,
    attackBonus: usesAttack && ctx.attackBonus != null ? ctx.attackBonus : null,
  };
}

/**
 * Classify a spell for the coverage report.
 * @returns {'none'|'computed'|'prose-only'} and a reason for prose-only.
 */
export function classifyUpcast(spell = {}) {
  const higherLevelText = (spell.higher_level || '').trim();
  if (!higherLevelText) return { status: 'none' };

  const incr = parseIncrement(spell.higher_level);
  if (!incr) return { status: 'prose-only', reason: 'non-dice upcast (targets/duration/DC/other)' };

  const dice = computeUpcastDice(spell, (spell.level ?? 1) + 1);
  if (dice && dice.ambiguous) {
    return { status: 'prose-only', reason: `ambiguous base dice (multiple d${incr.die} in description)` };
  }
  if (!dice) return { status: 'prose-only', reason: `no d${incr.die} base dice found in description` };
  return { status: 'computed' };
}
