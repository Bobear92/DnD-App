/**
 * Skill advantage — "do I roll this one twice?"
 *
 * Advantage on a skill check is a real, common mechanic that the sheet could not express:
 * it was hardcoded to exactly one source (the 2024 Champion's Remarkable Athlete) inside
 * CharacterDetail, read straight off `remarkableAthlete().advantageSkills`. The moment a
 * second source appeared — the Rune Knight, where FOUR of six runes grant it — that hardcode
 * had to become a table. This is that table.
 *
 * It is the sibling of `saveFeatures.js` (features affecting your saves) and `defenses.js`
 * (features affecting incoming damage): one module owns one question, entries are declarative,
 * and adding a source is a data row rather than a change to the panel.
 *
 * ── Why sources carry their own predicate ────────────────────────────────────────────────
 * The two sources gate on genuinely different things — Remarkable Athlete on class/subclass/
 * level/edition, a rune on whether it is carved onto an EQUIPPED item — so a purely
 * declarative `{charClass, subclass, minLevel}` match (the saveFeatures shape) could not
 * express the second. Each entry therefore supplies `resolve(ctx)` returning the skills it
 * currently grants. A future source (a race trait, a feat) is still one entry.
 *
 * NOT in scope: advantage on saving throws (saveFeatures.js), on attack rolls, or on
 * initiative (initiativeData.js). This module answers skill checks only.
 */

import { remarkableAthlete } from '@/characters/components/combat/combatBonuses';
import { activeRunes } from '@/characters/components/inventory/runeCarving';

/**
 * @typedef {Object} SkillAdvantageSource
 * @property {string} key                       Stable id, for React keys and test ids.
 * @property {(ctx: object) => {skill: string, source: string, note?: string}[]} resolve
 */

/** @type {SkillAdvantageSource[]} */
export const SKILL_ADVANTAGE_SOURCES = [
  {
    key: 'remarkable-athlete',
    // 2024 Champion L3 only. The 5e version is a NUMERIC half-proficiency bonus, not
    // advantage, and stays where it is — this module would misreport it as advantage.
    resolve: ({ charClass, subclass, level, edition }) => {
      const ra = remarkableAthlete({ charClass, subclass, level, edition });
      return (ra?.advantageSkills ?? []).map((skill) => ({
        skill,
        source: 'Remarkable Athlete',
      }));
    },
  },
  {
    key: 'rune-carving',
    // A rune grants its passive only while carved onto an object you wear or hold, so this
    // resolves through activeRunes() rather than through character_data.runes. Unequip the
    // axe and the advantage goes away, which is the whole point of the carving model.
    resolve: ({ characterData, level }) =>
      activeRunes({ characterData, level }).flatMap(({ rune, entry }) =>
        (rune.passive?.skills ?? []).map((skill) => ({
          skill,
          source: rune.name,
          note: `Carved on ${entry.name}`,
        })),
      ),
  },
];

/**
 * Every skill-check advantage the character currently has.
 * @returns {{ skill: string, source: string, note?: string }[]}
 */
export function getSkillAdvantages(ctx = {}) {
  return SKILL_ADVANTAGE_SOURCES.flatMap((s) => s.resolve(ctx) ?? []);
}

/** Just the skill names, deduped — the cheap lookup for rendering an 'adv' tag. */
export function getSkillAdvantageNames(ctx = {}) {
  return [...new Set(getSkillAdvantages(ctx).map((a) => a.skill))];
}

/**
 * The sources granting advantage on ONE skill (a skill can have more than one — a Rune Knight
 * Champion could get Athletics from Remarkable Athlete and Insight from a rune).
 */
export function skillAdvantageSourcesFor(skill, ctx = {}) {
  return getSkillAdvantages(ctx).filter((a) => a.skill === skill);
}

/**
 * Legend text for the Abilities & Skills panel: "Teal = advantage (Remarkable Athlete)", or
 * a combined label when several sources are live, so the legend names what the tag came from
 * instead of asserting a single source that may not be the one the reader is looking at.
 */
export function skillAdvantageLegend(ctx = {}) {
  const sources = [...new Set(getSkillAdvantages(ctx).map((a) => a.source))];
  if (sources.length === 0) return null;
  if (sources.length === 1) return `Teal = advantage (${sources[0]})`;
  return `Teal = advantage (${sources.slice(0, -1).join(', ')} & ${sources[sources.length - 1]})`;
}
