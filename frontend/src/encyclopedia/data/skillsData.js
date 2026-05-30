// The 18 standard 5e skills. Static reference data — does not vary by campaign or edition.
//
// Each skill: { name, ability, flavor, description, examples[] }
//   ability        — 3-letter ability code: STR | DEX | CON | INT | WIS | CHA
//   flavor         — one short sentence evoking the feel of the skill
//   description    — what the skill actually does in play (2–4 sentences)
//   examples       — list of concrete check ideas a DM might call for

export const ABILITY_FULL = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

export const SKILLS = [
  {
    name: 'Acrobatics',
    ability: 'DEX',
    flavor: 'Balance, tumble, and twist out of harm’s way.',
    description:
      'An Acrobatics check covers staying on your feet in tricky situations — balancing on a narrow ledge, tumbling under a swinging blade, or sticking the landing after a fall. It is the go-to skill when the question is whether your body bends instead of breaks.',
    examples: [
      'Balance across a rope bridge in a high wind.',
      'Tumble through an enemy’s legs to escape a grapple.',
      'Land on your feet after being shoved off a cart.',
      'Stand upright on the deck of a rocking ship during a storm.',
    ],
  },
  {
    name: 'Animal Handling',
    ability: 'WIS',
    flavor: 'Read a beast, calm it, command it.',
    description:
      'You use Animal Handling to sense an animal’s intent, calm a spooked mount, or coax a feral creature into trusting you. It does not work on magical beasts of high intelligence, but it covers everything from soothing a guard dog to riding a panicked horse through battle.',
    examples: [
      'Calm a wounded warhorse before it bolts.',
      'Coax a wild wolf to take food from your hand.',
      'Notice that a stable’s animals are unusually nervous.',
      'Drive a wagon team safely through a narrow mountain pass.',
    ],
  },
  {
    name: 'Arcana',
    ability: 'INT',
    flavor: 'Lore of spells, magic items, and planar mysteries.',
    description:
      'Arcana is your knowledge of the magical fabric of the world: schools of magic, the properties of spells and magic items, the traditions of wizards and sorcerers, the nature of elementals and the planes. When something glows, hums, or rewrites reality, this is the skill that knows why.',
    examples: [
      'Identify a spell by its verbal component and gestures.',
      'Recognize the maker’s mark on an enchanted blade.',
      'Recall what plane a summoned creature comes from.',
      'Understand how a magical trap was constructed.',
    ],
  },
  {
    name: 'Athletics',
    ability: 'STR',
    flavor: 'Climb, swim, jump, and grapple your way through.',
    description:
      'Athletics is the raw physical skill of muscling through difficult movement: climbing sheer walls, swimming against a current, leaping a chasm, or shoving and grappling enemies in melee. If brute physical effort might solve the problem, this is the check.',
    examples: [
      'Climb a wet castle wall under cover of darkness.',
      'Swim against the current to reach a drowning ally.',
      'Long-jump across a gap in a collapsing bridge.',
      'Shove a charging enemy off a cliff.',
    ],
  },
  {
    name: 'Deception',
    ability: 'CHA',
    flavor: 'Lie convincingly — with words, with smiles, with silence.',
    description:
      'Deception covers any attempt to convince someone of something untrue: bluffing past a guard, lying about your identity, conning a merchant, hiding your true feelings, or selling a fake story with a straight face. It is a contest of charm and conviction, not of fact.',
    examples: [
      'Talk your way past a city guard with a forged writ.',
      'Pretend to be the new servant the noble was expecting.',
      'Sell a fake antique to a suspicious collector.',
      'Hide your fear when a dragon asks if you are afraid.',
    ],
  },
  {
    name: 'History',
    ability: 'INT',
    flavor: 'Lore of empires, wars, dynasties, and forgotten ages.',
    description:
      'History is your knowledge of past events: kingdoms that rose and fell, wars that shaped borders, ancient rulers, lost civilizations, the origin of a famous artifact. It is the scholar’s memory of who did what, when, and what came of it.',
    examples: [
      'Recall the rulers of the kingdom three centuries past.',
      'Identify the heraldry on a dust-covered shield.',
      'Remember the location of a famous battlefield.',
      'Recognize the architectural style of a ruined temple.',
    ],
  },
  {
    name: 'Insight',
    ability: 'WIS',
    flavor: 'Read the truth behind a face.',
    description:
      'Insight lets you read someone’s true intent: detect a lie, sense an impending betrayal, judge the mood of a crowd, or tell when a friendly merchant is hiding something. It is the skill of the gut feeling — and of paying close enough attention to know why you have one.',
    examples: [
      'Tell whether the noble is lying about her alibi.',
      'Sense that the captain is about to give a desperate order.',
      'Judge whether a thieves’ guild contact intends to double-cross you.',
      'Notice an interrogator is bluffing about what they already know.',
    ],
  },
  {
    name: 'Intimidation',
    ability: 'CHA',
    flavor: 'Bend others to your will through fear and force of presence.',
    description:
      'Intimidation is the art of getting what you want through threat — overt or implied. A glower, a hand on the hilt, a quiet promise of pain. It can extract information, force a retreat, or end a fight before it starts, but it costs goodwill and breeds resentment.',
    examples: [
      'Force a captured bandit to give up his crew’s hideout.',
      'Cow a tavern full of drunks into silence.',
      'Stare down an opposing champion before a duel.',
      'Convince a corrupt clerk that bribing you is safer than ignoring you.',
    ],
  },
  {
    name: 'Investigation',
    ability: 'INT',
    flavor: 'Sift, deduce, and follow the trail of evidence.',
    description:
      'Investigation is the reasoning side of finding things out: searching a room for hidden compartments, deducing the cause of a fire from the burn pattern, piecing together clues at a crime scene. Where Perception notices things, Investigation works out what they mean.',
    examples: [
      'Search a study for a hidden safe.',
      'Determine which of three potions was tampered with.',
      'Piece together what happened from blood spatter and overturned furniture.',
      'Spot the inconsistency in a forged contract.',
    ],
  },
  {
    name: 'Medicine',
    ability: 'WIS',
    flavor: 'Stabilize the dying. Diagnose the sick. Read a body.',
    description:
      'Medicine covers a healer’s practical knowledge: stabilizing a dying ally, diagnosing a disease, identifying a poison from its symptoms, or determining the cause and time of death from a corpse. It does not restore hit points — but it keeps people alive long enough for someone else to.',
    examples: [
      'Stabilize a downed ally without using a healer’s kit slot.',
      'Diagnose the illness sweeping through a village.',
      'Determine that a corpse died of poisoning, not blade.',
      'Identify which herbs in an apothecary are dangerous together.',
    ],
  },
  {
    name: 'Nature',
    ability: 'INT',
    flavor: 'Lore of the wild world — plants, weather, beasts, terrain.',
    description:
      'Nature is your knowledge of the natural world: plants and their uses, animal behavior, weather patterns, terrain, seasons, and natural cycles. It does not cover the supernatural — that is Arcana — but it covers everything that grows, hunts, or shapes the land.',
    examples: [
      'Identify a plant as poisonous, edible, or medicinal.',
      'Predict tomorrow’s weather from the sky and wind.',
      'Recognize tracks as belonging to a dire wolf, not a normal one.',
      'Tell that the forest has been logged too aggressively to recover.',
    ],
  },
  {
    name: 'Perception',
    ability: 'WIS',
    flavor: 'See, hear, and notice what others miss.',
    description:
      'Perception is your raw sensory awareness — spotting a hidden enemy, hearing a distant footstep, smelling smoke on the wind, noticing the door that doesn’t quite hang right. It is the skill of being present and paying attention, and it powers your Passive Perception score.',
    examples: [
      'Spot an archer hidden in the rafters.',
      'Hear the soft click of a trap’s pressure plate.',
      'Notice that one stone in the wall is slightly recessed.',
      'Catch the faint scent of perfume in an empty room.',
    ],
  },
  {
    name: 'Performance',
    ability: 'CHA',
    flavor: 'Move a crowd with music, drama, or sheer presence.',
    description:
      'Performance is your skill at entertaining an audience: singing, playing an instrument, telling a story, dancing, juggling, oratory. A good performance can earn coin, sway a mood, or distract a room while your party slips through the back.',
    examples: [
      'Play in a tavern for room and board.',
      'Hold a crowd spellbound long enough for an ally to act.',
      'Deliver a rousing speech that rallies the militia.',
      'Distract the guests at a noble’s ball with an impromptu song.',
    ],
  },
  {
    name: 'Persuasion',
    ability: 'CHA',
    flavor: 'Win hearts and change minds — honestly.',
    description:
      'Persuasion is influencing others in good faith: negotiation, diplomacy, social grace, sincere appeal. It works best on listeners who are open to your message and trust you to mean what you say. Lies belong to Deception; threats belong to Intimidation; truth belongs here.',
    examples: [
      'Convince a baron to grant your party an audience.',
      'Negotiate a fair price with a stingy merchant.',
      'Calm a panicked crowd before they riot.',
      'Talk a rival adventuring party into joining a common cause.',
    ],
  },
  {
    name: 'Religion',
    ability: 'INT',
    flavor: 'Lore of gods, rites, scriptures, and the divine.',
    description:
      'Religion is your knowledge of deities, cosmologies, holy symbols, sacred rites, prayers, and the structures of clerical orders. It covers the difference between the church of Pelor and the cult of Hextor, the meaning of a relic, and the symbolism on an altar.',
    examples: [
      'Identify a holy symbol carved into an old shrine.',
      'Recall the proper rites to consecrate a temple.',
      'Recognize a heretical sect by its prayer language.',
      'Determine which deity an undead creature is profaning by its presence.',
    ],
  },
  {
    name: 'Sleight of Hand',
    ability: 'DEX',
    flavor: 'Steal, palm, plant, and pick — all without being seen.',
    description:
      'Sleight of Hand is fine manual deception: pickpocketing, palming an object, planting evidence, picking a lock under pressure, cheating at cards. Where Stealth hides your body, this skill hides what your hands are doing.',
    examples: [
      'Lift a coin purse from a target’s belt in a busy market.',
      'Slip a poisoned vial into the noble’s wine glass.',
      'Hide a small dagger up your sleeve before a search.',
      'Switch a real key for a copy without the guard noticing.',
    ],
  },
  {
    name: 'Stealth',
    ability: 'DEX',
    flavor: 'Move unseen, unheard, and unsuspected.',
    description:
      'Stealth is your ability to move and hide without being detected: creeping past a sleeping guard, sneaking through a moonlit camp, ambushing an enemy from cover. It contests against passive Perception by default — the better you roll, the less they see.',
    examples: [
      'Sneak past a sleeping ogre to reach the prisoner.',
      'Hide in a curtain alcove as the patrol marches by.',
      'Move silently across a creaking wooden floor.',
      'Tail a courier through crowded streets without being made.',
    ],
  },
  {
    name: 'Survival',
    ability: 'WIS',
    flavor: 'Track, forage, navigate, and endure the wild.',
    description:
      'Survival covers the practical wilderness skills: following tracks, foraging for food and water, navigating by sun and stars, predicting weather, finding shelter, and avoiding natural hazards. It is the skill that keeps a party alive when the road runs out.',
    examples: [
      'Follow a trail through three days of rain.',
      'Find clean water in a hostile desert.',
      'Identify safe footing on a treacherous mountain pass.',
      'Predict an oncoming blizzard in time to make camp.',
    ],
  },
];

// Quick index by name for detail lookups.
export const SKILLS_BY_NAME = SKILLS.reduce((acc, s) => {
  acc[s.name] = s;
  return acc;
}, {});

// Tailwind color classes per ability, used for badges and accent strips.
// Matches the encyclopedia's general palette: cool for mental, warm for physical, neutral for social.
export const ABILITY_COLORS = {
  STR: { bg: 'bg-red-500',     ring: 'ring-red-500',     pill: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  DEX: { bg: 'bg-green-500',   ring: 'ring-green-500',   pill: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  CON: { bg: 'bg-orange-500',  ring: 'ring-orange-500',  pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  INT: { bg: 'bg-blue-500',    ring: 'ring-blue-500',    pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  WIS: { bg: 'bg-violet-500',  ring: 'ring-violet-500',  pill: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200' },
  CHA: { bg: 'bg-pink-500',    ring: 'ring-pink-500',    pill: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
};

export function abilityColor(ability) {
  return ABILITY_COLORS[ability] ?? { bg: 'bg-muted', ring: 'ring-muted', pill: 'bg-muted text-foreground' };
}
