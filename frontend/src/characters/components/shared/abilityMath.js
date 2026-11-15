/**
 * The two formulas every part of the character system needs, and how their results are printed.
 *
 * This is the ONLY place they are written out. They used to be defined in three exported copies
 * (inventoryData, skillMath, classProgressionTables), about fifteen local `mod` / `abMod` /
 * `conMod` helpers, and a dozen inline `Math.floor((score - 10) / 2)` expressions — each handling
 * a missing score slightly differently (some returned NaN, some 0). `src/test/noDuplicateHelpers.test.js`
 * fails the build if either formula is written anywhere else.
 *
 * Dependency-free on purpose, so any module (data tables, components, scripts) can import it.
 */

/**
 * A D&D ability modifier: (score − 10) halved, rounded DOWN (so 9 → −1, not 0).
 * A missing, empty or non-numeric score counts as 10 (modifier 0) rather than producing NaN —
 * a half-typed ability score must not blank every number derived from it.
 */
export const abilityMod = (score) => Math.floor(((Number(score) || 10) - 10) / 2);

/**
 * Proficiency bonus by character level: +2 at 1–4, +3 at 5–8, +4 at 9–12, +5 at 13–16, +6 at 17–20.
 * A missing or non-numeric level counts as level 1.
 */
export const profBonus = (level) => Math.ceil((Number(level) || 1) / 4) + 1;

/** "+3" / "-1" / "+0" — a signed number with a plain hyphen (compact chips, attack rows). */
export const formatSigned = (n) => (n >= 0 ? `+${n}` : `${n}`);

/** "+3" / "−1" / "+0" — a signed number with a real minus sign (skills, saves, prose). */
export const formatBonus = (n) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

/** An ability score's modifier, signed with a plain hyphen: 16 → "+3", 8 → "-1". */
export const formatAbilityMod = (score) => formatSigned(abilityMod(score));
