/**
 * Dragonborn Breath Weapon — the computed numbers behind the trait.
 *
 * The trait's rules text scales with level and depends on the chosen draconic ancestry, so
 * every number a player needs mid-combat (damage die, save DC, save ability, shape, damage
 * type) is derived here rather than left as prose. Single source of truth for any surface
 * that shows the breath weapon — currently the Action Economy tab.
 *
 * Reads the ancestry SNAPSHOT stored at creation (`character_data.draconic_ancestry`,
 * `{name, damage, breath}`), so this module needs no ancestry table of its own and a
 * character keeps whatever they picked even if the table later changes.
 *
 * NOTE: 2014 rules. The 2024 Dragonborn breath weapon differs (proficiency-bonus uses per
 * long rest, a different progression) — the app has no 2024 race data yet, so a 2024
 * campaign currently gets these 2014 numbers like every other racial trait.
 */
import { abilityMod, profBonus } from '@/characters/components/inventory/inventoryData';

/** Damage dice by character level: 2d6, then 3d6 at 6th, 4d6 at 11th, 5d6 at 16th. */
export function breathWeaponDamage(level = 1) {
  const l = Number(level) || 1;
  if (l >= 16) return '5d6';
  if (l >= 11) return '4d6';
  if (l >= 6) return '3d6';
  return '2d6';
}

/**
 * Which save the breath weapon calls for. Per the PHB ancestry table this tracks the damage
 * type exactly: acid / lightning / fire breaths are Dexterity saves, poison / cold are
 * Constitution saves (true for all ten dragons, cone and line alike).
 */
export function breathWeaponSaveAbility(damageType) {
  return /poison|cold/i.test(damageType ?? '') ? 'CON' : 'DEX';
}

/** Save DC = 8 + Constitution modifier + proficiency bonus. */
export function breathWeaponSaveDc(level = 1, constitutionScore = 10) {
  return 8 + profBonus(level) + abilityMod(constitutionScore);
}

/** The DC broken into its parts, so a surface can show the math rather than a bare number. */
export function breathWeaponSaveDcParts(level = 1, constitutionScore = 10) {
  const pb = profBonus(level);
  const mod = abilityMod(constitutionScore);
  return { dc: 8 + pb + mod, pb, mod };
}

/**
 * The full resolved breath weapon, or null when the character has no Breath Weapon trait.
 *
 * The ancestry is optional: a Dragonborn who somehow has no stored `draconic_ancestry` still
 * gets the damage and DC (which don't depend on it) with the shape/type left null, so the
 * feature degrades to a partial card instead of vanishing.
 *
 * @returns {{damage, damageType, shape, saveAbility, saveDc, pb, conMod, summary}|null}
 */
export function getBreathWeapon({ raceTraits = [], draconicAncestry = null, level = 1, constitutionScore = 10 } = {}) {
  if (!(raceTraits ?? []).includes('Breath Weapon')) return null;
  const damage = breathWeaponDamage(level);
  const damageType = draconicAncestry?.damage ?? null;
  const shape = draconicAncestry?.breath ?? null;
  const saveAbility = breathWeaponSaveAbility(damageType);
  const { dc, pb, mod } = breathWeaponSaveDcParts(level, constitutionScore);
  const area = shape ? `in a ${shape}` : 'in a line or cone';
  const typed = damageType ? `${damage} ${damageType.toLowerCase()} damage` : `${damage} damage`;
  return {
    damage,
    damageType,
    shape,
    saveAbility,
    saveDc: dc,
    pb,
    conMod: mod,
    summary: `Exhale destructive energy ${area}. Each creature in the area makes a DC ${dc} `
      + `${saveAbility} save, taking ${typed} on a failure or half as much on a success.`,
  };
}

export default getBreathWeapon;
