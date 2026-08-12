/**
 * Initiative — the single source for "what does this character add to an initiative roll?"
 *
 * Extracted from the CharacterDetail Stats tab, which computed it inline. It is about to have a
 * SECOND consumer (the GM's encounter page rolls initiative for a whole party), and two copies of
 * this formula would drift the moment a feat or subclass feature touched initiative — 5e Alert
 * (+5), 2024 Alert (+PB, resolved through the shared `'pb'` resolver) and Champion's Remarkable
 * Athlete (advantage, not a number) already make it more than "DEX modifier".
 *
 * Returns the whole shape rather than a bare number so the sheet can keep its click-to-see-the-math
 * panel: `breakdown` feeds BreakdownValue/BreakdownPanel unchanged, `featSources` drives the green
 * "+5 Alert" note, and `advantage` drives the teal one. A consumer that only wants the number takes
 * `.total`.
 */
import { getFeatStatModSources } from '@/characters/components/feats/featEffects';
import { remarkableAthlete } from '@/characters/components/combat/combatBonuses';
import { abilityPart, buildBreakdown } from '@/characters/components/skills/skillMath';

/** Advantage on initiative isn't a modifier, so it rides in the breakdown's notes. */
export const REMARKABLE_ATHLETE_NOTE = 'Advantage — Remarkable Athlete';

export function initiativeBreakdown({
  dexterity,
  feats = [],
  pb = 0,
  charClass,
  subclass,
  level = 1,
  edition = '5e',
} = {}) {
  const featSources = getFeatStatModSources(feats, 'initiative', { pb });
  const ra = remarkableAthlete({ charClass, subclass, level, edition, pb });
  const advantage = !!ra?.advantageInitiative;

  const breakdown = buildBreakdown({
    parts: [
      abilityPart('dexterity', dexterity),
      ...featSources.map((s) => ({ key: `feat-${s.source}`, label: s.source, value: s.amount })),
    ],
    notes: [advantage && REMARKABLE_ATHLETE_NOTE],
  });

  return { total: breakdown.total, breakdown, featSources, advantage };
}

/** The sheet's green feat note: "+5 Alert" (", +2 Something" when more than one applies). */
export function initiativeFeatNote(featSources = []) {
  return featSources.map((s) => `+${s.amount} ${s.source}`).join(', ');
}

/**
 * One initiative roll: d20 + modifier. `rng` is injectable so tests are deterministic.
 * Advantage is deliberately NOT rolled for — the app shows the advantage note and lets the GM
 * decide, rather than silently picking a die the table didn't see.
 */
export function rollInitiative(modifier = 0, rng = Math.random) {
  const die = Math.floor(rng() * 20) + 1;
  return { die, total: die + (Number(modifier) || 0) };
}

/**
 * The initiative modifier for a character LIST row (the shape the campaign characters endpoint
 * returns), so a caller with a roster doesn't re-plumb `character_data` fields itself.
 */
export function initiativeForCharacter(character, { edition = '5e', pb = 0 } = {}) {
  const cd = character?.character_data ?? {};
  return initiativeBreakdown({
    dexterity: character?.dexterity,
    feats: cd.feats ?? [],
    pb,
    charClass: character?.char_class,
    subclass: cd.subclass,
    level: character?.level ?? 1,
    edition,
  });
}
