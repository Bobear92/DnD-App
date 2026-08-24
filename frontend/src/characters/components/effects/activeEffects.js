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

export const ACTIVE_EFFECTS = [GIANTS_MIGHT];

/** The effect definitions this character has earned (whether or not they are switched on). */
export function getActiveEffectDefs({ charClass, subclass, level = 1, edition = '5e' } = {}) {
  const ed = normEdition(edition);
  return ACTIVE_EFFECTS.filter((e) => (
    (!e.charClass || e.charClass === charClass)
    && (!e.subclass || e.subclass === subclass)
    && (!e.edition || e.edition === ed)
    && (Number(level) || 1) >= (e.minLevel ?? 1)
  ));
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
  const on = getActiveEffectDefs({ charClass, subclass, level, edition })
    .filter((e) => isEffectActive(characterData, e.key));
  const out = {
    size: null, advantageAbilities: [], advantageSaves: [], attackDie: null, reachBonus: 0,
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
  }
  return out;
}

export default ACTIVE_EFFECTS;
