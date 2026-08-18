// Psi Warrior reference data (Fighter → Psi Warrior, TCoE / PHB-2024). Pure data + arithmetic —
// mirrors the arcaneShotData / maneuversData pattern, and is the single source of truth shared by
// the class config's rest-resource rows and the Action Economy cards, so the pool size, the die
// size and the save DC can never drift between the two surfaces.
//
// RAW notes (the subclass feature blurbs in subclassData are looser summaries — three of them are
// outright wrong, which is why the numbers are computed here rather than transcribed):
//   • Psionic Energy dice: a pool of TWICE your proficiency bonus. The die SIZE scales — d6 at
//     3rd, d8 at 5th, d10 at 11th, d12 at 17th. The stored blurb says a flat "d6s".
//   • All expended dice return on a long rest. Separately, as a bonus action you can regain ONE
//     expended die, and you can't do that again until a short or long rest — so the regain is its
//     own once-per-short-rest charge, not a property of the pool.
//   • Psi-Powered Leap grants a fly speed equal to TWICE your walking speed (the stored blurb says
//     "equal to", which understates it by half). Free once per long rest, or spend a die.
//   • Telekinetic Movement is an ACTION (a Magic action in 2024), not the bonus action the stored
//     blurb claims. Free once per short or long rest, or spend a die.
//   • Telekinetic Thrust / Bulwark of Force / Protective Field all key off INTELLIGENCE, even
//     though the Fighter has no spellcasting ability of its own (the Arcane Shot situation).
//   • Protective Field reduces damage by the die roll + INT modifier, to a MINIMUM of 1 — so a
//     dump-stat Psi Warrior still gets a floor rather than a negative.
//
// Both editions use the same numbers; the 2024 revision renames nothing and moves no level, so
// every consumer registers one authored entry against both.

import { abilityMod } from '@/characters/components/inventory/inventoryData';
import { profBonus } from '@/characters/components/classData/classProgressionTables';
import { buildBreakdown } from '@/characters/components/skills/skillMath';

/** Levels at which the Psionic Energy die grows, largest threshold first. */
const DIE_STEPS = [
  { level: 17, die: 12 },
  { level: 11, die: 10 },
  { level: 5, die: 8 },
  { level: 3, die: 6 },
];

/**
 * Psionic Energy die SIZE at a Fighter level, as a number of sides.
 * Below 3rd level the subclass doesn't exist yet; it still answers d6 so a caller that renders
 * before the subclass is chosen shows the starting die rather than "dNaN".
 */
export function psionicDieSize(level = 1) {
  const step = DIE_STEPS.find((s) => Number(level) >= s.level);
  return step ? step.die : 6;
}

/** The die as it is written on a card — "d8". */
export function psionicDie(level = 1) {
  return `d${psionicDieSize(level)}`;
}

/** Pool size: twice the proficiency bonus. */
export function psionicDiceTotal(level = 1) {
  return 2 * profBonus(level);
}

/**
 * "1d8 + 3" — one die plus the Intelligence modifier, as it appears in damage and reduction
 * text. A negative modifier is written as a subtraction, and a zero modifier is dropped entirely
 * rather than printed as "+ 0".
 */
export function psionicDieAndInt(level = 1, intelligence = 10) {
  const mod = abilityMod(intelligence);
  const die = psionicDie(level);
  if (mod === 0) return `1${die}`;
  return `1${die} ${mod > 0 ? '+' : '−'} ${Math.abs(mod)}`;
}

/** Save DC for Telekinetic Thrust: 8 + proficiency bonus + INT modifier. */
export function psiSaveDc(level = 1, intelligence = 10) {
  return 8 + profBonus(level) + abilityMod(intelligence);
}

/** The same DC as arithmetic, so a card's number can expand into how it was reached. */
export function psiSaveDcBreakdown(level = 1, intelligence = 10) {
  return buildBreakdown({
    parts: [
      { key: 'base', label: 'Base', value: 8, signed: false },
      { key: 'proficiency', label: 'Proficiency bonus', value: profBonus(level) },
      { key: 'ability', label: 'INT modifier', value: abilityMod(intelligence) },
    ],
  });
}

/**
 * How many creatures Bulwark of Force can shield: your Intelligence modifier, including
 * yourself. Floored at one — RAW gives no minimum, but a zero-target card is an empty feature,
 * and the same floor is already applied to the ability-modifier pools on the Fighter config.
 */
export function bulwarkTargets(intelligence = 10) {
  return Math.max(1, abilityMod(intelligence));
}
