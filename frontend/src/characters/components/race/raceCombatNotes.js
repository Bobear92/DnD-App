/**
 * Race combat reminders — short, always-on racial traits surfaced next to the places
 * they actually matter (the HP section, weapon cards, the Action Economy tab) rather
 * than only in the Racial Features list. Single source of truth for the note text and
 * the trait-detection so every surface reads the same string.
 *
 * `race_traits` is stored as an array of trait-name strings on character_data; the
 * `(t?.name ?? t)` guard also tolerates an object form defensively.
 */

export function hasRaceTrait(traits, name) {
  return (traits || []).some((t) => (t?.name ?? t) === name);
}

/** Half-Orc: extra damage die on a melee weapon critical hit. */
export const SAVAGE_ATTACKS_NOTE =
  "Savage Attacks: on a melee weapon critical hit, roll one of the weapon's damage dice one extra time and add it.";

/** Half-Orc: drop to 1 HP instead of 0 once per long rest. */
export const RELENTLESS_ENDURANCE_NOTE =
  'Relentless Endurance: when reduced to 0 HP but not killed outright, you can drop to 1 HP instead (once per long rest).';

export const hasSavageAttacks = (traits) => hasRaceTrait(traits, 'Savage Attacks');
export const hasRelentlessEndurance = (traits) => hasRaceTrait(traits, 'Relentless Endurance');
