export const MONK = {
  '5e': {
    'Way of the Open Hand': {
      flavorText: 'Monks of the Way of the Open Hand are the ultimate masters of martial arts combat, whether armed or unarmed. They learn techniques to push and trip their opponents, manipulate ki to heal damage to their bodies, and practice advanced meditation that can protect them from harm.',
      features: [
        { level: 3, name: 'Open Hand Technique', description: 'Whenever you hit a creature with one of the attacks granted by your Flurry of Blows, you can impose one of the following: the creature must succeed on a Dexterity saving throw or be knocked prone; the creature must make a Strength saving throw or be pushed up to 15 ft; or the creature can\'t take reactions until the end of your next turn.' },
        { level: 6, name: 'Wholeness of Body', description: 'As an action, you can regain hit points equal to three times your monk level. You must finish a long rest before you can use this feature again.' },
        { level: 11, name: 'Tranquility', description: 'You can enter a special meditation at the end of a long rest that gives you an effect of the sanctuary spell until the start of your next long rest (DC 8 + PB + WIS). The spell ends early if you attack a creature or take a hostile action.' },
        { level: 17, name: 'Quivering Palm', description: 'Set up lethal vibrations in a target\'s body with a melee attack. Spend 3 ki points; within 24 hours, use a bonus action to deal 10d10 necrotic damage to the target (CON save for half). The target dies immediately if reduced to 0 HP.' },
      ],
    },
    'Way of Shadow': {
      flavorText: 'Monks of the Way of Shadow follow a tradition that values stealth and subterfuge. These monks might be called ninjas or shadowdancers, and they serve as spies and assassins. Sometimes the members of a ninja monastery are family members, forming a clan sworn to secrecy about their arts and missions.',
      features: [
        { level: 3, name: 'Shadow Arts', description: 'You can spend 2 ki points to cast darkness, darkvision, pass without trace, or silence without material components. Additionally, you learn the minor illusion cantrip (INT is your casting modifier).' },
        { level: 6, name: 'Shadow Step', description: 'When you are in dim light or darkness, as a bonus action you can teleport up to 60 ft to an unoccupied space you can see that is also in dim light or darkness. You have advantage on the first melee attack you make before the end of the turn.' },
        { level: 11, name: 'Cloak of Shadows', description: 'When you are in an area of dim light or darkness, you can use your action to become invisible. You remain invisible until you make an attack, cast a spell, or are in an area of bright light.' },
        { level: 17, name: 'Opportunist', description: 'When a creature within 5 ft is hit by an attack made by a creature other than you, you can use your reaction to make a melee attack against that creature.' },
      ],
    },
    'Way of the Four Elements': {
      flavorText: 'You follow a monastic tradition that teaches you to harness the elements. When you focus your ki, you can align yourself with the forces of creation and bend the four elements to your will, using them as an extension of your body. Some members of this tradition dedicate themselves to a single element, but others weave the elements together.',
      features: [
        { level: 3, name: 'Disciple of the Elements', description: 'Learn the Elemental Attunement cantrip (minor elemental effects at will). You also learn 2 elemental disciplines (from a list of 17) that let you spend ki points to cast spells like burning hands, thunderwave, water whip, or earth tremor. Learn one more discipline at levels 6, 11, and 17.' },
        { level: 6, name: 'Additional Elemental Discipline', description: 'Learn one additional elemental discipline. You can also use disciplines that cost 4 ki points.' },
        { level: 11, name: 'Additional Elemental Discipline', description: 'Learn one additional elemental discipline. You can now use disciplines costing up to 5 ki points, and unlock tier 3 disciplines like wall of fire.' },
        { level: 17, name: 'Additional Elemental Discipline', description: 'Learn one additional elemental discipline. You unlock the most powerful tier-4 disciplines, including elemental control effects on par with 7th-level spells.' },
      ],
    },
    'Way of the Drunken Master': {
      flavorText: 'The Way of the Drunken Master teaches its students to move with the jerky, unpredictable movements of a drunkard. A drunken master sways, totters, and seems to fall — and then strikes with lightning speed and power. A drunken master is often seen as comical, leading enemies to underestimate them.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'You gain proficiency in the Performance skill and with brewer\'s supplies.' },
        { level: 3, name: 'Drunken Technique', description: 'When you use Flurry of Blows, you can take the Disengage action as a bonus action, and your walking speed increases by 10 ft until the end of the current turn.' },
        { level: 6, name: 'Tipsy Sway', description: 'Leap to Your Feet: When prone, standing up costs only 5 ft of movement (instead of half your speed). Redirect Attack: When a melee attack misses you, spend 1 ki point as a reaction to redirect it to a creature within 5 ft of you (attacker rerolls with the same modifier).' },
        { level: 11, name: 'Drunkard\'s Luck', description: 'You always seem to get a lucky bounce at just the right moment. When you make an ability check, attack roll, or saving throw and have disadvantage on the roll, you can spend 2 ki points to cancel the disadvantage for that roll.' },
        { level: 17, name: 'Intoxicated Frenzy', description: 'When you use Flurry of Blows, you can make up to three additional attacks with it (total of 5 Flurry strikes), provided each attack targets a different creature.' },
      ],
    },
    'Way of the Kensei': {
      flavorText: 'Monks of the Way of the Kensei train relentlessly with their weapons to the point where the weapon becomes an extension of the body. Founded on a mastery of sword fighting, the tradition has expanded to include many different weapons. A kensei sees a weapon in much the same way a calligrapher or painter regards a pen or brush.',
      features: [
        { level: 3, name: 'Path of the Kensei', description: 'Certain weapons become Kensei weapons for you (choose 2 at level 3, gaining more as you level). Kensei weapons count as monk weapons. For melee kensei weapons, gain +2 AC as a bonus action when you attack with them. For ranged kensei weapons, draw them as part of the attack.' },
        { level: 3, name: 'Agile Parry', description: 'If you make an unarmed strike as part of the Attack action on your turn and are holding a kensei weapon, use it to defend. You gain a +2 bonus to AC until the start of your next turn as long as you\'re holding the weapon.' },
        { level: 6, name: 'Kensei\'s Shot', description: 'Use a bonus action on your turn to make your ranged attacks with a kensei weapon more powerful until the end of the turn, dealing an extra 1d4 damage.' },
        { level: 6, name: 'One with the Blade', description: 'Your kensei weapons count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks. Additionally, spend 1 ki to grant +1d4 damage to all kensei weapon attacks until end of turn.' },
        { level: 11, name: 'Sharpen the Blade', description: 'As a bonus action, grant your kensei weapon a bonus to attack and damage rolls equal to the number of ki points spent (max 3) for 1 minute.' },
        { level: 17, name: 'Unerring Accuracy', description: 'Once per turn, if you miss an attack roll with a monk weapon, you can reroll it. You can use the new roll.' },
      ],
    },
    'Way of the Sun Soul': {
      flavorText: 'Monks of the Way of the Sun Soul learn to channel their life energy into searing bolts of light. They teach that meditation can unlock the ability to unleash the indomitable light shed by the soul of every living creature.',
      features: [
        { level: 3, name: 'Radiant Sun Bolt', description: 'You can hurl searing bolts of magical radiance. You can use your ranged attack (DEX or STR) or replace one attack to make a Radiant Sun Bolt attack (range 30 ft, 1d4 + DEX or STR radiant damage). You can spend 1 ki to make two bolts as a bonus action.' },
        { level: 6, name: 'Searing Arc Strike', description: 'Immediately after taking the Attack action, spend 2 ki points (+ 1 per spell slot level above 1) to cast burning hands as a bonus action. Wisdom is your spellcasting modifier.' },
        { level: 11, name: 'Searing Sunburst', description: 'Create a brilliant ball of light as an action. Any creature in a 20 ft radius must succeed on a Constitution saving throw (DC 8 + PB + WIS) or take 2d6 radiant damage. Spend ki (1 per die, max 3) to increase the damage.' },
        { level: 17, name: 'Sun Shield', description: 'You become wreathed in a luminous, magical aura: shed bright light to 30 ft (can turn off as bonus action). When a creature hits you with a melee attack, deal 5 + WIS modifier radiant damage to the attacker.' },
      ],
    },
    'Way of the Ascendant Dragon': {
      flavorText: 'The fundamental teaching of this tradition holds that by emulating dragons, a monk becomes a true spiritual descendant of Bahamut, the Platinum Dragon — working to make the world a better place. Monks who follow the Way of the Ascendant Dragon work with their breath and ki to embody this ideal.',
      features: [
        { level: 3, name: 'Draconic Disciple', description: 'Learn to speak, read, and write Draconic. Make unarmed strikes deal acid, cold, fire, lightning, or poison damage (your choice per hit). Also learn the thaumaturgy cantrip if not already known.' },
        { level: 3, name: 'Breath of the Dragon', description: 'As a bonus action when you use Flurry of Blows, replace one hit with a breath weapon — 20 ft line or 20 ft cone dealing 2d10 damage of your elemental type (DEX save for half). Spend 1 ki for an extra 1d10. Usable PB times per long rest (or spend 2 ki).' },
        { level: 6, name: 'Wings Unfurled', description: 'Spend 1 ki when you use Step of the Wind to sprout spectral wings, granting fly speed equal to walking speed until end of turn.' },
        { level: 11, name: 'Aspect of the Wyrm', description: 'As a bonus action, create a 10 ft aura for 1 minute: allies are resistant to the damage type of your Breath of the Dragon, and enemies who enter the aura must make a WIS save or be frightened until the end of their turn. Usable PB times per long rest.' },
        { level: 17, name: 'Ascendant Aspect', description: 'Blindsight to 10 ft. When using Breath of the Dragon, deal 3d10 (instead of 2d10). When an aura creature fails the frightened save, they also take 3d10 damage of your type.' },
      ],
    },
    'Way of the Astral Self': {
      flavorText: 'A monk who follows the Way of the Astral Self believes that their body is an illusion. They see their ki as a representation of their true form, an astral self. This path emphasizes that by shedding the physical, a monk can better understand the cosmic nature of existence.',
      features: [
        { level: 3, name: 'Arms of the Astral Self', description: 'Spend 1 ki to summon spectral arms for 10 minutes. They can make reach attacks (5 ft extended to 10 ft), use WIS instead of STR/DEX for attack and damage rolls, and deal 1d6 (1d8 if unarmed strike from your body is involved) force or bludgeoning damage.' },
        { level: 6, name: 'Visage of the Astral Self', description: 'Spend 1 ki to summon the visage of your astral self for 10 minutes: Astral Sight (see through magical darkness, to 120 ft), Wisdom of the Spirit (add WIS modifier to Charisma and Insight checks), Word of the Spirit (speak and be heard clearly up to 600 ft).' },
        { level: 11, name: 'Body of the Astral Self', description: 'When you have both Arms and Visage active, your astral form creates a defensive shell. As a reaction when hit, take only half damage (the other half dealt back as force damage). Also deal extra 1d6 force damage when you take the Attack action with your arms.' },
        { level: 17, name: 'Awakened Astral Self', description: 'Summon your complete astral self as a bonus action (spending 5 ki), manifesting arms, visage, and body simultaneously plus a flight speed equal to your walking speed. Attacks deal an extra 2d6 force damage (instead of 1d6).' },
      ],
    },
    'Way of Mercy': {
      flavorText: 'Monks of the Way of Mercy learn to manipulate the life force of others to bring aid to those in need. They are wanderers who journey through the world seeking those in need of medical care. They wear masks, often depicting a face of serene compassion or simply blank white — representing the impartiality of life and death.',
      features: [
        { level: 3, name: 'Implements of Mercy', description: 'Gain proficiency in Insight and Medicine, plus herbalism kit. Learn the disguise kit if not already known.' },
        { level: 3, name: 'Hand of Harm', description: 'When you hit with an unarmed strike, spend 1 ki to deal extra necrotic damage equal to 1 monk die + WIS modifier. Can be used on the same target as Hand of Healing in a turn.' },
        { level: 3, name: 'Hand of Healing', description: 'Spend 1 ki as an action to touch a creature and restore HP equal to 1 monk die + WIS modifier. Can replace one Flurry of Blows hit with this healing.' },
        { level: 6, name: 'Physician\'s Touch', description: 'Hand of Healing can also end one disease or one condition (blinded, deafened, paralyzed, poisoned, stunned) on the target. Hand of Harm also poisons the target until the end of your next turn.' },
        { level: 11, name: 'Flurry of Healing and Harm', description: 'Use Flurry of Blows to make Hand of Healing or Hand of Harm attacks, spending the ki as normal. Physician\'s Touch applies to all Flurry healing attacks, without spending additional ki.' },
        { level: 17, name: 'Hand of Ultimate Mercy', description: 'As an action, touch a creature that died in the last 24 hours and spend 5 ki. The creature returns to life with 4d10 + WIS hit points and is cured of all conditions. Usable once per long rest.' },
      ],
    },
  },

  '5.5e': {
    'Warrior of the Open Hand': {
      flavorText: 'Warriors of the Open Hand are the ultimate masters of unarmed martial arts. The 2024 revision sharpens Open Hand Technique into a menu of powerful debuffing options, while Quivering Palm becomes even more lethal at high levels.',
      features: [
        { level: 3, name: 'Open Hand Technique', description: 'When you hit with a Flurry of Blows attack, impose one of: the target must DEX save or fall prone; the target must STR save or be pushed 15 ft; the target can\'t take reactions until the end of your next turn.' },
        { level: 6, name: 'Wholeness of Body', description: 'As a Bonus Action, spend 3 Focus Points to heal a number of HP equal to your Monk level × your Wisdom modifier. Usable once per long rest.' },
        { level: 11, name: 'Fleet Step', description: 'When you take a Bonus Action other than Step of the Wind, you can also use Step of the Wind as part of the same Bonus Action.' },
        { level: 17, name: 'Quivering Palm', description: 'When you hit with an unarmed strike, spend 4 Focus Points to set up lethal vibrations. Within 1 hour, you can end them as a Bonus Action, dealing 10d12 Necrotic damage (CON save for half). Instantly kills creatures that fail the save and are reduced to 0 HP.' },
      ],
    },
    'Warrior of Shadow': {
      flavorText: 'Warriors of Shadow follow a tradition that values stealth and subterfuge. The 2024 revision renames the subclass and expands the ninja/shadowdancer fantasy with cleaner access to shadow abilities at lower ki (now focus point) cost.',
      features: [
        { level: 3, name: 'Shadow Arts', description: 'Spend 2 Focus Points to cast darkness, darkvision, pass without trace, or silence. You also learn the minor illusion cantrip (WIS is your spellcasting modifier).' },
        { level: 6, name: 'Shadow Step', description: 'When you\'re in dim light or darkness, teleport up to 60 ft to another dim-light or darkness space as a Bonus Action. You have advantage on the first melee attack you make before the end of the turn.' },
        { level: 11, name: 'Cloak of Shadows', description: 'While in dim light or darkness, use your action to become Invisible until the start of your next turn, or until you attack or cast a spell.' },
        { level: 17, name: 'Opportunist', description: 'When a creature within 5 ft of you is hit by an attack made by another creature, you can use your Reaction to make one unarmed strike against the hit creature.' },
      ],
    },
    'Warrior of the Elements': {
      flavorText: 'This tradition — the 2024 revision of the Way of the Four Elements — streamlines elemental disciplines into a coherent AoE-focused system. Warriors of the Elements become conduits of elemental power, shaping their surroundings through focused ki.',
      features: [
        { level: 3, name: 'Elemental Attunement', description: 'At the start of your turn, spend 1 Focus Point to harness elemental energy until the start of your next turn: reach extends to 15 ft for strikes (dealing chosen element damage), and you can move across earth, water, or air without opportunity attacks.' },
        { level: 3, name: 'Environmental Burst', description: 'As a Magic action, spend 2 Focus Points to cause an elemental burst in a 20 ft radius centered within 120 ft. Creatures must make a DEX save or take 2d6 damage of your element (half on success). Difficult terrain created for 1 minute.' },
        { level: 6, name: 'Stride of the Elements', description: 'While Elemental Attunement is active, you gain a Swim Speed and Fly Speed both equal to your Speed.' },
        { level: 11, name: 'Elemental Epitome', description: 'While Elemental Attunement is active, you gain resistance to one damage type (Acid, Cold, Fire, Lightning, or Thunder), and elemental damage from your Monk attacks ignores resistance.' },
        { level: 17, name: 'Convergence', description: 'When you use Environmental Burst, you can spend 2 additional Focus Points to cause the burst to also push creatures 30 ft away from the center, or to summon a continuous elemental zone for 1 minute that deals 2d6 damage each round.' },
      ],
    },
    'Warrior of Mercy': {
      flavorText: 'Warriors of Mercy learn to manipulate the life force of others. The 2024 rules preserve the healing/harm duality while making Flurry of Healing and Harm available earlier and polishing the hand features for more consistent play.',
      features: [
        { level: 3, name: 'Hand of Harm', description: 'When you hit a creature with an Unarmed Strike, spend 1 Focus Point to deal extra Necrotic damage equal to one Martial Arts die + WIS modifier. Also poisons the target until end of your next turn.' },
        { level: 3, name: 'Hand of Healing', description: 'Spend 1 Focus Point as a Bonus Action to touch a creature and restore HP equal to one Martial Arts die + WIS modifier. Can replace one Flurry of Blows attack.' },
        { level: 6, name: 'Physician\'s Touch', description: 'Hand of Healing can also end one condition (Blinded, Deafened, Paralyzed, Poisoned, or Stunned). Hand of Harm poisons the target.' },
        { level: 11, name: 'Flurry of Healing and Harm', description: 'You can use Hand of Healing with each hit from Flurry of Blows, spending 1 Focus Point per hit (Physician\'s Touch applies automatically).' },
        { level: 17, name: 'Hand of Ultimate Mercy', description: 'Spend 5 Focus Points as an action to touch a creature that died in the last 24 hours. It returns to life with 4d10 + WIS HP, cured of all conditions. Usable once per long rest.' },
      ],
    },
    'Warrior of the Astral Self': {
      flavorText: 'A Warrior of the Astral Self believes the body is an illusion and their ki is their true form. The 2024 rules tighten the astral arm and visage summoning into a more streamlined action economy, making the astral fantasy easier to express in every combat.',
      features: [
        { level: 3, name: 'Arms of the Astral Self', description: 'Spend 1 Focus Point as a Bonus Action to summon spectral arms for 10 minutes. They extend your reach by 5 ft and use WIS for attack/damage (1d6 Force or Bludgeoning, 1d8 with both arms).' },
        { level: 6, name: 'Visage of the Astral Self', description: 'Spend 1 Focus Point as a Bonus Action to summon your astral visage for 10 minutes: Astral Sight (see through magical darkness, 120 ft), Wisdom of the Spirit (WIS to Insight and CHA checks), Word of the Spirit (voice carries to 600 ft).' },
        { level: 11, name: 'Body of the Astral Self', description: 'When Arms and Visage are both active, gain a defensive shell: take half damage on hits (reaction, returns other half as Force damage to attacker). Attacks with Arms deal +1d6 Force damage.' },
        { level: 17, name: 'Awakened Astral Self', description: 'Spend 5 Focus Points as a Bonus Action to summon arms, visage, and body simultaneously, plus gain a Fly Speed equal to your Speed. Attacks with the astral arms deal +2d6 Force damage.' },
      ],
    },
    'Warrior of the Drunken Master': {
      flavorText: 'The Warrior of the Drunken Master sways and totters — and strikes with lightning speed. The 2024 revision keeps the unpredictable movement fantasy while making Tipsy Sway\'s redirect attack slightly more intuitive and Intoxicated Frenzy\'s multi-target condition clearer.',
      features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'Gain proficiency in Performance and brewer\'s supplies.' },
        { level: 3, name: 'Drunken Technique', description: 'When you use Flurry of Blows, you can take the Disengage action as a Bonus Action and your speed increases by 10 ft until the end of that turn.' },
        { level: 6, name: 'Tipsy Sway', description: 'When prone, standing up costs only 5 ft. When a melee attack misses you, spend 1 Focus Point as a Reaction to redirect it to a different creature within 5 ft.' },
        { level: 11, name: 'Drunkard\'s Luck', description: 'When you have disadvantage on an attack roll, ability check, or saving throw, spend 2 Focus Points to cancel the disadvantage.' },
        { level: 17, name: 'Intoxicated Frenzy', description: 'When you use Flurry of Blows, make up to three additional attacks (5 total), provided each targets a different creature.' },
      ],
    },
    'Warrior of the Kensei': {
      flavorText: 'Warriors of the Kensei treat their chosen weapons as an extension of their body. The 2024 rules refine kensei weapon categories and give the subclass more ways to express weapon mastery through ki at high levels.',
      features: [
        { level: 3, name: 'Path of the Kensei', description: 'Choose 2 weapons as Kensei weapons (must include one ranged). They count as Monk weapons. For melee kensei weapons, gain +2 AC as a Bonus Action when attacking. For ranged, draw as part of attacking.' },
        { level: 6, name: 'One with the Blade', description: 'Kensei weapons count as magical. Spend 1 Focus Point as a Bonus Action to grant +1d4 damage on all kensei attacks until end of turn.' },
        { level: 11, name: 'Sharpen the Blade', description: 'Spend 1–3 Focus Points as a Bonus Action to grant your kensei weapon a +1 to +3 bonus to attack and damage rolls for 1 minute.' },
        { level: 17, name: 'Unerring Accuracy', description: 'Once per turn, if you miss with a Monk weapon, reroll the attack and use the new roll.' },
      ],
    },
    'Warrior of the Sun Soul': {
      flavorText: 'Warriors of the Sun Soul learn to channel their life energy into searing bolts of light. The 2024 revision gives the Radiant Sun Bolt better damage scaling and makes Searing Sunburst\'s cost more flexible at higher levels.',
      features: [
        { level: 3, name: 'Radiant Sun Bolt', description: 'Make a ranged attack (30 ft range) as part of the Attack action dealing 1d4 + DEX/STR Radiant damage. Spend 1 Focus Point as a Bonus Action to make two bolts.' },
        { level: 6, name: 'Searing Arc Strike', description: 'After the Attack action, spend 2 Focus Points (+ 1 per extra level) to cast burning hands as a Bonus Action (WIS is your spellcasting modifier).' },
        { level: 11, name: 'Searing Sunburst', description: 'As an action, create a 20 ft radius burst of radiance. Creatures must CON save (DC 8 + PB + WIS) or take 2d6 Radiant damage. Spend up to 3 Focus Points for +1d6 per point.' },
        { level: 17, name: 'Sun Shield', description: 'You shed bright light to 30 ft (togglable as a Bonus Action). When a creature hits you with a melee attack, deal 5 + WIS Radiant damage to it as a Reaction.' },
      ],
    },
  },
};
