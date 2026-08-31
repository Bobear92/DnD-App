/**
 * Active effects — a feature the player switches ON and OFF, which changes numbers elsewhere
 * on the sheet while it runs.
 *
 * **This is a deliberate reversal of a long-standing design line.** Until now the app modelled
 * NO active state (no `isRaging`, no concentration, no durations), and that is why Rage damage,
 * Divine Smite and spell-granted magic weapons are all prose today: a bare "+2d6" on a card
 * would be false most of the time. Giant's Might forced the issue — it changes the character's
 * SIZE, grants advantage on two roll types, and adds a scaling damage die, which is far too much
 * to leave as a paragraph the reader has to apply by hand.
 *
 * The model stays deliberately small, and only carries what a real feature needs today:
 *   - the state is `character_data.active_effects: string[]` (effect keys currently running)
 *   - an effect DEFINITION is a data entry here, gated by class/subclass/level/edition
 *   - `grants(level)` returns only the fields that effect changes; consumers merge what they use
 *
 * What it deliberately does NOT model: duration. Nothing in the app tracks rounds or minutes, so
 * an effect runs until the player switches it off, and the stated duration is text on the card.
 * That is the same honesty line the rest of the app draws — display what a player can act on,
 * don't simulate a battlefield.
 *
 * Adding Rage, Hex or a Hunter's Mark later should be a data entry here plus one consumer, not a
 * second model. When the second effect arrives, check whether `grants` needs more fields rather
 * than whether it needs a sibling table.
 */

import { isRuneActive } from '@/characters/components/inventory/runeCarving';

/** Sizes, smallest first — so a consumer can compare two of them. */
export const SIZE_ORDER = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

const normEdition = (edition) => (edition === '5.5e' || edition === '2024' ? '5.5e' : '5e');

/**
 * Rune Knight "Giant's Might" (Fighter, L3, 5e only — there is no 2024 Rune Knight).
 *
 * RAW, and NOT what the stored feature blurb says: the blurb claims you "can grapple Large
 * creatures", which is not in the feature at all (size is what governs grappling), and
 * Runic Juggernaut's real second clause — +5 ft of reach while Huge — is missing from it.
 * The numbers here follow the rulebook; see the feature-text corrections shipped alongside.
 */
const GIANTS_MIGHT = {
  key: 'giants_might',
  label: "Giant's Might",
  charClass: 'Fighter',
  subclass: 'Rune Knight',
  edition: '5e',
  minLevel: 3,
  resourceKey: 'giants_might_used',
  duration: '1 minute',
  // Shown on the toggle so the player knows what switching it on is claiming.
  summary: (level) => {
    const bits = [`Size ${sizeAt(level)}`, 'advantage on Strength checks and Strength saves',
      `once per turn one weapon or unarmed attack deals an extra ${mightDie(level)}`];
    if (level >= 18) bits.push('reach +5 ft');
    return bits.join(' · ');
  },
  grants: (level) => ({
    size: sizeAt(level),
    // RAW is Strength CHECKS and Strength SAVES — not "saving throws" generally, which is how
    // the stored blurb reads.
    advantageAbilities: ['strength'],
    advantageSaves: ['strength'],
    attackDie: mightDie(level),
    // Runic Juggernaut (L18): the reach increase applies only while Huge.
    reachBonus: level >= 18 ? 5 : 0,
  }),
};

/** Giant's Might damage die: 1d6, 1d8 from Great Stature (L10), 1d10 from Runic Juggernaut (L18). */
export function mightDie(level = 1) {
  const l = Number(level) || 1;
  if (l >= 18) return '1d10';
  if (l >= 10) return '1d8';
  return '1d6';
}

/**
 * The size Giant's Might grows you to. Runic Juggernaut (L18) says your size *can* increase to
 * Huge — it is the player's option, not automatic, so the card says so; the number here takes
 * the larger size because that is what the feature is for and the reach bonus rides on it.
 */
export function sizeAt(level = 1) {
  return (Number(level) || 1) >= 18 ? 'Huge' : 'Large';
}

/**
 * Rune Knight "Channel Rune: Frost" (Fighter, L3, 5e only).
 *
 * The SECOND active effect, and the one that showed what the model was missing. Giant's Might
 * changes what you roll (advantage) and how big you are; Frost changes a NUMBER — "+2 to all
 * ability checks and saving throws that use Strength or Constitution" for 10 minutes — which no
 * `grants` field could express, so `checkBonus`/`saveBonus` were added rather than a second
 * model (the note above says to check `grants` first, and this is that check coming back yes).
 *
 * Unlike Giant's Might it is gated on EQUIPMENT as well as level: a rune grants nothing until it
 * is carved onto an object you wear or hold, so the definition carries the same `applies(ctx)`
 * escape hatch defenses.js and saveFeatures.js use. Unequip the axe and the effect is no longer
 * offered — an effect already switched on would keep its key in `active_effects` and simply stop
 * resolving, which is the honest answer for a rune you are no longer carrying.
 */
const CHANNEL_RUNE_FROST = {
  key: 'channel_rune_frost',
  label: 'Channel Rune: Frost',
  charClass: 'Fighter',
  subclass: 'Rune Knight',
  edition: '5e',
  minLevel: 3,
  resourceKey: 'channel_rune_frost_used',
  duration: '10 minutes',
  applies: (ctx) => isRuneActive('Frost Rune', ctx),
  summary: () => `+${FROST_RUNE_BONUS} to all ability checks and saving throws that use Strength`
    + ' or Constitution',
  grants: () => ({
    // The abilities are named rather than the skills: RAW is "checks that use Strength or
    // Constitution", so a consumer maps the ability to whatever it displays (Athletics is the
    // only skill either ability drives; the saves grid shows both).
    checkBonus: { abilities: ['strength', 'constitution'], amount: FROST_RUNE_BONUS },
    saveBonus: { abilities: ['strength', 'constitution'], amount: FROST_RUNE_BONUS },
  }),
};

/** Frost Rune's Channel Rune bonus. Flat in RAW — it does not scale with level or proficiency. */
export const FROST_RUNE_BONUS = 2;

export const ACTIVE_EFFECTS = [GIANTS_MIGHT, CHANNEL_RUNE_FROST];

/** The effect definitions this character has earned (whether or not they are switched on). */
export function getActiveEffectDefs({
  charClass, subclass, level = 1, edition = '5e', characterData = {},
} = {}) {
  const ed = normEdition(edition);
  return ACTIVE_EFFECTS.filter((e) => (
    (!e.charClass || e.charClass === charClass)
    && (!e.subclass || e.subclass === subclass)
    && (!e.edition || e.edition === ed)
    && (Number(level) || 1) >= (e.minLevel ?? 1)
    // Escape hatch for a gate the declarative keys cannot express — a rune effect depends on
    // whether the rune is carved onto an EQUIPPED item, which is character_data state.
    && (!e.applies || e.applies({ charClass, subclass, level, edition: ed, characterData }))
  ));
}

/**
 * The effect whose CHARGE this resource key spends, if any.
 *
 * Exists so a rest-tracker row can discover that it is not an ordinary counter. Matching on the
 * key alone is enough: the row is already gated by class/subclass/level (and, for a rune, by the
 * rune being carved on an equipped item), so a config that is showing `channel_rune_frost_used`
 * belongs to a character who has that effect.
 */
export function effectForResourceKey(key) {
  return ACTIVE_EFFECTS.find((e) => e.resourceKey && e.resourceKey === key) ?? null;
}

/** The effect keys currently switched on (always an array). */
export function activeEffectKeys(characterData = {}) {
  return Array.isArray(characterData?.active_effects) ? characterData.active_effects : [];
}

/** Is this effect switched on right now? */
export function isEffectActive(characterData, key) {
  return activeEffectKeys(characterData).includes(key);
}

/** The patch that switches an effect on or off (callers persist it like any other change). */
export function toggleEffectPatch(characterData, key, on) {
  const current = activeEffectKeys(characterData);
  const next = on ? [...new Set([...current, key])] : current.filter((k) => k !== key);
  return { active_effects: next };
}

/**
 * The merged grants of every effect this character has earned AND switched on.
 *
 * Size takes the LARGEST rather than the last one merged: two effects that both change size are
 * not additive, and "whichever was toggled most recently" would be arbitrary. The other fields
 * are single-source today; revisit the merge rule when a second effect actually collides.
 */
export function activeEffectGrants({ characterData = {}, charClass, subclass, level = 1, edition = '5e' } = {}) {
  const on = runningEffects({ characterData, charClass, subclass, level, edition });
  const out = {
    size: null, advantageAbilities: [], advantageSaves: [], attackDie: null, reachBonus: 0,
    checkBonuses: {}, saveBonuses: {},
    sources: on.map((e) => e.label),
  };
  for (const e of on) {
    const g = e.grants(Number(level) || 1) ?? {};
    if (g.size && (!out.size || SIZE_ORDER.indexOf(g.size) > SIZE_ORDER.indexOf(out.size))) {
      out.size = g.size;
    }
    out.advantageAbilities = [...new Set([...out.advantageAbilities, ...(g.advantageAbilities ?? [])])];
    out.advantageSaves = [...new Set([...out.advantageSaves, ...(g.advantageSaves ?? [])])];
    if (g.attackDie) out.attackDie = g.attackDie;
    out.reachBonus = Math.max(out.reachBonus, g.reachBonus ?? 0);
    // Numeric bonuses SUM across effects: two differently-named features that both add to a
    // Strength check do stack in 5e (unlike advantage, which does not), and there is no single
    // "largest wins" answer to fall back on. Only one such effect exists today.
    for (const ability of g.checkBonus?.abilities ?? []) {
      out.checkBonuses[ability] = (out.checkBonuses[ability] ?? 0) + (g.checkBonus.amount ?? 0);
    }
    for (const ability of g.saveBonus?.abilities ?? []) {
      out.saveBonuses[ability] = (out.saveBonuses[ability] ?? 0) + (g.saveBonus.amount ?? 0);
    }
  }
  return out;
}

/** The effect definitions this character has earned AND switched on. */
function runningEffects(ctx) {
  return getActiveEffectDefs(ctx).filter((e) => isEffectActive(ctx.characterData, e.key));
}

/**
 * The running effects that add a flat bonus to one ability's CHECKS or SAVES, as breakdown-ready
 * terms. Returned per source rather than pre-summed so the sheet's click-to-see-the-math panel
 * can name what raised the number — a "+2" that appears with nothing to attribute it to reads as
 * a bug in the ability modifier.
 *
 * @returns {{ key: string, label: string, value: number }[]}
 */
function bonusParts(field, ability, ctx) {
  return runningEffects(ctx)
    .map((e) => ({ e, amount: pickBonus(e.grants(Number(ctx.level) || 1)?.[field], ability) }))
    .filter(({ amount }) => amount)
    .map(({ e, amount }) => ({ key: `effect:${e.key}`, label: e.label, value: amount }));
}

function pickBonus(spec, ability) {
  return (spec?.abilities ?? []).includes(ability) ? (spec.amount ?? 0) : 0;
}

/**
 * The running effects that add a flat bonus, grouped by SOURCE rather than by ability — what a
 * legend or a summary line needs ("+2 to STR and CON saving throws — Channel Rune: Frost"),
 * where the per-ability `…Parts` helpers answer "what does THIS row add up to".
 *
 * @returns {{ key: string, source: string, amount: number, abilities: string[] }[]}
 */
function bonusSources(field, ctx) {
  return runningEffects(ctx).flatMap((e) => {
    const spec = e.grants(Number(ctx.level) || 1)?.[field];
    if (!spec?.amount || (spec.abilities ?? []).length === 0) return [];
    return [{ key: e.key, source: e.label, amount: spec.amount, abilities: spec.abilities }];
  });
}

/** Running effects adding a flat bonus to ability CHECKS, grouped by source. */
export function activeEffectCheckSources(ctx = {}) {
  return bonusSources('checkBonus', ctx);
}

/** Running effects adding a flat bonus to SAVING THROWS, grouped by source. */
export function activeEffectSaveSources(ctx = {}) {
  return bonusSources('saveBonus', ctx);
}

/** The total flat bonus on one ability's checks — the number a row's tag shows. */
export function activeEffectCheckBonus(ability, ctx = {}) {
  return activeEffectCheckParts(ability, ctx).reduce((sum, p) => sum + p.value, 0);
}

/** The total flat bonus on one ability's saving throws. */
export function activeEffectSaveBonus(ability, ctx = {}) {
  return activeEffectSaveParts(ability, ctx).reduce((sum, p) => sum + p.value, 0);
}

/** Flat bonus terms on one ability's CHECKS (and so on the skills that use it). */
export function activeEffectCheckParts(ability, ctx = {}) {
  return bonusParts('checkBonus', ability, ctx);
}

/** Flat bonus terms on one ability's SAVING THROWS. */
export function activeEffectSaveParts(ability, ctx = {}) {
  return bonusParts('saveBonus', ability, ctx);
}

export default ACTIVE_EFFECTS;
