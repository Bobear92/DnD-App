export const BARD = {
  '5e': {
    'College of Lore': {
      flavorText: 'Bards of the College of Lore know something about most things, collecting bits of knowledge from sources as diverse as scholarly tomes and peasant tales. Whether singing folk ballads in taverns or elaborate compositions in royal courts, these bards use their gifts to hold audiences spellbound.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'You gain proficiency in three skills of your choice.' },
        { level: 3, name: 'Cutting Words', description: 'When a creature you can see within 60 ft makes an attack roll, ability check, or damage roll, you can use your reaction and expend a Bardic Inspiration die to subtract the roll from their result. You can choose to use this after the creature makes its roll but before the DM announces whether it succeeds.' },
        { level: 6, name: 'Additional Magical Secrets', description: 'You learn two spells of your choice from any class. A spell you choose must be of a level you can cast. These spells count as bard spells for you.' },
        { level: 14, name: 'Peerless Skill', description: 'When you make an ability check, you can expend a Bardic Inspiration die and add the result to your ability check. You can choose to do so after you roll the die but before the DM says whether you succeed or fail.' },
      ],
    },
    'College of Valor': {
      flavorText: 'Bards of the College of Valor are daring skalds whose tales keep alive the memory of the great heroes of the past. These bards gather in mead halls or around great bonfires to sing the deeds of the mighty, both to inspire the living and to honor the dead.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'You gain proficiency with medium armor, shields, and martial weapons.' },
        { level: 3, name: 'Combat Inspiration', description: 'You learn to inspire others in battle. When a creature has a Bardic Inspiration die from you, they can also use it to add to a weapon damage roll or to add to their AC against an attack.' },
        { level: 6, name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
        { level: 14, name: 'Battle Magic', description: 'You have mastered the art of weaving spellcasting and weapon use together. When you use your action to cast a bard spell, you can make one weapon attack as a bonus action.' },
      ],
    },
    'College of Glamour': {
      flavorText: 'The College of Glamour is the home of bards who mastered their craft in the vibrant realm of the Feywild or under the tutelage of someone who dwelled there. Tutored by satyrs, eladrin, and other fey, these bards learn to use their magic to delight and captivate others.',
      features: [
        { level: 3, name: 'Mantle of Inspiration', description: 'As a bonus action, expend a Bardic Inspiration die to grant a number of creatures (up to your Charisma modifier) within 60 ft temporary HP equal to the die roll + your CHA modifier. Each creature can also immediately move up to their speed without provoking opportunity attacks.' },
        { level: 3, name: 'Enthralling Performance', description: 'After performing for 1 minute, up to your Charisma modifier number of humanoids who watched are charmed by you for 1 hour. While charmed, they regard you as a friendly acquaintance.' },
        { level: 6, name: 'Mantle of Majesty', description: 'As a bonus action, you cast command without using a spell slot. For 1 minute (concentration), you can cast command as a bonus action each turn without expending a slot. Creatures charmed by Enthralling Performance automatically fail their save against this command.' },
        { level: 14, name: 'Unbreakable Majesty', description: 'As a bonus action, you assume a magically majestic presence for 1 minute. For the duration, each time any creature tries to attack you for the first time on a turn, it must succeed on a Charisma saving throw or waste the attack by attacking a different target (or lose the attack if none is available).' },
      ],
    },
    'College of Swords': {
      flavorText: 'Bards of the College of Swords are called blades, and they entertain through daring feats of weapon prowess. Blades perform stunts such as sword swallowing, knife throwing and juggling, and mock combats. Though they use their weapons to entertain, they are also highly trained and skilled warriors in their own right.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'You gain proficiency with medium armor and scimitars.' },
        { level: 3, name: 'Fighting Style', description: 'You adopt a fighting style as your specialty: Dueling (+2 damage with a one-handed weapon when no other weapons are held) or Two-Weapon Fighting (add ability modifier to the damage of your off-hand attack).' },
        { level: 3, name: 'Blade Flourish', description: 'When you take the Attack action, your walking speed increases by 10 ft. If you hit a creature with a weapon attack, you can expend a Bardic Inspiration die to use one flourish: Defensive (add die to your AC until next turn), Slashing (deal die as damage to target and an adjacent creature), or Mobile (push target up to die result × 5 ft, no opportunity attacks this turn).' },
        { level: 6, name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
        { level: 14, name: 'Master\'s Flourish', description: 'Whenever you use a Blade Flourish option, you can roll a d6 and use it instead of expending a Bardic Inspiration die.' },
      ],
    },
    'College of Whispers': {
      flavorText: 'Most folk are happy to welcome a bard into their midst. Bards of the College of Whispers use this to their advantage. They appear to be like other bards, sharing news, singing songs, and telling tales to the audiences they gather. In truth, the College of Whispers teaches its students that they are wolves among sheep.',
      features: [
        { level: 3, name: 'Psychic Blades', description: 'When you hit a creature with a weapon attack, you can expend a Bardic Inspiration die to deal psychic damage in addition to the weapon\'s damage. The amount is 2d6 at level 3, increasing to 3d6 at level 5, 5d6 at level 10, and 8d6 at level 15.' },
        { level: 3, name: 'Words of Terror', description: 'You learn to infuse innocent-seeming words with an insidious magic that can inspire terror. After speaking privately with a humanoid for 1 minute, they must succeed on a Wisdom saving throw or become frightened of you for 1 hour.' },
        { level: 6, name: 'Mantle of Whispers', description: 'When a humanoid dies within 30 ft of you, you can use your reaction to magically capture their shadow. You can then assume the guise of that person for up to 1 hour, gaining access to their surface memories to impersonate them.' },
        { level: 14, name: 'Shadow Lore', description: 'As an action, you magically whisper a phrase that only one creature within 30 ft can hear. The target must succeed on a Wisdom saving throw or become frightened and charmed by you for 8 hours. This requires no spell slot and can be used once per long rest.' },
      ],
    },
    'College of Creation': {
      flavorText: 'Bards believe the cosmos is a work of art — the creation of the first dragons and gods. That creative work included harmonies that continue to resound through existence: the Song of Creation. Bards of the College of Creation draw on that primordial song through dance, music, and poetry, and their teachers share this lesson above all others.',
      features: [
        { level: 3, name: 'Mote of Potential', description: 'When you give a creature a Bardic Inspiration die, you can also confer a mote of potential. The mote\'s effect depends on how the die is used — bonus to attack (roll twice, use higher), ability check (minor illusion-like shimmer grants advantage on one check), or saving throw (on fail, deal psychic damage to the attacker equal to the die roll).' },
        { level: 3, name: 'Performance of Creation', description: 'As an action, create one nonmagical item of your choice worth up to 20 gp × your proficiency bonus in an unoccupied space within 10 ft of you. It lasts until your next long rest. Usable once per long rest (or by expending a 2nd-level or higher spell slot).' },
        { level: 6, name: 'Animating Performance', description: 'As an action, target one Large or smaller nonmagical item you can see within 30 ft and animate it. The animated object follows your verbal commands and can attack, move, and take other actions for 1 hour.' },
        { level: 14, name: 'Creative Crescendo', description: 'When you use Performance of Creation, you can create up to a number of items equal to your proficiency bonus. Each item must be a different kind of object.' },
      ],
    },
    'College of Eloquence': {
      flavorText: 'Adherents of the College of Eloquence master the art of oratory. Persuasion is considered a high art, and a well-reasoned, well-spoken argument often proves more powerful than objective truth. These bards wield a blend of logic and theatrical wordplay, winning over skeptics and detractors with logical arguments and plucking at heartstrings to appeal to the emotions of allies and enemies alike.',
      features: [
        { level: 3, name: 'Silver Tongue', description: 'You are a master at saying the right thing at the right time. When you make a Charisma (Persuasion) or Charisma (Deception) check, you can treat a die roll of 9 or lower as a 10.' },
        { level: 3, name: 'Unsettling Words', description: 'You can spin words laced with magic that unsettle a creature and make it doubt itself. As a bonus action, expend a Bardic Inspiration die and choose one creature within 60 ft. Roll the die — the creature subtracts that number from the next saving throw it makes before the start of your next turn.' },
        { level: 6, name: 'Unfailing Inspiration', description: 'Your inspiring words are so persuasive that others feel driven to succeed. When a creature uses a Bardic Inspiration die from you and fails, the die is not expended.' },
        { level: 6, name: 'Universal Speech', description: 'You have gained the ability to make your speech comprehensible to any creature. As an action, choose a number of creatures within 60 ft up to your CHA modifier. Each chosen creature can magically understand you for 1 hour, regardless of language. Usable PB times per long rest.' },
        { level: 14, name: 'Infectious Inspiration', description: 'When a creature uses a Bardic Inspiration die you gave them and succeeds, you can use your reaction to give a different creature within 60 ft a Bardic Inspiration die without expending one of your uses. Usable CHA modifier times per long rest.' },
      ],
    },
    'College of Spirits': {
      flavorText: 'Bards of the College of Spirits seek tales with inherent power — the old stories that have long outlived the people who first told them. These bards use their knowledge of stories and the power of spiritual forces to communicate with the dead and draw on the might of spirits from the beyond.',
      features: [
        { level: 3, name: 'Guiding Whispers', description: 'You can reach out to spirits to guide others. You learn the guidance cantrip, which you can cast at a range of 60 ft (instead of touch).' },
        { level: 3, name: 'Spiritual Focus', description: 'You employ tools that spirits have hinted will help you — a candle, crystal ball, skull, spirit board, or tarokka deck. When you cast a bard spell through this focus, you can roll a d6 and add it to one damage or healing roll of the spell.' },
        { level: 3, name: 'Tales from Beyond', description: 'You reach out to spirits who tell their tales through you. You can expend a Bardic Inspiration die to roll on the Spirit Tales table and apply a magical effect based on the result, drawing on the power of ancient stories.' },
        { level: 6, name: 'Spirit Session', description: 'You can conduct a séance. Over 1 hour, you and up to PB willing participants commune with spirits. Each participant learns one spell from any class spell list; you learn one additional spell as well. These spells are temporarily added to your spell list until the next séance.' },
        { level: 14, name: 'Mystical Connection', description: 'You now have a more powerful connection to the spirit world. Whenever you use your Tales from Beyond feature, you can roll the die twice and choose which of the two effects to apply.' },
      ],
    },
  },

  '5.5e': {
    'College of Dance': {
      flavorText: 'Bards of the College of Dance know that the Words of Creation can\'t be contained in song and story; they must also be expressed in motion. By mastering the art of dance, these bards become one with the cosmic forces that animate all life. They blend fluid movement with martial skill and spellcasting.',
      features: [
        { level: 3, name: 'Dazzling Footwork', description: 'While not wearing armor, your AC equals 10 + your Dexterity modifier + your Charisma modifier. Additionally, when you make an unarmed strike or use a weapon, you can deal Bludgeoning damage equal to a Bardic Inspiration die + your Dexterity modifier.' },
        { level: 3, name: 'Inspiring Movement', description: 'When an enemy ends its turn within 5 ft of an ally of yours, you can use your reaction and expend a Bardic Inspiration die to move that ally up to their speed without provoking opportunity attacks.' },
        { level: 6, name: 'Tandem Footwork', description: 'When you roll initiative, you can expend a Bardic Inspiration die and roll it. Each ally within 30 ft who can see you gains a bonus to their initiative roll equal to the number rolled.' },
        { level: 14, name: 'Leading Evasion', description: 'When you are subjected to an effect that allows a Dexterity saving throw to take only half damage, you instead take no damage on a successful save and half damage on a failed save. When you use this feature, each ally within 5 ft who can see you may also benefit from it.' },
      ],
    },
    'College of Glamour': {
      flavorText: 'The College of Glamour is the home of bards who mastered their craft in the vibrant realm of the Feywild. These bards learn to use their magic to delight and captivate others. The 2024 revision refines these abilities into a more cohesive package of fey-touched charm and inspiration.',
      features: [
        { level: 3, name: 'Beguiling Magic', description: 'You always have the charm person and mirror image spells prepared. When a creature fails a saving throw against a Bard spell you cast, you can also cause it to be charmed or frightened (your choice) until the end of your next turn.' },
        { level: 3, name: 'Mantle of Inspiration', description: 'As a bonus action, expend a Bardic Inspiration die. Each creature you choose within 60 ft (up to your CHA modifier) gains temporary HP equal to the die result + CHA modifier and can immediately move up to their speed without provoking opportunity attacks.' },
        { level: 6, name: 'Mantle of Majesty', description: 'As a bonus action, you take on an unearthly air for 1 minute. For the duration, you can cast command as a bonus action on each of your turns without expending a spell slot, and creatures charmed by you automatically fail their saving throws against your commands.' },
        { level: 14, name: 'Unbreakable Majesty', description: 'You now radiate such majestic power that attacks against you falter. As a bonus action, assume a magically majestic presence. For 1 minute, any creature that tries to attack you must make a Charisma saving throw or be forced to target another creature, wasting its action if no other target is available.' },
      ],
    },
    'College of Lore': {
      flavorText: 'Bards of the College of Lore know something about most things, collecting bits of knowledge from sources as diverse as scholarly tomes and peasant tales. The 2024 rules sharpen Cutting Words into a more versatile tool and refine the college\'s identity as the premier knowledge-gathering and enemy-undermining tradition.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'You gain proficiency in three skills of your choice from any list.' },
        { level: 3, name: 'Cutting Words', description: 'When a creature you can see within 60 ft makes an attack roll, ability check, or damage roll, use your reaction and expend a Bardic Inspiration die to subtract the number rolled from the result. You can do this after the roll but before knowing success or failure.' },
        { level: 6, name: 'Magical Discoveries', description: 'You learn two spells of your choice from any class spell list. These spells count as Bard spells for you and are always prepared.' },
        { level: 14, name: 'Peerless Skill', description: 'When you make an ability check, you can expend a Bardic Inspiration die and add the result to your roll after seeing the number but before the DM announces the outcome.' },
      ],
    },
    'College of Valor': {
      flavorText: 'Bards of the College of Valor are daring skalds whose tales keep alive the memory of the great heroes of the past, and who fight alongside those heroes in the present. The 2024 rules tighten the college\'s martial identity and make Battle Magic a cornerstone of the high-level fantasy.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'You gain proficiency with medium armor, shields, and martial weapons.' },
        { level: 3, name: 'Combat Inspiration', description: 'Creatures with a Bardic Inspiration die from you can expend it to add to a weapon damage roll or to their AC against a single attack.' },
        { level: 6, name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
        { level: 14, name: 'Battle Magic', description: 'When you use your action to cast a Bard spell, you can make one weapon attack as a bonus action. Your weapon attacks count as magical for the purpose of overcoming resistance and immunity.' },
      ],
    },
    'College of Swords': {
      flavorText: 'Bards of the College of Swords are called blades, entertaining through daring feats of weapon prowess. The 2024 version sharpens the Blade Flourish system and delivers Extra Attack at the same level as the Valor bard for parity, making the Swords bard a true martial-caster hybrid.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'You gain proficiency with medium armor and the Scimitar.' },
        { level: 3, name: 'Fighting Style', description: 'Choose Dueling (+2 damage when fighting with one weapon and no other weapons) or Two-Weapon Fighting (add ability modifier to off-hand damage).' },
        { level: 3, name: 'Blade Flourish', description: 'When you take the Attack action, your walking speed increases by 10 ft. On a hit, expend a Bardic Inspiration die for a Flourish — Defensive (add die to AC), Slashing (deal die damage to a second creature within 5 ft), or Mobile (push target up to die × 5 ft, no opportunity attacks).' },
        { level: 6, name: 'Extra Attack', description: 'You can attack twice whenever you take the Attack action.' },
        { level: 14, name: 'Master\'s Flourish', description: 'You can roll a d6 when using a Blade Flourish instead of expending a Bardic Inspiration die.' },
      ],
    },
    'College of Whispers': {
      flavorText: 'Bards of the College of Whispers appear like other bards, sharing news and singing songs. In truth, the College of Whispers teaches that bards are wolves among sheep, and they use their magical arts to manipulate, infiltrate, and dominate. The 2024 revision refines the college\'s espionage toolkit.',
      features: [
        { level: 3, name: 'Psychic Blades', description: 'When you hit a creature with a weapon attack, expend a Bardic Inspiration die to deal extra psychic damage: 2d6 at level 3, scaling to 8d6 at level 15.' },
        { level: 3, name: 'Words of Terror', description: 'After speaking privately with a humanoid for 1 minute, they must succeed on a Wisdom saving throw or become frightened of you for 1 hour (or until they take damage from you or your companions).' },
        { level: 6, name: 'Mantle of Whispers', description: 'When a humanoid dies within 30 ft of you, you can capture their shadow as a reaction. You can assume their appearance and surface memories for up to 1 hour, impersonating them convincingly.' },
        { level: 14, name: 'Shadow Lore', description: 'Whisper a phrase to one creature within 30 ft that only it can hear. The target must succeed on a Wisdom saving throw or become frightened and charmed for 8 hours. Usable once per long rest without a spell slot.' },
      ],
    },
  },
};
