/**
 * Descriptions for all racial traits that appear in the 5e PHB races.
 * Keyed by the exact trait name string stored in race data and character_data.race_traits.
 */
export const RACE_TRAIT_DESCRIPTIONS = {
  // ── Dragonborn ──────────────────────────────────────────────────────────────
  'Draconic Ancestry':
    'You have draconic ancestry of a particular dragon type chosen during character creation. Your breath weapon type and damage resistance are determined by that choice. You can speak, read, and write Draconic.',
  'Breath Weapon':
    'As an action, you exhale destructive energy in a shape determined by your draconic ancestry. Each creature in the area must make a saving throw (DC 8 + your Constitution modifier + your proficiency bonus). A creature takes 2d6 damage on a failed save, or half as much on a success. The damage increases to 3d6 at 6th level, 4d6 at 11th, and 5d6 at 16th. After using this feature, you must finish a short or long rest before using it again.',
  'Damage Resistance':
    'You have resistance to the damage type associated with your draconic ancestry.',

  // ── Dwarf (base) ────────────────────────────────────────────────────────────
  'Darkvision':
    'Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.',
  'Dwarven Resilience':
    'You have advantage on saving throws against poison, and you have resistance against poison damage.',
  'Stonecunning':
    'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check, instead of your normal proficiency bonus.',
  'Tool Proficiency':
    "You gain proficiency with the artisan's tools of your choice: smith's tools, brewer's supplies, or mason's tools.",
  'Dwarven Combat Training':
    'You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.',

  // ── Hill Dwarf ───────────────────────────────────────────────────────────────
  'Dwarven Toughness':
    'Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.',

  // ── Mountain Dwarf ───────────────────────────────────────────────────────────
  'Dwarven Armor Training':
    'You have proficiency with light and medium armor.',

  // ── Elf (base) ───────────────────────────────────────────────────────────────
  'Keen Senses':
    'You have proficiency in the Perception skill.',
  'Fey Ancestry':
    "You have advantage on saving throws against being charmed, and magic can't put you to sleep.",
  'Trance':
    "Elves don't need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. While meditating, you can dream after a fashion. After resting this way, you gain the same benefit that a human does from 8 hours of sleep.",

  // ── High Elf / Wood Elf shared ───────────────────────────────────────────────
  'Elf Weapon Training':
    'You have proficiency with the longsword, shortsword, shortbow, and longbow.',

  // ── High Elf ─────────────────────────────────────────────────────────────────
  'Cantrip':
    'You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.',
  'Extra Language':
    'You can speak, read, and write one extra language of your choice.',

  // ── Wood Elf ─────────────────────────────────────────────────────────────────
  'Fleet of Foot':
    'Your base walking speed increases to 35 feet.',
  'Mask of the Wild':
    'You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.',

  // ── Dark Elf (Drow) ──────────────────────────────────────────────────────────
  'Superior Darkvision':
    'Your darkvision has a radius of 120 feet, rather than the usual 60.',
  'Sunlight Sensitivity':
    'You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight.',
  'Drow Magic':
    'You know the dancing lights cantrip. At 3rd level, you can cast faerie fire once per long rest. At 5th level, you can also cast darkness once per long rest. Charisma is your spellcasting ability for these spells.',
  'Drow Weapon Training':
    'You have proficiency with rapiers, shortswords, and hand crossbows.',

  // ── Gnome (base) ─────────────────────────────────────────────────────────────
  'Gnome Cunning':
    'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.',

  // ── Forest Gnome ─────────────────────────────────────────────────────────────
  'Natural Illusionist':
    'You know the minor illusion cantrip. Intelligence is your spellcasting ability for it.',
  'Speak with Small Beasts':
    'Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts.',

  // ── Rock Gnome ───────────────────────────────────────────────────────────────
  "Artificer's Lore":
    'Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you can add twice your proficiency bonus, instead of any proficiency bonus you normally apply.',
  'Tinker':
    "You have proficiency with artisan's tools (tinker's tools). Using those tools you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device (AC 5, 1 hp). The device ceases to function after 24 hours unless you spend 1 hour repairing it to keep it functioning. You can have up to three such devices active at a time.",

  // ── Half-Elf ─────────────────────────────────────────────────────────────────
  'Skill Versatility':
    'You gain proficiency in two skills of your choice.',

  // ── Half-Orc ─────────────────────────────────────────────────────────────────
  'Menacing':
    'You gain proficiency in the Intimidation skill.',
  'Relentless Endurance':
    "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can't use this feature again until you finish a long rest.",
  'Savage Attacks':
    'When you score a critical hit with a melee weapon attack, you can roll one of the weapon\'s damage dice one additional time and add it to the extra damage of the critical hit.',

  // ── Halfling (base) ──────────────────────────────────────────────────────────
  'Lucky':
    'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
  'Brave':
    'You have advantage on saving throws against being frightened.',
  'Halfling Nimbleness':
    'You can move through the space of any creature that is of a size larger than yours.',

  // ── Lightfoot Halfling ───────────────────────────────────────────────────────
  'Naturally Stealthy':
    'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.',

  // ── Stout Halfling ───────────────────────────────────────────────────────────
  'Stout Resilience':
    'You have advantage on saving throws against poison, and you have resistance against poison damage.',

  // ── Human ────────────────────────────────────────────────────────────────────
  'Variant: +1 to Two, one Feat, one extra Skill':
    'Variant Human: Instead of the standard +1 to all stats, you gain +1 to two different ability scores of your choice, proficiency in one skill of your choice, and one feat of your choice.',

  // ── Tiefling ─────────────────────────────────────────────────────────────────
  'Hellish Resistance':
    'You have resistance to fire damage.',
  'Infernal Legacy':
    'You know the thaumaturgy cantrip. When you reach 3rd level, you can cast hellish rebuke as a 2nd-level spell once per long rest. At 5th level, you can also cast darkness once per long rest. Charisma is your spellcasting ability for these spells.',
};
