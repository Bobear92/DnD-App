/**
 * Subclass combat reminders — short, always-on subclass features surfaced next to the
 * places they actually matter (the HP block) rather than only in the subclass features
 * list. Mirrors raceCombatNotes.js: a single source of truth for the note text + the
 * feature-detection so every surface reads the same string.
 *
 * First surface: Champion Fighter "Survivor" (L18, both editions) — a start-of-turn
 * self-heal that has no home in the sheet's action economy (it fires automatically,
 * per-turn — not an action/bonus/reaction), so it's surfaced as an at-the-table
 * reminder by the HP block instead of only in the subclass features list.
 */

const SURVIVOR_UNLOCK = 18;

/** True when this character is a Champion Fighter of high enough level for Survivor. */
export function hasSurvivor({ charClass, subclass, level = 1 } = {}) {
  return (
    charClass === 'Fighter' &&
    subclass === 'Champion' &&
    (level ?? 1) >= SURVIVOR_UNLOCK
  );
}

/**
 * Champion Fighter "Survivor" reminder string, or null when it doesn't apply.
 *   5e (L18): at the start of each of your turns, if you have ≤ half your HP max
 *     (and at least 1), regain 5 + CON modifier HP.
 *   2024 (L18): the same, plus a +3 bonus to death saving throws.
 * `conMod` folds the character's actual Constitution modifier into the number so the
 * reminder shows the real regain amount (floored at 0), matching the app's other
 * computed surfaces (MaxHpValue, JumpCard).
 *
 * @param {{ charClass, subclass, level?, edition?, conMod? }} ctx
 */
export function survivorNote({ charClass, subclass, level = 1, edition = '5e', conMod = 0 } = {}) {
  if (!hasSurvivor({ charClass, subclass, level })) return null;
  const regain = Math.max(0, 5 + (conMod ?? 0));
  const base =
    `Survivor: at the start of each of your turns, if you have at least 1 HP but no more ` +
    `than half your HP maximum, you regain ${regain} HP (5 + CON modifier).`;
  return edition === '5.5e'
    ? `${base} You also gain a +3 bonus to death saving throws.`
    : base;
}

const HEROIC_WARRIOR_UNLOCK = 10;

/** True when this character is a 2024 Champion Fighter of high enough level for Heroic Warrior. */
export function hasHeroicWarrior({ charClass, subclass, level = 1, edition = '5e' } = {}) {
  return (
    edition === '5.5e' &&
    charClass === 'Fighter' &&
    subclass === 'Champion' &&
    (level ?? 1) >= HEROIC_WARRIOR_UNLOCK
  );
}

/**
 * Champion Fighter "Heroic Warrior" reminder string, or null when it doesn't apply.
 *   2024 only (L10): during combat, give yourself Heroic Inspiration whenever you start
 *   your turn without it. Surfaced next to the Inspiration card since that's where the
 *   effect lands — it fires automatically per-turn, so it has no action-economy home.
 *
 * @param {{ charClass, subclass, level?, edition? }} ctx
 */
export function heroicWarriorNote({ charClass, subclass, level = 1, edition = '5e' } = {}) {
  if (!hasHeroicWarrior({ charClass, subclass, level, edition })) return null;
  return (
    'Heroic Warrior: during combat, you can give yourself Heroic Inspiration ' +
    'whenever you start your turn without it.'
  );
}

const REMARKABLE_ATHLETE_MOVE_UNLOCK = 3;

/** True when this character has the 2024 Champion Remarkable Athlete post-crit free move. */
export function hasRemarkableAthleteMove({ charClass, subclass, level = 1, edition = '5e' } = {}) {
  return (
    edition === '5.5e' &&
    charClass === 'Fighter' &&
    subclass === 'Champion' &&
    (level ?? 1) >= REMARKABLE_ATHLETE_MOVE_UNLOCK
  );
}

/**
 * The 2024 Champion Remarkable Athlete post-Critical-Hit movement rider, or null when
 * it doesn't apply. Surfaced next to the crit-range note on weapon attacks because it's
 * crit-triggered — immediately after you score a Critical Hit (with any weapon), you can
 * move up to half your Speed without provoking Opportunity Attacks. 2024 (L3) only; the
 * 5e Remarkable Athlete has no such rider.
 *
 * @param {{ charClass, subclass, level?, edition? }} ctx
 */
export function remarkableAthleteMoveNote({ charClass, subclass, level = 1, edition = '5e' } = {}) {
  if (!hasRemarkableAthleteMove({ charClass, subclass, level, edition })) return null;
  return (
    'Remarkable Athlete: immediately after you score a critical hit, you can move up to ' +
    'half your Speed without provoking opportunity attacks.'
  );
}
