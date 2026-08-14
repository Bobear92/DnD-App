export const FIGHTER = {
  '5e': {
    'Champion': {
      flavorText: 'The archetypal Champion focuses on the development of raw physical power honed to deadly perfection. Those who model themselves on this archetype combine rigorous training with physical excellence to deal devastating blows. They are defined by their relentless pursuit of physical excellence.',
      features: [
        { level: 3, name: 'Improved Critical', description: 'Your weapon attacks score a critical hit on a roll of 19 or 20.' },
        { level: 7, name: 'Remarkable Athlete', description: 'You can add half your proficiency bonus (rounded up) to any Strength, Dexterity, or Constitution check that doesn\'t already use your proficiency bonus. Additionally, when you make a running long jump, the distance you can cover increases by a number of feet equal to your Strength modifier.' },
        { level: 10, name: 'Additional Fighting Style', description: 'You can choose a second option from the Fighting Style class feature.' },
        { level: 15, name: 'Superior Critical', description: 'Your weapon attacks score a critical hit on a roll of 18–20.' },
        { level: 18, name: 'Survivor', description: 'You attain the pinnacle of resilience in battle. At the start of each of your turns, you regain hit points equal to 5 + your Constitution modifier if you have no more than half of your hit points left. You don\'t gain this benefit if you have 0 hit points.' },
      ],
    },
    'Battle Master': {
      flavorText: 'Those who emulate the ideal of the Battle Master employ martial techniques passed down through generations. To a Battle Master, combat is an academic field, sometimes including subjects beyond battle such as weaponsmithing, cartography, history, and tactics. Not every fighter absorbs the lessons of history, theory, and artistry that are reflected in the Battle Master archetype.',
      features: [
        { level: 3, name: 'Combat Superiority', description: 'You learn maneuvers that are fueled by special dice called superiority dice (d8s, number equal to your proficiency bonus). You learn three maneuvers of your choice (from a list) and regain all dice on a short or long rest.' },
        { level: 3, name: 'Student of War', description: 'You gain proficiency with one type of artisan\'s tools of your choice.' },
        { level: 7, name: 'Know Your Enemy', description: 'If you spend at least 1 minute observing or interacting with another creature outside combat, you can learn certain information about its capabilities compared to your own: equal, superior, or inferior in Strength, Dexterity, Constitution, AC, HP, total class levels, or fighter levels.' },
        { level: 10, name: 'Improved Combat Superiority', description: 'Your superiority dice turn into d10s.' },
        { level: 15, name: 'Relentless', description: 'When you roll initiative and have no superiority dice remaining, you regain 1 superiority die.' },
        { level: 18, name: 'Improved Combat Superiority (d12)', description: 'Your superiority dice turn into d12s.' },
      ],
    },
    'Eldritch Knight': {
      flavorText: 'The archetypal Eldritch Knight combines the martial mastery common to all fighters with a careful study of magic. Eldritch Knights use magical techniques similar to those practiced by wizards. They focus their study on two of the eight schools of magic: abjuration and evocation.',
      features: [
        { level: 3, name: 'Spellcasting', description: 'You augment your martial prowess with the ability to cast spells. You learn spells primarily from the abjuration and evocation schools; Intelligence is your spellcasting ability.' },
        { level: 3, name: 'Weapon Bond', description: 'You learn a ritual that creates a magical bond between yourself and one weapon. Once bonded, you can\'t be disarmed of that weapon and can summon it to your hand as a bonus action.' },
        { level: 7, name: 'War Magic', description: 'When you use your action to cast a cantrip, you can make one weapon attack as a bonus action.' },
        { level: 10, name: 'Eldritch Strike', description: 'You learn to make your weapon strikes undercut a creature\'s resistance to your spells. When you hit a creature with a weapon attack, that creature has disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn.' },
        { level: 15, name: 'Arcane Charge', description: 'When you use your Action Surge, you can teleport up to 30 ft to an unoccupied space you can see, either before or after the extra action.' },
        { level: 18, name: 'Improved War Magic', description: 'When you use your action to cast a spell, you can make one weapon attack as a bonus action (upgraded from cantrips only).' },
      ],
    },
    'Arcane Archer': {
      flavorText: 'An Arcane Archer studies a unique elven method of archery that weaves magic into attacks to produce supernatural effects. Arcane Archers are some of the most elite warriors among the elves. They stand watch over the fringes of elven domains, using magic-infused arrows to defeat monsters and invaders before they can reach elven settlements.',
      features: [
        { level: 3, name: 'Arcane Archer Lore', description: 'You gain proficiency in either the Arcana or Nature skill, and you learn the Prestidigitation or Druidcraft cantrip.' },
        { level: 3, name: 'Arcane Shot', description: 'You learn to unleash special magical effects with some of your shots. You know two Arcane Shot options (Banishing Arrow, Beguiling Arrow, Bursting Arrow, Enfeebling Arrow, Grasping Arrow, Piercing Arrow, Seeking Arrow, or Shadow Arrow) and gain more as you level. Once per turn when you fire an arrow from a shortbow or longbow as part of the Attack action, you can apply one option to that arrow. You have two uses, regained on a short or long rest, and each time you gain a Fighter level you can replace one option you know. Your Arcane Shot save DC is 8 + your proficiency bonus + your Intelligence modifier.' },
        { level: 7, name: 'Magic Arrow', description: 'You gain the ability to infuse arrows with magic. Whenever you fire a nonmagical arrow, you can make it magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.' },
        { level: 7, name: 'Curving Shot', description: 'You learn how to direct an errant arrow toward a new target. When you make an attack roll with a magic arrow and miss, you can use a bonus action to reroll the attack roll against a different target within 60 ft of the original target.' },
        { level: 10, name: 'Additional Arcane Shot', description: 'You learn one more Arcane Shot option of your choice. Your number of uses per rest does not change.' },
        { level: 15, name: 'Ever-Ready Shot', description: 'Your magic infuses you with a measure of arcane readiness. When you roll initiative and have no uses of Arcane Shot remaining, you regain one use of it.' },
        { level: 18, name: 'Superior Arcane Shot', description: 'You learn one more Arcane Shot option, and every option you know gains its improved effect — the damage each deals increases. The improved effects are shown on each option in your Arcane Shot list.' },
      ],
    },
    'Cavalier': {
      flavorText: 'The archetypal Cavalier excels at mounted combat. Usually born among the nobility and raised at court, a Cavalier is equally at home leading a cavalry charge or exchanging repartee at a state dinner. Cavaliers also learn how to guard those in their charge from harm, often serving as the protectors of their superiors and of the weak.',
      features: [
        { level: 3, name: 'Bonus Proficiency', description: 'You gain proficiency in one of the following skills: Animal Handling, History, Insight, Performance, or Persuasion. Alternatively, you learn one language of your choice.' },
        { level: 3, name: 'Born to the Saddle', description: 'Your mastery as a rider becomes apparent. You have advantage on saving throws made to avoid falling off your mount. If you fall off your mount and descend no more than 10 ft, you can land on your feet if you\'re not incapacitated. Mounting or dismounting costs you only 5 ft of movement, rather than half your speed.' },
        { level: 3, name: 'Unwavering Mark', description: 'When you hit a creature with a melee weapon attack, you can mark it until the end of your next turn. While it is within 5 ft of you, a marked creature has disadvantage on any attack roll that doesn\'t target you. If a marked creature deals damage to anyone other than you, you can make a special melee weapon attack against it as a bonus action on your next turn, with advantage on the attack roll; on a hit it deals extra damage equal to half your Fighter level. However many creatures you have marked, you can make this special attack a number of times equal to your Strength modifier (a minimum of once) per long rest.' },
        { level: 7, name: 'Warding Maneuver', description: 'When you or a creature you can see within 5 ft is hit by an attack, and you are wielding a melee weapon or a shield, you can use your reaction to roll a d8 and add the number rolled to the target\'s AC against that attack — potentially making it miss. If the attack still hits, the target has resistance against its damage. Use this a number of times equal to your Constitution modifier (a minimum of once) per long rest.' },
        { level: 10, name: 'Hold the Line', description: 'You become a master of locking down enemies. Creatures provoke opportunity attacks from you when they move 5 ft or more while within your reach, and if you hit a creature with an opportunity attack, its speed is reduced to 0 for the rest of the current turn.' },
        { level: 15, name: 'Ferocious Charger', description: 'You can run down your foes. If you move at least 10 ft in a straight line right before attacking a creature and you hit it, that creature must succeed on a Strength saving throw (DC 8 + PB + STR) or be knocked prone. You can use this feature only once per turn.' },
        { level: 18, name: 'Vigilant Defender', description: 'You respond to danger with extraordinary vigilance. In combat, you get a special reaction that you can take once on every creature\'s turn except your own. You can use this special reaction only to make an opportunity attack, and it does not consume your normal reaction.' },
      ],
    },
    'Echo Knight': {
      flavorText: 'A mysterious and feared frontline warrior of the Kryn Dynasty, the Echo Knight has mastered the art of dunamis to summon the fading shades of unrealized timelines to aid them in battle. Alongside their ghostly echo, they charge into the fray as a terrible one-two punch.',
      features: [
        { level: 3, name: 'Manifest Echo', description: 'As a bonus action, manifest an echo of yourself in an unoccupied space within 15 ft. It has 1 HP, AC = 14 + PB, and shares your stats but can\'t take actions. When you take the Attack action, one of your attacks can originate from the echo\'s location. You can swap places with it using 15 ft of movement.' },
        { level: 3, name: 'Unleash Incarnation', description: 'When you take the Attack action, you can make one additional melee attack from your echo\'s position. Use this a number of times equal to your CON modifier per long rest.' },
        { level: 7, name: 'Echo Avatar', description: 'You can temporarily transfer your consciousness to your echo. As an action, see through the echo\'s eyes and hear through its ears for up to 10 minutes; you can end it early at no cost. Your body is deafened and blinded while you do. The echo can be up to 1,000 ft away without any adverse effect.' },
        { level: 10, name: 'Shadow Martyr', description: 'Before an attack roll is made against a creature you can see other than yourself, you can use your reaction to teleport your echo to an unoccupied space within 5 ft of that creature. The attack targets your echo instead, which can cause it to miss. Once you use this feature, you can\'t use it again until you finish a short or long rest.' },
        { level: 15, name: 'Reclaim Potential', description: 'You\'ve learned to absorb the fleeting magic of your echo. When an echo you\'ve created is destroyed by taking damage, you gain 2d6 + CON temporary HP. Use this a number of times equal to your CON modifier per long rest.' },
        { level: 18, name: 'Legion of One', description: 'You can use a bonus action to create two echoes with your Manifest Echo feature, and these echoes can coexist. If you try to create a third, the previous two are destroyed. Anything you can do from one echo\'s position can be done from the other\'s instead. In addition, when you roll initiative and have no uses of Unleash Incarnation remaining, you regain one use of that feature.' },
      ],
    },
    'Psi Warrior': {
      flavorText: 'Awake to the psionic power within, a Psi Warrior is a fighter who augments their physical might with psi-infused weapon strikes, telekinetic lashes, and barriers of mental force. Many githyanki train as Psi Warriors. Some human tribes do as well. Whatever its source, psionic power can be a devastating martial tool.',
      features: [
        { level: 3, name: 'Psionic Power', description: 'You harbor a wellspring of psionic energy within yourself. You have a number of Psionic Energy dice (d6s equal to twice your PB). They fuel three abilities: Protective Field (reaction, reduce damage by die + INT), Psionic Strike (deal extra die + INT force damage on hit once per turn), Telekinetic Movement (bonus action, move one object or willing creature 30 ft).' },
        { level: 7, name: 'Telekinetic Adept', description: 'Psi-Powered Leap (bonus action, gain fly speed equal to walking speed until end of turn), Telekinetic Thrust (when Psionic Strike hits, target must STR save or be knocked prone or moved 10 ft).' },
        { level: 10, name: 'Guarded Mind', description: 'Resistance to psychic damage. When you start your turn frightened or charmed, you can spend a Psionic Energy die to end the condition on yourself.' },
        { level: 15, name: 'Bulwark of Force', description: 'As a bonus action, choose up to a number of creatures equal to your INT modifier (including yourself) within 30 ft. Each gains half cover for 1 minute. Usable once per long rest (or spend a Psionic Energy die).' },
        { level: 18, name: 'Telekinetic Master', description: 'You can cast telekinesis at will without a spell slot or components, using INT as your spellcasting ability. While concentrating on it, you can make one weapon attack as a bonus action.' },
      ],
    },
    'Rune Knight': {
      flavorText: 'Rune Knights enhance their martial prowess using the supernatural power of runes, an ancient practice that originated with giants. Rune magic is often considered a secret art, as giants guard these mysteries closely. Some fighters seek out giants or their ruins to learn rune lore.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'You gain proficiency with smith\'s tools, and you learn to speak, read, and write Giant.' },
        { level: 3, name: 'Rune Carving', description: 'You can use magic runes to enhance your gear. You learn two runes at level 3 (from Cloud, Fire, Frost, Hill, Stone, or Storm runes, each providing a passive benefit and an active Channel Rune effect once per short or long rest).' },
        { level: 3, name: 'Giant\'s Might', description: 'As a bonus action, magically grow to Large size for 1 minute. While Large, your weapon attacks deal an extra 1d6 damage, you gain advantage on Strength checks and saving throws, and you can grapple Large creatures. Use this a number of times equal to your PB per long rest.' },
        { level: 7, name: 'Runic Shield', description: 'When another creature you can see within 60 ft is hit by an attack roll, use your reaction to force the attacker to reroll the attack and use the lower of the two rolls. Use this PB times per long rest.' },
        { level: 10, name: 'Great Stature', description: 'The runes you\'ve carved have begun to permanently embiggen you. When you use Giant\'s Might, the extra damage increases to 1d8. Additionally, your height increases by 3d4 inches and your equipment automatically adjusts to fit your new size.' },
        { level: 15, name: 'Master of Runes', description: 'You can invoke each rune you know twice per short or long rest (instead of once).' },
        { level: 18, name: 'Runic Juggernaut', description: 'Your rune magic and your body have become one. When you use Giant\'s Might, you can grow to Huge size (instead of Large), your extra damage increases to 1d10, and you can grapple creatures of Huge size or smaller.' },
      ],
    },
    'Samurai': {
      flavorText: 'The Samurai is a fighter who draws on an implacable fighting spirit to overcome enemies. A Samurai\'s resolve is nearly unbreakable, and the enemies in a Samurai\'s path have two choices: yield or die fighting. The Samurai\'s code of honor and battle philosophy define who they are.',
      features: [
        { level: 3, name: 'Bonus Proficiency', description: 'You gain proficiency in one of the following skills: History, Insight, Performance, or Persuasion. Alternatively, you learn one language of your choice.' },
        { level: 3, name: 'Fighting Spirit', description: 'As a bonus action, give yourself advantage on all weapon attack rolls until the end of the current turn and gain 5 temporary HP (10 at level 10, 15 at level 15). You can use this three times per long rest.' },
        { level: 7, name: 'Elegant Courtier', description: 'Your discipline and attention to detail allow you to excel in social situations. Whenever you make a Charisma (Persuasion) check, you add your Wisdom modifier to the result. Also gain proficiency in Wisdom saving throws.' },
        { level: 10, name: 'Tireless Spirit', description: 'When you roll initiative and have no uses of Fighting Spirit remaining, you regain one use.' },
        { level: 15, name: 'Rapid Strike', description: 'You learn to trade accuracy for swift strikes. If you take the Attack action and have advantage on an attack roll against one of the targets, you can forgo the advantage on that roll to make one additional weapon attack against that target as part of the same action.' },
        { level: 18, name: 'Strength Before Death', description: 'Your fighting spirit can delay the grasp of death. If you take damage that reduces you to 0 HP, you can delay that damage and take an extra turn (interrupting the regular turn order). At the end of that extra turn, you take the damage and any other damage from that turn.' },
      ],
    },
  },

  '5.5e': {
    'Battle Master': {
      flavorText: 'Those who emulate the Battle Master employ martial techniques passed down through generations. The 2024 rules expand the maneuver list and smooth out the superiority dice progression, making the Battle Master more versatile at all levels of play.',
      features: [
        { level: 3, name: 'Combat Superiority', description: 'You learn maneuvers fueled by Superiority Dice (d8s equal to your PB). Learn three maneuvers; regain all dice on a short or long rest.' },
        { level: 3, name: 'Student of War', description: 'You gain proficiency in one type of artisan\'s tools of your choice.' },
        { level: 7, name: 'Know Your Enemy', description: 'Spend 1 minute observing a creature to learn how its Strength, Dexterity, Constitution, AC, current HP, total class levels, and Fighter levels compare to yours.' },
        { level: 10, name: 'Improved Combat Superiority', description: 'Your Superiority Dice become d10s.' },
        { level: 15, name: 'Relentless', description: 'When you roll initiative with no Superiority Dice remaining, you regain 1 die.' },
        { level: 18, name: 'Ultimate Combat Superiority', description: 'Your Superiority Dice become d12s.' },
      ],
    },
    'Champion': {
      flavorText: 'The Champion focuses on the development of raw physical power honed to deadly perfection. The 2024 rules refine the Champion\'s critical hit range improvements and add the Heroic Warrior feature to give the archetype more active battlefield presence.',
      features: [
        { level: 3, name: 'Improved Critical', description: 'Your attack rolls with weapons and Unarmed Strikes can score a Critical Hit on a roll of 19 or 20.' },
        { level: 3, name: 'Remarkable Athlete', description: 'You have Advantage on Initiative rolls and Strength (Athletics) checks. In addition, immediately after you score a Critical Hit, you can move up to half your Speed without provoking Opportunity Attacks.' },
        { level: 7, name: 'Additional Fighting Style', description: 'You gain another Fighting Style feat of your choice.' },
        { level: 10, name: 'Heroic Warrior', description: 'During combat, you can give yourself Heroic Inspiration whenever you start your turn without it.' },
        { level: 15, name: 'Superior Critical', description: 'Your attack rolls with weapons and Unarmed Strikes can now score a Critical Hit on a roll of 18–20.' },
        { level: 18, name: 'Survivor', description: 'At the start of each of your turns, if you have at least 1 Hit Point but no more than half your Hit Point maximum, you regain Hit Points equal to 5 + your CON modifier. You also gain a +3 bonus to any death saving throw you make.' },
      ],
    },
    'Eldritch Knight': {
      flavorText: 'The Eldritch Knight combines martial mastery with spellcasting, focusing on abjuration and evocation magic. The 2024 rules give Eldritch Knights slightly more spell flexibility and refine War Magic into a consistently useful feature at every tier.',
      features: [
        { level: 3, name: 'Spellcasting', description: 'You can cast spells from the Wizard list (primarily Abjuration and Evocation). Intelligence is your spellcasting ability.' },
        { level: 3, name: 'Weapon Bond', description: 'Perform a ritual to bond with up to two weapons. You can\'t be disarmed of bonded weapons and can summon them to your hand as a Bonus Action.' },
        { level: 7, name: 'War Magic', description: 'When you use your action to cast a cantrip, you can make one weapon attack as a Bonus Action.' },
        { level: 10, name: 'Eldritch Strike', description: 'When you hit a creature with a weapon attack, it has disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn.' },
        { level: 15, name: 'Arcane Charge', description: 'When you use Action Surge, you can teleport up to 30 ft to an unoccupied space you can see before or after taking the extra action.' },
        { level: 18, name: 'Improved War Magic', description: 'When you use your action to cast any spell (not just a cantrip), you can make one weapon attack as a Bonus Action.' },
      ],
    },
    'Psi Warrior': {
      flavorText: 'The Psi Warrior augments physical might with telekinetic power. The 2024 revision keeps the Psionic Energy die system intact while improving the flow of Telekinetic Adept and raising the ceiling on the late-game Telekinetic Master feature.',
      features: [
        { level: 3, name: 'Psionic Power', description: 'You have a pool of Psionic Energy dice (d6s, number = twice your PB). Use them for Protective Field (reduce damage), Psionic Strike (bonus force damage), and Telekinetic Movement (move an object or creature 30 ft).' },
        { level: 7, name: 'Telekinetic Adept', description: 'Gain Psi-Powered Leap (fly speed equal to walking speed for one turn) and Telekinetic Thrust (on Psionic Strike hit, target must STR save or be knocked prone or pushed 10 ft).' },
        { level: 10, name: 'Guarded Mind', description: 'Resistance to psychic damage. Spend a Psionic Energy die to end a frightened or charmed condition on yourself at the start of your turn.' },
        { level: 15, name: 'Bulwark of Force', description: 'As a Bonus Action, grant half cover to up to INT modifier creatures within 30 ft for 1 minute. Usable once per long rest (or spend a Psionic Energy die).' },
        { level: 18, name: 'Telekinetic Master', description: 'Cast telekinesis at will without a spell slot or components, using INT as your spellcasting ability. While concentrating on it, you can make one weapon attack as a Bonus Action each turn.' },
      ],
    },
  },
};
