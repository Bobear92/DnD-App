/**
 * The character's physical description — the field catalog behind the Narrative tab's Appearance
 * card, and the single source of truth for what a character can say about how they look.
 *
 * Why this exists: NPCs have had age/gender/height/weight/appearance since the module was built,
 * and player characters had NONE of it. A GM could record that a tavern keeper was greying and
 * five foot two, but not one thing about the party's own fighter.
 *
 * Deliberately RICHER than the NPC set. An NPC's description is a GM's shorthand for a person the
 * party meets once; a player character's is the thing its owner returns to for a whole campaign,
 * so the catalog is built for someone who wants to be specific — separate fields for hair colour
 * and hair style, for eye colour and what is odd about the eyes, and an explicit slot for the
 * horns, tusks, wings and tails that half the races in the compendium have and that a "hair"
 * field cannot hold.
 *
 * Two rules the catalog is shaped around:
 *
 *   1. SUGGESTIONS, NEVER CONSTRAINTS. Every field is free text. `suggestions` are rendered as a
 *      native datalist — a starting point for someone facing an empty box, not a menu to pick
 *      from. A closed <Select> here would be the app telling a player which colours their eyes
 *      may be, which is the opposite of the point. Lists are short and obviously partial.
 *   2. NOTHING COMPUTES FROM ANY OF IT. This is display-only text. Height in particular must never
 *      feed `creatureSize` or anything downstream of it: growing three inches doesn't change your
 *      size category, and a sheet where a tall character grappled differently from a short one
 *      would be inventing a rule. See APPEARANCE_FEATURE_NOTES below for the one place a game
 *      feature touches this card, and note that it only leaves a NOTE.
 *
 * Stored in the `characters.appearance` JSONB column (not `character_data`, which is class-specific
 * mechanical state). Adding a field here is a frontend-only change — that is why it is one column.
 */

/** `kind: 'long'` renders a textarea; everything else is a one-line input. */
export const APPEARANCE_GROUPS = [
  {
    key: 'body',
    label: 'Body',
    fields: [
      { key: 'age', label: 'Age', placeholder: 'e.g. 27, or "ancient"' },
      {
        key: 'pronouns',
        label: 'Pronouns',
        placeholder: 'e.g. she/her',
        suggestions: ['she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'it/its', 'any'],
      },
      { key: 'gender', label: 'Gender', placeholder: 'However you want to put it' },
      {
        key: 'height',
        label: 'Height',
        placeholder: `e.g. 5'11" or 180 cm`,
      },
      { key: 'weight', label: 'Weight', placeholder: 'e.g. 165 lb or 75 kg' },
      {
        key: 'build',
        label: 'Build',
        placeholder: 'e.g. lean and wiry',
        suggestions: ['Slender', 'Lean', 'Wiry', 'Athletic', 'Muscular', 'Stocky', 'Broad',
          'Heavyset', 'Willowy', 'Gaunt'],
      },
      {
        key: 'posture',
        label: 'Posture & bearing',
        placeholder: 'How they carry themselves',
        suggestions: ['Upright', 'Relaxed', 'Stiff', 'Slouched', 'Coiled', 'Regal', 'Restless',
          'Hunched'],
      },
    ],
  },
  {
    key: 'features',
    label: 'Face & Features',
    fields: [
      {
        key: 'eyes',
        label: 'Eye colour',
        placeholder: 'e.g. pale grey',
        suggestions: ['Brown', 'Hazel', 'Green', 'Blue', 'Grey', 'Amber', 'Black', 'Violet',
          'Gold', 'Red'],
      },
      {
        key: 'eyeDetail',
        label: 'Something about the eyes',
        placeholder: 'e.g. one milky white, slit pupils, never quite still',
      },
      {
        key: 'hairColor',
        label: 'Hair colour',
        placeholder: 'e.g. black shot with grey',
        suggestions: ['Black', 'Brown', 'Auburn', 'Red', 'Blond', 'White', 'Silver', 'Grey',
          'Dyed', 'None'],
      },
      {
        key: 'hairStyle',
        label: 'Hair style',
        placeholder: 'e.g. shaved at the sides, braided down the back',
        suggestions: ['Close-cropped', 'Shoulder-length', 'Long and loose', 'Braided', 'Ponytail',
          'Topknot', 'Locs', 'Shaved', 'Wild and unkempt', 'Bald'],
      },
      {
        key: 'facialHair',
        label: 'Facial hair',
        placeholder: 'e.g. a beard braided with iron rings',
        suggestions: ['Clean-shaven', 'Stubble', 'Full beard', 'Braided beard', 'Goatee',
          'Moustache', 'Sideburns', 'None'],
      },
      {
        key: 'skin',
        label: 'Skin',
        placeholder: 'e.g. weather-beaten copper',
        suggestions: ['Pale', 'Fair', 'Tan', 'Olive', 'Bronze', 'Brown', 'Dark', 'Ashen',
          'Ruddy', 'Scaled'],
      },
      {
        key: 'markings',
        label: 'Scars, tattoos & markings',
        placeholder: 'e.g. a burn across the left forearm; runes inked along the ribs',
        kind: 'long',
      },
      {
        key: 'distinctiveFeatures',
        label: 'Horns, tusks, wings, tail…',
        placeholder: 'Anything a human-shaped list leaves out',
        kind: 'long',
      },
    ],
  },
  {
    key: 'presentation',
    label: 'Presentation',
    fields: [
      {
        key: 'clothing',
        label: 'Clothing & style',
        placeholder: 'What they wear when nobody is trying to kill them',
        kind: 'long',
      },
      {
        key: 'accessories',
        label: 'Accessories & jewellery',
        placeholder: 'e.g. a cracked signet ring, never removed',
      },
      {
        key: 'signatureItem',
        label: 'Signature item',
        placeholder: 'The thing people remember them by',
      },
      {
        key: 'voice',
        label: 'Voice',
        placeholder: 'e.g. quiet, and slower than you expect',
        suggestions: ['Deep', 'Soft', 'Raspy', 'Melodic', 'Clipped', 'Booming', 'Nasal',
          'Whispery', 'Accented'],
      },
      {
        key: 'mannerisms',
        label: 'Mannerisms',
        placeholder: 'Habits, tics, the thing they do with their hands',
        kind: 'long',
      },
      {
        key: 'scent',
        label: 'Scent',
        placeholder: 'e.g. woodsmoke and wet wool',
      },
    ],
  },
  {
    key: 'overall',
    label: 'Overall',
    fields: [
      {
        key: 'firstImpression',
        label: 'First impression',
        placeholder: 'What a stranger notices in the first three seconds',
        kind: 'long',
      },
      {
        key: 'description',
        label: 'Full description',
        placeholder: "Describe your character in your own words. Anything the fields above don't cover.",
        kind: 'long',
      },
    ],
  },
];

/** Every field key, flattened — for iteration and for tests that guard against duplicates. */
export const APPEARANCE_FIELDS = APPEARANCE_GROUPS.flatMap((g) => g.fields);

export function appearanceFieldKeys() {
  return APPEARANCE_FIELDS.map((f) => f.key);
}

/**
 * The game features that say something about a character's physical description.
 *
 * These leave a NOTE beside a field — they never write a value and nothing reads them back. That
 * is the whole point: Great Stature adds 3d4 inches of height, which is a one-time roll the player
 * makes and a number only they can know, and which changes nothing mechanically (3–12 inches never
 * crosses a size category, and size is what the rules actually key on). So the honest surface is a
 * reminder next to the field the player types into — the same line the app draws for the Fire
 * Rune's damage: state it where the player acts on it, compute nothing.
 *
 * `applies(ctx)` follows the declarative-gate-plus-escape-hatch shape used by skillAdvantage.js
 * and saveFeatures.js. Adding another is one entry.
 */
export const APPEARANCE_FEATURE_NOTES = [
  {
    key: 'great-stature',
    field: 'height',
    source: 'Great Stature',
    charClass: 'Fighter',
    subclass: 'Rune Knight',
    edition: '5e',
    minLevel: 10,
    text: 'Great Stature has made you permanently taller — roll 3d4 and add that many inches. '
      + 'This is description only: your size category is unchanged.',
  },
];

const normEdition = (edition) => (edition === '5.5e' || edition === '2024' ? '5.5e' : '5e');

/**
 * The notes that apply to one field for this character. Returns [] for almost everybody, which is
 * why the card renders nothing rather than an empty row when there are none.
 */
export function appearanceNotesFor(fieldKey, { charClass, subclass, level = 1, edition = '5e' } = {}) {
  const ed = normEdition(edition);
  return APPEARANCE_FEATURE_NOTES.filter((n) => (
    n.field === fieldKey
    && (!n.charClass || n.charClass === charClass)
    && (!n.subclass || n.subclass === subclass)
    && (!n.edition || n.edition === ed)
    && (Number(level) || 1) >= (n.minLevel ?? 1)
  ));
}

/** True when the character has written anything at all — drives the card's empty state. */
export function hasAppearance(appearance = {}) {
  return APPEARANCE_FIELDS.some((f) => String(appearance?.[f.key] ?? '').trim() !== '');
}

/**
 * The filled fields, grouped, for the READ view. Empty fields are dropped entirely rather than
 * shown blank: a reader wants the description, not a form with gaps in it.
 */
export function filledAppearanceGroups(appearance = {}) {
  return APPEARANCE_GROUPS
    .map((g) => ({
      ...g,
      fields: g.fields.filter((f) => String(appearance?.[f.key] ?? '').trim() !== ''),
    }))
    .filter((g) => g.fields.length > 0);
}

/**
 * Drop empty strings before saving, so an untouched field never persists as `""` and
 * `hasAppearance` stays honest about what was actually written.
 */
export function cleanAppearance(draft = {}) {
  const out = {};
  for (const f of APPEARANCE_FIELDS) {
    const v = String(draft?.[f.key] ?? '').trim();
    if (v) out[f.key] = v;
  }
  return out;
}
