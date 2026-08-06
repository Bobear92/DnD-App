// Passive skill scores.
//
// RAW (PHB "Passive Checks"): a passive score is 10 + every modifier that normally
// applies to that check. So proficiency counts, expertise counts double, and feat
// bonuses count — a passive score is just the skill's own modifier with a 10 floor
// instead of a d20.
//
// We surface the three passives that tables actually use:
//   Perception    — the PHB's own example; what Stealth is opposed by.
//   Investigation — the 2014 Observant feat grants +5 to it by name.
//   Insight       — used against Deception in social play.
// Other skills technically have passive scores too, but nothing in the rules or in
// this app reads them, so listing all 18 would be noise.
//
// Advantage/disadvantage on a check shifts its passive score by ±5. Nothing in the
// app currently grants advantage on Perception/Investigation/Insight, and the two
// disadvantage sources we model (non-proficient armor, Remarkable Athlete's ½ PB)
// only touch STR/DEX/CON checks — so no ±5 adjustment is applied here yet.

import { getFeatStatMods, getFeatStatModSources } from '@/characters/components/feats/featEffects';
import { getRaceGrantedSkillsFromTraits } from '@/characters/components/race/raceProficienciesData';
import { abilityMod as mod, abilityPart, proficiencyPart, buildBreakdown } from './skillMath';

/**
 * The passive scores we display, in render order.
 *   key     — testid/render key
 *   skill   — the underlying skill, matched against skill_proficiencies / expertise_skills
 *   ability — the ability key on the character record
 *   statMod — the feat `stat_mod` stat name that modifies this passive
 */
export const PASSIVE_SKILLS = [
  { key: 'perception', skill: 'Perception', label: 'Perception', ability: 'wisdom', statMod: 'passive_perception' },
  { key: 'investigation', skill: 'Investigation', label: 'Investigation', ability: 'intelligence', statMod: 'passive_investigation' },
  { key: 'insight', skill: 'Insight', label: 'Insight', ability: 'wisdom', statMod: 'passive_insight' },
];

/**
 * Compute all three passive scores for a character.
 *
 * Takes the same inputs SkillsDisplay does — the ability scores plus `character_data`
 * — and derives proficiency the same way, including the race-trait fallback for
 * characters created before race-granted skills were written into skill_proficiencies.
 *
 * @param {object}  abilityScores  character record with strength/dexterity/... keys
 * @param {number}  pb             proficiency bonus
 * @param {object}  classData      character_data (skill_proficiencies, expertise_skills, race_traits, feats)
 * @param {array}   feats          override for classData.feats
 * @returns {Array<{key, skill, label, ability, total, abilityMod, profBonus, featBonus,
 *                  featSources, isProficient, isExpert}>}
 */
export function computePassiveScores({ abilityScores = {}, pb = 0, classData = {}, feats } = {}) {
  const raceGranted = getRaceGrantedSkillsFromTraits(classData?.race_traits ?? []);
  const skillProfs = [...new Set([...(classData?.skill_proficiencies ?? []), ...raceGranted])];
  const expertiseSkills = classData?.expertise_skills ?? [];
  const featList = feats ?? classData?.feats ?? [];

  return PASSIVE_SKILLS.map((entry) => {
    const abilityMod = mod(abilityScores?.[entry.ability]);
    const isExpert = expertiseSkills.includes(entry.skill);
    const isProficient = isExpert || skillProfs.includes(entry.skill);
    const profBonus = isExpert ? pb * 2 : isProficient ? pb : 0;
    const featBonus = getFeatStatMods(featList, entry.statMod, { pb });
    const featSources = getFeatStatModSources(featList, entry.statMod, { pb }).filter((s) => s.amount !== 0);

    // The same parts the tile's click-to-expand panel shows — the base 10 is a flat
    // score, not a bonus, so it renders unsigned.
    const breakdown = buildBreakdown({
      parts: [
        { key: 'base', label: 'Base', value: 10, signed: false },
        abilityPart(entry.ability, abilityScores?.[entry.ability]),
        proficiencyPart({ pb, isProficient, isExpert }),
        ...featSources.map((s) => ({ key: `feat-${s.source}`, label: s.source, value: s.amount })),
      ],
    });

    return {
      ...entry,
      abilityMod,
      isProficient,
      isExpert,
      profBonus,
      featBonus,
      featSources,
      breakdown,
      total: breakdown.total,
    };
  });
}
