export const SORCERER = {
  '5e': {
    'Draconic Bloodline': {
      flavorText: 'Your innate magic comes from draconic magic that was mingled with your blood or that of your ancestors. Most often, sorcerers with this origin trace their descent back to a mighty sorcerer of ancient times who made a bargain with a dragon or who might even have claimed a dragon parent.',
      features: [
        { level: 1, name: 'Dragon Ancestor', description: 'You have draconic blood from a particular type of dragon. Choose the type: black (acid), blue (lightning), brass (fire), bronze (lightning), copper (acid), gold (fire), green (poison), red (fire), silver (cold), or white (cold). This affects your Breath Weapon and Elemental Affinity.' },
        { level: 1, name: 'Draconic Resilience', description: 'As magic flows through your body, it causes physical traits of your dragon ancestors to emerge. Your hit point maximum increases by 1 and increases by 1 again whenever you gain a level in this class. Additionally, if you aren\'t wearing armor, your AC equals 13 + your Dexterity modifier.' },
        { level: 6, name: 'Elemental Affinity', description: 'When you cast a spell that deals damage of your draconic ancestor type, add your Charisma modifier to that damage. At the same time, spend 1 sorcery point to gain resistance to that damage type for 1 hour.' },
        { level: 14, name: 'Dragon Wings', description: 'You gain the ability to sprout a pair of dragon wings from your back, gaining a flying speed equal to your current speed. You can create these wings as a bonus action on your turn. They last until you dismiss them as a bonus action on your turn. You can\'t manifest your wings while wearing armor.' },
        { level: 18, name: 'Draconic Presence', description: 'You can channel the dread presence of your dragon ancestor, causing those around you to become awestruck or frightened. As an action, spend 5 sorcery points to draw on this power and exude an aura of awe or fear (your choice) to a distance of 60 ft. Each hostile creature that starts its turn in the aura must succeed on a Wisdom save or be charmed (awe) or frightened (fear) until the aura ends. You maintain this aura for up to 1 minute (concentration).' },
      ],
    },
    'Wild Magic': {
      flavorText: 'Your innate magic comes from the wild forces of chaos that underlie the order of creation. You might have endured exposure to some form of raw magic, perhaps through a planar rift, or Wild Magic might simply be a feature of your birth, with no apparent cause. However it came to be, this chaotic magic churns within you.',
      features: [
        { level: 1, name: 'Wild Magic Surge', description: 'Your spellcasting can unleash surges of untamed magic. Immediately after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20. On a 1, roll on the Wild Magic Surge table to create a random magical effect.' },
        { level: 1, name: 'Tides of Chaos', description: 'You can manipulate the forces of chance and chaos to gain advantage on one attack roll, ability check, or saving throw. Once you do so, you must finish a long rest before you can use this feature again (or the DM can trigger a Wild Magic Surge to reset it immediately).' },
        { level: 6, name: 'Bend Luck', description: 'You have the ability to twist fate using your wild magic. When another creature you can see makes an attack roll, ability check, or saving throw, you can use your reaction and spend 2 sorcery points to roll 1d4 and apply the number rolled as a bonus or penalty (your choice) to the creature\'s roll.' },
        { level: 14, name: 'Controlled Chaos', description: 'You gain a modicum of control over the surges of your wild magic. Whenever you roll on the Wild Magic Surge table, you can roll twice and use either number.' },
        { level: 18, name: 'Spell Bombardment', description: 'The harmful energy of your spells intensifies. When you roll damage for a spell and roll the highest number possible on any of the dice, choose one of those dice, roll it again and add that roll to the damage. You can use the feature only once per turn.' },
      ],
    },
    'Divine Soul': {
      flavorText: 'Sometimes the spark of magic that fuels a sorcerer comes from a divine source that glimmers within the soul. Having such a blessed soul is a sign that your innate magic might come from a distant but powerful familial connection to a divine being. Perhaps your ancestor was an angel, transformed into a mortal and sent to fight in a god\'s name.',
      features: [
        { level: 1, name: 'Divine Magic', description: 'Your link to the divine allows you to learn spells from the cleric spell list. You learn one additional spell of your choice from that list; you can replace this spell whenever you gain a sorcerer level. Additionally, choose an affinity: Good (add spare the dying), Evil (add inflict wounds), Law (add bless), Chaos (add bane), or Neutrality (add protection from evil and good).' },
        { level: 1, name: 'Favored by the Gods', description: 'Divine power guards your destiny. If you fail a saving throw or miss with an attack roll, you can roll 2d4 and add it to the total, possibly changing the outcome. Once you use this feature, you can\'t use it again until you finish a short or long rest.' },
        { level: 6, name: 'Empowered Healing', description: 'The divine energy coursing through you can empower healing spells. Whenever you or an ally within 5 ft of you rolls dice to restore hit points with a spell, you can spend 1 sorcery point to reroll any number of those dice once, as long as you aren\'t incapacitated. You can use this feature only once per turn.' },
        { level: 14, name: 'Otherworldly Wings', description: 'You can use a bonus action to manifest a pair of spectral wings from your back. While the wings are present, you have a flying speed of 30 ft. The wings last until you\'re incapacitated, you die, or you dismiss them as a bonus action. Their appearance varies — feathered wings for those of good or neutral alignment, leathery bat wings for evil.' },
        { level: 18, name: 'Unearthly Recovery', description: 'You gain the ability to overcome grievous injuries. As a bonus action when you have fewer than half of your hit points remaining, you can regain a number of hit points equal to half your hit point maximum. Once you use this feature, you can\'t use it again until you finish a long rest.' },
      ],
    },
    'Shadow Magic': {
      flavorText: 'You are a creature of shadow, for your innate magic comes from the Shadowfell itself. You might trace your lineage to an entity from that place, or perhaps you were exposed to its fell energy and transformed by it. The power of shadow magic casts a strange pall over your physical presence.',
      features: [
        { level: 1, name: 'Eyes of the Dark', description: 'From 1st level, you have darkvision with a range of 120 ft. When you reach 3rd level in this class, you learn the darkness spell, which doesn\'t count against your number of sorcerer spells known. In addition, you can cast it by spending 2 sorcery points or by expending a spell slot. If you cast it with sorcery points, you can see through the darkness created by the spell.' },
        { level: 1, name: 'Strength of the Grave', description: 'Your existence in a twilight state between life and death makes you difficult to defeat. When damage reduces you to 0 hit points, you can make a Charisma saving throw (DC 5 + the damage taken). On success, you instead drop to 1 hit point. You can\'t use this feature if you are reduced to 0 hit points by radiant damage or by a critical hit. Recharges on a long rest.' },
        { level: 6, name: 'Hound of Ill Omen', description: 'You gain the ability to call forth a howling creature of darkness to harass your foes. As a bonus action, spend 3 sorcery points to magically summon a hound of ill omen to target one creature you can see within 120 ft. The hound uses the dire wolf\'s statistics but is shadow-like, reduces its speed to 0 ft at the target\'s location, can move through other creatures and objects, and has resistance to all damage (except force). While the hound is summoned, your target has disadvantage on saves against your spells.' },
        { level: 14, name: 'Shadow Walk', description: 'You gain the ability to step from one shadow into another. When you are in dim light or darkness, as a bonus action, you can teleport up to 120 ft to an unoccupied space you can see that is also in dim light or darkness.' },
        { level: 18, name: 'Umbral Form', description: 'You can spend 6 sorcery points as a bonus action to transform yourself into a shadowy form. In this form, you have resistance to all damage except force and radiant, and you can move through other creatures and objects as if they were difficult terrain (taking 5 force damage if inside an object at end of turn). This transformation lasts 1 minute or until you end it as a bonus action.' },
      ],
    },
    'Storm Sorcery': {
      flavorText: 'Your innate magic comes from the power of elemental air. Many with this power can trace their magic back to a near-death experience caused by the Great Rain, but perhaps you were born during a howling gale so powerful that folk still tell the story of it, or your lineage might include the influence of potent air creatures.',
      features: [
        { level: 1, name: 'Wind Speaker', description: 'The arcane magic you command is infused with elemental air. You can speak, read, and write Primordial. Knowing this language allows you to understand and be understood by those who speak its dialects: Aquan, Auran, Ignan, and Terran.' },
        { level: 1, name: 'Tempestuous Magic', description: 'Starting at 1st level, you can use a bonus action on your turn to cause whirling gusts of elemental air to briefly surround you, immediately before or after you cast a spell of 1st level or higher. Doing so allows you to fly up to 10 ft without provoking opportunity attacks.' },
        { level: 6, name: 'Heart of the Storm', description: 'You gain resistance to lightning and thunder damage. In addition, whenever you start casting a spell of 1st level or higher that deals lightning or thunder damage, stormy magic erupts from you. This eruption causes each creature of your choice within 10 ft to take lightning or thunder damage (your choice) equal to half your sorcerer level.' },
        { level: 6, name: 'Storm Guide', description: 'You gain the ability to subtly control the weather around you. If it is raining, you can use an action to cause the rain to stop falling in a 20 ft radius centered on you. This effect lasts until you lose your concentration (as if concentrating on a spell). If it is windy, you can use a bonus action each round to choose the direction that the wind blows in a 100 ft radius around you.' },
        { level: 14, name: 'Storm\'s Fury', description: 'When you are hit by a melee attack, you can use your reaction to deal lightning damage to the attacker equal to your sorcerer level. The attacker must also make a Strength saving throw against your spell save DC, and if it fails, it is pushed in a straight line up to 20 ft away from you.' },
        { level: 18, name: 'Wind Soul', description: 'You gain immunity to lightning and thunder damage and you have a magical flying speed of 60 ft. As an action, you can reduce your fly speed to 30 ft for 1 hour and choose a number of creatures within 30 ft equal to 3 + your CHA modifier. The chosen creatures gain a magical fly speed of 30 ft for 1 hour.' },
      ],
    },
    'Aberrant Mind': {
      flavorText: 'An alien influence has wrapped its tendrils around your mind, giving you psionic power. You can hear faint whispers that others can\'t, and you have been forever changed by your exposure to some alien intelligence. Perhaps you were born with this power, and it has always set you apart from others.',
      features: [
        { level: 1, name: 'Telepathic Speech', description: 'You can form a telepathic connection between your mind and the mind of another. As a bonus action, choose one creature you can see within 30 ft. You and the chosen creature can speak telepathically with each other while you are within a number of miles of each other equal to your CHA modifier (min 1 mile). The connection lasts for a number of minutes equal to your sorcerer level. It ends early if you are incapacitated, if you die, or if you use this feature to form a connection with a different creature.' },
        { level: 6, name: 'Psionic Sorcery', description: 'When you cast any spell from your Expanded Spells (the psionic/aberrant ones), you can cast it by expending a spell slot as normal or by spending a number of sorcery points equal to the spell\'s level. If you cast the spell using sorcery points, it requires no verbal or somatic components, and it requires no material components unless they are consumed by the spell.' },
        { level: 6, name: 'Psychic Defenses', description: 'You gain resistance to psychic damage, and you have advantage on saving throws against being charmed or frightened.' },
        { level: 14, name: 'Revelation in Flesh', description: 'You can unleash the aberrant truth hidden within yourself. As a bonus action, spend 1 or more sorcery points to magically transform yourself for 10 minutes. For each sorcery point spent: 1 pt = see invisible creatures and on the Ethereal Plane to 60 ft; 2 pts = gain swim speed equal to walking speed and breathe underwater; 3 pts = gain fly speed equal to walking speed; 4 pts = your body becomes amorphous (can move through spaces as narrow as 1 inch without squeezing).' },
        { level: 18, name: 'Warping Implosion', description: 'You can unleash your aberrant power as a space-warping anomaly. As an action, choose a point you can see within 120 ft. Each creature within 30 ft of the chosen point must make a Strength saving throw. On a failed save, a creature takes 3d10 force damage and is pulled straight toward the chosen point. On a successful save, it takes half damage and isn\'t pulled. After you use this feature, you can\'t use it again until you finish a long rest.' },
      ],
    },
    'Clockwork Soul': {
      flavorText: 'The cosmic force of order has suffused you with magic. You might have stumbled upon a clockwork creature, or your lineage might include strong ties to Mechanus, the plane of order, or even a direct encounter with Primus, the ruler of that place. However you acquired this power, your magic is imbued with the ability to impose order on the world around you.',
      features: [
        { level: 1, name: 'Clockwork Magic', description: 'Your connection to the plane of absolute order allows you to learn spells normally associated with the abjuration and transmutation schools. When your Spellcasting feature lets you learn or replace a sorcerer cantrip or a sorcerer spell of 1st level or higher, you can choose the new spell from the cleric or wizard spell list in addition to the sorcerer spell list.' },
        { level: 1, name: 'Restore Balance', description: 'Your connection to the plane of absolute order allows you to equalize chaotic moments. When a creature you can see within 60 ft is about to roll a d20 with advantage or disadvantage, you can use your reaction to prevent the roll from being affected by advantage and disadvantage. You can use this feature a number of times equal to your PB per long rest.' },
        { level: 6, name: 'Bastion of Law', description: 'You can tap into the grand equation of existence to imbue a creature with a shimmering shield of order. As an action, you can expend 1 to 5 sorcery points to create a magical ward around yourself or another creature you can see within 30 ft. The ward has hit points equal to 5 × the sorcery points spent. Whenever the warded creature takes damage, the ward takes the damage instead. The ward lasts until exhausted or until you finish a long rest.' },
        { level: 14, name: 'Trance of Order', description: 'You gain the ability to align your consciousness to the endless calculations of Mechanus. As a bonus action, you can enter this state for 1 minute. For the duration, attack rolls against you can\'t benefit from advantage, and whenever you make an attack roll, ability check, or saving throw, you can treat a roll of 9 or lower on the d20 as a 10. Once you use this feature, you can\'t use it again until you finish a long rest.' },
        { level: 18, name: 'Clockwork Cavalcade', description: 'You summon spirits of order to expunge disorder around you. As an action, you summon the spirits in a 30 ft cube originating from you. The spirits look like modrons or other constructs of your choice. The spirits restore up to 4d6 × 10 hit points, divided as you choose among any number of creatures in the cube. They end any effects causing a creature in the cube to be charmed, frightened, or poisoned. Any damaged objects in the cube are repaired. Once you use this feature, you can\'t use it again until you finish a long rest.' },
      ],
    },
  },

  '5.5e': {
    'Aberrant Mind': {
      flavorText: 'An alien intelligence has left its psychic mark on you. The 2024 Aberrant Mind sorcerer refines Psionic Sorcery to reduce costs on psionic spells and sharpens Warping Implosion into a reliable capstone.',
      features: [
        { level: 3, name: 'Telepathic Speech', description: 'As a Bonus Action, form a telepathic connection with a visible creature within 30 ft. You can communicate telepathically for a number of miles equal to your CHA modifier (min 1). Lasts your Sorcerer level in minutes.' },
        { level: 3, name: 'Psionic Sorcery', description: 'Cast your psionic expansion spells by spending Sorcery Points equal to the spell level instead of a spell slot. Spells cast this way need no verbal, somatic, or non-consumed material components.' },
        { level: 6, name: 'Psychic Defenses', description: 'Resistance to psychic damage and advantage on saves against being Charmed or Frightened.' },
        { level: 14, name: 'Revelation in Flesh', description: 'Spend Sorcery Points as a Bonus Action to transform for 10 minutes. Each point unlocks a benefit: see invisible/ethereal (1), aquatic adaptation (2), fly speed (3), or become amorphous (4).' },
        { level: 18, name: 'Warping Implosion', description: 'As an action, choose a point within 120 ft. Creatures within 30 ft must STR save or take 3d10 force damage and be pulled toward the point (half on success, no pull). Usable once per long rest.' },
      ],
    },
    'Clockwork Soul': {
      flavorText: 'The cosmic force of order has infused your magic. The 2024 Clockwork Soul sorcerer improves Bastion of Law\'s shield durability and makes Trance of Order available earlier in the level arc.',
      features: [
        { level: 3, name: 'Restore Balance', description: 'When a creature within 60 ft is about to roll with advantage or disadvantage, use your reaction to cancel it. Usable PB times per long rest.' },
        { level: 6, name: 'Bastion of Law', description: 'As an action, spend 1–5 Sorcery Points to create a ward with 5 × points HP around a creature within 30 ft. The ward absorbs damage until exhausted.' },
        { level: 14, name: 'Trance of Order', description: 'As a Bonus Action, align yourself with Mechanus for 1 minute: attacks against you can\'t have advantage; rolls of 9 or lower count as 10 for you. Usable once per long rest.' },
        { level: 18, name: 'Clockwork Cavalcade', description: 'Summon spirits of order in a 30 ft cube: restore up to 4d6 × 10 HP among creatures, end charm/fear/poison conditions, and repair damaged objects. Usable once per long rest.' },
      ],
    },
    'Draconic Sorcery': {
      flavorText: 'Your innate magic flows from draconic blood. The 2024 revision renames this subclass Draconic Sorcery and refines the natural armor formula, while making Dragon Wings available at level 14 without the armor restriction.',
      features: [
        { level: 3, name: 'Dragon Ancestor', description: 'Choose a dragon type (and element): black (acid), blue (lightning), brass (fire), bronze (lightning), copper (acid), gold (fire), green (poison), red (fire), silver (cold), or white (cold). This determines your Elemental Affinity and later abilities.' },
        { level: 3, name: 'Draconic Resilience', description: 'Max HP increases by 1 per Sorcerer level. If not wearing armor, your AC equals 13 + DEX modifier.' },
        { level: 6, name: 'Elemental Affinity', description: 'Add CHA modifier to one damage roll of spells dealing your draconic element type. Spend 1 Sorcery Point to gain resistance to that damage type for 1 hour.' },
        { level: 14, name: 'Dragon Wings', description: 'As a Bonus Action, sprout spectral dragon wings granting fly speed equal to your walking speed. You can dismiss them as a Bonus Action.' },
        { level: 18, name: 'Draconic Presence', description: 'Spend 5 Sorcery Points as an action to project an aura of awe or fear for 60 ft for up to 1 minute (concentration). Hostile creatures that start their turn in the aura must WIS save or be Charmed (awe) or Frightened (fear).' },
      ],
    },
    'Divine Soul': {
      flavorText: 'A divine spark glimmers within your soul. The 2024 Divine Soul sorcerer expands access to cleric spells and sharpens Unearthly Recovery into a more reliable emergency healing option for the mid-combat pinch.',
      features: [
        { level: 3, name: 'Divine Magic', description: 'Your Expanded Spells include spells from the Cleric list. Choose an affinity (Good, Evil, Law, Chaos, or Neutrality) to gain one bonus domain spell.' },
        { level: 3, name: 'Favored by the Gods', description: 'When you fail a save or miss an attack, roll 2d4 and add it to the result. Usable once per short or long rest.' },
        { level: 6, name: 'Empowered Healing', description: 'Spend 1 Sorcery Point to reroll any number of dice from a healing spell cast by you or an ally within 5 ft (once per turn).' },
        { level: 14, name: 'Otherworldly Wings', description: 'Manifest spectral wings as a Bonus Action, gaining a fly speed of 30 ft. Wings persist until you\'re incapacitated or dismiss them.' },
        { level: 18, name: 'Unearthly Recovery', description: 'As a Bonus Action when below half HP, regain half your maximum HP. Usable once per long rest.' },
      ],
    },
    'Shadow Magic': {
      flavorText: 'Your power comes from the Shadowfell\'s dark energy. The 2024 Shadow Magic sorcerer extends Eyes of the Dark\'s darkvision range and makes Umbral Form\'s resistance broader and more useful against physical damage types.',
      features: [
        { level: 3, name: 'Eyes of the Dark', description: '120 ft darkvision. You learn darkness and can cast it by spending 2 Sorcery Points (you can see through your own darkness).' },
        { level: 3, name: 'Strength of the Grave', description: 'When damage would drop you to 0 HP, make a CHA save (DC 5 + damage taken). On success, drop to 1 HP instead. Doesn\'t work against radiant damage or critical hits. Usable once per long rest.' },
        { level: 6, name: 'Hound of Ill Omen', description: 'Spend 3 Sorcery Points as a Bonus Action to summon a shadowy dire wolf to harry a target within 120 ft. The target has disadvantage on saves against your spells while the hound pursues it.' },
        { level: 14, name: 'Shadow Walk', description: 'While in dim light or darkness, teleport up to 120 ft to another dim or dark space as a Bonus Action.' },
        { level: 18, name: 'Umbral Form', description: 'Spend 6 Sorcery Points as a Bonus Action to become shadow-like for 1 minute: resistance to all non-force, non-radiant damage; move through creatures and objects as difficult terrain.' },
      ],
    },
    'Storm Sorcery': {
      flavorText: 'The power of elemental air flows through you. The 2024 Storm Sorcery sorcerer retains the unique fly-before-spellcasting feature and gives Storm\'s Fury stronger push distances and cleaner damage expressions.',
      features: [
        { level: 3, name: 'Tempestuous Magic', description: 'As a Bonus Action before or after casting a spell of 1st level or higher, fly up to 10 ft without provoking opportunity attacks.' },
        { level: 6, name: 'Heart of the Storm', description: 'Resistance to lightning and thunder damage. When you cast a spell dealing those damage types, deal half your Sorcerer level in lightning or thunder damage to creatures within 10 ft.' },
        { level: 14, name: 'Storm\'s Fury', description: 'When hit by a melee attack, use your reaction to deal your Sorcerer level in lightning damage to the attacker. If they fail a STR save, push them up to 20 ft away.' },
        { level: 18, name: 'Wind Soul', description: 'Immunity to lightning and thunder damage; 60 ft fly speed. As an action, grant up to 3 + CHA modifier allies within 30 ft a 30 ft fly speed for 1 hour (your own fly speed drops to 30 ft for that hour).' },
        { level: 6, name: 'Storm Guide', description: 'Stop rain in a 20 ft radius as an action (concentration). Control wind direction in a 100 ft radius as a bonus action.' },
      ],
    },
    'Wild Magic': {
      flavorText: 'Chaotic magical forces surge within you. The 2024 Wild Magic sorcerer makes Tides of Chaos recharge more reliably on a Wild Magic Surge, and expands the surge table to produce more memorable and dramatic effects.',
      features: [
        { level: 3, name: 'Wild Magic Surge', description: 'After casting a Sorcerer spell of 1st level or higher, the DM can ask you to roll a d20. On a 1, roll on the Wild Magic Surge table for a random magical effect.' },
        { level: 3, name: 'Tides of Chaos', description: 'Gain advantage on one attack roll, ability check, or saving throw. Recharges on a long rest (or when a Wild Magic Surge occurs immediately after you use this feature).' },
        { level: 6, name: 'Bend Luck', description: 'Spend 2 Sorcery Points as a reaction when a creature you can see makes a d20 roll. Roll 1d4 and apply the result as a bonus or penalty to their roll.' },
        { level: 14, name: 'Controlled Chaos', description: 'When rolling on the Wild Magic Surge table, roll twice and use either result.' },
        { level: 18, name: 'Spell Bombardment', description: 'Once per turn, when you roll the maximum on a damage die for a spell, roll that die again and add the result to the damage.' },
      ],
    },
  },
};
