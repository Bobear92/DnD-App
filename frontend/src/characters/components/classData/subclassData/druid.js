export const DRUID = {
  '5e': {
    'Circle of the Land': {
      flavorText: 'The Circle of the Land is made up of mystics and sages who safeguard ancient knowledge and rites through a vast oral tradition. These druids meet within sacred circles of trees or standing stones to whisper primal secrets in Druidic. The circle\'s wisest members preside as the chief priests of their communities.',
      features: [
        { level: 2, name: 'Bonus Cantrip', description: 'You learn one additional druid cantrip of your choice.' },
        { level: 2, name: 'Natural Recovery', description: 'Once per short rest, you can recover expended spell slots with a combined level equal to or less than half your druid level (rounded up). None of the slots can be 6th level or higher.' },
        { level: 2, name: 'Circle Spells', description: 'Your mystical connection to the land infuses you with the ability to cast certain spells. You always have a set of spells prepared based on your terrain (arctic, coast, desert, forest, grassland, mountain, swamp, or underdark).' },
        { level: 6, name: 'Land\'s Stride', description: 'Moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed or taking damage. Magical plants still affect you.' },
        { level: 10, name: 'Nature\'s Ward', description: 'You can\'t be charmed or frightened by elementals or fey, and you are immune to poison and disease.' },
        { level: 14, name: 'Nature\'s Sanctuary', description: 'Creatures of the natural world sense your connection to nature. When a beast or plant creature attacks you, it must make a Wisdom saving throw (DC 8 + PB + WIS) or choose a different target. On a failed save, it can\'t attack you until its next turn.' },
      ],
    },
    'Circle of the Moon': {
      flavorText: 'Druids of the Circle of the Moon are fierce guardians of the wilds. Their order gathers under the full moon to share news and trade warnings. They never fear to wield the power of the moon, and their wild shapes reflect that fierce power.',
      features: [
        { level: 2, name: 'Combat Wild Shape', description: 'You can use Wild Shape as a bonus action, rather than an action. Additionally, while in Wild Shape, you can use a bonus action to expend one spell slot (converted to 1d8 temp HP per level of the slot).' },
        { level: 2, name: 'Circle Forms', description: 'You can use your Wild Shape to transform into beasts with a challenge rating as high as 1 (instead of 1/4). Starting at 6th level, you can transform into beasts with CR as high as your druid level ÷ 3, rounded down.' },
        { level: 6, name: 'Primal Strike', description: 'Your attacks in beast form count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.' },
        { level: 10, name: 'Elemental Wild Shape', description: 'You can expend two uses of Wild Shape at the same time to transform into an air, earth, fire, or water elemental.' },
        { level: 14, name: 'Thousand Forms', description: 'You have learned to use magic to alter your physical form in more subtle ways. You can cast alter self at will, without expending a spell slot.' },
      ],
    },
    'Circle of Dreams': {
      flavorText: 'Druids who are members of the Circle of Dreams hail from regions that have strong ties to the Feywild and its dreamlike realms. The druids\' guardianship of the natural world makes for a natural alliance with good-aligned fey. These druids seek to fill the world with dreamy wonder.',
      features: [
        { level: 2, name: 'Balm of the Summer Court', description: 'You become imbued with the blessings of the Summer Court. You have a pool of fey energy (d6 dice equal to your druid level). As a bonus action, choose a creature within 120 ft and spend up to half your druid level in dice; the target regains HP and gains temp HP equal to the die roll.' },
        { level: 6, name: 'Hearth of Moonlight and Shadow', description: 'Home can be wherever you are. When you finish a short or long rest, you can invoke this feature to ward the area with faint magic. While warded, light conditions are always friendly for your group, outsiders can\'t perceive or enter the area without your permission.' },
        { level: 10, name: 'Hidden Paths', description: 'You can use the hidden paths of the Feywild. As a bonus action (or as a reaction when you take damage), teleport up to 60 ft to an unoccupied space you can see. Usable WIS modifier times per long rest.' },
        { level: 14, name: 'Walker in Dreams', description: 'You can cast dream (targeting a sleeping creature), scrying, or teleportation circle (going to a familiar location) without expending a spell slot or material components. After using this feature, you must finish a long rest before using it again.' },
      ],
    },
    'Circle of the Shepherd': {
      flavorText: 'Druids of the Circle of the Shepherd commune with the spirits of nature, especially the spirits of beasts and the fey, and call upon those spirits to ward their allies. These druids recognize that all living things play a role in the natural world, yet animals lack the ability to defend themselves from two-legged predators.',
      features: [
        { level: 2, name: 'Speech of the Woods', description: 'You gain the ability to converse with beasts and many fey. You learn to speak, read, and write Sylvan. Additionally, beasts can understand your speech, and you gain the ability to decipher their noises and motions.' },
        { level: 2, name: 'Spirit Totem', description: 'As a bonus action, summon a nature spirit (Bear, Hawk, or Unicorn totem) that fills a 30 ft area for 1 minute. Bear: temp HP = half max HP for creatures in the area; advantage on STR checks/saves. Hawk: reaction attacks against creatures in the area; Perception advantage. Unicorn: healing spells also restore HP to creatures in the area.' },
        { level: 6, name: 'Mighty Summoner', description: 'Beasts and fey you summon or create with a spell have 2 extra HP per Hit Die and their natural weapons count as magical.' },
        { level: 10, name: 'Guardian Spirit', description: 'Your Spirit Totem now guards the beasts you summon. Any beast or fey summoned while in the totem\'s area gains a number of temp HP equal to half your druid level whenever it starts its turn there.' },
        { level: 14, name: 'Faithful Summons', description: 'If you are reduced to 0 HP or are incapacitated against your will, four beasts of CR 2 or lower appear in unoccupied spaces within 20 ft of you. They last for 1 hour or until dismissed, and act on your behalf.' },
      ],
    },
    'Circle of Spores': {
      flavorText: 'The Circle of Spores finds beauty in decay. Its members hold that life and death are parts of a grand cycle, with the power of the spore being a vehicle for destruction and new life alike. These druids believe that the energy residing in a dead creature can be transformed by the power of the Underdark\'s fungal fauna.',
      features: [
        { level: 2, name: 'Halo of Spores', description: 'You are surrounded by invisible motes of fungal spores. As a reaction when a creature within 10 ft of you moves or takes an action, you can deal 1d4 necrotic damage (no save). The damage increases as you level.' },
        { level: 2, name: 'Symbiotic Entity', description: 'As an action, expend a Wild Shape use to awaken the spores. For 10 minutes, you gain 4 temp HP per druid level, your Halo of Spores reaction damage doubles, and your melee weapon attacks deal an extra 1d6 poison damage.' },
        { level: 6, name: 'Fungal Infestation', description: 'Your spores gain the power to animate corpses. When a beast or humanoid dies within 10 ft of you, you can use your reaction to animate it as a zombie that obeys your verbal commands.' },
        { level: 10, name: 'Spreading Spores', description: 'You gain the ability to seed the toxic spores across a wide area. While Symbiotic Entity is active, you can use your Halo of Spores as a bonus action instead of a reaction, and it affects all creatures in a 10 ft cube within 30 ft.' },
        { level: 14, name: 'Fungal Body', description: 'The fungal spores in your body fortify you: immunity to being blinded, deafened, frightened, and poisoned; critical hits against you are treated as normal hits.' },
      ],
    },
    'Circle of Stars': {
      flavorText: 'The Circle of Stars allows druids to draw on the power of starlight. These druids have tracked heavenly patterns since time immemorial, discovering secrets hidden amid the constellations. Now they seek to use that knowledge to deepen their connection to the cosmos.',
      features: [
        { level: 2, name: 'Star Map', description: 'You\'ve created a star chart as part of your heavenly studies. It is a tiny object and functions as a spellcasting focus for druid spells. With it, you know the guidance cantrip and can cast guiding bolt once per short or long rest without spending a slot.' },
        { level: 2, name: 'Starry Form', description: 'As a bonus action, assume a starry form for 10 minutes. Choose one: Archer (ranged spell attack for 1d8 + WIS radiant each turn as bonus action), Chalice (healing spells also restore 1d8 + WIS to you when you cast them), or Dragon (concentration checks automatically succeed on a roll of 9 or lower).' },
        { level: 6, name: 'Cosmic Omen', description: 'Whenever you finish a long rest, you roll a die. On an odd result (Woe), you can use your reaction when a creature in range makes an attack roll, ability check, or saving throw to impose a −1d6. On an even result (Weal), you can grant a +1d6. You can use this reaction PB times per long rest.' },
        { level: 10, name: 'Twinkling Constellations', description: 'The constellations of your Starry Form improve. Archer: 2d8 + WIS. Chalice: 2d8 + WIS. Dragon: sprout spectral wings for 10 ft fly speed on each turn. Switch constellation form as a bonus action.' },
        { level: 14, name: 'Full of Stars', description: 'While in Starry Form, you become partially incorporeal, giving you resistance to bludgeoning, piercing, and slashing damage.' },
      ],
    },
    'Circle of Wildfire': {
      flavorText: 'Druids within the Circle of Wildfire understand that destruction is sometimes the precursor of creation, such as when a forest fire promotes later growth. These druids bond with a wildfire spirit, a conflagration of life and growth, to embody that philosophy.',
      features: [
        { level: 2, name: 'Summon Wildfire Spirit', description: 'Expend a use of Wild Shape to summon a wildfire spirit into an unoccupied space within 30 ft. It has HP equal to 5 × your druid level and acts on your initiative. It can move and make fire attacks, and can teleport itself and willing creatures within 5 ft to open spaces within 15 ft as a bonus action.' },
        { level: 6, name: 'Enhanced Bond', description: 'The bond with your wildfire spirit enhances your destructive and restorative spells. When you cast a spell that deals fire damage or restores HP while your spirit is summoned, roll a d8 and add the result to one fire damage or healing roll.' },
        { level: 10, name: 'Cauterizing Flames', description: 'When a creature dies within 30 ft of you or your wildfire spirit, a healing flame of spectral fire appears where that creature died. As a bonus action, you or a friendly creature within 5 ft of the flame can use it to regain 2d10 + WIS HP. Appears a number of times equal to WIS modifier per long rest.' },
        { level: 14, name: 'Blazing Revival', description: 'The bond with your wildfire spirit can save you from death. If the spirit is within 120 ft when you drop to 0 HP and fall unconscious, it can use its reaction to sacrifice itself and cause you to regain half your maximum HP while rising to your feet.' },
      ],
    },
  },

  '5.5e': {
    'Circle of the Land': {
      flavorText: 'The Circle of the Land is made up of mystics and sages who safeguard ancient knowledge and rites. The 2024 revision tightens the circle\'s identity, emphasizing Natural Recovery and terrain-specific magic while adding new options for diverse environments.',
      features: [
        { level: 3, name: 'Circle of the Land Spells', description: 'You gain additional prepared spells based on your chosen terrain (e.g., Arctic, Coast, Desert, Forest, Grassland, Mountain, Swamp, or Underdark). These are always prepared and don\'t count against your prepared spells limit.' },
        { level: 3, name: 'Natural Recovery', description: 'When you finish a short rest, you can recover expended spell slots of a combined level equal to or less than half your Druid level (rounded up). None can be 6th level or higher. Usable once per long rest.' },
        { level: 6, name: 'Land\'s Aid', description: 'As a Magic action, touch the ground and send vitality through the network of roots and vines. Creatures of your choice in a 10 ft radius regain 1d6 + WIS modifier HP; hostile plants become difficult terrain. Usable PB times per long rest.' },
        { level: 10, name: 'Nature\'s Ward', description: 'You can\'t be charmed or frightened by Elementals or Fey, and you\'re immune to poison and disease.' },
        { level: 14, name: 'Nature\'s Sanctuary', description: 'When a Beast or Plant creature attacks you, it must make a WIS saving throw (DC 8 + PB + WIS) or choose a different target. On a failed save, it can\'t attack you for 24 hours or until it attacks you.' },
      ],
    },
    'Circle of the Moon': {
      flavorText: 'Druids of the Circle of the Moon are fierce guardians of the wilds. The 2024 rules enhance Wild Shape significantly — these druids can now transform into stronger beasts earlier and cast spells in beast form at higher levels, leaning into the beast-warrior fantasy more fully than before.',
      features: [
        { level: 3, name: 'Circle Forms', description: 'Wild Shape now allows you to take the form of beasts with CR up to 1. Starting at 6th level, the CR cap becomes your Druid level ÷ 3, rounded down (max CR 6). You can also Wild Shape as a Bonus Action.' },
        { level: 3, name: 'Combat Wild Shape', description: 'While in Wild Shape, you can expend spell slots to regain 1d8 HP per spell slot level as a Bonus Action.' },
        { level: 6, name: 'Elemental Wild Shape', description: 'You can expend two Wild Shape uses simultaneously to transform into an Air, Earth, Fire, or Water Elemental.' },
        { level: 10, name: 'Thousand Forms', description: 'You can cast alter self at will without expending a spell slot.' },
        { level: 14, name: 'Beast Spells', description: 'You can cast Druid spells while in Wild Shape form, as long as the spell has no material components.' },
      ],
    },
    'Circle of the Sea': {
      flavorText: 'Druids of the Circle of the Sea draw power from the vast ocean and the creatures that call it home. This circle is new to the 2024 rules, offering a water-themed option that combines wrath, cold, and tidal power with the druid\'s core identity as a nature guardian.',
      features: [
        { level: 3, name: 'Wrath of the Sea', description: 'As a Bonus Action, summon a sea aura in a 5 ft radius around you for 1 minute. When a creature starts its turn in the aura, it must make a Strength saving throw (DC 8 + PB + WIS) or take 1d6 Cold damage and be pushed 10 ft away. Usable PB times per long rest.' },
        { level: 6, name: 'Aquatic Affinity', description: 'Gain a swim speed equal to your walking speed. Additionally, you and any creature of your choice within your Wrath of the Sea aura can breathe underwater.' },
        { level: 10, name: 'Stormborn', description: 'Your Wrath of the Sea aura now also deals 1d6 Lightning damage to targets that fail the saving throw. You gain resistance to Cold and Lightning damage.' },
        { level: 14, name: 'Oceanic Gift', description: 'Allies within your Wrath of the Sea aura also gain the benefits of your Aquatic Affinity and resistance to Cold and Lightning damage.' },
      ],
    },
    'Circle of the Stars': {
      flavorText: 'The Circle of Stars draws on the power of starlight and the ancient knowledge hidden in constellations. The 2024 revision preserves the core Starry Form fantasy while polishing the cosmic omen system and scaling improvements.',
      features: [
        { level: 3, name: 'Star Map', description: 'You\'ve created a star chart that acts as a spellcasting focus. You always have guiding bolt prepared; you can cast it without expending a spell slot a number of times equal to your Wisdom modifier per long rest.' },
        { level: 3, name: 'Starry Form', description: 'As a Bonus Action, assume a Starry Form for 10 minutes. Choose Archer (1d8 + WIS radiant bonus action attack), Chalice (healing spells also restore 1d8 + WIS to you), or Dragon (concentration checks auto-succeed on a 9 or lower).' },
        { level: 6, name: 'Cosmic Omen', description: 'After a long rest, roll a die. On Woe (odd), use a reaction to impose −1d6 on an attack/check/save within range. On Weal (even), grant +1d6. Usable PB times per long rest.' },
        { level: 10, name: 'Twinkling Constellations', description: 'Starry Form constellations improve — Archer and Chalice deal/restore 2d8 + WIS. Dragon grows wings, granting 20 ft fly speed each turn. Switch constellation form as a Bonus Action.' },
        { level: 14, name: 'Full of Stars', description: 'While in Starry Form, you become partially incorporeal, giving you resistance to Bludgeoning, Piercing, and Slashing damage.' },
      ],
    },
    'Circle of Wildfire': {
      flavorText: 'Druids within the Circle of Wildfire understand that destruction can be the precursor of creation. The 2024 revision retains the wildfire spirit bond while refining the fire and healing synergies to be more consistently useful throughout play.',
      features: [
        { level: 3, name: 'Summon Wildfire Spirit', description: 'Expend a Wild Shape use to summon a wildfire spirit (HP = 5 × druid level). It can attack, teleport allies, and create bursts of flame. You share its initiative.' },
        { level: 6, name: 'Enhanced Bond', description: 'When you cast a spell dealing fire damage or restoring HP while your wildfire spirit is present, roll 1d8 and add the result to one fire damage or healing roll of the spell.' },
        { level: 10, name: 'Cauterizing Flames', description: 'When a creature dies within 30 ft of you or your spirit, a healing flame appears. As a bonus action, you or an ally can touch the flame to regain 2d10 + WIS HP. Appears WIS modifier times per long rest.' },
        { level: 14, name: 'Blazing Revival', description: 'If your wildfire spirit is within 120 ft when you drop to 0 HP, it can sacrifice itself to restore you to half your maximum HP while you rise to your feet.' },
      ],
    },
    'Circle of Spores': {
      flavorText: 'The Circle of Spores finds beauty in decay. Its members hold that life and death cycle through the power of the spore. The 2024 revision keeps the symbiotic entity fantasy intact while adjusting Halo of Spores and the fungal zombie animation features.',
      features: [
        { level: 3, name: 'Halo of Spores', description: 'As a Reaction when a creature moves within 10 ft of you, you can deal 1d4 Necrotic damage (no save). The damage increases at higher levels.' },
        { level: 3, name: 'Symbiotic Entity', description: 'As an action, expend a Wild Shape use: gain 4 temp HP per Druid level, Halo of Spores doubles, and melee attacks deal an extra 1d6 Poison damage. Lasts 10 minutes.' },
        { level: 6, name: 'Fungal Infestation', description: 'When a Beast or Humanoid dies within 10 ft, you can use your Reaction to animate it as a Zombie that obeys your verbal commands.' },
        { level: 10, name: 'Spreading Spores', description: 'While Symbiotic Entity is active, you can use Halo of Spores as a Bonus Action targeting all creatures in a 10 ft cube within 30 ft.' },
        { level: 14, name: 'Fungal Body', description: 'Immunity to Blinded, Deafened, Frightened, and Poisoned conditions. Critical hits against you are treated as normal hits.' },
      ],
    },
    'Circle of Dreams': {
      flavorText: 'Druids of the Circle of Dreams hail from regions with strong ties to the Feywild. The 2024 revision refines the Balm of the Summer Court healing mechanic and sharpens Hidden Paths for more reliable use during combat.',
      features: [
        { level: 3, name: 'Balm of the Summer Court', description: 'You have a pool of d6 dice equal to your Druid level. As a Bonus Action, choose a creature within 120 ft and spend up to half your Druid level in dice; the target regains that much HP and gains temp HP equal to the roll.' },
        { level: 6, name: 'Hearth of Moonlight and Shadow', description: 'After a short or long rest in an area you designate, the area becomes magically warded — concealed from outside view, with dim but comfortable light for those within.' },
        { level: 10, name: 'Hidden Paths', description: 'As a Bonus Action or Reaction (when you take damage), teleport up to 60 ft to an unoccupied space you can see. Usable WIS modifier times per long rest.' },
        { level: 14, name: 'Walker in Dreams', description: 'Cast dream, scrying, or teleportation circle (familiar location only) once per long rest without a spell slot or material components.' },
      ],
    },
    'Circle of Shepherd': {
      flavorText: 'Druids of the Circle of the Shepherd commune with beast and fey spirits to protect nature and its creatures. The 2024 revision expands Spirit Totem options and refines the powerful Faithful Summons emergency defensive feature.',
      features: [
        { level: 3, name: 'Speech of the Woods', description: 'You learn Sylvan and can speak with Beasts. You gain the ability to understand their vocalizations and body language.' },
        { level: 3, name: 'Spirit Totem', description: 'As a Bonus Action, summon a nature spirit in a 30 ft radius for 1 minute: Bear (temp HP + STR advantage for creatures in area), Hawk (reaction attacks on creatures in area + Perception advantage), or Unicorn (healing spells restore HP to creatures in the area).' },
        { level: 6, name: 'Mighty Summoner', description: 'Beasts and Fey you summon with spells gain 2 extra HP per Hit Die and their natural weapons count as magical.' },
        { level: 10, name: 'Guardian Spirit', description: 'Beasts and Fey summoned or created by you while in the Spirit Totem aura gain temp HP equal to half your Druid level at the start of each of their turns.' },
        { level: 14, name: 'Faithful Summons', description: 'If reduced to 0 HP or incapacitated against your will, four CR 2 or lower Beasts appear in spaces within 20 ft of you, acting on your behalf for 1 hour or until dismissed.' },
      ],
    },
  },
};
