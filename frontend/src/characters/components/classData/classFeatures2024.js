// D&D 2024 (5.5e) class features by level
// Key differences from 2014: subclass timing shifts, renamed abilities, new level 1 features

export const HIT_DICE_2024 = {
  Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8, Fighter: 10,
  Monk: 8, Paladin: 10, Ranger: 10, Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6,
};

export const CLASS_FEATURES_2024 = {

  Barbarian: {
    1: [
      { name: 'Rage', description: 'On your turn you can enter a rage as a bonus action. While raging you gain advantage on Strength checks and saving throws, a damage bonus to melee Strength attacks (+2 at levels 1–8, +3 at 9–15, +4 at 16+), and resistance to bludgeoning, piercing, and slashing damage. You can rage 2 times per long rest (increases at higher levels). Starting at 3rd level, you can enter rage as part of your initiative roll.' },
      { name: 'Unarmored Defense', description: 'While not wearing armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.' },
      { name: 'Weapon Mastery', description: 'Your training with weapons allows you to use the mastery properties of two kinds of Simple or Martial Melee weapons of your choice. You can change your mastery weapon choices when you finish a Long Rest.' },
    ],
    2: [
      { name: 'Danger Sense', description: 'You have advantage on Dexterity saving throws against effects you can see, such as traps and spells. To gain this benefit, you can\'t be blinded, deafened, or incapacitated.' },
      { name: 'Reckless Attack', description: 'When you make your first attack on your turn, you can decide to attack recklessly. Doing so gives you Advantage on melee weapon attack rolls using Strength during this turn, but attack rolls against you have Advantage until your next turn.' },
    ],
    3: [
      { name: 'Primal Knowledge', description: 'You gain proficiency in one skill of your choice from the Barbarian skill list.' },
      { name: 'Primal Path', description: 'You choose a Primal Path. Your choice grants you features at 3rd, 6th, 10th, and 14th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [
      { name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
      { name: 'Fast Movement', description: 'Your speed increases by 10 feet while you aren\'t wearing heavy armor.' },
    ],
    6: [
      { name: 'Path Feature', description: 'You gain a feature from your Primal Path.' },
    ],
    7: [
      { name: 'Feral Instinct', description: 'You have Advantage on Initiative rolls. Additionally, if you are Surprised at the start of combat, you can take your first turn as normal if you enter a Rage during that turn.' },
      { name: 'Instinctive Pounce', description: 'As part of the Bonus Action you take to enter your Rage, you can move up to half your Speed.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [
      { name: 'Brutal Strike', description: 'If you use Reckless Attack, you can forgo Advantage on one Strength-based attack in the current turn. If that attack hits, the target takes an extra 1d10 damage of the same type as the weapon and you can apply a Brutal Strike effect: Forceful Blow (push 15 ft) or Hamstring Blow (halve target\'s speed until start of your next turn). More effects unlock at 13th and 17th level.' },
    ],
    10: [
      { name: 'Path Feature', description: 'You gain a feature from your Primal Path.' },
    ],
    11: [
      { name: 'Relentless Rage', description: 'If you drop to 0 HP while raging, you can make a DC 10 Con save to drop to 1 HP instead. Each use after the first increases the DC by 5. Resets on a long rest.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [
      { name: 'Brutal Strike Improvement', description: 'Unlock two more Brutal Strike effects: Staggering Blow (Disadvantage on next attack before your next turn) and Sundering Blow (the next attack roll against the target has Advantage).' },
    ],
    14: [
      { name: 'Path Feature', description: 'You gain a feature from your Primal Path.' },
    ],
    15: [
      { name: 'Persistent Rage', description: 'Your rage can now only end early if you choose to end it or you fall Unconscious.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [
      { name: 'Brutal Strike Improvement', description: 'Brutal Strike deals 2d10 extra damage instead of 1d10.' },
    ],
    18: [
      { name: 'Indomitable Might', description: 'If your total for a Strength check is less than your Strength score, you can use that score in place of the total.' },
    ],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Primal Champion', description: 'Your Strength and Constitution each increase by 4. Their maximum is now 25.' },
    ],
  },

  Bard: {
    1: [
      { name: 'Bardic Inspiration', description: 'As a Bonus Action, give a Bardic Inspiration die (d6, upgraded later) to one creature within 60 feet who can hear you. They can use it within 10 minutes on an attack roll, ability check, or saving throw. You can use this a number of times equal to your Charisma modifier, regaining all uses on a short or long rest (regain on Short Rest from 1st level, unlike 2014).' },
      { name: 'Spellcasting', description: 'You know two cantrips and four 1st-level spells from the bard spell list. Charisma is your spellcasting ability.' },
    ],
    2: [
      { name: 'Expertise', description: 'Choose two skills you\'re proficient in. Double your proficiency bonus for those skills.' },
      { name: 'Jack of All Trades', description: 'Add half your proficiency bonus (rounded down) to any ability check that doesn\'t already use your proficiency bonus.' },
    ],
    3: [
      { name: 'Bard Subclass', description: 'Choose a Bard subclass (College). Your choice grants you features at 3rd, 6th, and 14th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [
      { name: 'Font of Inspiration', description: 'Bardic Inspiration die increases to d8. You regain uses on a Short or Long Rest.' },
    ],
    6: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Bard Subclass.' },
      { name: 'Countercharm', description: 'As an Action, start a performance lasting until the end of your next turn. You and friendly creatures within 30 feet have Advantage on saves against being Charmed or Frightened.' },
    ],
    7: [
      { name: 'Expertise', description: 'Choose two more skill proficiencies to double with your proficiency bonus.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [
      { name: 'Magical Secrets', description: 'Choose two spells from any class list. They count as bard spells for you.' },
    ],
    10: [
      { name: 'Bardic Inspiration (d10)', description: 'Your Bardic Inspiration die increases to d10.' },
    ],
    11: [],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [
      { name: 'Magical Secrets', description: 'Choose two more spells from any class list.' },
    ],
    14: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Bard Subclass.' },
    ],
    15: [
      { name: 'Bardic Inspiration (d12)', description: 'Your Bardic Inspiration die increases to d12.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [
      { name: 'Magical Secrets', description: 'Choose two more spells from any class list.' },
    ],
    18: [],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Words of Creation', description: 'You learn the Power Word Heal and Power Word Kill spells. These are always prepared and don\'t count against your prepared spells. You can cast each once without a slot per long rest.' },
    ],
  },

  Cleric: {
    1: [
      { name: 'Divine Order', description: 'Choose Protector (gain Martial weapon proficiency and Heavy armor proficiency) or Thaumaturge (learn one extra cantrip from the cleric list and Cleric spells you cast ignore verbal components).' },
      { name: 'Spellcasting', description: 'Wisdom is your spellcasting ability. You prepare cleric spells equal to your Wisdom modifier + your cleric level. You always have your Domain spells prepared.' },
    ],
    2: [
      { name: 'Channel Divinity', description: 'You gain two Channel Divinity uses (recharge on Short or Long Rest). You always have Divine Spark and Turn Undead.' },
      { name: 'Divine Spark', description: 'Spend one Channel Divinity use to restore or deal (1d8 per 2 cleric levels) radiant or necrotic damage/healing to a creature within 30 feet. Target makes a Constitution save to halve if dealing damage.' },
      { name: 'Turn Undead', description: 'Spend one Channel Divinity use: each undead within 30 feet must make a Wisdom save or be Turned for 1 minute.' },
    ],
    3: [
      { name: 'Cleric Subclass', description: 'You choose a Divine Domain subclass at 3rd level (shifted from 1st in 2014). Your choice grants features at 3rd, 6th, 8th, and 17th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [
      { name: 'Sear Undead', description: 'When undead fail their Turn Undead save, they also take radiant damage equal to your Wisdom modifier (minimum 1).' },
    ],
    6: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Divine Domain.' },
    ],
    7: [
      { name: 'Blessed Strikes', description: 'Divine power infuses your attacks. When you hit a creature with a weapon or cantrip, you can cause the hit to deal an extra 1d8 radiant or necrotic damage. Once per turn.' },
    ],
    8: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Divine Domain.' },
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [],
    10: [
      { name: 'Divine Intervention', description: 'Call on your deity for aid using your Action. Roll d100. If you roll ≤ your cleric level, your deity intervenes (DM determines how). Success: unavailable for 7 days. Failure: available again after a Long Rest.' },
    ],
    11: [],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [],
    14: [],
    15: [],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [
      { name: 'Subclass Feature', description: 'You gain a capstone feature from your Divine Domain.' },
    ],
    18: [],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Greater Divine Intervention', description: 'Your Divine Intervention succeeds automatically, no die roll required. Once used, you can\'t use it again for 2d4 days.' },
    ],
  },

  Druid: {
    1: [
      { name: 'Primal Order', description: 'Choose Magician (learn one extra cantrip from any list; use Wisdom for it) or Warden (gain Martial weapon proficiency and Medium armor training).' },
      { name: 'Spellcasting', description: 'Wisdom is your spellcasting ability. You prepare spells equal to your Wisdom modifier + your druid level.' },
      { name: 'Druidic', description: 'You know the Druidic language and can leave hidden nature messages in the wild.' },
    ],
    2: [
      { name: 'Wild Shape', description: 'As a Bonus Action, transform into a beast with CR ≤ floor(your level / 3). At 2nd level this is CR 1/3 beasts only. Duration: 1 hour or until you drop to 0 HP. You regain 2 Wild Shape uses on a Short or Long Rest.' },
      { name: 'Wild Companion', description: 'Spend a Wild Shape use to cast Find Familiar as a ritual (no material components). The familiar is a Fey Spirit.' },
    ],
    3: [
      { name: 'Druid Subclass', description: 'Choose a Circle subclass at 3rd level (shifted from 2nd in 2014). Features at 3rd, 6th, 10th, and 14th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
      { name: 'Wild Shape Improvement', description: 'You can now use Wild Shape as a Bonus Action.' },
    ],
    5: [
      { name: 'Wild Resurgence', description: 'Once per turn, if you have no Wild Shape uses remaining, you can expend one spell slot (any level) to gain one Wild Shape use. Also, if you have no 1st-level spell slots remaining, you can spend one Wild Shape use to gain one 1st-level slot.' },
    ],
    6: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Druid Circle.' },
      { name: 'Elemental Fury', description: 'Choose an Elemental Fury option each time you prepare spells: Potent Spellcasting (add Wisdom modifier to cantrip damage) or Primal Strike (weapon + Wild Shape attacks count as magical and deal extra damage equal to your Wisdom modifier).' },
    ],
    7: [],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [],
    10: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Druid Circle.' },
    ],
    11: [],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [],
    14: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Druid Circle.' },
    ],
    15: [],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [],
    18: [
      { name: 'Beast Spells', description: 'You can cast many of your druid spells in any Wild Shape form (verbal and somatic components only).' },
    ],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Archdruid', description: 'You can use your Wild Shape an unlimited number of times. Additionally, the Primal Strike Elemental Fury option deals extra damage equal to your Wisdom modifier every time you hit, not just once per turn.' },
    ],
  },

  Fighter: {
    1: [
      { name: 'Fighting Style', description: 'Choose one fighting style specialty: Archery (+2 to ranged attack rolls), Blind Fighting (10 ft. blindsight), Defense (+1 AC while armored), Dueling (+2 damage with one-handed weapon), Great Weapon Fighting (reroll 1s/2s on damage), Interception (reaction: reduce damage to nearby creature by 1d10 + PB), Protection (impose Disadvantage on attack against adjacent creature when shielded), Thrown Weapon Fighting (draw thrown weapon as part of attack, +2 damage), Two-Weapon Fighting (add modifier to off-hand attack), Unarmed Fighting (1d6 or 1d8 unarmed strikes, grappled target takes 1d4 bludgeoning).' },
      { name: 'Second Wind', description: 'Bonus Action: regain 1d10 + Fighter level HP. Uses equal to your Constitution modifier (minimum 1), all regained on a Short or Long Rest.' },
      { name: 'Weapon Mastery', description: 'You can use the mastery property of three weapons you\'re proficient with. You can change which weapons at the end of a Long Rest.' },
    ],
    2: [
      { name: 'Action Surge', description: 'Once per turn, take one additional Action on your turn. Recharges on Short or Long Rest. Gain a second use at 17th level.' },
      { name: 'Tactical Mind', description: 'When you fail an ability check, you can expend one use of Second Wind to add 1d10 to the check, potentially turning it into a success (rolled after the check but before the DM determines success or failure).' },
    ],
    3: [
      { name: 'Fighter Subclass', description: 'Choose a Martial Archetype subclass. Features at 3rd, 7th, 10th, 15th, and 18th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [
      { name: 'Extra Attack', description: 'You can attack twice whenever you take the Attack action.' },
    ],
    6: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    7: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Martial Archetype.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [
      { name: 'Tactical Shift', description: 'Whenever you activate Second Wind, you can move up to half your speed without provoking Opportunity Attacks.' },
      { name: 'Indomitable', description: 'Reroll a failed saving throw once per Long Rest (2/LR at 13th, 3/LR at 17th).' },
    ],
    10: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Martial Archetype.' },
    ],
    11: [
      { name: 'Extra Attack (3)', description: 'You can attack three times whenever you take the Attack action.' },
      { name: 'Two Extra Attacks', description: 'Applies whenever you take the Attack action.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [
      { name: 'Indomitable (2/LR)', description: 'You can use Indomitable twice between Long Rests.' },
      { name: 'Studied Attacks', description: 'When you miss with an attack, the next attack roll you make against the same target has Advantage (provided it occurs before the end of your next turn).' },
    ],
    14: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    15: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Martial Archetype.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
      { name: 'Weapon Mastery (6 weapons)', description: 'You can now use the mastery property of six weapons.' },
    ],
    17: [
      { name: 'Action Surge (2/rest)', description: 'You can use Action Surge twice between rests.' },
      { name: 'Indomitable (3/LR)', description: 'You can use Indomitable three times between Long Rests.' },
    ],
    18: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Martial Archetype.' },
    ],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Extra Attack (4)', description: 'You can attack four times whenever you take the Attack action.' },
    ],
  },

  Monk: {
    1: [
      { name: 'Martial Arts', description: 'Unarmed strikes and monk weapons use your Martial Arts die (d6→d8 at 5→d10 at 11→d12 at 17). You can use Dex or Str for attack and damage rolls with these weapons. You can make one Unarmed Strike as a Bonus Action when you take the Attack action with these weapons.' },
      { name: 'Unarmored Defense', description: 'AC = 10 + Dex modifier + Wis modifier while wearing no armor and no shield.' },
      { name: 'Weapon Mastery', description: 'Use the mastery property of one Simple or Martial Melee weapon you\'re proficient with. Change choice on Long Rest.' },
    ],
    2: [
      { name: 'Monk\'s Focus (Ki, renamed)', description: 'You have Focus Points equal to your Monk level, regained on Short or Long Rest. Use them for: Flurry of Blows (1 pt: two Unarmed Strikes as Bonus Action), Patient Defense (1 pt: Dodge as Bonus Action), Step of the Wind (1 pt: Disengage or Dash as Bonus Action; jump distance doubled).' },
      { name: 'Unarmored Movement', description: 'Speed increases by 10 ft while unarmored and unshielded (increases at higher levels).' },
      { name: 'Uncanny Metabolism', description: 'When you roll Initiative, you can regain Focus Points equal to your Proficiency Bonus. 1/Long Rest.' },
    ],
    3: [
      { name: 'Deflect Attacks', description: 'As a Reaction when hit by an attack, reduce damage by 1d10 + Dex + Monk level. If reduced to 0, you can spend 1 Focus Point to redirect the attack (30 ft range, +5 to hit, same damage type).' },
      { name: 'Monk Subclass', description: 'Choose a Monastic Tradition subclass. Features at 3rd, 6th, 11th, and 17th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
      { name: 'Slow Fall', description: 'Reaction: reduce falling damage by 5× Monk level.' },
    ],
    5: [
      { name: 'Extra Attack', description: 'Attack twice whenever you take the Attack action.' },
      { name: 'Stunning Strike', description: 'Spend 1 Focus Point when you hit a creature with an attack. Target makes a Con save or is Stunned until the start of your next turn.' },
    ],
    6: [
      { name: 'Empowered Strikes', description: 'Your Unarmed Strikes count as magical for purposes of overcoming resistance and immunity.' },
      { name: 'Subclass Feature', description: 'You gain a feature from your Monastic Tradition.' },
    ],
    7: [
      { name: 'Evasion', description: 'You take no damage on a successful Dexterity save against effects that deal half on a save, and only half on a failure.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [
      { name: 'Acrobatic Movement', description: 'While not wearing armor or using a shield, you can move along vertical surfaces and across liquids on your turn without falling if you end your turn on a surface or object.' },
    ],
    10: [
      { name: 'Heightened Focus', description: 'Benefits from Flurry of Blows, Patient Defense, and Step of the Wind improve: Flurry causes disadvantage on saves vs. Stunning Strike; Patient Defense grants Dodge for the full turn; Step of the Wind triples jump distance.' },
      { name: 'Self Restoration', description: 'At the end of each of your turns, you can end one of the following conditions affecting yourself: Charmed, Frightened, or Poisoned (no action or Focus Point required).' },
    ],
    11: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Monastic Tradition.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [
      { name: 'Deflect Energy', description: 'You can now use Deflect Attacks against ranged spell attacks, as well as melee weapon attacks and ranged weapon attacks.' },
    ],
    14: [
      { name: 'Disciplined Survivor', description: 'You gain proficiency in all saving throws. Whenever you make a saving throw and fail, you can spend 1 Focus Point to reroll it and take the second result.' },
    ],
    15: [
      { name: 'Perfect Focus', description: 'When you roll Initiative and have fewer Focus Points than your Proficiency Bonus, your total becomes equal to your Proficiency Bonus.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Monastic Tradition.' },
    ],
    18: [
      { name: 'Superior Defense', description: 'At the start of your turn, you can spend 3 Focus Points to give yourself resistance to all damage types until the start of your next turn.' },
    ],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Body and Mind', description: 'Your Dexterity and Wisdom each increase by 4. Their maximum is now 25.' },
    ],
  },

  Paladin: {
    1: [
      { name: 'Divine Sense', description: 'As a Bonus Action, detect the presence of Aberrations, Celestials, Fiends, and Undead within 60 feet (not behind total cover) until the end of your next turn. Uses = 1 + Cha modifier, regained on Long Rest.' },
      { name: 'Lay on Hands', description: 'Pool = 5 × Paladin level. As an Action, restore HP to a touched creature. Also spend 5 HP from pool to end one disease or poison.' },
      { name: 'Spellcasting (starts at level 1)', description: 'Unlike 2014, Paladin spell slots begin at 1st level. Charisma is your spellcasting ability. Prepare spells equal to half your Paladin level + Charisma modifier.' },
      { name: 'Weapon Mastery', description: 'Use the mastery property of two weapons you\'re proficient with. Change choices at the end of a Long Rest.' },
    ],
    2: [
      { name: 'Fighting Style', description: 'Choose a fighting style specialty (Defense, Dueling, Great Weapon Fighting, Protection, Blessed Warrior, or Blind Fighting).' },
      { name: 'Paladin\'s Smite', description: 'When you hit a creature with a melee weapon or unarmed strike, you can expend a spell slot to deal extra radiant damage: 2d8 per slot level. +1d8 against Undead or Fiends. You can use this even after seeing the roll — it is now a free-action decision after hitting.' },
    ],
    3: [
      { name: 'Channel Divinity', description: 'Gain 2 uses that recharge on Short or Long Rest. You always have Divine Smite and Sacred Weapon options; your subclass oath adds more.' },
      { name: 'Paladin Subclass (Sacred Oath)', description: 'You swear your Sacred Oath at 3rd level (shifted from 3rd in 2014, but identical timing). Features at 3rd, 7th, 15th, and 20th level.' },
      { name: 'Divine Health', description: 'You are immune to disease.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [
      { name: 'Extra Attack', description: 'Attack twice whenever you take the Attack action.' },
      { name: 'Faithful Steed', description: 'You can cast Find Steed without using a spell slot. 1/Long Rest.' },
    ],
    6: [
      { name: 'Aura of Protection', description: 'You and friendly creatures within 10 ft add your Charisma modifier (minimum 1) to all saving throws while you are conscious. Expands to 30 ft at 18th level.' },
    ],
    7: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Sacred Oath.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [
      { name: 'Abjure Foes', description: 'As an Action, expend one Channel Divinity use. Up to a number of creatures equal to your Charisma modifier (minimum 1) within 60 feet must make Wisdom saves or be Frightened and Incapacitated for 1 minute (Con save ends each turn).' },
    ],
    10: [
      { name: 'Aura of Courage', description: 'You and friendly creatures within 10 feet can\'t be Frightened while you are conscious. Expands to 30 ft at 18th level.' },
    ],
    11: [
      { name: 'Radiant Strikes', description: 'Your melee weapon and unarmed strikes deal an extra 1d8 radiant damage on a hit.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [],
    14: [
      { name: 'Restoring Touch', description: 'When you use Lay on Hands to restore HP, you can also remove one of the following: Blinded, Deafened, Paralyzed, Poisoned, or Stunned. No HP cost.' },
    ],
    15: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Sacred Oath.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [],
    18: [
      { name: 'Aura Expansion', description: 'Your Aura of Protection and Aura of Courage now extend to 30 feet.' },
    ],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Subclass Feature', description: 'You gain your Sacred Oath\'s capstone feature.' },
    ],
  },

  Ranger: {
    1: [
      { name: 'Deft Explorer', description: 'Gain the Expertise benefit for one skill you\'re proficient in, plus two languages of your choice.' },
      { name: 'Favored Enemy', description: 'Choose a type of favored enemy. You always have Hunter\'s Mark prepared and can cast it once without using a spell slot (regain on Long Rest). Gain Advantage on checks to track or recall knowledge about your favored prey.' },
      { name: 'Spellcasting (starts at level 1)', description: 'Wisdom is your spellcasting ability. Ranger spell slots begin at 1st level in the 2024 rules.' },
      { name: 'Weapon Mastery', description: 'Use the mastery property of two weapons you\'re proficient with. Change choices on Long Rest.' },
    ],
    2: [
      { name: 'Deft Explorer Improvement', description: 'You gain the Roving benefit: your Speed increases by 10 feet, and you gain a Climb and Swim speed equal to your Speed.' },
      { name: 'Fighting Style', description: 'Choose a fighting style specialty (Archery, Defense, Druidic Warrior, Thrown Weapon Fighting, or Two-Weapon Fighting).' },
    ],
    3: [
      { name: 'Ranger Subclass', description: 'Choose a Ranger subclass (e.g. Hunter, Beast Master, Gloom Stalker). Features at 3rd, 7th, 11th, and 15th level.' },
      { name: 'Roving (Deft Explorer)', description: 'Speed +10, and you gain Climb and Swim speeds equal to your Speed.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [
      { name: 'Extra Attack', description: 'Attack twice whenever you take the Attack action.' },
    ],
    6: [
      { name: 'Deft Explorer Improvement (Tireless)', description: 'As an Action, gain Temporary HP equal to 1d8 + Wisdom modifier. 1/Long Rest (plus additional uses on Short Rests up to your Wisdom modifier times).' },
    ],
    7: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Ranger Subclass.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
      { name: 'Relentless Hunter', description: 'When you cast Hunter\'s Mark, you can maintain concentration on it and one other concentration spell at the same time.' },
    ],
    9: [
      { name: 'Conjure Barrage', description: 'You always have Conjure Barrage prepared and can cast it once without a slot (regain on Long Rest).' },
    ],
    10: [
      { name: 'Deft Explorer Improvement (Nature\'s Veil)', description: 'As a Bonus Action, become invisible until the start of your next turn. Uses equal to Wisdom modifier (minimum 1), regained on Long Rest.' },
    ],
    11: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Ranger Subclass.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [
      { name: 'Conjure Volley', description: 'You always have Conjure Volley prepared and can cast it once without a slot (regain on Long Rest).' },
    ],
    14: [
      { name: 'Precise Hunter', description: 'You have Advantage on attack rolls against the creature currently marked by your Hunter\'s Mark.' },
    ],
    15: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Ranger Subclass.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [
      { name: 'Conjure Volley (free use)', description: 'You can cast Conjure Volley without a slot once per Long Rest.' },
    ],
    18: [
      { name: 'Feral Senses', description: 'You gain Blindsight with a range of 30 feet.' },
    ],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Foe Slayer', description: 'Once per turn, when you hit a creature with a weapon, you can add your Wisdom modifier to the damage roll.' },
    ],
  },

  Rogue: {
    1: [
      { name: 'Expertise', description: 'Double your proficiency bonus for two skill proficiencies of your choice.' },
      { name: 'Sneak Attack', description: 'Once per turn, deal 1d6 extra damage (scaling per level) to a creature you hit with a Finesse or Ranged weapon if you have Advantage or an ally is adjacent to the target.' },
      { name: 'Thieves\' Cant', description: 'You know the secret language and signs used by thieves to convey short messages to one another.' },
      { name: 'Weapon Mastery', description: 'Use the mastery property of two weapons you\'re proficient with. Change on Long Rest.' },
    ],
    2: [
      { name: 'Cunning Action', description: 'Bonus Action each turn: take the Dash, Disengage, or Hide action.' },
    ],
    3: [
      { name: 'Rogue Subclass', description: 'Choose a Roguish Archetype subclass. Features at 3rd, 9th, 13th, and 17th level.' },
      { name: 'Steady Aim', description: 'As a Bonus Action, give yourself Advantage on your next attack roll this turn — but your Speed must be 0 until the end of the turn.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [
      { name: 'Cunning Strike', description: 'When you deal Sneak Attack damage, you can forgo one die of Sneak Attack damage to impose one of the following effects on the target: Disarm, Poison, Trip.' },
      { name: 'Uncanny Dodge', description: 'Reaction when hit by an attack: halve the damage.' },
    ],
    6: [
      { name: 'Expertise', description: 'Choose two more skill proficiencies to double with your proficiency bonus.' },
    ],
    7: [
      { name: 'Evasion', description: 'No damage on a successful Dex save against half-damage effects; only half on failure.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Roguish Archetype.' },
    ],
    10: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    11: [
      { name: 'Reliable Talent', description: 'When you add your proficiency bonus to an ability check, treat a d20 roll of 9 or lower as a 10.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Roguish Archetype.' },
    ],
    14: [
      { name: 'Devious Strikes', description: 'Expand Cunning Strike options with Daze, Knock Out, and Obscure at the cost of more Sneak Attack dice.' },
    ],
    15: [
      { name: 'Slippery Mind', description: 'You gain proficiency in Wisdom and Charisma saving throws.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Roguish Archetype.' },
    ],
    18: [
      { name: 'Elusive', description: 'No attack roll has Advantage against you while you\'re not Incapacitated.' },
    ],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Stroke of Luck', description: 'Turn a missed attack into a hit, or a failed ability check into a 20 (treat d20 as 20). 1/Short or Long Rest.' },
    ],
  },

  Sorcerer: {
    1: [
      { name: 'Innate Sorcery', description: 'As a Bonus Action, enter a 1-minute state of magical empowerment. While active, the save DC of your spells increases by 1 and you have Advantage on attack rolls of spells you cast. 2/Long Rest.' },
      { name: 'Spellcasting', description: 'Charisma is your spellcasting ability. You know 2 cantrips and 2 1st-level spells.' },
      { name: 'Sorcerous Origin', description: 'Choose a subclass at 1st level (same as 2014). Features at 1st, 6th, 14th, and 18th level.' },
    ],
    2: [
      { name: 'Font of Magic', description: 'Gain 2 sorcery points (+1 per level). Convert sorcery points to spell slots or slots to points. Same costs as 2014.' },
    ],
    3: [
      { name: 'Metamagic', description: 'Gain 2 Metamagic options (2 more at 10th, and another at 17th). Same options as 2014: Careful, Distant, Empowered, Extended, Heightened, Quickened, Seeking, Subtle, Transmuted, Twinned.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [
      { name: 'Sorcerous Restoration', description: 'When you finish a Short Rest, you can regain expended sorcery points. The total regained can\'t exceed half your maximum (rounded up). 1/Long Rest.' },
    ],
    6: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Sorcerous Origin.' },
    ],
    7: [],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [],
    10: [
      { name: 'Metamagic', description: 'Learn two more Metamagic options.' },
    ],
    11: [],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [],
    14: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Sorcerous Origin.' },
    ],
    15: [],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [
      { name: 'Metamagic', description: 'Learn one more Metamagic option.' },
    ],
    18: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Sorcerous Origin.' },
    ],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Arcane Apotheosis', description: 'While your Innate Sorcery is active, you can use one Metamagic option on each of your turns without spending sorcery points (once per turn).' },
    ],
  },

  Warlock: {
    1: [
      { name: 'Eldritch Invocations', description: 'Learn 2 Eldritch Invocations of your choice (starting at 1st level, earlier than 2014\'s 2nd level). Gain more as you level. You can replace one invocation whenever you gain a Warlock level.' },
      { name: 'Pact Magic', description: 'Charisma is your spellcasting ability. Your spell slots refresh on Short or Long Rest. Slot level increases: 1st at level 1, 2nd at 3rd, 3rd at 5th, 4th at 7th, 5th at 9th.' },
      { name: 'Otherworldly Patron', description: 'Choose your patron at 1st level. Features at 1st, 6th, 10th, and 14th level.' },
    ],
    2: [
      { name: 'Magical Cunning', description: 'If you have no Pact Magic slots remaining, you can perform a 1-minute ritual to regain half your maximum slots (rounded up). 1/Long Rest.' },
    ],
    3: [
      { name: 'Warlock Subclass Feature', description: 'You gain a feature from your Otherworldly Patron.' },
      { name: 'Pact Boon', description: 'Expand your invocation access to pact boon invocations now that you\'ve reached 3rd level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [
      { name: 'Contact Patron', description: 'As an Action, ask your patron a question. They can choose to answer or remain silent. 1/Long Rest.' },
    ],
    6: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Otherworldly Patron.' },
    ],
    7: [],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [],
    10: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Otherworldly Patron.' },
    ],
    11: [
      { name: 'Mystic Arcanum (6th level)', description: 'Gain a 6th-level spell as a Mystic Arcanum. Cast once per Long Rest without a slot.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [
      { name: 'Mystic Arcanum (7th level)', description: 'Gain a 7th-level spell as a Mystic Arcanum.' },
    ],
    14: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Otherworldly Patron.' },
    ],
    15: [
      { name: 'Mystic Arcanum (8th level)', description: 'Gain an 8th-level spell as a Mystic Arcanum.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [
      { name: 'Mystic Arcanum (9th level)', description: 'Gain a 9th-level spell as a Mystic Arcanum.' },
    ],
    18: [],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Eldritch Master', description: 'Spend 1 minute entreating your patron to regain all Pact Magic slots. 1/Long Rest.' },
    ],
  },

  Wizard: {
    1: [
      { name: 'Arcane Recovery', description: 'Once per day after a Short Rest, recover spell slots with combined level ≤ half your Wizard level (rounded up, max 5th level slots).' },
      { name: 'Memorize Spell', description: 'When you finish a Short Rest, you can study your spellbook and replace one of your currently prepared Wizard spells with another from the book. 1/Short Rest.' },
      { name: 'Spellcasting', description: 'Intelligence is your spellcasting ability. Your spellbook contains 6 spells. You prepare spells equal to your Intelligence modifier + your Wizard level.' },
    ],
    2: [
      { name: 'Scholar', description: 'Choose a field of study from: Arcane, Biologist, Historian, Mathematician, Naturalist, or Tactician. Gain Expertise in one skill related to that field, plus one language.' },
    ],
    3: [
      { name: 'Wizard Subclass', description: 'Choose an Arcane Tradition subclass at 3rd level (shifted from 2nd in 2014). Features at 3rd, 6th, 10th, and 14th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    5: [],
    6: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Arcane Tradition.' },
      { name: 'Memorize Spell Improvement', description: 'You can now swap two prepared spells per Short Rest (instead of one).' },
    ],
    7: [],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    9: [],
    10: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Arcane Tradition.' },
    ],
    11: [],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    13: [],
    14: [
      { name: 'Subclass Feature', description: 'You gain a feature from your Arcane Tradition.' },
    ],
    15: [],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat.' },
    ],
    17: [],
    18: [
      { name: 'Spell Mastery', description: 'Choose one 1st-level and one 2nd-level spell from your spellbook. You can cast those spells at their lowest level without expending a slot while they are prepared.' },
    ],
    19: [
      { name: 'Epic Boon', description: 'You gain an Epic Boon feat.' },
    ],
    20: [
      { name: 'Signature Spells', description: 'Two 3rd-level spells from your spellbook become signature spells. They\'re always prepared, don\'t count against your total, and can each be cast once at 3rd level without a slot per Short or Long Rest.' },
    ],
  },

};
