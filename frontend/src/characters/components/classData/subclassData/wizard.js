export const WIZARD = {
  '5e': {
    'School of Abjuration': {
      flavorText:
        'The School of Abjuration emphasizes magic that blocks, banishes, or protects. Detractors of this school say that its tradition is about denial, negation rather than positive assertion. You understand, however, that ending harmful effects, protecting the weak, and banishing evil influences is anything but a philosophical negative. It is a proud and respected vocation.',
      features: [
        {
          level: 2,
          name: 'Abjuration Savant',
          description:
            'Beginning when you select this school at 2nd level, the gold and time you must spend to copy an abjuration spell into your spellbook is halved.',
        },
        {
          level: 2,
          name: 'Arcane Ward',
          description:
            'Starting at 2nd level, you can weave magic around yourself for protection. When you cast an abjuration spell of 1st level or higher, you can simultaneously use a strand of the spell\'s magic to create a magical ward on yourself that lasts until you finish a long rest. The ward has hit points equal to twice your wizard level + your Intelligence modifier. Whenever you take damage, the ward takes the damage instead. If this damage reduces the ward to 0 hit points, you take any remaining damage. While the ward has 0 hit points, it can\'t absorb damage, but its magic remains. Whenever you cast an abjuration spell of 1st level or higher, the ward regains a number of hit points equal to twice the level of the spell. Once you create the ward, you can\'t create it again until you finish a long rest.',
        },
        {
          level: 6,
          name: 'Projected Ward',
          description:
            'Starting at 6th level, when a creature that you can see within 30 feet of you takes damage, you can use your reaction to cause your Arcane Ward to absorb that damage. If this damage reduces the ward to 0 hit points, the warded creature takes any remaining damage.',
        },
        {
          level: 10,
          name: 'Improved Abjuration',
          description:
            'Beginning at 10th level, when you cast an abjuration spell that requires you to make an ability check as a part of casting that spell (as in counterspell and dispel magic), you add your proficiency bonus to that ability check.',
        },
        {
          level: 14,
          name: 'Spell Resistance',
          description:
            'Starting at 14th level, you have advantage on saving throws against spells. Furthermore, you have resistance against the damage of spells.',
        },
      ],
    },
    'School of Conjuration': {
      flavorText:
        'As a conjurer, you favor spells that produce objects and creatures out of thin air. You can conjure billowing clouds of killing fog or summon creatures from elsewhere to fight on your behalf. As your mastery grows, you learn spells of transportation and can teleport yourself across vast distances, even to different planes of existence.',
      features: [
        {
          level: 2,
          name: 'Conjuration Savant',
          description:
            'Beginning when you select this school at 2nd level, the gold and time you must spend to copy a conjuration spell into your spellbook is halved.',
        },
        {
          level: 2,
          name: 'Minor Conjuration',
          description:
            'Starting at 2nd level when you select this school, you can use your action to conjure up an inanimate object in your hand or on the ground in an unoccupied space that you can see within 10 feet of you. This object can be no larger than 3 feet on a side and weigh no more than 10 pounds, and its form must be that of a nonmagical object that you have seen. The object is visibly magical, radiating dim light out to 5 feet. The object disappears after 1 hour, when you use this feature again, or if it takes any damage.',
        },
        {
          level: 6,
          name: 'Benign Transposition',
          description:
            'Starting at 6th level, you can use your action to teleport up to 30 feet to an unoccupied space that you can see. Alternatively, you can choose a space within range that is occupied by a Small or Medium creature. If that creature is willing, you both teleport, swapping places. Once you use this feature, you can\'t use it again until you finish a long rest or you cast a conjuration spell of 1st level or higher.',
        },
        {
          level: 10,
          name: 'Focused Conjuration',
          description:
            'Beginning at 10th level, while you are concentrating on a conjuration spell, your concentration can\'t be broken as a result of taking damage.',
        },
        {
          level: 14,
          name: 'Durable Summons',
          description:
            'Starting at 14th level, any creature that you summon or create with a conjuration spell has 30 temporary hit points.',
        },
      ],
    },
    'School of Divination': {
      flavorText:
        'The counsel of a diviner is sought by royalty and commoners alike, for all seek a clearer understanding of the past, present, and future. As a diviner, you strive to part the veils of space, time, and consciousness so that you can see clearly. You work to master spells of discernment, remote viewing, supernatural knowledge, and foresight.',
      features: [
        {
          level: 2,
          name: 'Divination Savant',
          description:
            'Beginning when you select this school at 2nd level, the gold and time you must spend to copy a divination spell into your spellbook is halved.',
        },
        {
          level: 2,
          name: 'Portent',
          description:
            'Starting at 2nd level when you choose this school, glimpses of the future begin to press in on your awareness. When you finish a long rest, roll two d20s and record the numbers rolled. You can replace any attack roll, saving throw, or ability check made by you or a creature that you can see with one of these foretelling rolls. You must choose to do so before the roll, and you can replace a roll in this way only once per turn. Each foretelling roll can be used only once. When you finish a long rest, you lose any unused foretelling rolls.',
        },
        {
          level: 6,
          name: 'Expert Divination',
          description:
            'Beginning at 6th level, casting divination spells comes so easily to you that it expends only a fraction of your spellcasting efforts. When you cast a divination spell of 2nd level or higher using a spell slot, you regain one expended spell slot. The slot you regain must be of a level lower than the spell you cast and can\'t be higher than 5th level.',
        },
        {
          level: 10,
          name: 'The Third Eye',
          description:
            'Starting at 10th level, you can use your action to increase your powers of perception. When you do so, choose one of the following benefits, which lasts until you are incapacitated or you take a short or long rest. You can\'t use the feature again until you finish a short or long rest. Darkvision (60 feet), Ethereal Sight (see into the Ethereal Plane 60 feet), Greater Comprehension (read any language), or See Invisibility.',
        },
        {
          level: 14,
          name: 'Greater Portent',
          description:
            'Starting at 14th level, the visions in your dreams intensify and paint a more accurate picture in your mind of what is to come. You roll three d20s for your Portent feature, rather than two.',
        },
      ],
    },
    'School of Enchantment': {
      flavorText:
        'As a member of the School of Enchantment, you have honed your ability to magically entrance and beguile other people and monsters. Some enchanters are peacemakers who bewitch the violent to lay down their arms and charm the cruel to be more amenable. Others are tyrants who magically bind the unwilling into their service.',
      features: [
        {
          level: 2,
          name: 'Enchantment Savant',
          description:
            'Beginning when you select this school at 2nd level, the gold and time you must spend to copy an enchantment spell into your spellbook is halved.',
        },
        {
          level: 2,
          name: 'Hypnotic Gaze',
          description:
            'Starting at 2nd level when you choose this school, your soft words and enchanting gaze can magically enthrall another creature. As an action, choose one creature that you can see within 5 feet of you. If the target can see or hear you, it must succeed on a Wisdom saving throw against your wizard spell save DC or be charmed by you until the end of your next turn. The charmed creature\'s speed drops to 0, and the creature is incapacitated and visibly dazed. On subsequent turns, you can use your action to maintain this effect, extending its duration until the end of your next turn. However, the effect ends if you move more than 5 feet away from the creature, if the creature can neither see nor hear you, or if the creature takes damage. Once the effect ends, or if the creature succeeds on its initial saving throw against this effect, you can\'t use this feature on that creature again until you finish a long rest.',
        },
        {
          level: 6,
          name: 'Instinctive Charm',
          description:
            'Beginning at 6th level, when a creature you can see within 30 feet of you makes an attack roll against you, you can use your reaction to divert the attack, provided that another creature is within the attack\'s range. The attacker must make a Wisdom saving throw against your wizard spell save DC. On a failed save, the attacker must target the creature that is closest to it, not counting you or itself. If multiple creatures are closest, the attacker chooses which one to target. On a successful save, you can\'t use this feature on the attacker again until you finish a long rest. You must choose to use this feature before knowing whether the attack hits or misses. Creatures that can\'t be charmed are immune to this effect.',
        },
        {
          level: 10,
          name: 'Split Enchantment',
          description:
            'Starting at 10th level, when you cast an enchantment spell of 1st level or higher that targets only one creature, you can have it target a second creature.',
        },
        {
          level: 14,
          name: 'Alter Memories',
          description:
            'At 14th level, you gain the ability to make a creature unaware of your magical influence on it. When you cast an enchantment spell to charm one or more creatures, you can alter one creature\'s understanding so that it remains unaware of being charmed. Additionally, once before the spell expires, you can use your action to try to make the chosen creature forget some of the time it spent charmed. The creature must succeed on an Intelligence saving throw against your wizard spell save DC or lose a number of hours of its memories equal to 1 + your Charisma modifier (minimum 1). You can make the creature forget less time, and the amount of time can\'t exceed the duration of your enchantment spell.',
        },
      ],
    },
    'School of Evocation': {
      flavorText:
        'You focus your study on magic that creates powerful elemental effects such as bitter cold, searing flame, rolling thunder, crackling lightning, and burning acid. Some evokers find employment in military forces, serving as artillery to blast enemy armies from afar. Others use their spectacular power to protect the weak, while some seek their own gain as bandits, adventurers, or aspiring tyrants.',
      features: [
        {
          level: 2,
          name: 'Evocation Savant',
          description:
            'Beginning when you select this school at 2nd level, the gold and time you must spend to copy an evocation spell into your spellbook is halved.',
        },
        {
          level: 2,
          name: 'Sculpt Spells',
          description:
            'Beginning at 2nd level, you can create pockets of relative safety within the effects of your evocation spells. When you cast an evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 + the spell\'s level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save.',
        },
        {
          level: 6,
          name: 'Potent Cantrip',
          description:
            'Starting at 6th level, your damaging cantrips affect even creatures that avoid the brunt of the effect. When a creature succeeds on a saving throw against your cantrip, the creature takes half the cantrip\'s damage (if any) but suffers no additional effect from the cantrip.',
        },
        {
          level: 10,
          name: 'Empowered Evocation',
          description:
            'Beginning at 10th level, you can add your Intelligence modifier to one damage roll of any wizard evocation spell you cast.',
        },
        {
          level: 14,
          name: 'Overchannel',
          description:
            'Starting at 14th level, you can increase the power of your simpler spells. When you cast a wizard spell of 1st through 5th level that deals damage, you can deal maximum damage with that spell. The first time you do so, you suffer no adverse effect. If you use this feature again before you finish a long rest, you take 2d12 necrotic damage for each level of the spell, immediately after you cast it. This damage ignores resistance and immunity. Each time you use this feature again before finishing a long rest, the necrotic damage per spell level increases by 1d12.',
        },
      ],
    },
    'School of Illusion': {
      flavorText:
        'You focus your studies on magic that dazzles the senses, befuddles the mind, and tricks even the wisest folk. Your magic is subtle, but the illusions crafted by your keen mind make the impossible seem real. Some illusionists — including many gnome wizards — are benign tricksters who use their spells to entertain. Others are more sinister masters of deception.',
      features: [
        {
          level: 2,
          name: 'Illusion Savant',
          description:
            'Beginning when you select this school at 2nd level, the gold and time you must spend to copy an illusion spell into your spellbook is halved.',
        },
        {
          level: 2,
          name: 'Improved Minor Illusion',
          description:
            'When you choose this school at 2nd level, you learn the minor illusion cantrip. If you already know this cantrip, you learn a different wizard cantrip of your choice. The cantrip doesn\'t count against your number of cantrips known. When you cast minor illusion, you can create both a sound and an image with a single casting of the spell.',
        },
        {
          level: 6,
          name: 'Malleable Illusions',
          description:
            'Starting at 6th level, when you cast an illusion spell that has a duration of 1 minute or longer, you can use your action to change the nature of that illusion (using the spell\'s normal parameters for the illusion), provided that you can see the illusion.',
        },
        {
          level: 10,
          name: 'Illusory Self',
          description:
            'Beginning at 10th level, you can create an illusory duplicate of yourself as an instant, almost instinctual reaction to danger. When a creature makes an attack roll against you, you can use your reaction to interpose the illusory duplicate between the attacker and yourself. The attack automatically misses you, then the illusion dissipates. Once you use this feature, you can\'t use it again until you finish a short or long rest.',
        },
        {
          level: 14,
          name: 'Illusory Reality',
          description:
            'By 14th level, you have learned the secret of weaving shadow magic into your illusions to give them a semireality. When you cast an illusion spell of 1st level or higher, you can choose one inanimate, nonmagical object that is part of the illusion and make that object real. You can do this on your turn as a bonus action while the spell is ongoing. The object remains real for 1 minute. For example, you can create an illusion of a bridge over a chasm and then make it real long enough for your allies to cross. The object can\'t deal damage or otherwise directly harm anyone.',
        },
      ],
    },
    'School of Necromancy': {
      flavorText:
        'The School of Necromancy explores the cosmic forces of life, death, and undeath. As you focus your studies in this tradition, you learn to manipulate the energy that animates all living things. As you progress, you learn to sap the life force from a creature as your magic destroys its body, transforming that vital energy into magical power you can manipulate.',
      features: [
        {
          level: 2,
          name: 'Necromancy Savant',
          description:
            'Beginning when you select this school at 2nd level, the gold and time you must spend to copy a necromancy spell into your spellbook is halved.',
        },
        {
          level: 2,
          name: 'Grim Harvest',
          description:
            'At 2nd level, you gain the ability to reap life energy from creatures you kill with your spells. Once per turn when you kill one or more creatures with a spell of 1st level or higher, you regain hit points equal to twice the spell\'s level, or three times its level if the spell belongs to the School of Necromancy. You don\'t gain this benefit for killing constructs or undead.',
        },
        {
          level: 6,
          name: 'Undead Thralls',
          description:
            'At 6th level, you add the animate dead spell to your spellbook if it is not there already. When you cast animate dead, you can target one additional corpse or pile of bones, creating another zombie or skeleton, as appropriate. Whenever you create an undead using a necromancy spell, it has additional benefits: The creature\'s hit point maximum is increased by an amount equal to your wizard level. The creature adds your proficiency bonus to its weapon damage rolls.',
        },
        {
          level: 10,
          name: 'Inured to Undeath',
          description:
            'Beginning at 10th level, you have resistance to necrotic damage, and your hit point maximum can\'t be reduced. You have spent so much time dealing with undead and the forces that animate them that you have become inured to some of their worst effects.',
        },
        {
          level: 14,
          name: 'Command Undead',
          description:
            'Starting at 14th level, you can use magic to bring undead under your control, even those created by other wizards. As an action, you can choose one undead that you can see within 60 feet of you. That creature must make a Charisma saving throw against your wizard spell save DC. If it succeeds, you can\'t use this feature on it again. If it fails, it becomes friendly to you and obeys your commands until you use this feature again. Intelligent undead are harder to control in this way. If the target has an Intelligence of 8 or higher, it has advantage on the saving throw. If it fails the saving throw and has an Intelligence of 12 or higher, it can repeat the saving throw at the end of every hour until it succeeds and breaks free.',
        },
      ],
    },
    'School of Transmutation': {
      flavorText:
        'You are a student of spells that modify energy and matter. To you, the world is not a fixed thing, but eminently mutable, and you delight in being an agent of change. You wield the raw stuff of reality and learn to alter both physical forms and mental qualities. Your magic gives you the tools to become a smith on the anvil of the world.',
      features: [
        {
          level: 2,
          name: 'Transmutation Savant',
          description:
            'Beginning when you select this school at 2nd level, the gold and time you must spend to copy a transmutation spell into your spellbook is halved.',
        },
        {
          level: 2,
          name: 'Minor Alchemy',
          description:
            'Starting at 2nd level when you select this school, you can temporarily alter the physical properties of one nonmagical object, changing it from one substance into another. You perform a special alchemical procedure on one object composed entirely of wood, stone (but not a gemstone), iron, copper, or silver, transforming it into a different one of those materials. For each 10 minutes you spend performing the procedure, you can transform up to 1 cubic foot of material. After 1 hour, or until you lose your concentration (as if you were concentrating on a spell), the material reverts to its original substance.',
        },
        {
          level: 6,
          name: 'Transmuter\'s Stone',
          description:
            'Starting at 6th level, you can spend 8 hours creating a transmuter\'s stone that stores transmutation magic. You can benefit from the stone yourself or give it to another creature. A creature gains a benefit of your choice as long as the stone is in the creature\'s possession. When you create the stone, choose the benefit from the following options: Darkvision (60 feet), +10 feet speed, Proficiency in Constitution saving throws, or Resistance to acid, cold, fire, lightning, or thunder damage (your choice when you select this benefit). Each time you cast a transmutation spell of 1st level or higher, you can change the effect of your stone if the stone is on your person. If you create a new transmuter\'s stone, the previous one ceases to function.',
        },
        {
          level: 10,
          name: 'Shapechanger',
          description:
            'At 10th level, you add the polymorph spell to your spellbook, if it is not there already. You can cast polymorph without expending a spell slot. When you do so, you can target only yourself and transform into a beast whose challenge rating is 1 or lower. Once you cast polymorph in this way, you can\'t do so again until you finish a short or long rest, though you can still cast it normally using an available spell slot.',
        },
        {
          level: 14,
          name: 'Master Transmuter',
          description:
            'Starting at 14th level, you can use your action to consume the reserve of transmutation magic stored within your transmuter\'s stone in a single burst. When you do so, choose one of the following effects. Your transmuter\'s stone is destroyed afterward. Major Transformation — You can transmute one nonmagical object, no larger than a 5-foot cube, into another nonmagical object of similar size and mass and of equal or lesser value. Panacea — You remove all curses, diseases, and poisons affecting a creature that you touch with the transmuter\'s stone. The creature also regains all its hit points. Restore Life — You cast the raise dead spell on a creature you touch with the transmuter\'s stone, without expending a spell slot or requiring material components. Restore Youth — You touch the transmuter\'s stone to a willing creature, and that creature\'s apparent age is reduced by 3d10 years, to a minimum of 13 years.',
        },
      ],
    },
    'Bladesinging': {
      flavorText:
        'Bladesingers master a tradition of wizardry that incorporates swordplay and dance. Originally created by elves, this tradition has been adopted by non-elf practitioners, who honor and expand on the elven ways. In combat, a bladesinger uses a series of intricate, elegant maneuvers that fend off harm and allow the bladesinger to channel magic into devastating attacks and a cunning defense.',
      features: [
        {
          level: 2,
          name: 'Training in War and Song',
          description:
            'When you adopt this tradition at 2nd level, you gain proficiency with light armor, and you gain proficiency with one type of one-handed melee weapon of your choice. You also gain proficiency in the Performance skill if you don\'t already have it.',
        },
        {
          level: 2,
          name: 'Bladesong',
          description:
            'Starting at 2nd level, you can invoke an elven magic called the Bladesong, provided that you aren\'t wearing medium or heavy armor or using a shield. It graces you with supernatural speed, agility, and focus. You can use a bonus action to start the Bladesong, which lasts for 1 minute. It ends early if you are incapacitated, if you don medium or heavy armor or a shield, or if you use two hands to make an attack with a weapon. You can also dismiss the Bladesong at any time you choose (no action required). While your Bladesong is active, you gain the following benefits: You gain a bonus to your AC equal to your Intelligence modifier (minimum of +1). Your walking speed increases by 10 feet. You have advantage on Dexterity (Acrobatics) checks. You gain a bonus to any Constitution saving throw you make to maintain your concentration on a spell. The bonus equals your Intelligence modifier (minimum of +1). You can use this feature twice. You regain all expended uses of it when you finish a short or long rest.',
        },
        {
          level: 6,
          name: 'Extra Attack',
          description:
            'Starting at 6th level, you can attack twice, instead of once, whenever you take the Attack action on your turn. Moreover, you can cast one of your cantrips in place of one of those attacks.',
        },
        {
          level: 10,
          name: 'Song of Defense',
          description:
            'Beginning at 10th level, you can direct your magic to absorb damage while your Bladesong is active. When you take damage, you can use your reaction to expend one spell slot and reduce that damage to you by an amount equal to five times the spell slot\'s level.',
        },
        {
          level: 14,
          name: 'Song of Victory',
          description:
            'Starting at 14th level, you add your Intelligence modifier (minimum of +1) to the damage of your melee weapon attacks while your Bladesong is active.',
        },
      ],
    },
    'Order of Scribes': {
      flavorText:
        'Magic of the spellbook is a tradition that varies widely among wizards. Some prefer the quick mastery of a few powerful spells, while others collect hundreds of spells, weaving them into the pages of multiple books. Those of the Order of Scribes, however, see their spellbooks as companions in a way others may not. These wizards study the magic of the written word and use their spellbooks both as magical tools and as extensions of their own minds.',
      features: [
        {
          level: 2,
          name: 'Wizardly Quill',
          description:
            'As a bonus action, you can magically create a Tiny quill in your free hand. The magic quill has the following properties: The quill doesn\'t require ink. When you write with it, it produces ink in a color of your choice on the writing surface. The time you must spend to copy a spell into your spellbook equals 2 minutes per spell level if you use the quill for the transcription. You can erase anything you write with the quill if you wave the feather over the text as a bonus action, provided the text is within 5 feet of you. This quill disappears if you create another one or if you die.',
        },
        {
          level: 2,
          name: 'Awakened Spellbook',
          description:
            'Using specially prepared inks and ancient incantations passed down by your order, you have awakened an arcane sentience within your spellbook. Your spellbook gains the following properties while you are holding it: You can use the book as a spellcasting focus for your wizard spells. When you cast a wizard spell with a spell slot, you can temporarily replace its damage type with a type that appears in another spell in your spellbook, which magically alters the spell\'s formula for this casting only. The other spell must be of the same level as the spell slot you expend. When you cast a wizard spell as a ritual, you can use the spell\'s normal casting time, rather than adding 10 minutes to it. Once you use this benefit, you can\'t do so again until you finish a long rest.',
        },
        {
          level: 6,
          name: 'One with the Word',
          description:
            'Your connection to your Awakened Spellbook has become so profound that your soul has become entwined with it. While you are holding your spellbook, you have advantage on any saving throw you are forced to make. If you fail a saving throw while holding the book, you can choose to succeed instead. If you use this ability, roll 3d6. The spellbook temporarily loses spells of your choice that have a combined spell level equal to that number. If the book doesn\'t have enough spells to cover this cost, you drop to 0 hit points. While some of its spells are missing, you are unable to add new spells to the book. The missing spells reappear in the book after you finish a long rest. Once you use this feature, you can\'t use it again until you finish a long rest.',
        },
        {
          level: 10,
          name: 'Manifest Mind',
          description:
            'You can cause the mind of your Awakened Spellbook to manifest as a Tiny spectral object, hovering in an unoccupied space of your choice within 60 feet of you. The spectral mind is intangible and doesn\'t occupy its space. It lasts for 10 minutes or until you become incapacitated or die or until you dismiss it as a bonus action. The spectral mind can hear and see, and it has darkvision with a range of 60 feet. As a bonus action, you can cause the spectral mind to move up to 30 feet, no matter what, without provoking opportunity attacks. As an action while the spectral mind hovers within 300 feet of you, you can cast a spell as if you were in the spectral mind\'s space, using your senses. When you cast a spell this way, the spell must produce a visible effect or require an attack roll. Once you use this action, you can\'t do so again until you finish a short or long rest. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.',
        },
        {
          level: 14,
          name: 'Master Scrivener',
          description:
            'Whenever you finish a long rest, you can create one magic scroll by touching your Wizardly Quill to a blank piece of paper or parchment and causing one spell from your Awakened Spellbook to be copied onto the scroll. The copied spell must be of a level you can prepare, and it must be a spell that has a casting time of 1 action. As a bonus action, you can use the scroll to cast the spell written on it, and the scroll disappears when you do. The spell on the scroll uses your spell save DC and spell attack modifier. If the spell is on the wizard spell list, it counts as a wizard spell when you cast it. Once you create a scroll this way, you can\'t do so again until you finish a long rest.',
        },
      ],
    },
    'War Magic': {
      flavorText:
        'A variety of spells are used by soldiers in war, and the practitioners of War Magic are called mageknights or war-mages. They learn that a wizard who uses magic to augment their defense and disrupt their enemies is a potent force on the battlefield. Followers of this tradition are not generally welcomed by other wizards, who see their focus on combat as too narrow — failing to appreciate all that magic can do.',
      features: [
        {
          level: 2,
          name: 'Arcane Deflection',
          description:
            'At 2nd level, you have learned to weave your magic to fortify yourself against harm. When you are hit by an attack or you fail a saving throw, you can use your reaction to gain a +2 bonus to your AC against that attack or a +4 bonus to that saving throw. When you use this feature, you can\'t cast spells other than cantrips until the end of your next turn.',
        },
        {
          level: 2,
          name: 'Tactical Wit',
          description:
            'Starting at 2nd level, your keen ability to assess tactical situations allows you to act quickly in battle. You can give yourself a bonus to your initiative rolls equal to your Intelligence modifier.',
        },
        {
          level: 6,
          name: 'Power Surge',
          description:
            'Starting at 6th level, you can store magical energy within yourself to later empower your damaging spells. In its stored form, this energy is called a power surge. You can store a maximum number of power surges equal to your Intelligence modifier (minimum of one). Whenever you finish a long rest, your number of power surges resets to one. Whenever you successfully end a spell with dispel magic or counterspell, you gain one power surge, as you steal magic from the spell you foiled. If you end a short rest with no power surges, you gain one power surge. Once per turn when you deal damage to a creature or object with a wizard spell, you can spend one power surge to deal extra force damage to that target. The extra damage equals half your wizard level.',
        },
        {
          level: 10,
          name: 'Durable Magic',
          description:
            'Beginning at 10th level, the magic you channel helps ward off harm. While you maintain concentration on a spell, you have a +2 bonus to AC and all saving throws.',
        },
        {
          level: 14,
          name: 'Deflecting Shroud',
          description:
            'At 14th level, your Arcane Deflection becomes infused with deadly magic. When you use your Arcane Deflection feature, you can cause magical energy to arc from you. Up to three creatures of your choice that you can see within 60 feet of you each take force damage equal to half your wizard level.',
        },
      ],
    },
  },
  '5.5e': {
    'Abjurer': {
      flavorText:
        'The School of Abjuration emphasizes magic that blocks, banishes, or protects. Detractors of this school say that its tradition is about denial, negation rather than positive assertion. You understand, however, that ending harmful effects, protecting the weak, and banishing evil influences is anything but a philosophical negative. It is a proud and respected vocation.',
      features: [
        {
          level: 3,
          name: 'Abjuration Savant',
          description:
            'Choose two Abjuration spells from the Wizard spell list, each of which must be no higher than level 2. You always have those spells prepared, and they don\'t count against the number of spells you can prepare.',
        },
        {
          level: 3,
          name: 'Arcane Ward',
          description:
            'You can weave magic around yourself for protection. When you cast an Abjuration spell with a spell slot, you can simultaneously use a strand of the spell\'s magic to create a magical ward on yourself that lasts until you finish a Long Rest. The ward has hit points equal to twice your Wizard level + your Intelligence modifier. Whenever you take damage, the ward takes the damage instead. If the damage reduces the ward to 0 hit points, you take any remaining damage. While the ward has 0 hit points, it can\'t absorb damage, but its magic remains. Whenever you cast an Abjuration spell with a spell slot, the ward regains a number of hit points equal to twice the level of the spell slot used.',
        },
        {
          level: 6,
          name: 'Projected Ward',
          description:
            'When a creature you can see within 30 feet of you takes damage, you can take a Reaction to cause your Arcane Ward to absorb that damage. If the damage reduces the ward to 0 hit points, the warded creature takes any remaining damage.',
        },
        {
          level: 10,
          name: 'Improved Abjuration',
          description:
            'When you cast an Abjuration spell that requires you to make an ability check as part of casting that spell (as in Counterspell and Dispel Magic), you add your Proficiency Bonus to that ability check.',
        },
        {
          level: 14,
          name: 'Spell Resistance',
          description:
            'You have Advantage on saving throws against spells, and you have Resistance to the damage of spells.',
        },
      ],
    },
    'Bladesinging': {
      flavorText:
        'Bladesingers master a tradition of wizardry that incorporates swordplay and dance. Originally created by elves, this tradition has been adopted by non-elf practitioners, who honor and expand on the elven ways. In combat, a bladesinger uses a series of intricate, elegant maneuvers that fend off harm and allow the bladesinger to channel magic into devastating attacks and a cunning defense.',
      features: [
        {
          level: 3,
          name: 'Training in War and Song',
          description:
            'You gain proficiency with Light armor and one type of one-handed melee weapon of your choice. You also gain proficiency in the Performance skill if you don\'t already have it.',
        },
        {
          level: 3,
          name: 'Bladesong',
          description:
            'You can invoke an elven magic called the Bladesong, provided you aren\'t wearing Medium or Heavy armor or using a Shield. It graces you with supernatural speed, agility, and focus. You can use a Bonus Action to start the Bladesong, which lasts for 1 minute. It ends early if you are Incapacitated, if you don Medium or Heavy armor or a Shield, or if you use two hands to make an attack with a weapon. You can also dismiss the Bladesong at any time (no action required). While your Bladesong is active, you gain these benefits: You gain a bonus to your Armor Class equal to your Intelligence modifier (minimum of +1). Your Speed increases by 10 feet. You have Advantage on Dexterity (Acrobatics) checks. You gain a bonus to any Constitution saving throw you make to maintain Concentration on a spell. The bonus equals your Intelligence modifier (minimum of +1). You can use this feature twice, and you regain all expended uses when you finish a Short or Long Rest.',
        },
        {
          level: 6,
          name: 'Extra Attack',
          description:
            'You can attack twice instead of once when you take the Attack action on your turn. Moreover, you can cast one of your Wizard cantrips in place of one of those attacks.',
        },
        {
          level: 10,
          name: 'Song of Defense',
          description:
            'You can direct your magic to absorb damage while your Bladesong is active. When you take damage, you can take a Reaction to expend one Wizard spell slot and reduce that damage by an amount equal to five times the slot\'s level.',
        },
        {
          level: 14,
          name: 'Song of Victory',
          description:
            'You add your Intelligence modifier (minimum of +1) to the damage of your melee weapon attacks while your Bladesong is active.',
        },
      ],
    },
    'Chronurgy Magic': {
      flavorText:
        'Focusing on the manipulation of time, those who follow the Chronurgy tradition learn to alter the pace of events to their advantage. Using the principles of dunamancy, these mages can slow enemies, give allies an extra chance at success, and even rewind the flow of time itself in small ways.',
      features: [
        {
          level: 3,
          name: 'Chronal Shift',
          description:
            'You can magically alter the flow of time for yourself or another creature. When you or a creature you can see within 30 feet of you makes an attack roll, an ability check, or a saving throw, you can use your Reaction to add or subtract 1d4 from the total of that roll after it is rolled but before its effects are applied. You can use this feature twice, and you regain all expended uses when you finish a Long Rest.',
        },
        {
          level: 3,
          name: 'Temporal Awareness',
          description:
            'You can add your Intelligence modifier to your initiative rolls.',
        },
        {
          level: 6,
          name: 'Momentary Stasis',
          description:
            'As an action, you can magically force a Large or smaller creature you can see within 60 feet of you to make a Constitution saving throw against your spell save DC. On a failed save, the creature is encased in a field of magical energy until the end of your next turn or until the creature takes any damage. While encased in this way, the creature\'s Speed is 0, and it has the Incapacitated condition. You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all uses when you finish a Long Rest.',
        },
        {
          level: 10,
          name: 'Arcane Abeyance',
          description:
            'When you cast a spell using a spell slot of 4th level or lower, you can condense the spell\'s magic into a mote and touch a willing creature. The spell is stored in that creature\'s aura until it\'s released or until 8 hours pass. The creature holding the mote can use its action to release the stored spell as if it were the one who cast the spell. When the spell is released, the creature must use its action, and the stored spell is immediately cast. The creature who releases the spell uses your spell save DC and spell attack bonus. Once you use this feature, you can\'t use it again until you finish a Short or Long Rest.',
        },
        {
          level: 14,
          name: 'Convergent Future',
          description:
            'You can peer through possible futures and, if you don\'t like the result, alter the timeline. When you or a creature you can see within 60 feet of you makes an attack roll, an ability check, or a saving throw, you can use your Reaction to ignore the die result and decide whether the number rolled is the minimum needed to succeed or one less than that number (your choice). When you use this feature, you gain one level of exhaustion. Only by finishing a Long Rest can you remove a level of exhaustion gained in this way.',
        },
      ],
    },
    'Conjurer': {
      flavorText:
        'As a Conjurer, you favor spells that produce objects and creatures out of thin air. You can conjure billowing clouds of killing fog or summon creatures from elsewhere to fight on your behalf. As your mastery grows, you learn spells of transportation and can teleport yourself across vast distances, even to different planes of existence.',
      features: [
        {
          level: 3,
          name: 'Conjuration Savant',
          description:
            'Choose two Conjuration spells from the Wizard spell list, each of which must be no higher than level 2. You always have those spells prepared, and they don\'t count against the number of spells you can prepare.',
        },
        {
          level: 3,
          name: 'Benign Transposition',
          description:
            'You can use a Bonus Action to teleport up to 30 feet to an unoccupied space you can see. Alternatively, you can choose a space within range that is occupied by a Small or Medium creature. If that creature is willing, you both teleport, swapping places. Once you use this feature, you can\'t use it again until you finish a Long Rest or you cast a Conjuration spell of level 1+.',
        },
        {
          level: 6,
          name: 'Focused Conjuration',
          description:
            'While you Concentrate on a Conjuration spell, your Concentration can\'t be broken as a result of taking damage.',
        },
        {
          level: 10,
          name: 'Durable Summons',
          description:
            'Any creature you summon or create with a Conjuration spell has 30 Temporary Hit Points.',
        },
        {
          level: 14,
          name: 'Superior Summoning',
          description:
            'When you cast a Conjuration spell to summon a creature, roll a d4, and you can summon that many additional creatures of the same type (if they fit in the spell\'s area and there are enough of them to summon).',
        },
      ],
    },
    'Diviner': {
      flavorText:
        'The counsel of a Diviner is sought by royalty and commoners alike, for all seek a clearer understanding of the past, present, and future. As a Diviner, you strive to part the veils of space, time, and consciousness so that you can see clearly. You work to master spells of discernment, remote viewing, supernatural knowledge, and foresight.',
      features: [
        {
          level: 3,
          name: 'Divination Savant',
          description:
            'Choose two Divination spells from the Wizard spell list, each of which must be no higher than level 2. You always have those spells prepared, and they don\'t count against the number of spells you can prepare.',
        },
        {
          level: 3,
          name: 'Portent',
          description:
            'Glimpses of the future begin to press in on your awareness. When you finish a Long Rest, roll two d20s and record the numbers rolled. You can replace any attack roll, saving throw, or ability check made by you or a creature that you can see with one of these foretelling rolls. You must choose to do so before the roll, and you can replace a roll in this way only once per turn. Each foretelling roll can be used only once. When you finish a Long Rest, you lose any unused foretelling rolls.',
        },
        {
          level: 6,
          name: 'Expert Divination',
          description:
            'Casting Divination spells comes so easily to you that it expends only a fraction of your spellcasting efforts. When you cast a Divination spell of level 2 or higher using a spell slot, you regain one expended spell slot. The slot you regain must be of a level lower than the spell you cast and can\'t be higher than level 5.',
        },
        {
          level: 10,
          name: 'The Third Eye',
          description:
            'You can use an action to increase your powers of perception. When you do so, choose one of the following benefits, which lasts until you finish a Short or Long Rest: Darkvision (60 feet), Ethereal Sight (see into the Ethereal Plane 60 feet), Greater Comprehension (read any language), or See Invisibility.',
        },
        {
          level: 14,
          name: 'Greater Portent',
          description:
            'The visions in your dreams intensify and paint a more accurate picture in your mind of what is to come. You roll three d20s for your Portent feature, rather than two.',
        },
      ],
    },
    'Enchanter': {
      flavorText:
        'As a member of the School of Enchantment, you have honed your ability to magically entrance and beguile other people and monsters. Some Enchanters are peacemakers who bewitch the violent to lay down their arms and charm the cruel to be more amenable. Others are tyrants who magically bind the unwilling into their service.',
      features: [
        {
          level: 3,
          name: 'Enchantment Savant',
          description:
            'Choose two Enchantment spells from the Wizard spell list, each of which must be no higher than level 2. You always have those spells prepared, and they don\'t count against the number of spells you can prepare.',
        },
        {
          level: 3,
          name: 'Hypnotic Gaze',
          description:
            'Your soft words and enchanting gaze can magically enthrall another creature. As a Bonus Action, choose one creature you can see within 5 feet of you. The creature must make a Wisdom saving throw against your spell save DC. On a failed save, the creature has the Charmed condition until the start of your next turn. While Charmed in this way, the creature\'s Speed is 0, and the creature has the Incapacitated condition. On subsequent turns, you can take a Bonus Action to maintain this effect, extending its duration until the start of your next turn. However, the effect ends if you move more than 5 feet away from the creature, if the creature can neither see nor hear you, or if the creature takes damage. Once the effect ends, or if the creature succeeds on its initial saving throw against this effect, you can\'t use this feature on that creature again until you finish a Long Rest.',
        },
        {
          level: 6,
          name: 'Instinctive Charm',
          description:
            'When a creature you can see within 30 feet of you makes an attack roll against you, you can take a Reaction to divert the attack. The attacker must make a Wisdom saving throw against your spell save DC. On a failed save, the attacker targets the creature closest to it (not counting you) that it can see. If multiple creatures are closest, the attacker chooses which one to target. On a successful save, you can\'t use this feature on the attacker again until you finish a Long Rest. Creatures that can\'t be Charmed are immune to this effect.',
        },
        {
          level: 10,
          name: 'Split Enchantment',
          description:
            'When you cast an Enchantment spell that targets only one creature, you can have it target a second creature.',
        },
        {
          level: 14,
          name: 'Alter Memories',
          description:
            'You gain the ability to make a creature unaware of your magical influence on it. When you cast an Enchantment spell to charm one or more creatures, you can alter one creature\'s understanding so that it remains unaware of being Charmed. Additionally, once before the spell expires, you can use your action to try to make the chosen creature forget some of the time it spent Charmed. The creature must succeed on an Intelligence saving throw against your spell save DC or lose a number of hours of its memories equal to 1 + your Charisma modifier (minimum 1).',
        },
      ],
    },
    'Evoker': {
      flavorText:
        'You focus your study on magic that creates powerful elemental effects such as bitter cold, searing flame, rolling thunder, crackling lightning, and burning acid. Some Evokers find employment in military forces, serving as artillery to blast enemy armies from afar. Others use their spectacular power to protect the weak, while some seek their own gain as adventurers.',
      features: [
        {
          level: 3,
          name: 'Evocation Savant',
          description:
            'Choose two Evocation spells from the Wizard spell list, each of which must be no higher than level 2. You always have those spells prepared, and they don\'t count against the number of spells you can prepare.',
        },
        {
          level: 3,
          name: 'Sculpt Spells',
          description:
            'You can create pockets of relative safety within the effects of your Evocation spells. When you cast an Evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 + the spell\'s level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save.',
        },
        {
          level: 6,
          name: 'Potent Cantrip',
          description:
            'Your damaging cantrips affect even creatures that avoid the brunt of the effect. When a creature succeeds on a saving throw against your cantrip, the creature takes half the cantrip\'s damage (if any) but suffers no additional effect from the cantrip.',
        },
        {
          level: 10,
          name: 'Empowered Evocation',
          description:
            'Whenever you cast an Evocation spell with a spell slot, you can add your Intelligence modifier to one damage roll of that spell.',
        },
        {
          level: 14,
          name: 'Overchannel',
          description:
            'You can increase the power of your simpler spells. When you cast a Wizard spell with a spell slot of levels 1–5 that deals damage, you can deal maximum damage with that spell. The first time you do so, you suffer no adverse effect. If you use this feature again before you finish a Long Rest, you take 2d12 Necrotic damage for each level of the spell slot, immediately after you cast it. Each time you use this feature again before finishing a Long Rest, the Necrotic damage per spell level increases by 1d12.',
        },
      ],
    },
    'Graviturgy Magic': {
      flavorText:
        'Understanding and mastering the forces that draw celestial bodies together, those who follow the Graviturgy tradition of magic learn to further bend and manipulate the violent energy of gravity to direct, detain, and destructively crush their enemies.',
      features: [
        {
          level: 3,
          name: 'Adjust Density',
          description:
            'As an action, you can magically alter the weight of one object or creature you can see within 30 feet of you. The object or creature must be Large or smaller. The target\'s weight is halved or doubled for up to 1 minute or until your concentration is broken (as if concentrating on a spell). While affected, a creature\'s Speed changes as follows: if its weight is halved, the creature\'s Speed increases by 10 feet; if its weight is doubled, the creature\'s Speed decreases by 10 feet. A doubled-weight creature also has disadvantage on Strength checks and Strength saving throws. You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all uses when you finish a Long Rest.',
        },
        {
          level: 6,
          name: 'Gravity Well',
          description:
            'Whenever you cast a spell on a creature, you can move the target 5 feet to an unoccupied space of your choice if the target is willing to move, the spell hits it with an attack, or it fails a saving throw against the spell.',
        },
        {
          level: 10,
          name: 'Violent Attraction',
          description:
            'When another creature that you can see within 60 feet of you hits with a weapon attack, you can use your Reaction to increase the attack\'s velocity, causing the attack\'s weapon to deal an extra 1d10 damage of its type. Alternatively, if a creature within 60 feet of you takes damage from a fall, you can use your Reaction to increase the fall\'s damage by 2d10. You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all uses when you finish a Long Rest.',
        },
        {
          level: 14,
          name: 'Event Horizon',
          description:
            'As an action, you can magically emit a powerful field of gravitational energy that tugs at other creatures for up to 1 minute or until your concentration ends (as if concentrating on a spell). For the duration, whenever a creature hostile to you starts its turn within 30 feet of you, it must make a Strength saving throw against your spell save DC. On a failed save, it takes 2d10 Force damage, and its Speed is reduced to 0 until the start of its next turn. On a successful save, it takes half as much damage, and every foot it moves this turn costs 2 extra feet of movement. Once you use this feature, you can\'t use it again until you finish a Long Rest.',
        },
      ],
    },
    'Illusionist': {
      flavorText:
        'You focus your studies on magic that dazzles the senses, befuddles the mind, and tricks even the wisest folk. Your magic is subtle, but the illusions crafted by your keen mind make the impossible seem real. Some Illusionists are benign tricksters who use their spells to entertain. Others are more sinister masters of deception, cloaking themselves in spells of misdirection and shadow.',
      features: [
        {
          level: 3,
          name: 'Illusion Savant',
          description:
            'Choose two Illusion spells from the Wizard spell list, each of which must be no higher than level 2. You always have those spells prepared, and they don\'t count against the number of spells you can prepare.',
        },
        {
          level: 3,
          name: 'Improved Minor Illusion',
          description:
            'You learn the Minor Illusion cantrip. If you already know this cantrip, you learn a different Wizard cantrip of your choice. The cantrip doesn\'t count against your number of cantrips known. When you cast Minor Illusion, you can create both a sound and an image with a single casting of the spell.',
        },
        {
          level: 6,
          name: 'Malleable Illusions',
          description:
            'When you cast an Illusion spell that has a duration of 1 minute or longer, you can use a Bonus Action to change the nature of that illusion (using the spell\'s normal parameters for the illusion), provided that you can see the illusion.',
        },
        {
          level: 10,
          name: 'Illusory Self',
          description:
            'When a creature makes an attack roll against you, you can take a Reaction to interpose an illusory duplicate of yourself between the attacker and yourself. The attack automatically misses you, then the illusion dissipates. Once you use this feature, you can\'t use it again until you finish a Short or Long Rest.',
        },
        {
          level: 14,
          name: 'Illusory Reality',
          description:
            'You have learned the secret of weaving shadow magic into your illusions to give them a semireality. When you cast an Illusion spell of level 1 or higher, you can choose one inanimate, nonmagical object that is part of the illusion and make that object real. You can do this on your turn as a Bonus Action while the spell is ongoing. The object remains real for 1 minute. For example, you can create an illusion of a bridge over a chasm and then make it real long enough for your allies to cross. The object can\'t deal damage or otherwise directly harm anyone.',
        },
      ],
    },
    'Necromancer': {
      flavorText:
        'The School of Necromancy explores the cosmic forces of life, death, and undeath. As you focus your studies in this tradition, you learn to manipulate the energy that animates all living things. As you progress, you learn to sap the life force from a creature as your magic destroys its body, transforming that vital energy into magical power you can manipulate.',
      features: [
        {
          level: 3,
          name: 'Necromancy Savant',
          description:
            'Choose two Necromancy spells from the Wizard spell list, each of which must be no higher than level 2. You always have those spells prepared, and they don\'t count against the number of spells you can prepare.',
        },
        {
          level: 3,
          name: 'Grim Harvest',
          description:
            'Once per turn when you kill one or more creatures with a spell of level 1 or higher, you regain hit points equal to twice the spell\'s level, or three times its level if the spell belongs to the Necromancy school. You don\'t gain this benefit for killing Constructs or Undead.',
        },
        {
          level: 6,
          name: 'Undead Thralls',
          description:
            'You always have the Animate Dead spell prepared. When you cast Animate Dead, you can target one additional corpse or pile of bones, creating another zombie or skeleton as appropriate. Whenever you create an Undead using a Necromancy spell, the creature has the following extra features: The creature\'s hit point maximum is increased by an amount equal to your Wizard level. The creature adds your Proficiency Bonus to its weapon damage rolls.',
        },
        {
          level: 10,
          name: 'Inured to Undeath',
          description:
            'You have Resistance to Necrotic damage, and your hit point maximum can\'t be reduced. You have spent so much time dealing with Undead and the forces that animate them that you have become inured to some of their worst effects.',
        },
        {
          level: 14,
          name: 'Command Undead',
          description:
            'You can use magic to bring Undead under your control, even those created by other wizards. As a Magic action, you can choose one Undead you can see within 60 feet of you. That creature must make a Charisma saving throw against your spell save DC. On a successful save, you can\'t use this feature on it again. On a failed save, it has the Charmed condition for 24 hours. While Charmed, it obeys your commands. After 24 hours or if it takes any damage from you or a companion of yours, it repeats the save. On a success, the effect ends. An Undead with Intelligence 8+ has Advantage on the saving throw.',
        },
      ],
    },
    'Order of Scribes': {
      flavorText:
        'Magic of the spellbook is a tradition that varies widely among wizards. Those of the Order of Scribes see their spellbooks as companions — studying the magic of the written word and using their spellbooks both as magical tools and as extensions of their own minds. The quill is as mighty as the sword in the hands of a Scribe Wizard.',
      features: [
        {
          level: 3,
          name: 'Wizardly Quill',
          description:
            'As a Bonus Action, you can magically create a Tiny quill in your free hand. The magic quill has the following properties: The quill doesn\'t require ink. When you write with it, it produces ink in a color of your choice on the writing surface. The time you must spend to copy a spell into your spellbook equals 2 minutes per spell level if you use the quill for the transcription. You can erase anything you write with the quill if you wave the feather over the text as a Bonus Action, provided the text is within 5 feet of you. This quill disappears if you create another one or if you die.',
        },
        {
          level: 3,
          name: 'Awakened Spellbook',
          description:
            'Using specially prepared inks and ancient incantations passed down by your order, you have awakened an arcane sentience within your spellbook. Your spellbook gains the following properties while you are holding it: You can use the book as a Spellcasting focus for your Wizard spells. When you cast a Wizard spell with a spell slot, you can temporarily replace its damage type with a type that appears in another spell in your spellbook. When you cast a Wizard spell as a Ritual, you can use the spell\'s normal casting time, rather than adding 10 minutes to it. Once you use this benefit, you can\'t do so again until you finish a Long Rest.',
        },
        {
          level: 6,
          name: 'One with the Word',
          description:
            'Your connection to your Awakened Spellbook has grown so profound that your soul has become entwined with it. While you are holding your spellbook, you have Advantage on any saving throw you are forced to make. If you fail a saving throw while holding the book, you can choose to succeed instead, but the book temporarily loses spells equal to 3d6 spell levels of your choice. If the book doesn\'t have enough spells to cover this cost, you drop to 0 hit points. The missing spells reappear after a Long Rest. Once you use this feature, you can\'t use it again until you finish a Long Rest.',
        },
        {
          level: 10,
          name: 'Manifest Mind',
          description:
            'You can cause the mind of your Awakened Spellbook to manifest as a Tiny spectral object, hovering in an unoccupied space you can see within 60 feet of you. It lasts for 10 minutes or until you become Incapacitated or die, or until you dismiss it as a Bonus Action. As a Bonus Action, you can move the spectral mind up to 30 feet. As a Magic action, while the spectral mind is within 300 feet of you, you can cast a spell as if you were in the spectral mind\'s space, using your senses. Once you use this action, you can\'t do so again until you finish a Short or Long Rest.',
        },
        {
          level: 14,
          name: 'Master Scrivener',
          description:
            'Whenever you finish a Long Rest, you can create one magic scroll by touching your Wizardly Quill to a blank piece of paper or parchment and causing one spell from your Awakened Spellbook to be copied onto the scroll. The copied spell must be of a level you can prepare, and it must be a spell that has a casting time of 1 action. As a Bonus Action, you can use the scroll to cast the spell written on it, and the scroll disappears when you do. The spell uses your spell save DC and spell attack modifier. Once you create a scroll this way, you can\'t do so again until you finish a Long Rest.',
        },
      ],
    },
    'Transmuter': {
      flavorText:
        'You are a student of spells that modify energy and matter. To you, the world is not a fixed thing, but eminently mutable, and you delight in being an agent of change. You wield the raw stuff of reality and learn to alter both physical forms and mental qualities. Your magic gives you the tools to become a smith on the anvil of the world.',
      features: [
        {
          level: 3,
          name: 'Transmutation Savant',
          description:
            'Choose two Transmutation spells from the Wizard spell list, each of which must be no higher than level 2. You always have those spells prepared, and they don\'t count against the number of spells you can prepare.',
        },
        {
          level: 3,
          name: 'Transmuter\'s Stone',
          description:
            'You can spend 8 hours creating a transmuter\'s stone that stores transmutation magic. You can benefit from the stone yourself or give it to another creature. A creature gains a benefit of your choice as long as the stone is in the creature\'s possession. When you create the stone, choose the benefit from the following options: Darkvision (60 feet), +10 feet Speed, Proficiency in Constitution saving throws, or Resistance to acid, cold, fire, lightning, or thunder damage. Each time you cast a Transmutation spell with a spell slot, you can change the effect of your stone if the stone is on your person. If you create a new transmuter\'s stone, the previous one ceases to function.',
        },
        {
          level: 6,
          name: 'Shapechanger',
          description:
            'You always have the Polymorph spell prepared. You can cast Polymorph without expending a spell slot. When you do so, you can target only yourself and transform into a Beast whose Challenge Rating is 1 or lower. Once you cast Polymorph in this way, you can\'t do so again until you finish a Short or Long Rest.',
        },
        {
          level: 10,
          name: 'Special Transmutation',
          description:
            'You can use your action to consume the reserve of transmutation magic stored within your transmuter\'s stone in a single burst. When you do so, choose one of the following effects. Major Transformation — You can transmute one nonmagical object, no larger than a 5-foot cube, into another nonmagical object of similar size and mass and of equal or lesser value. Panacea — You remove all curses, diseases, and poisons affecting a creature that you touch with the transmuter\'s stone. The creature also regains all its hit points. Restore Life — You cast the Raise Dead spell on a creature you touch with the transmuter\'s stone, without expending a spell slot or requiring material components. Restore Youth — You touch the transmuter\'s stone to a willing creature, and that creature\'s apparent age is reduced by 3d10 years, to a minimum of 13 years.',
        },
        {
          level: 14,
          name: 'Master Transmuter',
          description:
            'Your mastery of transmutation magic has reached its pinnacle. You can use your Transmuter\'s Stone feature\'s Special Transmutation without destroying the stone. Additionally, when you use Special Transmutation, the effects are maximized (Restore Life works as Resurrection; Panacea also removes the Frightened, Paralyzed, and Stunned conditions).',
        },
      ],
    },
    'War Magic': {
      flavorText:
        'A variety of spells are used by soldiers in war, and the practitioners of War Magic are called mageknights or war-mages. They learn that a wizard who uses magic to augment their defense and disrupt their enemies is a potent force on the battlefield. Followers of this tradition prize utility and durability over raw power.',
      features: [
        {
          level: 3,
          name: 'Arcane Deflection',
          description:
            'You have learned to weave your magic to fortify yourself against harm. When you are hit by an attack or you fail a saving throw, you can use your Reaction to gain a +2 bonus to your AC against that attack or a +4 bonus to that saving throw. When you use this feature, you can\'t cast spells other than cantrips until the end of your next turn.',
        },
        {
          level: 3,
          name: 'Tactical Wit',
          description:
            'Your keen ability to assess tactical situations allows you to act quickly in battle. You can give yourself a bonus to your initiative rolls equal to your Intelligence modifier.',
        },
        {
          level: 6,
          name: 'Power Surge',
          description:
            'You can store magical energy within yourself to later empower your damaging spells. In its stored form, this energy is called a power surge. You can store a maximum number of power surges equal to your Intelligence modifier (minimum of one). Whenever you finish a Long Rest, your number of power surges resets to one. Whenever you successfully end a spell with Dispel Magic or Counterspell, you gain one power surge. Once per turn when you deal damage to a creature or object with a Wizard spell, you can spend one power surge to deal extra Force damage to that target equal to half your Wizard level.',
        },
        {
          level: 10,
          name: 'Durable Magic',
          description:
            'The magic you channel helps ward off harm. While you maintain Concentration on a spell, you have a +2 bonus to AC and all saving throws.',
        },
        {
          level: 14,
          name: 'Deflecting Shroud',
          description:
            'Your Arcane Deflection becomes infused with deadly magic. When you use your Arcane Deflection feature, you can cause magical energy to arc from you. Up to three creatures of your choice that you can see within 60 feet of you each take Force damage equal to half your Wizard level.',
        },
      ],
    },
  },
};
