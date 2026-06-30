export const PALADIN = {
  '5e': {
    'Oath of Devotion': {
      flavorText: 'The Oath of Devotion binds a paladin to the loftiest ideals of justice, virtue, and order. Sometimes called cavaliers, white knights, or holy warriors, these paladins meet the ideal of the knight in shining armor, acting with honor in pursuit of justice and the greater good. They hold themselves to the highest standards of conduct.',
      features: [
        { level: 3, name: 'Sacred Weapon', description: 'Channel Divinity: As an action, imbue one weapon you are holding with positive energy. For 1 minute, add your Charisma modifier to attack rolls with the weapon (min +1), and the weapon emits bright light for 20 ft and dim light for 20 ft more. The effect ends early if you are incapacitated or drop the weapon.' },
        { level: 3, name: 'Turn the Unholy', description: 'Channel Divinity: As an action, present your holy symbol and speak a prayer. Each fiend or undead within 30 ft must make a Wisdom saving throw. On a failed save, the creature is turned for 1 minute or until it takes damage.' },
        { level: 7, name: 'Aura of Devotion', description: 'You and friendly creatures within 10 ft of you can\'t be charmed while you are conscious (radius extends to 30 ft at level 18).' },
        { level: 15, name: 'Purity of Spirit', description: 'You are always under the effects of a protection from evil and good spell.' },
        { level: 20, name: 'Holy Nimbus', description: 'As an action, emanate an aura of sunlight for 1 minute. Bright light fills a 30 ft radius; dim light extends 30 ft beyond that. Enemy undead and fiends in the bright light have disadvantage on attack rolls against you. You also deal 10 radiant damage to undead who end their turn in bright light from this aura. Usable once per long rest.' },
      ],
    },
    'Oath of the Ancients': {
      flavorText: 'The Oath of the Ancients is as old as the race of elves and the rituals of the druids. Sometimes called fey knights, green knights, or horned knights, paladins who swear this oath cast their lot with the side of the light in the cosmic struggle against darkness because they love the beautiful and life-giving things of the world, not necessarily because they believe in principles of honor, courage, and justice.',
      features: [
        { level: 3, name: 'Nature\'s Wrath', description: 'Channel Divinity: As an action, conjure spectral vines that reach out to restrain a creature within 10 ft. The creature must succeed on a Strength or Dexterity saving throw (its choice) or be restrained. The creature can repeat the save at the end of each of its turns, ending the effect on a success.' },
        { level: 3, name: 'Turn the Faithless', description: 'Channel Divinity: As an action, present your holy symbol. Each fey or fiend within 30 ft must make a Wisdom saving throw or be turned for 1 minute or until it takes damage.' },
        { level: 7, name: 'Aura of Warding', description: 'You and friendly creatures within 10 ft of you have resistance to damage from spells (radius extends to 30 ft at level 18).' },
        { level: 15, name: 'Undying Sentinel', description: 'When you are reduced to 0 hit points and are not killed outright, you can choose to drop to 1 hit point instead. Once you use this feature, you can\'t use it again until you finish a long rest. Additionally, you can\'t be aged magically, and you don\'t suffer the drawbacks of old age.' },
        { level: 20, name: 'Elder Champion', description: 'As an action, assume the form of an ancient force of nature for 1 minute. You become surrounded by nature: at the start of each of your turns, regain 10 hit points; casting spells that take 1 action costs only a bonus action; enemies within 10 ft have disadvantage on saves against your paladin spells and Channel Divinity. Usable once per long rest.' },
      ],
    },
    'Oath of Vengeance': {
      flavorText: 'The Oath of Vengeance is a solemn commitment to punish those who have committed a grievous sin. When evil forces slaughter helpless villagers, when an entire people turns against the will of the gods, when a thieves\' guild grows too violent and powerful, when a dragon rampages through the countryside — at times like these, paladins arise and swear an Oath of Vengeance.',
      features: [
        { level: 3, name: 'Abjure Enemy', description: 'Channel Divinity: As an action, choose a creature within 60 ft. The creature must make a Wisdom saving throw or be frightened and have its speed reduced to 0 for 1 minute or until it takes damage. Fiends and undead have disadvantage on this save.' },
        { level: 3, name: 'Vow of Enmity', description: 'Channel Divinity: As a bonus action, utter a vow of enmity against a creature within 10 ft. You gain advantage on attack rolls against that creature for 1 minute or until the creature drops to 0 hit points or falls unconscious.' },
        { level: 7, name: 'Relentless Avenger', description: 'Your supernatural focus helps you close off a foe\'s retreat. When you hit a creature with an opportunity attack, you can move up to half your speed immediately after the attack, without provoking opportunity attacks.' },
        { level: 15, name: 'Soul of Vengeance', description: 'The authority with which you speak your Vow of Enmity gives you greater power over your foe. When a creature under your Vow of Enmity makes an attack, you can use your reaction to make a melee weapon attack against that creature if it is within range.' },
        { level: 20, name: 'Avenging Angel', description: 'As an action, assume the form of an angelic avenger for 1 hour. Sprout wings, gaining a flying speed of 60 ft. Enemies who see you must make a Wisdom saving throw (DC 8 + PB + CHA) or become frightened of you for 1 minute. Usable once per long rest.' },
      ],
    },
    'Oath of Conquest': {
      flavorText: 'The Oath of Conquest calls to paladins who seek glory in battle and the subjugation of their enemies. It isn\'t enough for these paladins to establish order. They must crush the forces of chaos. Sometimes called knight tyrants or iron mongers, conquering paladins use whatever means necessary to achieve their goals.',
      features: [
        { level: 3, name: 'Conquering Presence', description: 'Channel Divinity: As an action, force each creature of your choice within 30 ft to make a Wisdom saving throw. On a failed save, the creature is frightened of you for 1 minute. The frightened creature repeats the save at the end of each turn; on a success, the effect ends for that creature.' },
        { level: 3, name: 'Guided Strike', description: 'Channel Divinity: Gain a +10 bonus to an attack roll you make (add after seeing the die but before knowing hit/miss).' },
        { level: 7, name: 'Aura of Conquest', description: 'You constantly emanate a menacing aura — while you\'re not incapacitated, any creature frightened of you that starts its turn within 10 ft of you takes psychic damage equal to half your paladin level and has its speed reduced to 0 (radius extends to 30 ft at level 18).' },
        { level: 15, name: 'Scornful Rebuke', description: 'Whenever a creature under the effect of your Aura of Conquest hits you with an attack, the attacker takes psychic damage equal to your Charisma modifier (min 1).' },
        { level: 20, name: 'Invincible Conqueror', description: 'As an action, assume an aspect of conquest for 1 minute. You have resistance to all damage. You can make an additional attack when you take the Attack action. Your melee weapon attacks score a critical hit on a roll of 19 or 20 on the d20. Usable once per long rest.' },
      ],
    },
    'Oath of Redemption': {
      flavorText: 'The Oath of Redemption sets a paladin on a difficult path, one that requires a holy warrior to use violence only as a last resort. Followers of this oath believe that any person can be redeemed and that the path of benevolence and justice is one that anyone can walk. These paladins face evil creatures in the hope of turning them to the light.',
      features: [
        { level: 3, name: 'Emissary of Peace', description: 'You gain a +5 bonus to Charisma (Persuasion) checks.' },
        { level: 3, name: 'Rebuke the Violent', description: 'Channel Divinity: When a creature within 30 ft deals damage to another creature with an attack, use your reaction to force the attacker to succeed on a Wisdom saving throw or take radiant damage equal to the damage it just dealt. On a successful save, it takes half as much damage.' },
        { level: 7, name: 'Aura of the Guardian', description: 'When a creature within 10 ft of you takes damage, you can use your reaction to magically take that damage yourself instead (it can\'t be reduced in any way). The aura extends to 30 ft at level 18.' },
        { level: 15, name: 'Protective Spirit', description: 'A holy presence mends your wounds. At the end of your turn if you have fewer than half your hit points remaining, you regain hit points equal to 1d6 + half your paladin level. This feature doesn\'t function if you have 0 hit points.' },
        { level: 20, name: 'Emissary of Redemption', description: 'You become an avatar of peace: you have resistance to all damage dealt by other creatures (not environment). Whenever a creature hits you with an attack, it takes radiant damage equal to half the damage you take. If you attack a creature, cast a spell on it, or deal damage to it, neither benefit applies until you finish a long rest.' },
      ],
    },
    'Oath of Glory': {
      flavorText: 'Paladins who take the Oath of Glory believe they and their companions are destined to achieve glory through deeds of heroism. They train diligently and encourage their companions so they\'re all ready when destiny calls.',
      features: [
        { level: 3, name: 'Inspiring Smite', description: 'Channel Divinity: Immediately after you deal damage with Divine Smite, distribute up to 2d8 + your paladin level temporary HP to one or more creatures you can see within 30 ft (including yourself).' },
        { level: 3, name: 'Peerless Athlete', description: 'Channel Divinity: For 10 minutes, you have advantage on Strength (Athletics) and Dexterity (Acrobatics) checks, and the distance you can jump increases by 10 ft.' },
        { level: 7, name: 'Aura of Alacrity', description: 'Your walking speed increases by 10 ft. In addition, if you are not incapacitated, the walking speed of any ally who starts their turn within 5 ft of you increases by 10 ft until the end of that turn (radius extends to 10 ft at level 18).' },
        { level: 15, name: 'Glorious Defense', description: 'When a creature you can see hits you or a creature within 10 ft of you with an attack roll, you can use your reaction to grant a +CHA modifier bonus to the target\'s AC against that attack (min +1). If the attack misses, make one weapon attack against the attacker as part of the same reaction.' },
        { level: 20, name: 'Living Legend', description: 'As a bonus action, you become empowered by your glory for 1 minute. You have advantage on Charisma checks. Once on each of your turns when you miss with a melee weapon attack, you can reroll the attack. If an ally fails a saving throw, you can use your reaction to let them reroll it (once per minute). Usable once per long rest.' },
      ],
    },
    'Oath of the Watchers': {
      flavorText: 'The Oath of the Watchers binds paladins to protect mortal realms from the predations of extraplanar creatures — many of whom are uninterested in the wellbeing of the Material Plane. The Watchers\' tenets are not codified, but their adherents believe that any oath-breaker who allows extraplanar influence to corrupt the mortal world has failed in their sacred duty.',
      features: [
        { level: 3, name: 'Watcher\'s Will', description: 'Channel Divinity: As an action, choose a number of creatures you can see equal to your Charisma modifier (min 1) within 30 ft. For 1 minute, those creatures have advantage on Intelligence, Wisdom, and Charisma saving throws.' },
        { level: 3, name: 'Abjure the Extraplanar', description: 'Channel Divinity: Present your holy symbol and speak a prayer against extraplanar interlopers. Each aberration, celestial, elemental, fey, or fiend within 30 ft must make a Wisdom saving throw or be turned for 1 minute or until it takes damage.' },
        { level: 7, name: 'Aura of the Sentinel', description: 'You and creatures you choose within 10 ft add your proficiency bonus to their initiative rolls (radius extends to 30 ft at level 18). You can\'t be surprised while conscious.' },
        { level: 15, name: 'Vigilant Rebuke', description: 'When a creature you can see succeeds on an Intelligence, Wisdom, or Charisma saving throw, you can use your reaction to deal 2d8 + CHA force damage to the creature that forced the saving throw.' },
        { level: 20, name: 'Mortal Bulwark', description: 'As a bonus action, become a manifestation of the Watchers\' will for 1 minute. You gain truesight to 120 ft; advantage on attack rolls against aberrations, celestials, elementals, fey, and fiends; Channel Divinity forces such creatures to make saving throws with disadvantage; and when you hit one with a weapon attack, you can banish it to its native plane (WIS save to resist). Usable once per long rest.' },
      ],
    },
    'Oathbreaker': {
      flavorText: 'An Oathbreaker is a paladin who has broken their sacred oaths to pursue some dark ambition or who has been seduced into the service of a dark power. Whatever light burned in the paladin\'s heart has been extinguished. Only darkness remains. This subclass is designed for use by the DM as a villain archetype.',
      features: [
        { level: 3, name: 'Dreadful Aspect', description: 'Channel Divinity: As an action, force each creature you choose within 30 ft to make a Wisdom saving throw or be frightened of you for 1 minute. Frightened creatures repeat the save at the end of each turn, ending the effect on a success.' },
        { level: 3, name: 'Control Undead', description: 'Channel Divinity: As an action, target one undead creature you can see within 30 ft. The target must make a Wisdom saving throw. On a failed save, the target is charmed by you for 24 hours and obeys your commands to the best of its ability.' },
        { level: 7, name: 'Aura of Hate', description: 'You and fiends and undead within 10 ft of you add your Charisma modifier (min +1) to melee weapon damage rolls. A creature cannot benefit from multiple instances of this feature simultaneously. Radius extends to 30 ft at level 18.' },
        { level: 15, name: 'Supernatural Resistance', description: 'You gain resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.' },
        { level: 20, name: 'Dread Lord', description: 'As an action, create an aura of gloom for 1 minute. The aura reduces bright light to dim light within 30 ft. Frightened enemies in the aura have disadvantage on saving throws. On each of your turns, you can use a bonus action to deal 4d10 psychic damage to one frightened enemy in the aura. Nonmagical light in the aura is extinguished. Usable once per long rest.' },
      ],
    },
  },

  '5.5e': {
    'Oath of Devotion': {
      flavorText: 'The Oath of Devotion binds a paladin to the highest ideals of justice, virtue, and order. The 2024 rules sharpen the Sacred Weapon channel divinity and refine Holy Nimbus into a reliable capstone for the classic holy warrior fantasy.',
      features: [
        { level: 3, name: 'Sacred Weapon', description: 'Channel Divinity: For 1 minute, one weapon you hold is imbued with radiance — add CHA modifier to attack rolls (min +1), and it emits bright light 20 ft, dim light 20 ft further.' },
        { level: 3, name: 'Turn the Unholy', description: 'Channel Divinity: Each fiend or undead within 30 ft must succeed on a WIS save or be turned for 1 minute or until it takes damage.' },
        { level: 7, name: 'Aura of Devotion', description: 'You and friendly creatures within 10 ft can\'t be charmed while you are conscious. Radius extends to 30 ft at level 18.' },
        { level: 15, name: 'Smite of Protection', description: 'When you use Divine Smite, you can grant allies within 30 ft resistance to one damage type until the start of your next turn.' },
        { level: 20, name: 'Holy Nimbus', description: 'As a Bonus Action, emanate an aura of sunlight for 1 minute (30 ft radius). Fiends and undead have disadvantage on attack rolls against you; undead in the bright light take 10 radiant damage per turn. Usable once per long rest.' },
      ],
    },
    'Oath of the Ancients': {
      flavorText: 'The Oath of the Ancients paladins protect the natural world with the authority of ancient traditions. The 2024 rules keep the signature spell resistance aura while adjusting Nature\'s Wrath and adding new synergies with the natural world.',
      features: [
        { level: 3, name: 'Nature\'s Wrath', description: 'Channel Divinity: Spectral vines restrain a creature within 10 ft (STR or DEX save). The creature can repeat the save each turn.' },
        { level: 3, name: 'Turn the Faithless', description: 'Channel Divinity: Each fey or fiend within 30 ft must make a WIS save or be turned for 1 minute.' },
        { level: 7, name: 'Aura of Warding', description: 'You and friendly creatures within 10 ft have resistance to damage from spells. Radius extends to 30 ft at level 18.' },
        { level: 15, name: 'Undying Sentinel', description: 'When reduced to 0 HP, drop to 1 HP instead (once per long rest). You can\'t be aged magically.' },
        { level: 20, name: 'Elder Champion', description: 'As an action, channel the power of nature for 1 minute: regain 10 HP at the start of each turn; paladin spells cost a Bonus Action; enemies within 10 ft have disadvantage on saves vs. your Paladin spells and Channel Divinity. Usable once per long rest.' },
      ],
    },
    'Oath of Glory': {
      flavorText: 'The Oath of Glory paladins believe they and their companions are destined for greatness. The 2024 revision keeps the mobility-focused Aura of Alacrity and sharpens Glorious Defense into a reliable defensive reaction throughout heroic adventures.',
      features: [
        { level: 3, name: 'Inspiring Smite', description: 'Channel Divinity: After dealing damage with Divine Smite, distribute up to 2d8 + Paladin level temp HP to creatures within 30 ft.' },
        { level: 3, name: 'Peerless Athlete', description: 'Channel Divinity: For 10 minutes, advantage on Athletics and Acrobatics checks; jump distance increases by 10 ft.' },
        { level: 7, name: 'Aura of Alacrity', description: 'Your speed increases by 10 ft. Allies who start their turn within 5 ft also gain +10 ft until end of their turn. Radius extends to 10 ft at level 18.' },
        { level: 15, name: 'Glorious Defense', description: 'When a creature hits you or a creature within 10 ft, use your reaction to add your CHA modifier to AC. If the attack misses, make one melee weapon attack against the attacker.' },
        { level: 20, name: 'Living Legend', description: 'As a Bonus Action, become empowered for 1 minute: advantage on CHA checks; reroll one missed weapon attack each turn; use your reaction to let an ally reroll a failed save (once per minute). Usable once per long rest.' },
      ],
    },
    'Oath of Vengeance': {
      flavorText: 'The Oath of Vengeance is a solemn commitment to punish those who have committed a grievous sin. The 2024 rules sharpen Vow of Enmity and give Relentless Avenger more consistent application as you chase down fleeing foes.',
      features: [
        { level: 3, name: 'Vow of Enmity', description: 'Channel Divinity: As a Bonus Action, vow against a creature within 10 ft. You have advantage on attack rolls against it for 1 minute or until it drops to 0 HP.' },
        { level: 3, name: 'Abjure Foes', description: 'Channel Divinity: Up to 5 creatures of your choice within 60 ft must make a WIS save or be frightened and have Speed 0 for 1 minute (or until they take damage).' },
        { level: 7, name: 'Relentless Avenger', description: 'When you hit with an opportunity attack, move up to half your speed immediately without provoking opportunity attacks.' },
        { level: 15, name: 'Soul of Vengeance', description: 'When a creature under your Vow of Enmity makes an attack, use your reaction to make one melee weapon attack against it.' },
        { level: 20, name: 'Avenging Angel', description: 'As an action, assume angelic form for 1 hour — fly speed 60 ft; enemies who see you must WIS save or be frightened for 1 minute. Usable once per long rest.' },
      ],
    },
    'Oath of Conquest': {
      flavorText: 'The Oath of Conquest demands total subjugation of enemies. The 2024 rules refine the Aura of Conquest\'s fear-lock mechanics and give the capstone Invincible Conqueror stronger synergy with the paladin\'s smite abilities.',
      features: [
        { level: 3, name: 'Conquering Presence', description: 'Channel Divinity: Frighten creatures of your choice within 30 ft (WIS save) for 1 minute. Frightened creatures repeat the save each turn.' },
        { level: 3, name: 'Guided Strike', description: 'Channel Divinity: Gain +10 to one attack roll (after seeing the die).' },
        { level: 7, name: 'Aura of Conquest', description: 'While you\'re not incapacitated, frightened creatures within 10 ft have Speed 0 and take psychic damage equal to half your Paladin level at the start of their turn. Radius extends to 30 ft at level 18.' },
        { level: 15, name: 'Scornful Rebuke', description: 'When a creature in your Aura of Conquest hits you, deal your CHA modifier psychic damage to it (min 1).' },
        { level: 20, name: 'Invincible Conqueror', description: 'As an action, assume an aspect of conquest for 1 minute: resistance to all damage; one extra attack when you take the Attack action; crits on 19-20. Usable once per long rest.' },
      ],
    },
    'Oath of Redemption': {
      flavorText: 'The Oath of Redemption calls paladins to use violence only as a last resort, believing anyone can be turned from darkness. The 2024 revision maintains the pacifist-defender fantasy with refined Guardian Aura damage-taking and cleaner Emissary of Redemption conditions.',
      features: [
        { level: 3, name: 'Emissary of Peace', description: 'You gain a +5 bonus to Persuasion checks.' },
        { level: 3, name: 'Rebuke the Violent', description: 'Channel Divinity: When a creature within 30 ft deals damage with an attack, use your reaction to force it to make a WIS save or take radiant damage equal to the damage it just dealt (half on success).' },
        { level: 7, name: 'Aura of the Guardian', description: 'When a creature within 10 ft takes damage, use your reaction to take that damage yourself instead. Radius extends to 30 ft at level 18.' },
        { level: 15, name: 'Protective Spirit', description: 'At the end of your turn, if you\'re below half HP, regain 1d6 + half your Paladin level HP (only if you have at least 1 HP).' },
        { level: 20, name: 'Emissary of Redemption', description: 'You gain resistance to all damage dealt by other creatures. When a creature hits you, it takes radiant damage equal to half the damage you take. If you deal damage to a creature, neither benefit applies until your next long rest.' },
      ],
    },
    'Oathbreaker': {
      flavorText: 'An Oathbreaker is a paladin who has broken their sacred oaths and turned to darkness. This villain archetype is primarily designed for DM use as an NPC, though a player may use it with DM permission to explore a fallen paladin narrative.',
      features: [
        { level: 3, name: 'Dreadful Aspect', description: 'Channel Divinity: Frighten creatures you choose within 30 ft (WIS save) for 1 minute.' },
        { level: 3, name: 'Control Undead', description: 'Channel Divinity: Charm one undead within 30 ft for 24 hours (WIS save to resist).' },
        { level: 7, name: 'Aura of Hate', description: 'You and fiends/undead within 10 ft add your CHA modifier to melee weapon damage. Radius extends to 30 ft at level 18.' },
        { level: 15, name: 'Supernatural Resistance', description: 'Resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.' },
        { level: 20, name: 'Dread Lord', description: 'As an action, spread an aura of gloom for 1 minute — reduces light, frightened enemies have disadvantage on saves; deal 4d10 psychic damage as a Bonus Action to a frightened enemy. Usable once per long rest.' },
      ],
    },
  },
};
