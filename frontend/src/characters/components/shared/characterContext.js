/**
 * The character as the sheet currently shows it — one object, built once.
 *
 * Nearly every derived surface on the sheet (defenses, save features, initiative, jump, the
 * Items and Action Economy tabs, …) asks the same questions: what class, subclass, level and
 * edition is this, and what is in its character_data? CharacterDetail used to answer them inline
 * at 17 separate call sites, and the answers had drifted apart: some read the unsaved DRAFT and
 * some the last-saved value, so a subclass or feat changed in an edit could reach one panel and
 * not the next until the page was saved.
 *
 * `buildCharacterContext` resolves each fact ONE way — the draft where there is one, the saved
 * character otherwise — and every surface reads from the result. Its field names are the ones
 * `matchesGate` (shared/featureGate.js) and the feature tables already expect, so the whole
 * object can be handed straight to them.
 */
import { abilityMod, profBonus } from '@/characters/components/shared/abilityMath';

export const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

/**
 * @param {object}  args
 * @param {object}  args.character      the saved character (API shape)
 * @param {object}  [args.campaign]     for the edition
 * @param {object}  [args.draftData]    unsaved character_data edits (CharacterDetail's class section)
 * @param {object}  [args.draftIdentity] unsaved identity edits (ability scores, race, level)
 * @returns {{charClass, subclass, level, edition, characterData, feats, inventory, raceTraits,
 *            race, subrace, scores, mods, pb}}
 */
export function buildCharacterContext({ character, campaign, draftData, draftIdentity } = {}) {
  const stored = character?.character_data ?? {};
  // The draft is normally a full copy of character_data; merging keeps this correct even when a
  // caller holds only a partial patch.
  const characterData = draftData ? { ...stored, ...draftData } : stored;
  const identity = draftIdentity ?? {};
  const pick = (key) => identity[key] ?? character?.[key];

  const level = Number(pick('level')) || 1;
  const scores = {};
  const mods = {};
  for (const key of ABILITY_KEYS) {
    scores[key] = pick(key) ?? 10;
    mods[key] = abilityMod(scores[key]);
  }

  return {
    charClass: character?.char_class,
    subclass: characterData.subclass ?? undefined,
    level,
    edition: campaign?.edition || '5e',
    characterData,
    feats: characterData.feats ?? [],
    inventory: characterData.inventory ?? [],
    raceTraits: characterData.race_traits ?? [],
    race: pick('race'),
    subrace: characterData.subrace,
    scores,
    mods,
    pb: profBonus(level),
  };
}
