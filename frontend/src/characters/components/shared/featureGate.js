/**
 * "Does this character have this?" — the one gate every feature table uses.
 *
 * Almost every data table in the character system (defenses, save features, active effects,
 * companions, attack riders, equipment features, rest resources, magical attack sources, …) is a
 * list of rows that apply to SOME characters, gated on the same four facts: class, subclass, level
 * and edition. Each table used to hand-roll that filter, and they had drifted — some required a
 * class and some treated it as optional, some compared the edition raw (so a campaign stored as
 * "2024" silently missed a "5.5e" row), some defaulted a missing level and some did not.
 *
 * A row declares only the gates it needs:
 *
 *   charClass  'Fighter'                 — omitted = any class
 *   subclass   'Rune Knight'             — omitted = any subclass (or none)
 *   minLevel   7                         — omitted = level 1
 *   edition    '5e' | '5.5e'             — omitted = both
 *   editions   ['5e', '5.5e']            — the list form of the same gate
 *   applies    (ctx) => boolean          — the escape hatch for anything the keys above cannot
 *                                          say (a rune must be carved on an EQUIPPED item; an
 *                                          effect must be switched ON; the character has a feat)
 *
 * Prefer the declarative keys: a row whose gate is `applies: ({charClass, subclass, level}) =>
 * charClass === 'Fighter' && subclass === 'Cavalier' && level >= 3` is the hand-rolled filter
 * again, one row at a time.
 */

/** The app's canonical edition key. A campaign may store 2024 rules as "5.5e" or "2024". */
export const normEdition = (edition) => (edition === '5.5e' || edition === '2024' ? '5.5e' : '5e');

/** True for a 2024-rules campaign, whichever way its edition is spelled. */
export const isEdition2024 = (edition) => normEdition(edition) === '5.5e';

/**
 * True when every gate `entry` declares is satisfied by `ctx`.
 *
 * @param {{charClass?: string, subclass?: string, minLevel?: number, edition?: string,
 *          editions?: string[], applies?: (ctx: object) => boolean}} entry
 * @param {{charClass?: string, subclass?: string, level?: number, edition?: string}} ctx
 *        `applies` receives this object untouched, so a table may pass extra fields it needs
 *        (characterData, feats, inventory, raceTraits…).
 */
export function matchesGate(entry, ctx = {}) {
  if (!entry) return false;
  const { charClass, subclass, level, edition } = ctx;
  if (entry.charClass && entry.charClass !== charClass) return false;
  if (entry.subclass && entry.subclass !== subclass) return false;
  if ((Number(level) || 1) < (entry.minLevel ?? 1)) return false;
  const ed = normEdition(edition);
  if (entry.edition && normEdition(entry.edition) !== ed) return false;
  if (entry.editions && !entry.editions.some((e) => normEdition(e) === ed)) return false;
  if (entry.applies && !entry.applies(ctx)) return false;
  return true;
}
