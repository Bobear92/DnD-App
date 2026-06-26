/**
 * Jump distance math (pure) — the single source of truth shared by the
 * encyclopedia JumpPage (worked example) and the CharacterDetail Stats-tab
 * JumpCard (live values). Mirrors the maneuversData.js pattern: data + helpers
 * here, display in the components that consume them.
 *
 * RAW (PHB 2014 & 2024 are identical for jump distance):
 *  - Long Jump, running start (≥ runStart ft of movement immediately before):
 *      distance (ft) = Strength score. Standing long jump = half that.
 *  - High Jump, running start: distance (ft) = 3 + Strength modifier.
 *      Standing high jump = half that.
 *  - A jump always costs movement equal to its distance, and can never exceed
 *      your remaining movement on the turn (situational — noted, not computed).
 *  - Athlete feat: a running start needs only 5 ft of movement (instead of 10).
 *      It does NOT change the distance formulas.
 */

const mod = (score) => Math.floor(((score ?? 10) - 10) / 2);

/** Feet of movement needed before a running long/high jump (Athlete halves it). */
export function runningStartFeet(athlete = false) {
  return athlete ? 5 : 10;
}

/** Long jump distances in feet: running = STR score, standing = half (rounded down). */
export function longJump(strength) {
  const running = Math.max(0, strength ?? 0);
  return { running, standing: Math.floor(running / 2) };
}

/** High jump distances in feet: running = 3 + STR mod, standing = half (min 0). */
export function highJump(strength) {
  const running = Math.max(0, 3 + mod(strength));
  return { running, standing: Math.floor(running / 2) };
}

/**
 * Known sources that MULTIPLY jump distance (long and high, running and
 * standing). These are temporary/conditional — a spell, an item, spending a
 * resource — so they are NOT auto-applied to the always-on JumpCard; they drive
 * the JumpPage "What changes your jump" section and any future opt-in toggle.
 * Multipliers don't change the running-start requirement (Athlete does that).
 */
export const JUMP_MULTIPLIER_SOURCES = [
  { name: 'Jump spell', multiplier: 3, note: '1st-level spell (Druid/Ranger/Sorcerer/Wizard/Artificer); lasts 1 minute. A Ring of Jumping casts it at will.' },
  { name: 'Boots of Striding and Springing', multiplier: 3, note: 'Magic item; also sets your walking speed to at least 30 ft.' },
  { name: 'Potion of Jumping', multiplier: 3, note: 'Consumable; same effect as the Jump spell for 1 minute.' },
  { name: 'Step of the Wind (Monk)', multiplier: 2, note: 'Spend 1 ki / Focus Point — doubles your jump distance for the turn.' },
  { name: 'Path of the Beast — Bestial Soul (Barbarian 6)', multiplier: 2, note: 'Only if you chose the "double your jump distance" option.' },
];

/**
 * Full jump readout for a character.
 *
 * @param {number} strength
 * @param {{ athlete?: boolean, multiplier?: number }} [opts]
 *   - athlete: lowers the running-start requirement to 5 ft.
 *   - multiplier: a temporary jump multiplier (Jump spell ×3, Step of the Wind
 *     ×2, Boots/Potion ×3, …). Applied to all four distances; the standing base
 *     is halved first, then multiplied (RAW: halve, then the effect triples).
 * @returns {{ strength, strMod, athlete, multiplier, runStartFt,
 *             longRunning, longStanding, highRunning, highStanding }}
 */
export function computeJump(strength, { athlete = false, multiplier = 1 } = {}) {
  const long = longJump(strength);
  const high = highJump(strength);
  const scale = (v) => Math.floor(v * multiplier);
  return {
    strength: strength ?? 10,
    strMod: mod(strength),
    athlete,
    multiplier,
    runStartFt: runningStartFeet(athlete),
    longRunning: scale(long.running),
    longStanding: scale(long.standing),
    highRunning: scale(high.running),
    highStanding: scale(high.standing),
  };
}
