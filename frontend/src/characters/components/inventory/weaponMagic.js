/**
 * Whether a given weapon's ATTACKS count as magical — i.e. overcome resistance and immunity to
 * nonmagical attacks and damage.
 *
 * Asked PER WEAPON, never per character: every source below applies to a subset of what the
 * character wields (a Magic Arrow archer's dagger is still mundane), so a character-level flag
 * would be wrong. Same shape as `isArcaneShotBow` — the feature decides which weapons it touches.
 *
 * Three origins exist in the rules; this module currently answers for one:
 *   1. FEATURE-granted (here)      — Magic Arrow, Monk Ki-Empowered Strikes, Improved Pact Weapon…
 *                                    Each is a data entry in MAGIC_ATTACK_SOURCES.
 *   2. ITEM-intrinsic (here)       — a +1 longbow is magical on its own. A magic weapon is a weapons
 *                                    entry carrying a `magic` block (inventoryData.buildMagicWeaponEntry);
 *                                    while that block is active (attuned, if the item needs it) the
 *                                    weapon's own magic is the source. Checked FIRST: it names the item.
 *   3. SPELL/temporary (declined)  — Magic Weapon, Shillelagh, Elemental Weapon. Deliberately NOT
 *                                    auto-tagged: the app tracks no buff duration, so claiming a
 *                                    weapon is magical "now" would be a promise it can't keep.
 *
 * The result carries its SOURCE, because that is what tells a player when the tag stops applying.
 */
import { isArcaneShotBow } from '@/characters/components/classData/arcaneShotData';
import { matchesGate } from '@/characters/components/shared/featureGate';

/**
 * Each entry: which characters have the source, and which of their weapons it covers.
 *   charClass / subclass  — required match (subclass optional for class-wide sources)
 *   edition               — omit to match both editions
 *   minLevel              — the level the feature is gained
 *   appliesTo(weapon)     — true for a weapon this source makes magical
 *   note                  — what the tag means, shown as the badge's tooltip
 */
export const MAGIC_ATTACK_SOURCES = [
  {
    source: 'Magic Arrow',
    charClass: 'Fighter',
    subclass: 'Arcane Archer',
    edition: '5e',
    minLevel: 7,
    // RAW: "whenever you fire a nonmagical arrow from a shortbow or longbow". The same narrow
    // bow list Arcane Shot uses — a crossbow bolt is not an arrow.
    appliesTo: (weapon) => isArcaneShotBow(weapon?.name),
    note: 'Arrows you fire from this bow become magical for the purpose of overcoming resistance '
      + 'and immunity to nonmagical attacks and damage.',
  },
];

/**
 * The entry's magic block while it is WORKING, else null: an item that requires attunement does nothing until the
 * character is attuned to it. Every reader of an inventory entry's `magic` goes through here (inventoryData
 * re-exports it), so that rule lives once.
 */
export function activeMagic(entry) {
  const magic = entry?.magic;
  if (!magic) return null;
  if (magic.attunement_required && !entry.attuned) return null;
  return magic;
}

/**
 * The source making this weapon's attacks magical, or null.
 * Returns `{ source, note }` — never a bare boolean, so the surface can say WHY.
 */
export function magicalAttackSource(weapon, { charClass, subclass, level = 1, edition = '5e' } = {}) {
  if (!weapon) return null;
  const magic = activeMagic(weapon);
  if (magic) {
    return {
      source: magic.item_name,
      note: 'A magic weapon: its attacks overcome resistance and immunity to nonmagical attacks and damage.',
    };
  }
  const ctx = { charClass, subclass, level, edition };
  const match = MAGIC_ATTACK_SOURCES.find((s) => matchesGate(s, ctx) && s.appliesTo(weapon));
  return match ? { source: match.source, note: match.note } : null;
}
