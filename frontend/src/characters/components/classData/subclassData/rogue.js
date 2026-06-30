export const ROGUE = {
  '5e': {
    'Thief': {
      flavorText: 'You hone your skills in the larcenous arts. Burglars, bandits, cutpurses, and other criminals typically follow this archetype, but so do rogues who prefer to think of themselves as professional treasure seekers, explorers, delvers, and investigators. In addition to improving your agility and stealth, you learn skills useful for delving into ancient ruins, reading unfamiliar languages, and using magic items you normally couldn\'t employ.',
      features: [
        { level: 3, name: 'Fast Hands', description: 'You can use the bonus action granted by your Cunning Action to make a Dexterity (Sleight of Hand) check, use your thieves\' tools to disarm a trap or open a lock, or take the Use an Object action.' },
        { level: 3, name: 'Second-Story Work', description: 'You gain the ability to climb faster than normal; climbing no longer costs extra movement. Also, when you make a running jump, the distance you cover increases by a number of feet equal to your Dexterity modifier.' },
        { level: 9, name: 'Supreme Sneak', description: 'You have advantage on a Dexterity (Stealth) check if you move no more than half your speed on the same turn.' },
        { level: 13, name: 'Use Magic Device', description: 'You have learned enough about the workings of magic that you can improvise the use of items even when they are not intended for you. You ignore all class, race, and level requirements on the use of magic items.' },
        { level: 17, name: 'Thief\'s Reflexes', description: 'You have become adept at laying ambushes and quickly escaping danger. You can take two turns during the first round of any combat. You take your first turn at your normal initiative and your second turn at your initiative minus 10. You can\'t use this feature when you are surprised.' },
      ],
    },
    'Arcane Trickster': {
      flavorText: 'Some rogues enhance their fine-honed skills of stealth and agility with magic, learning tricks of enchantment and illusion. These rogues include pickpockets and burglars, but also pranksters, mischief-makers, and a significant number of adventurers.',
      features: [
        { level: 3, name: 'Spellcasting', description: 'Learn spells from the enchantment and illusion schools (Intelligence is your spellcasting ability). You know three cantrips from the wizard list and four 1st-level spells (three must be from enchantment or illusion).' },
        { level: 3, name: 'Mage Hand Legerdemain', description: 'When you cast mage hand, you can make the spectral hand invisible and can perform additional tasks: stow or retrieve objects, use thieves\' tools to pick locks and disarm traps, use any other rogue tools — all from up to 30 ft away, all without being noticed (contested Sleight of Hand vs. Perception).' },
        { level: 9, name: 'Magical Ambush', description: 'If you are hidden from a creature when you cast a spell on it, the creature has disadvantage on any saving throw it makes against the spell this turn.' },
        { level: 13, name: 'Versatile Trickster', description: 'You gain the ability to distract targets with your mage hand. As a bonus action on your turn, you can designate a creature within 5 ft of the spectral hand to be the target of your Sneak Attack for the rest of the turn, even if you don\'t have advantage on the attack roll.' },
        { level: 17, name: 'Spell Thief', description: 'You gain the ability to magically steal the knowledge of how to cast a spell from another spellcaster. Immediately after a creature casts a spell that targets you or includes you in its area of effect, make a saving throw with your spellcasting ability. On a success, the creature can\'t cast that spell until after a long rest, and for the next 8 hours, you know the spell and can cast it using your spell slots.' },
      ],
    },
    'Assassin': {
      flavorText: 'You focus your training on the grim art of death. Those who adhere to this archetype are diverse: hired killers, spies, bounty hunters, and even specially anointed priests trained to exterminate the enemies of their deity. Stealth, poison, and disguise help you eliminate your foes with deadly efficiency.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'You gain proficiency with the disguise kit and the poisoner\'s kit.' },
        { level: 3, name: 'Assassinate', description: 'You are at your deadliest when you get the drop on your enemies. You have advantage on attack rolls against any creature that hasn\'t taken a turn in combat yet. Additionally, any hit you score against a creature that is surprised is a critical hit.' },
        { level: 9, name: 'Infiltration Expertise', description: 'You can unfailingly create false identities for yourself. You must spend seven days and 25 gp to establish the history, profession, and affiliations for an identity. You can\'t establish an identity that belongs to someone else, and using Disguise Kit convincingly is automatic.' },
        { level: 13, name: 'Impostor', description: 'You gain the ability to unerringly mimic another person\'s speech, writing, and behavior. You must spend at least three hours studying each aspect of their behavior. The disguise fools mundane perception in social situations, but magical detection (true seeing, zone of truth) can see through it.' },
        { level: 17, name: 'Death Strike', description: 'You become a master of instant death. When you attack and hit a creature that is surprised, it must make a Constitution saving throw (DC 8 + your Dexterity modifier + your proficiency bonus). On a failed save, double the damage of your attack against the creature.' },
      ],
    },
    'Inquisitive': {
      flavorText: 'As an archetypal Inquisitive, you excel at rooting out secrets and unraveling mysteries. You rely on your sharp eye for detail, but also on your ability to read the words and deeds of other creatures to determine their true intent. You excel at defeating creatures that hide among and prey upon ordinary folk.',
      features: [
        { level: 3, name: 'Ear for Deceit', description: 'You develop a talent for picking out lies. Whenever you make a Wisdom (Insight) check to determine whether a creature is lying, treat a roll of 7 or lower on the d20 as an 8.' },
        { level: 3, name: 'Eye for Detail', description: 'You can use a bonus action to make a Wisdom (Perception) check to spot a hidden creature or object, or to make an Intelligence (Investigation) check to uncover or decipher clues.' },
        { level: 3, name: 'Insightful Fighting', description: 'As a bonus action, make a Wisdom (Insight) check against a creature you can see. DC = 8 + Deception modifier. On success, you can use Sneak Attack against that creature even if you don\'t have advantage, as long as you don\'t have disadvantage. Lasts 1 minute.' },
        { level: 9, name: 'Steady Eye', description: 'You gain advantage on any Perception or Investigation check if you move no more than half your speed on the same turn.' },
        { level: 13, name: 'Unerring Eye', description: 'Your senses are almost impossible to foil. As an action, sense the presence of illusions, shapechangers, and objects not in their original form within 30 ft. You can use this feature a number of times equal to your WIS modifier per long rest.' },
        { level: 17, name: 'Eye for Weakness', description: 'While your Insightful Fighting is active, Sneak Attack deals an extra 3d6 damage against the creature.' },
      ],
    },
    'Mastermind': {
      flavorText: 'Your focus is on people and on the influence and secrets they have. Many spies, courtiers, and schemers follow this archetype, leading lives of intrigue. Words are your weapons as often as knives or poison, and secrets and favors are some of your favorite treasures.',
      features: [
        { level: 3, name: 'Master of Intrigue', description: 'You gain proficiency with the disguise kit, the forgery kit, and two gaming sets of your choice. Additionally, you can unerringly mimic the speech patterns and accent of a creature that you have heard speak for at least 1 minute, allowing you to pass yourself off as a native speaker.' },
        { level: 3, name: 'Master of Tactics', description: 'You can use the Help action as a bonus action. Additionally, when you use the Help action to aid an ally in attacking a creature, the target of that attack can be within 30 ft of you, rather than 5 ft.' },
        { level: 9, name: 'Insightful Manipulator', description: 'If you spend at least 1 minute observing or interacting with another creature outside combat, you can determine if it is your equal, superior, or inferior in regard to two of the following: Intelligence score, Wisdom score, Charisma score, class levels (if any).' },
        { level: 13, name: 'Misdirection', description: 'You can use your action to create a diversion to escape. You can use the Cunning Action feature to take the Hide action, even when you\'re observed, as long as you are adjacent to a creature of at least Medium size that isn\'t hostile to you.' },
        { level: 17, name: 'Soul of Deceit', description: 'Your thoughts can\'t be determined by telepathy or other means unless you allow it. Additionally, it is nearly impossible to determine your true thoughts by using magic — a zone of truth spell neither reveals you are in it nor does it force you to speak only the truth.' },
      ],
    },
    'Phantom': {
      flavorText: 'Many rogues walk a fine line between life and death, risking their own lives and taking the lives of others. While adventuring on that line, some rogues discover a mystical connection to death itself. Their study of death enables them to walk the line between the living and the dead.',
      features: [
        { level: 3, name: 'Whispers of the Dead', description: 'Echoes of those who have died cling to you. Whenever you finish a short or long rest, you can choose one skill or tool proficiency that you lack and gain it, as a ghostly presence shares that knowledge with you. You lose this proficiency when you use this feature again.' },
        { level: 3, name: 'Wails from the Grave', description: 'As you nudge someone closer to the grave, you can channel the power of death to harm someone else as well. Immediately after you deal Sneak Attack damage to a creature on your turn, you can target a second creature within 30 ft. Roll half the number of Sneak Attack dice for that creature (round up). The second creature takes necrotic damage equal to the roll.' },
        { level: 9, name: 'Tokens of the Departed', description: 'When a creature you can see dies within 30 ft of you, you can use your reaction to magically capture its soul in a trinket-sized object (a soul trinket). You have advantage on death saving throws. You can have a maximum of your PB soul trinkets simultaneously. Destroying one deals 5d10 necrotic damage to the creature it came from.' },
        { level: 13, name: 'Ghost Walk', description: 'You can take on a spectral form. As a bonus action, assume the Ghost Walk for 10 minutes. While in this form, you have a fly speed of 10 ft, can move through objects (takes 1d10 force damage if inside at end of turn), and attacks against you have disadvantage. Usable once per long rest (or destroy a soul trinket to reuse).' },
        { level: 17, name: 'Death\'s Friend', description: 'Your association with death has become so close that you gain the following benefits: when you use Wails from the Grave, you don\'t need to spend one of your Sneak Attack dice for the wail; at the end of a long rest, a soul trinket appears in your hand if you have none.' },
      ],
    },
    'Scout': {
      flavorText: 'You are skilled in stealth and surviving far from the streets of a city, allowing you to scout ahead of your companions during expeditions. Rogues who embrace this archetype are at home in the wilderness and among barbarians and rangers, and many Scouts serve as the eyes and ears of military forces.',
      features: [
        { level: 3, name: 'Skirmisher', description: 'You are difficult to pin down during a fight. You can move up to half your speed as a reaction when an enemy ends its turn within 5 ft of you. This movement doesn\'t provoke opportunity attacks.' },
        { level: 3, name: 'Survivalist', description: 'You gain proficiency in the Nature and Survival skills. Your proficiency bonus is doubled for any ability check that uses either of those proficiencies.' },
        { level: 9, name: 'Superior Mobility', description: 'Your walking speed increases by 10 ft. If you have a climbing or swimming speed, those speeds also increase by 10 ft.' },
        { level: 13, name: 'Ambush Master', description: 'You excel at leading ambushes and acting first in a fight. You have advantage on initiative rolls. In addition, the first creature you hit during the first round of a combat becomes easier for you and others to strike; attack rolls against that target have advantage until the start of your next turn.' },
        { level: 17, name: 'Sudden Strike', description: 'You can strike with deadly speed. If you take the Attack action, you can make one additional attack as a bonus action. This attack can benefit from your Sneak Attack even if you have already used it this turn, but you can\'t use your Sneak Attack against the same target twice in a turn.' },
      ],
    },
    'Soul Knife': {
      flavorText: 'Most assassins strike with physical weapons, and many burglars and spies use thieves\' tools when the need arises. In contrast, a Soul Knife strikes and sniffs out secrets with the mind, cutting through barriers both physical and psychological. Because a Soul Knife\'s weapon is a manifestation of their mind, they\'re always a threat as long as they\'re awake.',
      features: [
        { level: 3, name: 'Psionic Power', description: 'You harbor a well of psionic energy within yourself. Psionic Energy dice (d6, equal to twice PB). Use them for: Psionic Whispers (bonus action, telepathically communicate with a creature within 60 ft for 1 hour without being overheard), Psychic Blades (bonus action to manifest blades; each appears as part of the attack action dealing 1d6 + DEX psychic damage; finesse, thrown 60/120 ft), and Recovery (bonus action, spend a die to regain HP).' },
        { level: 3, name: 'Psychic Blades', description: 'Manifest blades of psychic energy. When you attack, you can manifest one (or two if making multiple attacks) — dealing 1d6 + DEX psychic damage. They vanish immediately after the attack. No hands required; always armed.' },
        { level: 9, name: 'Soul Blades', description: 'Your Psychic Blades offer new options: Homing Strikes (spend a Psionic Energy die after missing; add the roll to the attack to possibly turn it into a hit) and Psychic Teleportation (bonus action, spend a die and throw a Psychic Blade — teleport to target space, up to 10 × die result ft away).' },
        { level: 13, name: 'Psychic Veil', description: 'You can weave a veil of psychic static to mask yourself. As an action, become invisible for 1 hour or until you attack, deal damage, or force a save. Reveal yourself early as a bonus action. Usable once per long rest (or spend a Psionic Energy die).' },
        { level: 17, name: 'Rend Mind', description: 'Shatter the mind of your foes with overwhelming psychic power. When you use Sneak Attack against a creature, you can forgo all of your Sneak Attack dice to instead have the target make a WIS save (DC 8 + PB + DEX). On a failed save, the target is stunned until the end of its next turn. Usable once per short or long rest.' },
      ],
    },
    'Swashbuckler': {
      flavorText: 'You focus your training on the art of the blade, relying on speed, elegance, and charm in equal parts. While some warriors are brutes clad in heavy armor, your method of fighting looks almost like a performance. Duelists and pirates typically follow this archetype.',
      features: [
        { level: 3, name: 'Fancy Footwork', description: 'When you choose this archetype at 3rd level, you learn how to land a strike and then slip away without reprisal. During your turn, if you make a melee attack against a creature, that creature can\'t make opportunity attacks against you for the rest of your turn.' },
        { level: 3, name: 'Rakish Audacity', description: 'Your confidence propels you into battle. You can give yourself a bonus to your initiative rolls equal to your Charisma modifier. You also gain an additional way to use your Sneak Attack — you don\'t need advantage if there\'s no creature within 5 ft of the target (other than you), though you still need Sneak Attack prerequisites otherwise.' },
        { level: 9, name: 'Panache', description: 'Your charm becomes extraordinarily beguiling. As an action, make a Persuasion check contested by a creature\'s Insight check within 60 ft. On success, if the creature is hostile, it has disadvantage on attack rolls against targets other than you and can\'t make opportunity attacks against others. If it\'s not hostile, it\'s charmed and regards you as a friendly acquaintance for 1 minute.' },
        { level: 13, name: 'Elegant Maneuver', description: 'You can use a bonus action on your turn to gain advantage on your next Dexterity (Acrobatics) or Strength (Athletics) check.' },
        { level: 17, name: 'Master Duelist', description: 'Your mastery of the blade lets you turn failure into success in combat. If you miss with an attack roll, you can roll it again with advantage. Once you do so, you can\'t use this feature again until you finish a short or long rest.' },
      ],
    },
  },

  '5.5e': {
    'Arcane Trickster': {
      flavorText: 'The Arcane Trickster weaves enchantment and illusion magic into thievery. The 2024 rules improve the Mage Hand Legerdemain\'s synergy with Sneak Attack and refine Spell Thief into a more reliable late-game power.',
      features: [
        { level: 3, name: 'Spellcasting', description: 'Cast spells from the Wizard list (primarily enchantment and illusion); INT is your spellcasting ability.' },
        { level: 3, name: 'Mage Hand Legerdemain', description: 'Your mage hand is invisible and can stow/retrieve objects, use thieves\' tools, or use other tools from 30 ft — all without being observed (opposed Sleight of Hand vs. Perception).' },
        { level: 9, name: 'Magical Ambush', description: 'When hidden from a creature and you cast a spell on it, the creature has disadvantage on any saving throw against the spell this turn.' },
        { level: 13, name: 'Versatile Trickster', description: 'As a Bonus Action, designate a creature within 5 ft of your mage hand as your Sneak Attack target for the rest of the turn (even without advantage).' },
        { level: 17, name: 'Spell Thief', description: 'After a creature casts a spell that includes you as a target, succeed on a spellcasting save to prevent them from casting that spell until a long rest, and know the spell for 8 hours.' },
      ],
    },
    'Assassin': {
      flavorText: 'Assassins specialize in the deadly art of eliminating targets swiftly and without warning. The 2024 rules sharpen Assassinate\'s trigger conditions and give the Impostor feature cleaner mechanics for extended disguise work.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'Gain proficiency with disguise kit and poisoner\'s kit.' },
        { level: 3, name: 'Assassinate', description: 'Advantage on attack rolls vs. creatures that haven\'t taken a turn yet. Hits against surprised creatures are automatic critical hits.' },
        { level: 9, name: 'Infiltration Expertise', description: 'In 7 days and 25 gp, establish a false identity complete with history, profession, and affiliations. Disguise Kit checks for this identity automatically succeed.' },
        { level: 13, name: 'Impostor', description: 'After 3 hours of study, perfectly mimic a creature\'s speech, writing, and mannerisms to pass as them in everyday social situations.' },
        { level: 17, name: 'Death Strike', description: 'When you attack a surprised creature and hit, it must succeed on a CON save (DC 8 + DEX + PB) or take double damage.' },
      ],
    },
    'Soulknife': {
      flavorText: 'The Soulknife strikes with the mind, manifesting psychic blades from pure psionic energy. The 2024 rules rename this archetype (dropping the space), refine the Psychic Blades damage, and streamline Psionic Power dice management.',
      features: [
        { level: 3, name: 'Psionic Power', description: 'You have Psionic Energy dice (d6s, 2 × PB). Use for: Psionic Whispers (telepathic communication for 1 hour), HP recovery (Bonus Action), and powering Soulknife features.' },
        { level: 3, name: 'Psychic Blades', description: 'When you take the Attack action or make an Opportunity Attack, manifest blades of psychic energy. Each attack deals 1d6 + DEX psychic damage (finesse, thrown 60/120 ft). You\'re always armed.' },
        { level: 9, name: 'Soul Blades', description: 'Homing Strikes: spend a die after a miss to add the result to the attack roll. Psychic Teleportation: Bonus Action, throw a blade and teleport to its space (up to 10 × die result ft).' },
        { level: 13, name: 'Psychic Veil', description: 'Become Invisible for 1 hour as an action. Ends if you attack, damage a creature, or force a saving throw. Usable once per long rest (or spend a Psionic Energy die).' },
        { level: 17, name: 'Rend Mind', description: 'Forgo Sneak Attack dice on a Sneak Attack to stun the target until the end of its next turn (WIS save, DC 8 + PB + DEX). Usable once per short or long rest.' },
      ],
    },
    'Swashbuckler': {
      flavorText: 'The Swashbuckler is an elegant duelist who relies on charisma and speed as much as skill. The 2024 rules refine Rakish Audacity\'s initiative bonus and make Panache a more reliable battlefield control tool at mid levels.',
      features: [
        { level: 3, name: 'Fancy Footwork', description: 'When you make a melee attack against a creature on your turn, it can\'t make opportunity attacks against you for the rest of that turn.' },
        { level: 3, name: 'Rakish Audacity', description: 'Add your CHA modifier to initiative. You can use Sneak Attack without advantage if no other creature except your target is within 5 ft of you.' },
        { level: 9, name: 'Panache', description: 'As an action, make a Persuasion check (contested by Insight) against a creature within 60 ft. Hostile creatures have disadvantage on attacks against others; non-hostile creatures are charmed for 1 minute.' },
        { level: 13, name: 'Elegant Maneuver', description: 'Use a Bonus Action to gain advantage on your next Athletics or Acrobatics check.' },
        { level: 17, name: 'Master Duelist', description: 'When you miss an attack, reroll it with advantage. Usable once per short or long rest.' },
      ],
    },
    'Thief': {
      flavorText: 'The Thief hones skills in the larcenous arts — burglary, sleight of hand, and exploration of dangerous ruins. The 2024 rules expand Fast Hands to include more object interactions and make Use Magic Device a reliable and broad tool for a skilled rogue.',
      features: [
        { level: 3, name: 'Fast Hands', description: 'Use Cunning Action to make a Sleight of Hand check, use thieves\' tools, or use the Utilize action.' },
        { level: 3, name: 'Second-Story Work', description: 'Climbing costs no extra movement. Running jump distance increases by DEX modifier in feet.' },
        { level: 9, name: 'Supreme Sneak', description: 'Advantage on Stealth checks when you move no more than half your speed on the same turn.' },
        { level: 13, name: 'Use Magic Device', description: 'Ignore all class, race, and level requirements on the use of magic items.' },
        { level: 17, name: 'Thief\'s Reflexes', description: 'Take two turns during the first round of combat — one at normal initiative, one at initiative − 10. Can\'t be used when surprised.' },
      ],
    },
  },
};
