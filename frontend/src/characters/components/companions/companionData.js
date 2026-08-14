/**
 * SUMMONED COMPANIONS — entities a character conjures that have their own defensive numbers
 * but are not creatures with a sheet of their own.
 *
 * WHY THIS EXISTS: an Echo Knight's echo has an AC that scales with proficiency bonus, and
 * that number lived nowhere in the app — the player had to compute it mid-combat from the
 * feature text. This module is the single source for a companion's derived statblock, and the
 * shape is deliberately class-agnostic so the next one (a familiar, a Steel Defender, a
 * Drakewarden's drake) is a data entry rather than another panel.
 *
 * WHAT THIS IS NOT: a creature model. There is no tracked state here — no current HP, no
 * "is it manifested right now", no position. The app displays what a character can do rather
 * than simulating a battlefield (the same line the Encounters tab and the mounts gap sit on),
 * and a summon whose HP is 1 has nothing to track anyway. A companion with real hit points
 * wants the Bestiary tie-in, not a bigger version of this table.
 *
 * A stat carries either a plain `value` (a string — "Medium", "Yours") or a `breakdown` built
 * with buildBreakdown, which the panel renders as a clickable number, the same treatment every
 * other derived number on the sheet gets. Traits are name + rules text, collapsed by default.
 */
import { profBonus } from '@/characters/components/inventory/inventoryData';
import { buildBreakdown } from '@/characters/components/skills/skillMath';

/**
 * The echo's AC. Exported because the Action Economy tab's Manifest Echo card shows the same
 * number — one formula, so the card and the statblock cannot disagree.
 */
export const echoArmorClass = (level) => 14 + profBonus(level);

const echoAcBreakdown = (level) => buildBreakdown({
  parts: [
    { key: 'base', label: 'Base', value: 14, signed: false },
    { key: 'proficiency', label: 'Proficiency bonus', value: profBonus(level) },
  ],
});

export const COMPANIONS = [
  {
    key: 'echo',
    name: 'Echo',
    plural: 'Echoes',   // authored, not derived — "Echo" + "s" is wrong, and so is a naive rule
    source: 'Manifest Echo',
    charClass: 'Fighter',
    subclass: 'Echo Knight',
    edition: '5e',
    minLevel: 3,
    summary: 'A magical, translucent grey image of yourself that you manifest as a bonus action '
      + 'in an unoccupied space you can see within 15 feet. It is a creature, but it can take no '
      + 'actions of its own — it exists so that you can act from where it stands.',
    // Legion of One (18th) lets two coexist. The count is a level formula rather than a note so
    // that a level-18 character reads "2 echoes" instead of doing the gating themselves.
    count: (level) => (level >= 18 ? 2 : 1),
    countNote: (level) => (level >= 18
      ? 'Both are created by the same bonus action and can coexist. Creating a third destroys the previous two.'
      : null),
    stats: (level) => [
      { key: 'ac', label: 'Armor Class', breakdown: echoAcBreakdown(level) },
      { key: 'hp', label: 'Hit Points', value: '1', note: 'Any damage destroys it.' },
      { key: 'size', label: 'Size', value: 'Medium' },
      { key: 'saves', label: 'Saving Throws', value: 'Yours', note: 'It uses your saving throw modifiers.' },
      { key: 'conditions', label: 'Conditions', value: 'Immune to all' },
      { key: 'duration', label: 'Duration', value: '1 minute' },
      { key: 'leash', label: 'Range', value: 'Within 30 ft of you' },
    ],
    traits: (level) => [
      {
        key: 'attack-from-echo',
        name: 'Attack from its space',
        text: 'When you take the Attack action on your turn, any attack you make with that action '
          + "can originate from your space or the echo's space.",
      },
      {
        key: 'swap',
        name: 'Swap places',
        text: 'You can use 15 feet of your movement to swap places with your echo, teleporting to '
          + 'its space as it teleports to yours.',
      },
      {
        key: 'dismiss',
        name: 'Dismiss it',
        text: 'You can dismiss the echo at any time, requiring no action.',
      },
      {
        key: 'destroyed',
        name: 'How it ends',
        text: 'The echo is destroyed if it takes any damage, if you are incapacitated or die, if '
          + 'you manifest another one, if it ends up more than 30 feet away from you at the start '
          + 'of your turn, or when its minute is up.',
      },
      ...(level >= 18 ? [{
        key: 'legion',
        name: 'Either echo will do',
        text: "Anything you can do from one echo's position can be done from the other's instead.",
      }] : []),
    ],
  },
];

/**
 * The companions this character has, resolved against their level.
 * Returns `[]` for the overwhelming majority of characters, which is the point — the panel
 * renders nothing rather than every sheet growing an empty section.
 */
export function getCompanions({ charClass, subclass, edition = '5e', level = 1 } = {}) {
  return COMPANIONS
    .filter((c) => c.charClass === charClass
      && c.subclass === subclass
      && (!c.edition || c.edition === edition)
      && level >= c.minLevel)
    .map((c) => ({
      key: c.key,
      name: c.name,
      plural: c.plural ?? `${c.name}s`,
      source: c.source,
      summary: c.summary,
      count: c.count(level),
      countNote: c.countNote?.(level) ?? null,
      stats: c.stats(level),
      traits: c.traits(level),
    }));
}
