// What a character adds to an ability check made with a tool they're PROFICIENT with.
//
// The app has no per-tool check number, and can't have an honest one: a tool check has no fixed
// ability (thieves' tools on a lock is DEX, on a trap's mechanism it may be INT; the DM picks).
// What IS fixed is the proficiency term, and that is exactly the part features change. So this
// answers one question: "on a proficient tool check, how much proficiency do I add?" The Tools
// sub-tab prints that number beside the proficiency banner, and the player adds the ability
// modifier the DM calls for.
//
// Sources are a table, the skillAdvantage.js shape. A source that doubles the bonus wins
// outright, since doubling doesn't stack (two "doubled" features are still ×2). Authored:
//   Fire Rune (Rune Knight): carved on an equipped object, via activeRunes(); the rune's
//     `passive.toolBonus` flag is the producer field this module reads.
// Artificer Tool Expertise (L6) is the same clause and would be the second row.

import { profBonus } from '@/characters/components/inventory/inventoryData';
import { activeRunes } from '@/characters/components/inventory/runeCarving';

const TOOL_CHECK_SOURCES = [
  {
    key: 'rune-carving',
    // `{source, note}` for each running source that doubles the bonus.
    resolve: ({ characterData, level }) =>
      activeRunes({ characterData, level })
        .filter(({ rune }) => rune.passive?.toolBonus)
        .map(({ rune, entry }) => ({ source: rune.name, note: `Carved on ${entry.name}` })),
  },
];

/**
 * The proficiency term on a proficient tool check:
 *   { pb, total, doubled, sources: [{source, note}] }
 * `total` is the number to show; `pb` is kept so a surface can explain a doubled total.
 */
export function toolCheckProficiency({ characterData = {}, level = 1 } = {}) {
  const pb = profBonus(level);
  const sources = TOOL_CHECK_SOURCES.flatMap((s) => s.resolve({ characterData, level }) ?? []);
  const doubled = sources.length > 0;
  return { pb, total: doubled ? pb * 2 : pb, doubled, sources };
}
