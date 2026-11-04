/**
 * What a level-up changes on the sheet WITHOUT asking the player anything.
 *
 * Some features are applied by derivation rather than by a pick — Samurai Elegant Courtier's
 * Wisdom-save proficiency (`saveProficiencies.js`) and its +WIS to Persuasion (`skillBonuses.js`)
 * are computed from class + subclass + level, so the wizard has nothing to collect for them. That
 * left the New Features step showing only a paragraph, with no sign that the app had actually
 * applied it (found in QA). This module diffs those same registries between the old and the new
 * level, so the wizard can say exactly what changed — and since it reads the registries rather
 * than naming any feature, a new row in either table shows up here with no wizard change.
 */

import {
  featureSaveProficiencies, nonFeatureSaveProficiencies, CLASS_SAVE_PROFS, CHOSEN_SAVE_FIELD,
} from '@/characters/components/skills/saveProficiencies';
import { getSkillBonuses } from '@/characters/components/skills/skillBonuses';
import { abilityMod } from '@/characters/components/skills/skillMath';
import { profBonus } from '@/characters/components/classData/classProgressionTables';

/**
 * @returns {{
 *   saveProficiencies: { ability: string, source: string, alreadyHeld: boolean, total: number,
 *                        abilityMod: number, pb: number }[],
 *   skillBonuses: { skill: string, amount: number, source: string, label?: string }[],
 * }}
 */
export function levelUpAutoEffects({
  charClass, subclass, edition = '5e', fromLevel, toLevel, characterData = {}, scores = {},
} = {}) {
  const base = { charClass, subclass, edition };
  // The fallback pick (Elegant Courtier → INT/CHA) is a CHOICE the wizard collects on its own
  // step, so it is not an automatic effect; drop it from both sides of the diff.
  const fixedOnly = { ...characterData, [CHOSEN_SAVE_FIELD]: [] };
  const savesAt = (level) => featureSaveProficiencies({ ...base, level, characterData: fixedOnly });
  const before = new Set(savesAt(fromLevel).map((p) => `${p.ability}|${p.source}`));
  const held = new Set(nonFeatureSaveProficiencies(characterData, { classSaves: CLASS_SAVE_PROFS[charClass] ?? [] }));
  const pb = profBonus(toLevel);

  const saveProficiencies = savesAt(toLevel)
    .filter((p) => !before.has(`${p.ability}|${p.source}`))
    .map((p) => {
      const mod = abilityMod(scores[p.ability] ?? 10);
      return { ...p, alreadyHeld: held.has(p.ability), abilityMod: mod, pb, total: mod + pb };
    });

  const bonusesAt = (level) => getSkillBonuses({ ...base, level, scores });
  const hadBonus = new Set(bonusesAt(fromLevel).map((b) => `${b.key}|${b.skill}`));
  const skillBonuses = bonusesAt(toLevel).filter((b) => !hadBonus.has(`${b.key}|${b.skill}`));

  return { saveProficiencies, skillBonuses };
}

/** "+2" / "−1" / "+0" — a signed modifier as the sheet prints one. */
export function signed(n) {
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`;
}
