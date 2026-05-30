/**
 * Descriptions for all selectable class choices: fighting styles,
 * subclasses, and pact boons. Used by OptionCardPicker across all class sheets.
 *
 * Values must match the strings already stored in character_data (database).
 */

// ── Fighting Styles ──────────────────────────────────────────────────────────

const FIGHTING_STYLE_DESCRIPTIONS = {
  'Archery':               '+2 bonus to attack rolls with ranged weapons.',
  'Blind Fighting':        'Gain 10-foot blindsight — detect and attack invisible or hidden creatures within that range.',
  'Defense':               '+1 bonus to AC while wearing armor.',
  'Druidic Warrior':       'Learn two Druid cantrips; Wisdom is your spellcasting modifier for them.',
  'Dueling':               '+2 damage when wielding a one-handed melee weapon with no other weapons.',
  'Great Weapon Fighting': 'Reroll 1s and 2s on damage dice when attacking with a two-handed or versatile weapon held in two hands.',
  'Interception':          'Use your reaction to reduce damage dealt to a creature within 5 feet of you by 1d10 + your proficiency bonus.',
  'Protection':            'Use your reaction to impose disadvantage on an attack roll against a creature within 5 feet of you (requires a shield).',
  'Thrown Weapon Fighting':'Draw thrown weapons as part of the attack; deal +2 damage with thrown weapon attacks.',
  'Two-Weapon Fighting':   'Add your ability modifier to the damage roll of your off-hand attack.',
  'Unarmed Fighting':      'Unarmed strikes deal 1d6 (or 1d8 with no weapon or shield held) bludgeoning damage; bonus-action grapple deals 1d4.',
};

function styles(...names) {
  return names.map(v => ({ value: v, description: FIGHTING_STYLE_DESCRIPTIONS[v] }));
}

export const FIGHTER_FIGHTING_STYLES_5E = styles(
  'Archery', 'Defense', 'Dueling', 'Great Weapon Fighting', 'Protection', 'Two-Weapon Fighting',
);
export const PALADIN_FIGHTING_STYLES_5E = styles(
  'Defense', 'Dueling', 'Great Weapon Fighting', 'Protection',
);
export const RANGER_FIGHTING_STYLES_5E = styles(
  'Archery', 'Defense', 'Dueling', 'Two-Weapon Fighting',
);
export const FIGHTER_FIGHTING_STYLES_2024 = styles(
  'Archery', 'Blind Fighting', 'Defense', 'Dueling',
  'Great Weapon Fighting', 'Interception', 'Protection',
  'Thrown Weapon Fighting', 'Two-Weapon Fighting', 'Unarmed Fighting',
);
export const RANGER_FIGHTING_STYLES_2024 = styles(
  'Archery', 'Defense', 'Druidic Warrior', 'Thrown Weapon Fighting', 'Two-Weapon Fighting',
);

// ── Subclasses ───────────────────────────────────────────────────────────────

export const ARTIFICER_SUBCLASSES_5E = [
  { value: 'Alchemist',    description: 'Master of experimental elixirs — brew random potions for free each long rest and restore allies with reagents.' },
  { value: 'Armorer',      description: 'Integrate your armor with arcane power — choose Guardian (sentinel tank) or Infiltrator (agile striker) models.' },
  { value: 'Artillerist',  description: 'Summon an Eldritch Cannon to blast enemies or shield allies; use a weapon as your Arcane Firearm for bonus force damage.' },
  { value: 'Battle Smith', description: 'Bond with a Steel Defender companion and wield weapons using Intelligence — fuse martial prowess with arcane crafting.' },
];

export const BARBARIAN_SUBCLASSES_5E = [
  { value: 'Path of the Berserker',         description: 'Bonus-action attacks while raging; immunity to charm and frighten at higher levels.' },
  { value: 'Path of the Totem Warrior',     description: 'Channel a totem animal spirit (bear, eagle, elk, or wolf) for passive combat and survival benefits.' },
  { value: 'Path of the Ancestral Guardian',description: 'Ancestral spirits protect allies while you rage, imposing disadvantage on enemies who ignore your friends.' },
  { value: 'Path of the Storm Herald',      description: 'Choose an environment (arctic, desert, or sea) to create an elemental aura that damages or heals while raging.' },
  { value: 'Path of the Zealot',            description: 'Divine rage deals bonus radiant or necrotic damage; allies can revive you in combat without material cost.' },
  { value: 'Path of the Beast',             description: 'Grow natural weapons (claws, bite, or tail) from your body while raging; share them with nearby allies at higher levels.' },
  { value: 'Path of Wild Magic',            description: 'Random wild magic surges accompany your rage, creating chaotic effects from healing auras to spectral maws.' },
];

export const BARBARIAN_SUBCLASSES_2024 = [
  { value: 'Path of the Berserker',    description: 'Bonus-action attacks while raging; exhaustion-resistant frenzied fighting.' },
  { value: 'Path of the Wild Heart',   description: 'Channel the spirit of a totem animal for defensive and utility benefits.' },
  { value: 'Path of the World Tree',   description: 'Draw power from the cosmic world tree — teleport allies and protect them from harm while raging.' },
  { value: 'Path of the Zealot',       description: 'Divine rage deals bonus damage; allies can revive you in battle without spending resources.' },
  { value: 'Path of Wild Magic',       description: 'Chaotic surges accompany your rage, triggering random magical effects from a surge table.' },
];

export const BARD_SUBCLASSES_5E = [
  { value: 'College of Lore',       description: 'Deep knowledge and Cutting Words to undermine enemies; gain extra Magical Secrets earlier than other bards.' },
  { value: 'College of Valor',      description: 'Martial bard — gain armor, weapons, a Fighting Style, and Extra Attack alongside spellcasting.' },
  { value: 'College of Glamour',    description: 'Channel Feywild enchantment to charm large groups and grant allies temp HP with Mantle of Inspiration.' },
  { value: 'College of Swords',     description: 'Acrobatic blade mastery — Blade Flourishes add damage effects to attacks using Bardic Inspiration dice.' },
  { value: 'College of Whispers',   description: 'Steal the life essence of enemies to impersonate them; psychic blades deal bonus damage.' },
  { value: 'College of Creation',   description: 'Shape raw magic into temporary objects and animate them; Note of Potential enhances Bardic Inspiration with bonus effects.' },
  { value: 'College of Eloquence',  description: 'Master persuader — Bardic Inspiration dice are never wasted; silver tongue means Persuasion/Deception never roll below 10.' },
  { value: 'College of Spirits',    description: 'Channel tales of the dead through a Spiritual Focus to unleash random narrative effects on allies and enemies.' },
];

export const BARD_SUBCLASSES_2024 = [
  { value: 'College of Dance',    description: 'Blend acrobatic footwork with spellcasting — weave fluidly between movement, attacks, and spells.' },
  { value: 'College of Glamour',  description: 'Feywild enchantment — charm crowds and grant allies temp HP through an Enthralling Performance.' },
  { value: 'College of Lore',     description: 'Extra skills, Cutting Words, and early Magical Secrets to undercut enemies and expand your repertoire.' },
  { value: 'College of Valor',    description: 'Martial bard combining armor, weapons, a Fighting Style, and Extra Attack with spellcasting.' },
  { value: 'College of Swords',   description: 'Blade Flourishes spend Bardic Inspiration to add damage or defensive effects to your attacks.' },
  { value: 'College of Whispers', description: 'Psychic blades and stolen identities — drain enemies and impersonate the dead.' },
];

export const CLERIC_SUBCLASSES_5E = [
  { value: 'Life Domain',      description: 'The most powerful healer — Disciple of Life boosts all cure spells; Preserve Life stabilizes many allies at once.' },
  { value: 'Light Domain',     description: 'Radiance and fire — Warding Flare imposes disadvantage on attacks; Corona of Light blinds enemies.' },
  { value: 'Trickery Domain',  description: 'Illusion and deception — create a duplicate, bless agents of subterfuge, and vanish with Cloak of Shadows.' },
  { value: 'Knowledge Domain', description: 'Master of secrets — read minds, gain temporary proficiencies, and learn languages from any creature.' },
  { value: 'Nature Domain',    description: 'Bond with nature — Charm Animals and Plants, call nature spirits, and protect the natural world.' },
  { value: 'Tempest Domain',   description: 'Storm wrath — maximize thunder and lightning damage with Destructive Wrath; push enemies with thunderwave. ' },
  { value: 'War Domain',       description: 'Martial champion — War Priest grants bonus action attacks; Guided Strike adds +10 to an attack roll.' },
  { value: 'Arcana Domain',    description: 'Master of magical knowledge — gain wizard cantrips, arcane spells, and the power to banish magical creatures.' },
  { value: 'Death Domain',     description: 'Necromancy and undeath — channel negative energy and raise more powerful undead servants (villain archetype).' },
  { value: 'Forge Domain',     description: 'Craft and metal — bless your armor, shape metal objects with a touch, and become resistant to fire.' },
  { value: 'Grave Domain',     description: 'Balance life and death — Sentinel at Death\'s Door prevents crits; Path to the Grave marks enemies for double damage.' },
  { value: 'Order Domain',     description: 'Lawful authority — Command allies as a bonus action; Voice of Authority lets an ally attack when you cast a spell on them.' },
  { value: 'Peace Domain',     description: 'Emboldening Bond links allies to share damage; Balm of Peace heals multiple creatures as a bonus action.' },
  { value: 'Twilight Domain',  description: 'Boundary of light and dark — Twilight Sanctuary aura protects allies; Steps of Night grants flying speed in dim light.' },
];

export const CLERIC_SUBCLASSES_2024 = CLERIC_SUBCLASSES_5E; // same domains in 2024

export const DRUID_SUBCLASSES_5E = [
  { value: 'Circle of the Land',     description: 'Terrain-based bonus spell slots and spells tied to your chosen homeland environment.' },
  { value: 'Circle of the Moon',     description: 'Wild Shape into powerful combat beasts (CR up to level/3) and elementals at level 10.' },
  { value: 'Circle of Dreams',       description: 'Healing and protective magic from the Feywild; teleport willing creatures with Hearth of Moonlight and Shadow.' },
  { value: 'Circle of the Shepherd', description: 'Summon spirit totems to empower companion creatures; call nature spirits to protect allies.' },
  { value: 'Circle of Spores',       description: 'Animate dead with fungal spores; Halo of Spores deals bonus necrotic damage to nearby creatures.' },
  { value: 'Circle of Stars',        description: 'Starry Form constellation shapes grant healing (Chalice), offense (Archer), or concentration protection (Dragon).' },
  { value: 'Circle of Wildfire',     description: 'Summon a wildfire spirit companion; teleport allies and enemies through fire portals.' },
];

export const DRUID_SUBCLASSES_2024 = [
  { value: 'Circle of the Land',     description: 'Natural Recovery for bonus spell slots; terrain spells keyed to your chosen landscape.' },
  { value: 'Circle of the Moon',     description: 'Enhanced Wild Shape into powerful beasts and elementals; Beast Spells while transformed.' },
  { value: 'Circle of the Sea',      description: 'Wrath of the Sea aura pushes enemies; thunder and water magic tied to the ocean.' },
  { value: 'Circle of the Stars',    description: 'Starry Form constellation shapes for healing, ranged offense, or concentration protection.' },
  { value: 'Circle of Wildfire',     description: 'Summon a wildfire spirit; teleport through flame portals and call fire to heal or harm.' },
  { value: 'Circle of Spores',       description: 'Halo of Spores necrotic aura and symbiotic entity that animates the dead.' },
  { value: 'Circle of Dreams',       description: 'Fey healing and protective teleportation from the Hearth of Moonlight and Shadow.' },
  { value: 'Circle of Shepherd',     description: 'Spirit totems (Bear, Hawk, Unicorn) empower summoned beasts and fey companions.' },
];

export const FIGHTER_SUBCLASSES_5E = [
  { value: 'Champion',       description: 'Simple but deadly — expanded critical hit range (19–20), extra Fighting Style, and athletic feats.' },
  { value: 'Battle Master',  description: 'Tactical combatant using superiority dice (d8) to fuel combat maneuvers that control the battlefield.' },
  { value: 'Eldritch Knight',description: 'Bind to a bonded weapon and learn abjuration and evocation spells (INT-based).' },
  { value: 'Arcane Archer',  description: 'Infuse arrows with magical effects like Seeking Shot, Shadow Arrow, or Bursting Arrow using Arcane Shot.' },
  { value: 'Cavalier',       description: 'Mounted warrior who protects allies and uses Unwavering Mark to punish enemies who ignore you.' },
  { value: 'Echo Knight',    description: 'Create a shimmering echo of yourself — attack from its position and swap places with it in a flash.' },
  { value: 'Psi Warrior',    description: 'Telekinetic fighter using Psionic Power dice to push enemies, protect yourself, and augment attacks.' },
  { value: 'Rune Knight',    description: 'Carve magical runes into weapons and armor; grow to Giant size for enhanced reach and damage.' },
  { value: 'Samurai',        description: 'Fighting Spirit grants advantage and temp HP; Elegant Courtier adds Wisdom saves and Charisma proficiency.' },
];

export const FIGHTER_SUBCLASSES_2024 = [
  { value: 'Battle Master',   description: 'Tactical combatant — superiority dice power maneuvers that trip, taunt, or bolster allies.' },
  { value: 'Champion',        description: 'Reliable excellence — wider crit range, extra Fighting Style, and remarkable athletic achievement.' },
  { value: 'Eldritch Knight', description: 'Weave abjuration and evocation magic into combat with INT-based spellcasting and a bonded weapon.' },
  { value: 'Psi Warrior',     description: 'Telekinetic powers — push enemies, protect yourself, and augment attacks with psionic energy.' },
];

export const MONK_SUBCLASSES_5E = [
  { value: 'Way of the Open Hand',       description: 'Master of unarmed combat — Flurry of Blows can knock prone, push, or prevent reactions.' },
  { value: 'Way of Shadow',              description: 'Stealth and darkness — teleport between shadows and cast darkness, silence, and pass without trace.' },
  { value: 'Way of the Four Elements',   description: 'Channel elemental ki to cast spells simulating fire, water, earth, and air.' },
  { value: 'Way of the Drunken Master',  description: 'Unpredictable weaving movements impose disadvantage and grant free Disengage reactions.' },
  { value: 'Way of the Kensei',          description: 'Turn chosen weapons into monk weapons with improved damage and ranged attack options.' },
  { value: 'Way of the Sun Soul',        description: 'Fire radiant ki bolts at range; unleash a Searing Sunburst AoE at higher levels.' },
  { value: 'Way of the Ascendant Dragon',description: 'Adopt a draconic aspect — add elemental damage to strikes and grant allies elemental resistance.' },
  { value: 'Way of the Astral Self',     description: 'Conjure astral arms for reach attacks, bonus unarmed strikes, and defensive sight at higher levels.' },
  { value: 'Way of Mercy',               description: 'Hand of Healing or Hand of Harm delivers life or necrotic damage through a touch; Mask of Mercy at higher levels.' },
];

export const MONK_SUBCLASSES_2024 = [
  { value: 'Warrior of the Open Hand',      description: 'Flurry of Blows with knockdown, push, or reaction-lock effects — pure unarmed mastery.' },
  { value: 'Warrior of Shadow',             description: 'Shadow Step teleportation; cast darkness and silence with ki; vanish at higher levels.' },
  { value: 'Warrior of the Elements',       description: 'Elemental Attunement deals AoE damage and alters terrain; elemental servant form at higher levels.' },
  { value: 'Warrior of Mercy',              description: 'Hand of Healing and Hand of Harm deliver restoration or necrotic damage through a touch.' },
  { value: 'Warrior of the Astral Self',    description: 'Manifest astral arms for extended reach, bonus attacks, and defensive ward.' },
  { value: 'Warrior of the Drunken Master', description: 'Tipsy Sway erratic movement imposes disadvantage and grants free Disengage.' },
  { value: 'Warrior of the Kensei',         description: 'Chosen kensei weapons become monk weapons with bonus damage and ranged options.' },
  { value: 'Warrior of the Sun Soul',       description: 'Radiant Sun Bolt ranged attacks; Searing Arc Strike and Searing Sunburst at higher levels.' },
];

export const PALADIN_SUBCLASSES_5E = [
  { value: 'Oath of Devotion',        description: 'The classic holy warrior — Sacred Weapon and Holy Nimbus; Turn the Unholy drives away fiends and undead.' },
  { value: 'Oath of the Ancients',    description: 'Defend the light of nature and fey magic — Nature\'s Wrath and Turn the Faithless for control.' },
  { value: 'Oath of Vengeance',       description: 'Relentless hunter — Vow of Enmity grants advantage; Relentless Avenger lets you chase down fleeing targets.' },
  { value: 'Oath of Conquest',        description: 'Rule through fear — Conquering Presence frightens enemies; Aura of Conquest holds them in place.' },
  { value: 'Oath of Redemption',      description: 'Peace first — Emissary of Peace; Rebuke the Violent reflects damage back on attackers.' },
  { value: 'Oath of Glory',           description: 'Inspire heroic deeds — Inspiring Smite heals allies; Aura of Alacrity boosts party movement speed.' },
  { value: 'Oath of the Watchers',    description: 'Protect against extraplanar threats — advantage on initiative; channel to banish celestials, fey, or fiends.' },
  { value: 'Oathbreaker',             description: 'Fallen paladin — animate undead, wield Aura of Hate for bonus necrotic damage (villain archetype).' },
];

export const PALADIN_SUBCLASSES_2024 = [
  { value: 'Oath of Devotion',     description: 'Sacred Weapon and Holy Nimbus — the classic radiant warrior who turns undead and fiends.' },
  { value: 'Oath of the Ancients', description: 'Channel the light of nature — Nature\'s Wrath and Turn the Faithless for battlefield control.' },
  { value: 'Oath of Glory',        description: 'Inspire greatness — Aura of Alacrity speeds allies; Inspiring Smite heals with a bonus action.' },
  { value: 'Oath of Vengeance',    description: 'Vow of Enmity grants advantage on hunted targets; Relentless Avenger closes the gap on fleeing foes.' },
  { value: 'Oath of Conquest',     description: 'Conquering Presence frightens foes; Aura of Conquest paralyzes frightened enemies.' },
  { value: 'Oath of Redemption',   description: 'Rebuke the Violent reflects damage; Emissary of Redemption shrugs off blows from those who would harm you.' },
  { value: 'Oathbreaker',          description: 'Channel Divinity to animate undead; Aura of Hate fuels allies with bonus necrotic damage (villain archetype).' },
];

export const RANGER_SUBCLASSES_5E = [
  { value: 'Beast Master',    description: 'Bond with an animal companion that fights alongside you and attacks on your command.' },
  { value: 'Gloom Stalker',   description: 'Ambush predator — extra attack on the first turn; invisible to darkvision in darkness.' },
  { value: 'Horizon Walker',  description: 'Planar warrior — detect and attack extraplanar creatures; Ethereal Step between planes.' },
  { value: 'Hunter',          description: 'Direct damage — choose Hunter\'s Prey, Defensive Tactics, and Multiattack specializations as you level.' },
  { value: 'Monster Slayer',  description: 'Specialized monster hunter — Hunter\'s Sense reveals immunities; Slayer\'s Prey marks targets for extra damage.' },
  { value: 'Fey Wanderer',    description: 'Otherworldly Glamour adds Charisma to Wisdom checks; Misty Wanderer grants teleportation.' },
  { value: 'Swarmkeeper',     description: 'Bond with a swarm of nature spirits — Gathered Swarm forces movement or deals bonus damage.' },
  { value: 'Drakewarden',     description: 'Bond with a drake companion that can fly and imbue your attacks with elemental damage.' },
];

export const RANGER_SUBCLASSES_2024 = [
  { value: 'Beast Master',    description: 'Bond with a Primal Beast that has its own stat block and attacks on your command.' },
  { value: 'Fey Wanderer',    description: 'Otherworldly Glamour from the Feywild; Dreadful Strikes and crowd-control fey magic.' },
  { value: 'Gloom Stalker',   description: 'Darkness ambusher — invisible to darkvision; extra first-round attack; Umbral Sight.' },
  { value: 'Hunter',          description: 'Choose Hunter\'s Prey, Defensive Tactics, and Multiattack specializations at specific levels.' },
  { value: 'Monster Slayer',  description: 'Hunter\'s Sense reveals resistances; Slayer\'s Prey and Supernatural Defense for focused hunting.' },
  { value: 'Swarmkeeper',     description: 'Gathered Swarm of nature spirits provides forced movement, cover, and bonus damage.' },
];

export const ROGUE_SUBCLASSES_5E = [
  { value: 'Thief',            description: 'Classic burglar — Fast Hands for bonus actions; Supreme Sneak for advantage while moving slowly.' },
  { value: 'Arcane Trickster', description: 'Weave enchantment and illusion magic into thievery with INT-based spellcasting.' },
  { value: 'Assassin',         description: 'Deadly ambusher — automatically crit surprised enemies; master of disguise and poison.' },
  { value: 'Inquisitive',      description: 'Detect lies and use Insightful Fighting to gain Sneak Attack on any target you observe.' },
  { value: 'Mastermind',       description: 'Social manipulator — Help as a bonus action from 30 feet; master of deception and languages.' },
  { value: 'Phantom',          description: 'Steal tokens from the dead — Tokens of the Departed grant advantage; Wails from the Grave haunts enemies.' },
  { value: 'Scout',            description: 'Superior terrain master — Skirmisher reaction to Dash away; Superior Mobility and Ambush Master.' },
  { value: 'Soul Knife',       description: 'Manifest psychic blades from your own mind — you are always armed and can slice through mental defenses.' },
  { value: 'Swashbuckler',     description: 'Elegant duelist — Sneak Attack in one-on-one fights without an ally; use Charisma for social defense.' },
];

export const ROGUE_SUBCLASSES_2024 = [
  { value: 'Arcane Trickster', description: 'INT-based enchantment and illusion spellcasting woven into classic rogue tactics.' },
  { value: 'Assassin',         description: 'Infiltrate and assassinate — auto-crit on surprised foes; disguises and poison mastery.' },
  { value: 'Soulknife',        description: 'Manifest psychic blades from your own mind; always armed, always ready.' },
  { value: 'Swashbuckler',     description: 'CHA-based duelist — Sneak Attack in one-on-one fights without needing an ally.' },
  { value: 'Thief',            description: 'Fast Hands for bonus-action item use; Supreme Sneak and Use Object expertise.' },
];

export const SORCERER_SUBCLASSES_5E = [
  { value: 'Draconic Bloodline', description: 'Draconic ancestor grants natural armor (13 + DEX) and empowered damage for your chosen element.' },
  { value: 'Wild Magic',         description: 'Unpredictable surges create chaotic effects; Tides of Chaos grants advantage once per rest.' },
  { value: 'Divine Soul',        description: 'Celestial or fiendish heritage grants access to the full Cleric spell list.' },
  { value: 'Shadow Magic',       description: 'Born in the Shadowfell — summon a Hound of Ill Omen and become invisible in magical darkness.' },
  { value: 'Storm Sorcery',      description: 'Channel storm fury — fly in wind, deal extra lightning/thunder damage, and resist those types.' },
  { value: 'Aberrant Mind',      description: 'Alien mental connection grants telepathy, extra psionic spells, and mind-twisting Metamagic.' },
  { value: 'Clockwork Soul',     description: 'Channel Modron order — Restore Balance cancels advantage/disadvantage; Bastion of Law for defense.' },
];

export const SORCERER_SUBCLASSES_2024 = [
  { value: 'Aberrant Mind',    description: 'Telepathy and psionic magic from an alien mental connection; flexible spell swapping.' },
  { value: 'Clockwork Soul',   description: 'Channel Modron order — cancel advantage/disadvantage and protect allies with Bastion of Law.' },
  { value: 'Draconic Sorcery', description: 'Draconic bloodline for natural armor and empowered elemental damage (choose your dragon type).' },
  { value: 'Divine Soul',      description: 'Celestial or fiendish ancestry — access the full Cleric spell list alongside your sorcerer magic.' },
  { value: 'Shadow Magic',     description: 'Shadowfell origin — summon Hound of Ill Omen, walk unseen in darkness, cheat death.' },
  { value: 'Storm Sorcery',    description: 'Born of a storm — fly in harsh weather, deal bonus lightning and thunder damage.' },
  { value: 'Wild Magic',       description: 'Chaotic surges from a wild magic table; Tides of Chaos for advantage at the risk of a surge.' },
];

export const WARLOCK_SUBCLASSES_5E = [
  { value: 'The Archfey',      description: 'A fey noble\'s power over dreams and emotions — charm enemies, frighten crowds, and escape via Misty Escape.' },
  { value: 'The Fiend',        description: 'Dark pact with a devil or demon — kill enemies to gain temp HP; Hurl Through Hell for massive damage.' },
  { value: 'The Great Old One', description: 'Cosmic horror grants telepathy and mind-blasting power from beyond the stars.' },
  { value: 'The Celestial',    description: 'An angelic being blesses you with healing and radiant spells unusual for warlocks.' },
  { value: 'The Hexblade',     description: 'A shadowy sentient weapon — use Charisma for attack/damage rolls; Hexblade\'s Curse for crits and healing.' },
  { value: 'The Fathomless',   description: 'Deep ocean entity — tentacle summons, aquatic companion, cold resistance, and water magic.' },
  { value: 'The Genie',        description: 'Noble genie patron (djinn, efreeti, etc.) — elemental magic and a magical lamp as a refuge.' },
  { value: 'The Undead',       description: 'An undead lord (lich or death knight) grants Form of Dread transformation and necrotic mastery.' },
  { value: 'The Undying',      description: 'A mortal who transcended death — resist dying, recover from wounds, and defy necrotic damage.' },
];

export const WARLOCK_SUBCLASSES_2024 = [
  { value: 'The Archfey',      description: 'Fey noble patron — charm enemies, step through mists, and draw on Feywild glamour.' },
  { value: 'The Celestial',    description: 'Upper Planes patron — healing word, radiant fire, and divine protection alongside pact magic.' },
  { value: 'The Fathomless',   description: 'Deep sea entity — aquatic tentacle companion, cold resistance, and watery magic.' },
  { value: 'The Fiend',        description: 'Lower Planes patron — kill enemies for temp HP; Dark One\'s Blessing and fire/darkness spells.' },
  { value: 'The Great Old One', description: 'Alien horror beyond space and time — telepathy, warping reality, and mind-control magic.' },
  { value: 'The Undead',       description: 'Undead lord patron — Form of Dread transformation and necrotic power that cheats death.' },
];

export const WIZARD_SUBCLASSES_5E = [
  { value: 'School of Abjuration',  description: 'Protective magic mastery — Arcane Ward absorbs damage for you; Projected Ward extends it to allies.' },
  { value: 'School of Conjuration', description: 'Summon and teleport — Minor Conjuration creates objects; Benign Transposition for short teleports.' },
  { value: 'School of Divination',  description: 'Portent dice replace any roll twice per rest; Supreme Divination for near-perfect foresight.' },
  { value: 'School of Enchantment', description: 'Charm and dominate minds — Hypnotic Gaze incapacitates; Instinctive Charm deflects attacks.' },
  { value: 'School of Evocation',   description: 'Maximize damage — Sculpt Spells to protect allies; Overchannel for maximum damage at a cost.' },
  { value: 'School of Illusion',    description: 'Create convincing illusions — Malleable Illusions reshape spells; Illusory Self for defense.' },
  { value: 'School of Necromancy',  description: 'Animate powerful undead servants; drain life to regain HP; rise as an undead yourself.' },
  { value: 'School of Transmutation',description: 'Transform objects and creatures — Transmuter\'s Stone for passive bonuses; Master Transmuter for polymorph.' },
  { value: 'Bladesinging',          description: 'Elven martial wizard — Bladesong grants AC/speed/concentration bonuses; Extra Attack at level 6.' },
  { value: 'Order of Scribes',      description: 'Awakened Spellbook grants versatility; copy spells in minutes; swap damage types.' },
  { value: 'War Magic',             description: 'Military precision — Arcane Deflection vs. saves/hits; Tactical Wit for initiative bonus.' },
];

export const WIZARD_SUBCLASSES_2024 = [
  { value: 'Abjurer',             description: 'Arcane Ward absorbs damage for you and allies; Projected Ward extends protection to teammates.' },
  { value: 'Bladesinging',        description: 'Elven martial tradition — Bladesong boosts AC, speed, and saves; Extra Attack at level 6.' },
  { value: 'Chronurgy Magic',     description: 'Manipulate time — Chronal Shift rerolls dice for allies; Temporal Awareness adds INT to initiative.' },
  { value: 'Conjurer',            description: 'Benign Transposition for short teleports; Minor Conjuration creates temporary objects.' },
  { value: 'Diviner',             description: 'Portent dice substitute for any roll twice per rest; Expert Divination conserves spell slots.' },
  { value: 'Enchanter',           description: 'Hypnotic Gaze incapacitates one creature; Instinctive Charm deflects attacks toward other targets.' },
  { value: 'Evoker',              description: 'Sculpt Spells protects allies in AoE; Potent Cantrip deals half damage on saves; Overchannel maximizes spells.' },
  { value: 'Graviturgy Magic',    description: 'Bend gravitational forces — push or pull creatures and objects; alter their weight and density.' },
  { value: 'Illusionist',         description: 'Illusory Reality makes one illusion physically real; Malleable Illusions reshape spells freely.' },
  { value: 'Necromancer',         description: 'Powerful undead servants with bonus HP; drain life for recovery; Undead Thralls obey your commands.' },
  { value: 'Order of Scribes',    description: 'Awakened Spellbook for quick spell copying; swap damage types; Manifest Mind for ranged delivery.' },
  { value: 'Transmuter',          description: 'Transmuter\'s Stone grants passive bonuses; Master Transmuter for polymorph and restoration effects.' },
  { value: 'War Magic',           description: 'Arcane Deflection vs. hits and saves; Tactical Wit for initiative; Power Surge for burst damage.' },
];

// ── Subclass unlock levels ────────────────────────────────────────────────────
// Level at which each class permanently chooses its subclass.
// Classes with unlock level 1 have the subclass chosen during character creation.

export const SUBCLASS_UNLOCK_LEVEL_5E = {
  Artificer: 3,
  Barbarian: 3, Bard: 3, Cleric: 1, Druid: 2, Fighter: 3,
  Monk: 3, Paladin: 3, Ranger: 3, Rogue: 3, Sorcerer: 1, Warlock: 1, Wizard: 2,
};

export const SUBCLASS_UNLOCK_LEVEL_2024 = {
  Barbarian: 3, Bard: 3, Cleric: 3, Druid: 3, Fighter: 3,
  Monk: 3, Paladin: 3, Ranger: 3, Rogue: 3, Sorcerer: 3, Warlock: 3, Wizard: 3,
};

// Pact Boons ───────────────────────────────────────────────────────────────

export const PACT_BOONS_5E = [
  { value: 'Pact of the Chain', description: 'A superior familiar (imp, pseudodragon, quasit, or sprite) serves you — it can attack and has unique abilities.' },
  { value: 'Pact of the Blade', description: 'Conjure a magical pact weapon in any form; it becomes your spellcasting focus and uses your CHA.' },
  { value: 'Pact of the Tome', description: 'A Book of Shadows grants three bonus cantrips from any class\'s spell list.' },
];

export const PACT_BOONS_2024 = [
  { value: 'Pact of the Blade',     description: 'Conjure a pact weapon in any form; use Charisma for attack and damage rolls with it.' },
  { value: 'Pact of the Chain',     description: 'Superior familiar (imp, pseudodragon, quasit, sprite, or homunculus) that can attack on your turn.' },
  { value: 'Pact of the Tome',      description: 'Book of Shadows with three extra cantrips from any class; gain ritual casting for those spells.' },
  { value: 'Pact of the Talisman',  description: 'Magical talisman lets the wearer add 1d4 to failed ability checks; you can summon it back at will.' },
];

// ── Subclass options by class (for LevelUpWizard) ─────────────────────────────

export const SUBCLASS_OPTIONS_5E = {
  Artificer: ARTIFICER_SUBCLASSES_5E,
  Barbarian: BARBARIAN_SUBCLASSES_5E,
  Bard:      BARD_SUBCLASSES_5E,
  Cleric:    CLERIC_SUBCLASSES_5E,
  Druid:     DRUID_SUBCLASSES_5E,
  Fighter:   FIGHTER_SUBCLASSES_5E,
  Monk:      MONK_SUBCLASSES_5E,
  Paladin:   PALADIN_SUBCLASSES_5E,
  Ranger:    RANGER_SUBCLASSES_5E,
  Rogue:     ROGUE_SUBCLASSES_5E,
  Sorcerer:  SORCERER_SUBCLASSES_5E,
  Warlock:   WARLOCK_SUBCLASSES_5E,
  Wizard:    WIZARD_SUBCLASSES_5E,
};

export const SUBCLASS_OPTIONS_2024 = {
  Barbarian: BARBARIAN_SUBCLASSES_2024,
  Bard:      BARD_SUBCLASSES_2024,
  Cleric:    CLERIC_SUBCLASSES_2024,
  Druid:     DRUID_SUBCLASSES_2024,
  Fighter:   FIGHTER_SUBCLASSES_2024,
  Monk:      MONK_SUBCLASSES_2024,
  Paladin:   PALADIN_SUBCLASSES_2024,
  Ranger:    RANGER_SUBCLASSES_2024,
  Rogue:     ROGUE_SUBCLASSES_2024,
  Sorcerer:  SORCERER_SUBCLASSES_2024,
  Warlock:   WARLOCK_SUBCLASSES_2024,
  Wizard:    WIZARD_SUBCLASSES_2024,
};
