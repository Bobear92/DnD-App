/**
 * Skill bonuses — a FEATURE that adds a number to one skill's checks, permanently.
 *
 * The sibling of `skillAdvantage.js` (roll twice) and of the active-effect check bonuses in
 * `activeEffects.js` (a number that is real only while something is switched on). This one owns
 * the always-on kind: Samurai Elegant Courtier adds your Wisdom modifier to every Charisma
 * (Persuasion) check. Each part is breakdown-ready, so it feeds `skillMath`'s `extras` and the
 * raised total names its source in the click-to-see-the-math panel.
 *
 * Adding a source is one entry: `resolve(ctx)` returns `[{skill, amount, label?}]` for what it grants
 * right now (an empty list when it doesn't apply).
 */

import { abilityMod } from '@/characters/components/skills/skillMath';

const normEdition = (edition) => (edition === '5.5e' || edition === '2024' ? '5.5e' : '5e');

export const SKILL_BONUS_SOURCES = [
  {
    key: 'elegant-courtier',
    source: 'Elegant Courtier',
    // Samurai L7, 5e only. RAW: "a bonus to the check equal to your Wisdom modifier". Applied
    // as-is, so a Wisdom below 10 is a penalty — the user's call, taking the literal reading.
    resolve: ({ charClass, subclass, level, edition, scores = {} }) => (
      charClass === 'Fighter' && subclass === 'Samurai' && (Number(level) || 1) >= 7
      && normEdition(edition) === '5e'
        ? [{ skill: 'Persuasion', amount: abilityMod(scores.wisdom ?? 10), label: 'Elegant Courtier (WIS modifier)' }]
        : []
    ),
  },
];

/** `[{key, source, skill, amount}]` — every flat skill bonus this character has. */
export function getSkillBonuses(ctx = {}) {
  return SKILL_BONUS_SOURCES.flatMap((src) =>
    src.resolve(ctx).map((b) => ({ key: src.key, source: src.source, ...b })));
}

/** Breakdown terms for one skill, ready for `skillBreakdown({ extras })`. */
export function skillBonusParts(skill, ctx = {}) {
  return getSkillBonuses(ctx)
    .filter((b) => b.skill === skill)
    .map((b) => ({ key: `skill-bonus-${b.key}`, label: b.label ?? b.source, value: b.amount }));
}

/** The distinct sources currently adding to any skill — for the skills legend. */
export function skillBonusSources(ctx = {}) {
  return [...new Set(getSkillBonuses(ctx).map((b) => b.source))];
}
