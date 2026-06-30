export const WARLOCK = {
  '5e': {
    'The Archfey': {
      flavorText:
        'Your patron is a lord or lady of the fey, a creature of legend who holds secrets that were forgotten before the mortal races were born. This being\'s motivations are often inscrutable, and sometimes whimsical, and might involve a striving to increase its own power among the courts of the Feywild.',
      features: [
        {
          level: 1,
          name: 'Fey Presence',
          description:
            'As an action, you can cause each creature in a 10-foot cube originating from you to make a Wisdom saving throw against your warlock spell save DC. The creatures that fail their saving throws are all charmed or frightened by you (your choice) until the end of your next turn. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
        {
          level: 6,
          name: 'Misty Escape',
          description:
            'When you take damage, you can use your reaction to turn invisible and teleport up to 60 feet to an unoccupied space you can see. You remain invisible until the start of your next turn or until you attack or cast a spell. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
        {
          level: 10,
          name: 'Beguiling Defenses',
          description:
            'Your patron teaches you the dark secrets of influencing and insulating your mind. You are immune to being charmed, and when another creature attempts to charm you, you can use your reaction to attempt to turn the charm back on that creature. The creature must succeed on a Wisdom saving throw against your warlock spell save DC or be charmed by you for 1 minute or until the creature takes any damage.',
        },
        {
          level: 14,
          name: 'Dark Delirium',
          description:
            'As an action, choose a creature that you can see within 60 feet of you. It must make a Wisdom saving throw against your warlock spell save DC. On a failed save, it is charmed or frightened by you (your choice) for 1 minute or until your concentration is broken (as if you are concentrating on a spell). This effect ends early if the creature takes any damage. Until this illusion ends, the creature thinks it is lost in a misty realm, the appearance of which you choose. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
      ],
    },
    'The Fiend': {
      flavorText:
        'You have made a pact with a fiend from the lower planes of existence, a being whose aims are evil, even if you strive against those aims. Such beings desire the corruption or destruction of all things, ultimately including you. Fiends powerful enough to forge a pact include demon lords such as Demogorgon, Orcus, and Graz\'zt; archdevils such as Asmodeus, Dispater, Mephistopheles, and Belial; pit fiends and balors that are especially mighty; and ultroloths and other lords of the yugoloths.',
      features: [
        {
          level: 1,
          name: 'Dark One\'s Blessing',
          description:
            'When you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level (minimum of 1).',
        },
        {
          level: 6,
          name: 'Dark One\'s Own Luck',
          description:
            'You can call on your patron to alter fate in your favor. When you make an ability check or a saving throw, you can use this feature to add a d10 to your roll. You can do so after seeing the initial roll but before any of the roll\'s effects occur. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
        {
          level: 10,
          name: 'Fiendish Resilience',
          description:
            'You can choose one damage type when you finish a short or long rest. You gain resistance to that damage type until you choose a different one with this feature. Damage from magical weapons or silver weapons ignores this resistance.',
        },
        {
          level: 14,
          name: 'Hurl Through Hell',
          description:
            'When you hit a creature with an attack, you can use this feature to instantly transport the target through the lower planes. The creature disappears and hurtles through a nightmare landscape. At the end of your next turn, the target returns to the space it previously occupied, or the nearest unoccupied space. If the target is not a fiend, it takes 10d10 psychic damage as it reels from its horrific experience. Once you use this feature, you can\'t use it again until you finish a long rest.',
        },
      ],
    },
    'The Great Old One': {
      flavorText:
        'Your patron is a mysterious entity whose nature is utterly foreign to the fabric of reality. It might come from the Far Realm, the space beyond reality, or it could be one of the elder gods known only in legends. Its motives are incomprehensible to mortals, and its knowledge so immense and ancient that even the greatest libraries pale in comparison to the vast secrets it holds.',
      features: [
        {
          level: 1,
          name: 'Awakened Mind',
          description:
            'Your alien knowledge gives you the ability to touch the minds of other creatures. You can communicate telepathically with any creature you can see within 30 feet of you. You don\'t need to share a language with the creature for it to understand your telepathic utterances, but the creature must be able to understand at least one language.',
        },
        {
          level: 6,
          name: 'Entropic Ward',
          description:
            'When a creature makes an attack roll against you, you can use your reaction to impose disadvantage on that roll. If the attack misses you, your next attack roll against the creature has advantage if you make it before the end of your next turn. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
        {
          level: 10,
          name: 'Thought Shield',
          description:
            'Your thoughts can\'t be read by telepathy or other means unless you allow it. Also, whenever a creature deals psychic damage to you, that creature takes the same amount of damage that you do.',
        },
        {
          level: 14,
          name: 'Create Thrall',
          description:
            'You gain the ability to infect a humanoid\'s mind with the alien magic of your patron. You can use your action to touch an incapacitated humanoid. That creature is then charmed by you until a remove curse spell is cast on it, the charmed condition is removed from it, or you use this feature again. You can communicate telepathically with the charmed creature as long as the two of you are on the same plane of existence.',
        },
      ],
    },
    'The Celestial': {
      flavorText:
        'Your patron is a powerful being of the Upper Planes. You have bound yourself to an ancient empyrean, solar, ki-rin, unicorn, or other entity that resides in the planes of everlasting bliss. Your pact with that being allows you to experience the barest touch of the holy light that illuminates the multiverse.',
      features: [
        {
          level: 1,
          name: 'Healing Light',
          description:
            'You gain the ability to channel celestial energy to heal wounds. You have a pool of d6s that you spend to fuel this healing. The number of dice in the pool equals 1 + your warlock level. As a bonus action, you can heal one creature you can see within 60 feet of you, spending dice from the pool. The maximum number of dice you can spend at once equals your Charisma modifier (minimum of one die). Roll the dice you spend, add them together, and restore a number of hit points equal to the total. Your pool regains all expended dice when you finish a long rest.',
        },
        {
          level: 6,
          name: 'Radiant Soul',
          description:
            'Your link to the Celestial allows you to serve as a conduit for radiant energy. You have resistance to radiant damage, and when you cast a spell that deals radiant or fire damage, you add your Charisma modifier to one radiant or fire damage roll of that spell against one of its targets.',
        },
        {
          level: 10,
          name: 'Celestial Resilience',
          description:
            'You gain temporary hit points whenever you finish a short or long rest. These temporary hit points equal your warlock level + your Charisma modifier. Additionally, choose up to five creatures you can see at the end of the rest. Those creatures each gain temporary hit points equal to half your warlock level + your Charisma modifier.',
        },
        {
          level: 14,
          name: 'Searing Vengeance',
          description:
            'The radiant energy you channel allows you to resist death. When you have to make a death saving throw at the start of your turn, you can instead spring back to your feet with a burst of radiant energy. You regain hit points equal to half your hit point maximum, and then you stand up if you so choose. Each creature of your choice that is within 30 feet of you takes radiant damage equal to 2d8 + your Charisma modifier, and it is blinded until the end of the current turn. Once you use this feature, you can\'t use it again until you finish a long rest.',
        },
      ],
    },
    'The Hexblade': {
      flavorText:
        'You have made your pact with a mysterious entity from the Shadowfell — a force that manifests in sentient magic weapons carved from the stuff of shadow. The mighty sword Blackrazor is the most notable of these weapons, which have slain many heroes and been wielded by champions of darkness. The shadowy force behind these weapons can offer power to warlocks who form pacts with it.',
      features: [
        {
          level: 1,
          name: 'Hexblade\'s Curse',
          description:
            'You gain the ability to place a baleful curse on someone. As a bonus action, choose one creature you can see within 30 feet of you. The target is cursed for 1 minute. The curse ends early if the target dies, you die, or you are incapacitated. Until the curse ends, you gain the following benefits: You gain a bonus to damage rolls against the cursed target. The bonus equals your proficiency bonus. Any attack roll you make against the cursed target is a critical hit on a roll of 19 or 20 on the d20. If the cursed target dies, you regain hit points equal to your warlock level + your Charisma modifier (minimum of 1 hit point). You can\'t use this feature again until you finish a short or long rest.',
        },
        {
          level: 1,
          name: 'Hex Warrior',
          description:
            'You acquire the training necessary to effectively arm yourself for battle. You gain proficiency with medium armor, shields, and martial weapons. The influence of your patron also allows you to mystically channel your will through a particular weapon. Whenever you finish a long rest, you can touch one weapon that you are proficient with and that lacks the two-handed property. When you attack with that weapon, you can use your Charisma modifier, instead of Strength or Dexterity, for the attack and damage rolls. This benefit lasts until you finish a long rest.',
        },
        {
          level: 6,
          name: 'Accursed Specter',
          description:
            'You can curse the soul of a person you slay, temporarily binding it to your service. When you slay a humanoid, you can cause its spirit to rise from its corpse as a specter. When the specter appears, it gains temporary hit points equal to half your warlock level. Roll initiative for the specter, which has its own turns. It obeys your verbal commands, and it gains a special bonus to its attack rolls equal to your Charisma modifier (minimum of +0). The specter remains in your service until the end of your next long rest, at which point it vanishes to the afterlife. Once you bind a specter with this feature, you can\'t use the feature again until you finish a long rest.',
        },
        {
          level: 10,
          name: 'Armor of Hexes',
          description:
            'Your hex grows more powerful. If the target cursed by your Hexblade\'s Curse hits you with an attack roll, you can use your reaction to roll a d6. On a 4 or higher, the attack instead misses you, regardless of its roll.',
        },
        {
          level: 14,
          name: 'Master of Hexes',
          description:
            'You can spread your Hexblade\'s Curse from a slain creature to another creature. When the creature cursed by your Hexblade\'s Curse dies, you can apply the curse to a different creature you can see within 30 feet of you, provided you aren\'t incapacitated. When you apply the curse in this way, you don\'t regain hit points from the death of the previously cursed creature.',
        },
      ],
    },
    'The Fathomless': {
      flavorText:
        'You have plunged into a pact with the deeps. An entity of the ocean, the Elemental Plane of Water, or another otherworldly sea now allows you to draw on its thalassic power. Is it merely using you to get a foothold on land, or does it want you to open a portal and let it surge across the world?',
      features: [
        {
          level: 1,
          name: 'Tentacle of the Deeps',
          description:
            'You can magically summon a spectral tentacle that strikes at your foes. As a bonus action, you create a 10-foot-long tentacle at a point you can see within 60 feet of you. The tentacle lasts for 1 minute or until you use this feature to create another tentacle. When you create the tentacle, you can make a melee spell attack against one creature within 10 feet of it. On a hit, the target takes 1d8 cold damage, and its speed is reduced by 10 feet until the start of your next turn. As a bonus action on your turn, you can move the tentacle up to 30 feet and repeat the attack. You can summon the tentacle a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.',
        },
        {
          level: 1,
          name: 'Gift of the Sea',
          description:
            'You gain a swimming speed of 40 feet, and you can breathe underwater.',
        },
        {
          level: 6,
          name: 'Oceanic Soul',
          description:
            'You are now even more at home in the depths. You gain resistance to cold damage. In addition, when you are fully submerged, any creature that is also fully submerged can understand your speech, and you can understand theirs.',
        },
        {
          level: 6,
          name: 'Guardian Coil',
          description:
            'Your Tentacle of the Deeps can defend you and others. When you or a creature you can see takes damage while within 10 feet of the tentacle, you can use your reaction to choose one of those creatures and reduce the damage to that creature by 1d8.',
        },
        {
          level: 10,
          name: 'Grasping Tentacles',
          description:
            'You learn the spell Evard\'s black tentacles. It counts as a warlock spell for you, but it doesn\'t count against the number of spells you know. You can also cast it once without a spell slot, and you regain the ability to do so when you finish a long rest. Whenever you cast this spell, your patron\'s magic reinforces your defenses; you gain a number of temporary hit points equal to your warlock level.',
        },
        {
          level: 14,
          name: 'Fathomless Plunge',
          description:
            'You can magically open temporary conduits to watery destinations. As an action, you can teleport yourself and up to five other willing creatures that you can see within 30 feet of you. Appearing in an unoccupied space that you choose within 30 feet of a body of water you can see, hear, or that you know the location of must be on the same plane of existence. The destination must be within 1 mile of the nearest body of water. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
      ],
    },
    'The Genie': {
      flavorText:
        'You have made a pact with one of the rarest kinds of genie, those who have been touched by the power of the Elemental Planes. The genie\'s power comes from their connection to one of the four elemental planes: Dao of the earth, Djinni of the air, Efreeti of fire, and Marid of water. Working in the service of a genie gives you access to elemental magic, a safe haven, and the opportunity to advance your patron\'s schemes in the mortal world.',
      features: [
        {
          level: 1,
          name: 'Genie\'s Vessel',
          description:
            'Your patron gives you a magical vessel that grants you a measure of the genie\'s power. The vessel is a Tiny object, and you can use it as a spellcasting focus for your warlock spells. You decide what the object is: a lamp, an urn, a ring, a bottle, a lantern, or some other object. You can use the vessel in the following ways: Bottled Respite — As an action, you can magically vanish and enter your vessel, which remains in the space you left. The interior is an extradimensional space in the shape of a cylinder 20 feet wide and 20 feet tall. You can remain inside for up to a number of hours equal to twice your proficiency bonus. You exit the vessel early if you use a bonus action to leave, if you die, or if the vessel is destroyed. You can eject a creature from the vessel at any time as a bonus action. Genie\'s Wrath — Once during each of your turns when you hit with an attack roll, you can deal extra damage to the target equal to your proficiency bonus. The type of this damage is determined by your patron: bludgeoning (dao), thunder (djinni), fire (efreeti), or cold (marid).',
        },
        {
          level: 6,
          name: 'Elemental Gift',
          description:
            'You begin to take on characteristics of your patron\'s kind. You now have resistance to a damage type determined by your patron\'s kind: bludgeoning (dao), thunder (djinni), fire (efreeti), or cold (marid). In addition, as a bonus action, you can give yourself a flying speed of 30 feet that lasts for 10 minutes, during which you can hover. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.',
        },
        {
          level: 10,
          name: 'Sanctuary Vessel',
          description:
            'When you enter your Genie\'s Vessel via the Bottled Respite feature, you can now choose up to five willing creatures that you can see within 30 feet of you, and the chosen creatures are drawn into the vessel with you. As a bonus action, you can eject any number of creatures from the vessel, and everyone is ejected if you leave or are expelled from the vessel. In addition, anyone (including you) who stays within the vessel for at least 10 minutes gains the benefit of finishing a short rest, and anyone can add your proficiency bonus to the number of hit points they regain if they spend any Hit Dice as part of a short rest there.',
        },
        {
          level: 14,
          name: 'Limited Wish',
          description:
            'You entreat your patron to grant you a small wish. As an action, you can speak your desire to your Genie\'s Vessel, requesting the effect of one spell that is 6th level or lower and has a casting time of 1 action. The spell can be from any class\'s spell list, and you don\'t need to meet the requirements in that spell, including costly components; the spell simply takes effect as part of this action. Once you use this feature, you can\'t use it again until 1d4 long rests are over.',
        },
      ],
    },
    'The Undead': {
      flavorText:
        'You\'ve made a pact with a deathless entity — a creature that defies the natural cycle of life and death, having transformed after achieving a power and perspective beyond most mortal ambitions. For such entities, their reject of death is rejection of limitation. You might have forged your pact with one of the great undead, such as a lich, vampire lord, or a death knight of legendary power.',
      features: [
        {
          level: 1,
          name: 'Form of Dread',
          description:
            'As a bonus action, you transform for 1 minute. You gain the following benefits while transformed: You gain temporary hit points equal to 1d10 + your warlock level. Once during each of your turns, when you hit a creature with an attack roll, you can force it to make a Wisdom saving throw, and on a failure, the target is frightened of you until the end of your next turn. You are immune to the frightened condition. You can transform a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.',
        },
        {
          level: 6,
          name: 'Grave Touched',
          description:
            'Your patron\'s powers have a profound effect on your body and magic. You don\'t need to eat, drink, or breathe. In addition, once during each of your turns, when you hit a creature with an attack roll and roll damage against the creature, you can replace the damage type with necrotic damage. While you are in Form of Dread, you can roll one additional damage die when determining the necrotic damage the target takes.',
        },
        {
          level: 10,
          name: 'Necrotic Husk',
          description:
            'Your connection to undeath and necrotic energy now saturates your body. You have resistance to necrotic damage. If you are transformed using your Form of Dread, you instead become immune to necrotic damage. In addition, when you would be reduced to 0 hit points, you can use your reaction to drop to 1 hit point instead and cause your body to erupt with deathly energy. Each creature of your choice that is within 30 feet of you takes necrotic damage equal to 2d10 + your warlock level. You then gain 1 level of exhaustion. Once you use this reaction, you can\'t use it again until you finish 1d4 long rests.',
        },
        {
          level: 14,
          name: 'Spirit Projection',
          description:
            'Your body is now merely a vessel for your undying spirit. As an action, you can project your spirit from your body. The body you leave behind is unconscious and in a state of suspended animation. Your spirit resembles your mortal form in most ways, carrying all your statistics and possessions. While projecting your spirit, you gain the following benefits: Your spirit and body gain resistance to bludgeoning, piercing, and slashing damage. When you cast a spell of the conjuration or necromancy school, the spell doesn\'t require material components. You can move through other creatures and objects as if they were difficult terrain. If you end your turn inside an object, you take 1d10 force damage. While your spirit is separated from your body, the two can be up to 1 mile apart without consequence. If the distance between them exceeds 1 mile, your spirit automatically returns to your body. Your spirit can return to your body as a bonus action on your turn, or automatically if you die. Once you use this feature, you can\'t use it again until you finish a long rest.',
        },
      ],
    },
    'The Undying': {
      flavorText:
        'Death holds no sway over your patron, who has unlocked the secrets of everlasting life, although such a prize — like all power — comes at a price. Once mortal, the Undying has seen mortal lifetimes pass like the seasons, like the flicker of endless days and nights. It has the secrets of the ages to share, secrets of life and death.',
      features: [
        {
          level: 1,
          name: 'Among the Dead',
          description:
            'You learn the spare the dying cantrip, which counts as a warlock cantrip for you. You also have advantage on saving throws against any disease, and magic can\'t put you to sleep.',
        },
        {
          level: 6,
          name: 'Defy Death',
          description:
            'You can give yourself vitality when you cheat death or when you help someone else cheat it. You can regain hit points equal to 1d8 + your Constitution modifier (minimum of 1 hit point) when you succeed on a death saving throw or when you stabilize a creature with spare the dying. Once you use this feature, you can\'t use it again until you finish a long rest.',
        },
        {
          level: 10,
          name: 'Undying Nature',
          description:
            'You can hold your breath indefinitely, and you don\'t require food, water, or sleep, although you still require rest to reduce exhaustion and still benefit from finishing short and long rests. In addition, you age at a slower rate. For every 10 years that pass, your body ages only 1 year, and you are immune to being magically aged.',
        },
        {
          level: 14,
          name: 'Indestructible Life',
          description:
            'When you are reduced to 0 hit points, you can use a bonus action to regain hit points equal to 1d8 + your warlock level. If you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
      ],
    },
  },
  '5.5e': {
    'The Archfey': {
      flavorText:
        'Your patron is a lord or lady of the Feywild. Such beings include the Prince of Frost, the Queen of Air and Darkness, Titania of the Summer Court, Oberon the Green Lord, and countless lesser powers who hold court in the Feywild. These entities are rulers of immense power who preside over domains of beauty, deception, and wild magic — their whims and schemes are impossible to predict.',
      features: [
        {
          level: 3,
          name: 'Steps of the Fey',
          description:
            'Your patron bestows on you the ability to move between the Material Plane and the Feywild. You can cast Misty Step without expending a spell slot a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a long rest. In addition, whenever you cast Misty Step, you can choose one of the following additional effects: Beguiling Step — Immediately after you teleport, up to one creature of your choice that you can see within 5 feet of the space you left must succeed on a Wisdom saving throw or be charmed by you for 1 minute. Taunting Step — Immediately after you teleport, up to one creature of your choice that you can see within 5 feet of the space you left has disadvantage on attack rolls against targets other than you until the start of your next turn.',
        },
        {
          level: 6,
          name: 'Misty Escape',
          description:
            'You can cast Misty Step as a Reaction in response to taking damage. You can use this Reaction a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a long rest.',
        },
        {
          level: 10,
          name: 'Beguiling Defenses',
          description:
            'Through your patron\'s magic, you have become adept at evading and turning enchantment magic. You are immune to the charmed condition. In addition, when another creature attempts to charm you, you can use your Reaction to try to turn the charm back on that creature. The creature must succeed on a Wisdom saving throw against your spell save DC or be charmed by you for 1 minute or until the creature takes any damage.',
        },
        {
          level: 14,
          name: 'Bewitching Magic',
          description:
            'Your patron grants you the ability to weave fey magic into your spells. Immediately after you cast an Enchantment or Illusion spell using a Warlock spell slot, you can cast Misty Step as part of the same action and without expending a spell slot or requiring Concentration.',
        },
      ],
    },
    'The Celestial': {
      flavorText:
        'Your pact draws you toward beings of the Upper Planes — ancient empyreans, solars, ki-rins, unicorns, and similar entities devoted to the ideals of light and goodness. Working with such a patron means you are an agent of their divine light in the world, channeling holy power to heal the sick and smite the wicked.',
      features: [
        {
          level: 3,
          name: 'Healing Light',
          description:
            'You gain the ability to channel celestial energy to heal wounds. You have a pool of d6s that you spend to fuel this healing. The number of dice in the pool equals 1 + your warlock level. As a bonus action, you can heal one creature you can see within 60 feet of you, spending dice from the pool. The maximum number of dice you can spend at once equals your Charisma modifier (minimum of one die). Roll the dice you spend, add them together, and restore a number of hit points equal to the total. Your pool regains all expended dice when you finish a long rest. In addition, you gain the Light and Sacred Flame cantrips if you don\'t already know them.',
        },
        {
          level: 6,
          name: 'Radiant Soul',
          description:
            'Your link to the Celestial allows you to serve as a conduit for radiant energy. You have resistance to radiant damage. In addition, when you cast a spell that deals radiant or fire damage, you add your Charisma modifier to one radiant or fire damage roll of that spell against one of its targets.',
        },
        {
          level: 10,
          name: 'Celestial Resilience',
          description:
            'You gain temporary hit points whenever you finish a short or long rest. These temporary hit points equal your warlock level + your Charisma modifier. Additionally, choose up to five creatures you can see at the end of the rest. Those creatures each gain temporary hit points equal to half your warlock level + your Charisma modifier.',
        },
        {
          level: 14,
          name: 'Searing Vengeance',
          description:
            'The radiant energy you channel allows you to resist death. When you have to make a death saving throw at the start of your turn, you can instead spring back to your feet with a burst of radiant energy. You regain hit points equal to half your hit point maximum, and then you stand up if you so choose. Each creature of your choice that is within 30 feet of you takes radiant damage equal to 2d8 + your Charisma modifier, and it is blinded until the end of the current turn. Once you use this feature, you can\'t use it again until you finish a long rest.',
        },
      ],
    },
    'The Fathomless': {
      flavorText:
        'You have plunged into a pact with the deeps. An entity of the ocean, the Elemental Plane of Water, or another otherworldly sea now allows you to draw on its thalassic power. Is it merely using you to get a foothold on land, or does it want you to open a portal and let it surge across the world?',
      features: [
        {
          level: 3,
          name: 'Tentacle of the Deeps',
          description:
            'You can magically summon a spectral tentacle that strikes at your foes. As a bonus action, you create a 10-foot-long tentacle at a point you can see within 60 feet of you. The tentacle lasts for 1 minute or until you use this feature to create another tentacle. When you create the tentacle, you can make a melee spell attack against one creature within 10 feet of it. On a hit, the target takes 1d8 cold damage, and its speed is reduced by 10 feet until the start of your next turn. As a bonus action on your turn, you can move the tentacle up to 30 feet and repeat the attack. You can summon the tentacle a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.',
        },
        {
          level: 3,
          name: 'Gift of the Sea',
          description:
            'You gain a swimming speed of 40 feet, and you can breathe underwater.',
        },
        {
          level: 6,
          name: 'Oceanic Soul',
          description:
            'You are now even more at home in the depths. You gain resistance to cold damage. In addition, when you are fully submerged, any creature that is also fully submerged can understand your speech, and you can understand theirs.',
        },
        {
          level: 6,
          name: 'Guardian Coil',
          description:
            'Your Tentacle of the Deeps can defend you and others. When you or a creature you can see takes damage while within 10 feet of the tentacle, you can use your reaction to choose one of those creatures and reduce the damage to that creature by 1d8.',
        },
        {
          level: 10,
          name: 'Grasping Tentacles',
          description:
            'You learn the spell Evard\'s Black Tentacles. It counts as a Warlock spell for you, but it doesn\'t count against the number of spells you know. You can also cast it once without a spell slot, and you regain the ability to do so when you finish a long rest. Whenever you cast this spell, your patron\'s magic reinforces your defenses; you gain a number of temporary hit points equal to your warlock level.',
        },
        {
          level: 14,
          name: 'Fathomless Plunge',
          description:
            'You can magically open temporary conduits to watery destinations. As an action, you can teleport yourself and up to five other willing creatures that you can see within 30 feet of you to an unoccupied space you choose within 30 feet of a body of water you can see or that you know the location of, which must be on the same plane of existence. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
      ],
    },
    'The Fiend': {
      flavorText:
        'Your patron is a fiend from the lower planes, a being whose aims are evil even if you strive against those aims. Fiends powerful enough to forge a pact include demon lords, archdevils, pit fiends, balors, and ultra-loths. Working with such a being — or perhaps against them, using their power for your own ends — means walking a razor\'s edge between power and corruption.',
      features: [
        {
          level: 3,
          name: 'Dark One\'s Blessing',
          description:
            'When you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level (minimum of 1).',
        },
        {
          level: 3,
          name: 'Dark One\'s Own Luck',
          description:
            'You can call on your patron to alter fate in your favor. When you make an ability check or a saving throw, you can use this feature to add a d10 to your roll. You can do so after seeing the initial roll but before any of the roll\'s effects occur. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
        {
          level: 6,
          name: 'Fiendish Resilience',
          description:
            'You can choose one damage type when you finish a short or long rest. You gain resistance to that damage type until you choose a different one with this feature. Damage from magical weapons or silver weapons ignores this resistance.',
        },
        {
          level: 10,
          name: 'Hurl Through Hell',
          description:
            'When you hit a creature with an attack, you can use this feature to instantly transport the target through the lower planes. The creature disappears and hurtles through a nightmare landscape. At the end of your next turn, the target returns to the space it previously occupied, or the nearest unoccupied space. If the target is not a fiend, it takes 10d10 psychic damage as it reels from its horrific experience. Once you use this feature, you can\'t use it again until you finish a long rest.',
        },
        {
          level: 14,
          name: 'Otherworldly Leap',
          description:
            'Your patron\'s connection to the multiverse grows, allowing you to push creatures through planar boundaries. Once on each of your turns when you damage a creature, you can force the target to make a Charisma saving throw against your spell save DC. On a failure, the creature vanishes briefly and reappears at the start of your next turn in the same spot (or the nearest unoccupied space). It takes 10d10 psychic damage from the harrowing experience, and it has the frightened condition until the end of your next turn.',
        },
      ],
    },
    'The Great Old One': {
      flavorText:
        'Your patron is a mysterious entity whose nature is utterly foreign to the fabric of reality. It might come from the Far Realm, the space beyond reality, or it could be one of the elder gods known only in legends. Its motives are incomprehensible to mortals, and its knowledge so immense and ancient that even the greatest libraries pale in comparison to the vast secrets it holds.',
      features: [
        {
          level: 3,
          name: 'Awakened Mind',
          description:
            'You can form a telepathic connection between your mind and the mind of another. As a bonus action, choose one creature you can see within 30 feet of you. You and the chosen creature can speak telepathically with each other while the two of you are within a number of miles of each other equal to your Charisma modifier (minimum of 1 mile). To understand each other, you each must speak mentally in a language the other knows. The telepathic connection lasts for a number of minutes equal to your warlock level. It ends early if you are incapacitated or die or if you use this feature to form a connection with a different creature.',
        },
        {
          level: 3,
          name: 'Psychic Spells',
          description:
            'When you cast a Warlock spell that deals damage, you can change its damage type to Psychic. Additionally, when you cast a Warlock spell that forces a creature to make a saving throw, you can change the saving throw to an Intelligence saving throw.',
        },
        {
          level: 6,
          name: 'Clairvoyant Combatant',
          description:
            'You learn to read the attacks of minds you\'ve connected to and use that knowledge against them. When you form your Awakened Mind connection with a creature, you can force that creature to make a Wisdom saving throw against your spell save DC. On a failed save, the creature has disadvantage on attack rolls against you for the duration of the connection.',
        },
        {
          level: 6,
          name: 'Entropic Ward',
          description:
            'When a creature makes an attack roll against you, you can use your reaction to impose disadvantage on that roll. If the attack misses you, your next attack roll against the creature has advantage if you make it before the end of your next turn. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
        {
          level: 10,
          name: 'Thought Shield',
          description:
            'Your thoughts can\'t be read by telepathy or other means, unless you allow it. Also, whenever a creature deals Psychic damage to you, that creature takes the same amount of damage that you take.',
        },
        {
          level: 10,
          name: 'Eldritch Hex',
          description:
            'Your alien patron grants you a powerful curse. You learn the Hex spell. It counts as a Warlock spell for you, but it doesn\'t count against the number of spells you know. You can cast it once without expending a spell slot, and you regain the ability to do so when you finish a long rest.',
        },
        {
          level: 14,
          name: 'Create Thrall',
          description:
            'You gain the ability to infect a humanoid\'s mind with the alien magic of your patron. You can use your action to touch an incapacitated humanoid. That creature is then charmed by you until a Remove Curse spell is cast on it, the Charmed condition is removed from it, or you use this feature again. You can communicate telepathically with the charmed creature as long as the two of you are on the same plane of existence.',
        },
      ],
    },
    'The Undead': {
      flavorText:
        'You\'ve made a pact with a deathless entity — a creature that defies the natural cycle of life and death, having transformed after achieving a power and perspective beyond most mortal ambitions. For such entities, their rejection of death is a rejection of limitation. You might have forged your pact with one of the great undead, such as a lich, vampire lord, or a death knight of legendary power.',
      features: [
        {
          level: 3,
          name: 'Form of Dread',
          description:
            'As a bonus action, you transform for 1 minute. You gain the following benefits while transformed: You gain temporary hit points equal to 1d10 + your warlock level. Once during each of your turns, when you hit a creature with an attack roll, you can force it to make a Wisdom saving throw, and on a failure, the target is frightened of you until the end of your next turn. You are immune to the frightened condition. You can transform a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.',
        },
        {
          level: 6,
          name: 'Grave Touched',
          description:
            'Your patron\'s powers have a profound effect on your body and magic. You don\'t need to eat, drink, or breathe. In addition, once during each of your turns, when you hit a creature with an attack roll and roll damage against the creature, you can replace the damage type with necrotic damage. While you are in Form of Dread, you can roll one additional damage die when determining the necrotic damage the target takes.',
        },
        {
          level: 10,
          name: 'Necrotic Husk',
          description:
            'Your connection to undeath and necrotic energy now saturates your body. You have resistance to necrotic damage. If you are transformed using your Form of Dread, you instead become immune to necrotic damage. In addition, when you would be reduced to 0 hit points, you can use your reaction to drop to 1 hit point instead and cause your body to erupt with deathly energy. Each creature of your choice that is within 30 feet of you takes necrotic damage equal to 2d10 + your warlock level. You then gain 1 level of exhaustion. Once you use this reaction, you can\'t use it again until you finish 1d4 long rests.',
        },
        {
          level: 14,
          name: 'Spirit Projection',
          description:
            'Your body is now merely a vessel for your undying spirit. As an action, you can project your spirit from your body. The body you leave behind is unconscious and in a state of suspended animation. Your spirit resembles your mortal form in most ways, carrying all your statistics and possessions. While projecting your spirit, you gain the following benefits: Your spirit and body gain resistance to bludgeoning, piercing, and slashing damage. When you cast a spell of the conjuration or necromancy school, the spell doesn\'t require material components. You can move through other creatures and objects as if they were difficult terrain. Your spirit can return to your body as a bonus action on your turn, or automatically if you die. Once you use this feature, you can\'t use it again until you finish a long rest.',
        },
      ],
    },
  },
};
