// D&D 5th Edition (2014) class features by level
// Each entry: { name, description }

export const HIT_DICE_5E = {
  Artificer: 8,
  Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8, Fighter: 10,
  Monk: 8, Paladin: 10, Ranger: 10, Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6,
};

export const CLASS_FEATURES_5E = {

  Artificer: {
    1: [
      { name: 'Magical Tinkering', description: 'You can imbue a Tiny nonmagical object with a magical effect by touching it as an action. Choose one: emit bright light (5 ft) and dim light (5 ft beyond); emit a recorded message of up to 6 seconds when tapped; emit an odor or nonverbal sound; or display a static visual effect. You can have up to your Intelligence modifier active at once (minimum 1). The effect lasts until you remove it.' },
      { name: 'Spellcasting', description: 'Intelligence is your spellcasting ability for your artificer spells. You know two cantrips from the artificer spell list. You prepare a list of artificer spells by choosing from the artificer spell list. The number of spells you can prepare equals your Intelligence modifier plus half your artificer level (rounded up), minimum 1. Artificer spells require tools as spellcasting focuses; you can use any tool you are proficient with.' },
    ],
    2: [
      { name: 'Infuse Item', description: 'You gain 4 artificer infusions of your choice from the Artificer Infusions list. When you finish a long rest, you can touch a number of nonmagical objects equal to the number of Infused Items for your level and imbue each with one infusion. An object can bear only one of your infusions at a time and a single object can\'t bear more than one infusion. Your infusion lasts until you die, you finish a long rest and choose to end it, or you exceed your maximum Infused Items for your level.' },
    ],
    3: [
      { name: 'Artificer Specialist', description: 'Choose an Artificer Specialist: Alchemist, Armorer, Artillerist, or Battle Smith. Your specialist grants you features at 3rd, 5th, 9th, and 15th level.' },
      { name: 'The Right Tool for the Job', description: 'With 1 hour of work and 10 gp of materials, you can create one set of artisan\'s tools in an unoccupied space within 5 feet of you. These tools vanish when you use this feature again.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [
      { name: 'Artificer Specialist Feature', description: 'You gain a feature from your Artificer Specialist.' },
    ],
    6: [
      { name: 'Tool Expertise', description: 'Your proficiency bonus is doubled for any ability check you make that uses your proficiency with a tool.' },
    ],
    7: [
      { name: 'Flash of Genius', description: 'When you or another creature you can see within 30 feet of you makes an ability check or a saving throw, you can use your reaction to add your Intelligence modifier to the roll. You can use this feature a number of times equal to your Intelligence modifier (minimum 1). You regain all expended uses when you finish a long rest.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [
      { name: 'Artificer Specialist Feature', description: 'You gain a feature from your Artificer Specialist.' },
    ],
    10: [
      { name: 'Magic Item Adept', description: 'You achieve a profound understanding of how to use and make magic items. You can attune to up to 4 magic items at once. If you craft a magic item with a rarity of common or uncommon, it takes you a quarter of the normal time and costs you half as much of the normal gold.' },
    ],
    11: [
      { name: 'Spell-Storing Item', description: 'At the end of a long rest, you can touch one simple or martial weapon or one item that you can use as a spellcasting focus and store a spell in it, choosing a 1st- or 2nd-level spell from the artificer spell list. A creature holding the item can use its action to produce the spell\'s effect, using your spell attack bonus and save DC. The spell is stored in the item until cast a number of times equal to twice your Intelligence modifier (minimum 2) or until you store a different spell in it.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [
      { name: 'Artificer Specialist Feature', description: 'You gain a feature from your Artificer Specialist.' },
    ],
    14: [
      { name: 'Magic Item Savant', description: 'Your skill with magic items deepens. You can attune to up to 5 magic items at once. You also ignore all class, race, spell, and level requirements on attuning to or using a magic item.' },
    ],
    15: [
      { name: 'Artificer Specialist Feature', description: 'You gain a feature from your Artificer Specialist.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [],
    18: [
      { name: 'Magic Item Master', description: 'You can now attune to up to 6 magic items at once.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Soul of Artifice', description: 'You have developed a mystical connection to your magic items, which you can draw on for protection: you gain a +1 bonus to all saving throws per magic item you are currently attuned to. In addition, if you\'re reduced to 0 hit points but not killed outright, you can use your reaction to end one of your artificer infusions, causing you to drop to 1 hit point instead of 0.' },
    ],
  },

  Barbarian: {
    1: [
      { name: 'Rage', description: 'On your turn you can enter a rage as a bonus action. While raging you gain advantage on Strength checks and saving throws, a damage bonus to melee Strength attacks (+2 at levels 1–8, +3 at 9–15, +4 at 16+), and resistance to bludgeoning, piercing, and slashing damage. Rage lasts 1 minute, ends early if you are knocked unconscious or if your turn ends without you attacking a hostile creature or taking damage. You can rage 2 times per long rest (increases at higher levels).' },
      { name: 'Unarmored Defense', description: 'While not wearing armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.' },
    ],
    2: [
      { name: 'Reckless Attack', description: 'When you make your first attack on your turn, you can decide to attack recklessly, giving you advantage on melee weapon attack rolls using Strength during this turn. However, attack rolls against you have advantage until your next turn.' },
      { name: 'Danger Sense', description: 'You have advantage on Dexterity saving throws against effects you can see, such as traps and spells. To gain this benefit, you can\'t be blinded, deafened, or incapacitated.' },
    ],
    3: [
      { name: 'Primal Path', description: 'You choose a Primal Path that shapes the nature of your rage. Your choice grants features at 3rd, 6th, 10th, and 14th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [
      { name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
      { name: 'Fast Movement', description: 'Your speed increases by 10 feet while you aren\'t wearing heavy armor.' },
    ],
    6: [
      { name: 'Path Feature', description: 'You gain a feature from your Primal Path.' },
    ],
    7: [
      { name: 'Feral Instinct', description: 'Your instincts are so honed that you have advantage on initiative rolls. Additionally, if you are surprised at the beginning of combat and aren\'t incapacitated, you can act normally on your first turn, but only if you enter your rage before doing anything else on that turn.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [
      { name: 'Brutal Critical (1 die)', description: 'You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack.' },
    ],
    10: [
      { name: 'Path Feature', description: 'You gain a feature from your Primal Path.' },
    ],
    11: [
      { name: 'Relentless Rage', description: 'Your rage can keep you fighting despite grievous wounds. If you drop to 0 hit points while raging and don\'t die outright, you can make a DC 10 Constitution saving throw. If you succeed, you drop to 1 hit point instead. Each time you use this feature after the first, the DC increases by 5.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [
      { name: 'Brutal Critical (2 dice)', description: 'You can roll two additional weapon damage dice when determining the extra damage for a critical hit with a melee attack.' },
    ],
    14: [
      { name: 'Path Feature', description: 'You gain a feature from your Primal Path.' },
    ],
    15: [
      { name: 'Persistent Rage', description: 'Your rage is so fierce that it ends early only if you fall unconscious or if you choose to end it.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [
      { name: 'Brutal Critical (3 dice)', description: 'You can roll three additional weapon damage dice when determining the extra damage for a critical hit with a melee attack.' },
    ],
    18: [
      { name: 'Indomitable Might', description: 'If your total for a Strength check is less than your Strength score, you can use that score in place of the total.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Primal Champion', description: 'Your Strength score increases by 4 and your Constitution score increases by 4. Your maximum for those scores is now 24.' },
    ],
  },

  Bard: {
    1: [
      { name: 'Spellcasting', description: 'You have learned to untangle and reshape the fabric of reality in harmony with your wishes and music. Your spells are part of your vast repertoire, magic that you can tune to different situations. You know two cantrips from the bard spell list and four 1st-level spells. Intelligence is your spellcasting ability — wait, Charisma. Charisma is your spellcasting ability.' },
      { name: 'Bardic Inspiration', description: 'You can inspire others through stirring words or music. As a bonus action, you can choose one creature other than yourself within 60 feet who can hear you, and give them a Bardic Inspiration die (d6, increasing to d8 at 5th, d10 at 10th, d12 at 15th). The creature can add the die to one ability check, attack roll, or saving throw it makes in the next 10 minutes. You can use this feature a number of times equal to your Charisma modifier (minimum 1). You regain all uses on a long rest (short rest at 5th level).' },
    ],
    2: [
      { name: 'Jack of All Trades', description: 'You can add half your proficiency bonus, rounded down, to any ability check you make that doesn\'t already include your proficiency bonus.' },
      { name: 'Song of Rest', description: 'You can use soothing music or oration to help revitalize your wounded allies during a short rest. If you or any friendly creatures who can hear your performance regain hit points at the end of the short rest by spending one or more Hit Dice, each of those creatures regains an extra 1d6 hit points (1d8 at 9th, 1d10 at 13th, 1d12 at 17th).' },
    ],
    3: [
      { name: 'Bard College', description: 'You delve into the advanced techniques of a bard college of your choice. Your choice grants you features at 3rd, 6th, and 14th level.' },
      { name: 'Expertise', description: 'Choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [
      { name: 'Bardic Inspiration (d8)', description: 'Your Bardic Inspiration die increases to d8. Additionally, you regain all your uses of Bardic Inspiration when you finish a short or long rest.' },
      { name: 'Font of Inspiration', description: 'You regain all your uses of Bardic Inspiration when you finish a short or long rest.' },
    ],
    6: [
      { name: 'Countercharm', description: 'As an action, you can start a performance that lasts until the end of your next turn. During that time, you and any friendly creatures within 30 feet have advantage on saving throws against being frightened or charmed.' },
      { name: 'Bard College Feature', description: 'You gain a feature from your Bard College.' },
    ],
    7: [],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [
      { name: 'Song of Rest (d8)', description: 'The extra hit points granted by your Song of Rest increases to 1d8.' },
    ],
    10: [
      { name: 'Bardic Inspiration (d10)', description: 'Your Bardic Inspiration die increases to d10.' },
      { name: 'Expertise', description: 'Choose two more skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.' },
      { name: 'Magical Secrets', description: 'You have plundered magical knowledge from a wide spectrum of disciplines. Choose two spells from any classes. A spell you choose must be of a level you can cast. You learn the two spells, which are treated as bard spells for you.' },
    ],
    11: [],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [
      { name: 'Song of Rest (d10)', description: 'The extra hit points granted by your Song of Rest increases to 1d10.' },
    ],
    14: [
      { name: 'Magical Secrets', description: 'Choose two more spells from any classes. A spell you choose must be of a level you can cast, as shown on the Bard table.' },
      { name: 'Bard College Feature', description: 'You gain a feature from your Bard College.' },
    ],
    15: [
      { name: 'Bardic Inspiration (d12)', description: 'Your Bardic Inspiration die increases to d12.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [
      { name: 'Song of Rest (d12)', description: 'The extra hit points granted by your Song of Rest increases to 1d12.' },
    ],
    18: [
      { name: 'Magical Secrets', description: 'Choose two more spells from any classes. A spell you choose must be of a level you can cast, as shown on the Bard table.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Superior Inspiration', description: 'When you roll initiative and have no uses of Bardic Inspiration left, you regain one use.' },
    ],
  },

  Cleric: {
    1: [
      { name: 'Spellcasting', description: 'As a conduit for divine power, you can cast cleric spells. Wisdom is your spellcasting ability. You prepare spells from the cleric spell list equal to your Wisdom modifier + your cleric level (minimum 1).' },
      { name: 'Divine Domain', description: 'Choose one domain related to your deity. Your choice grants you domain spells and other features when you choose it at 1st level, and again at 2nd, 6th, 8th, and 17th level.' },
    ],
    2: [
      { name: 'Channel Divinity (1/rest)', description: 'You gain the ability to channel divine energy directly from your deity. You have one use per short or long rest, gaining additional uses at 6th (2/rest) and 18th (3/rest) level. You always have the Turn Undead option, and your domain gives you additional Channel Divinity options.' },
      { name: 'Turn Undead', description: 'As an action, you present your holy symbol and speak a prayer censuring the undead. Each undead that can see or hear you within 30 feet must make a Wisdom saving throw. If the creature fails its saving throw, it is turned for 1 minute or until it takes any damage.' },
      { name: 'Divine Domain Feature', description: 'You gain a feature from your Divine Domain.' },
    ],
    3: [],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [
      { name: 'Destroy Undead (CR 1/2)', description: 'When an undead fails its saving throw against your Turn Undead feature, the creature is instantly destroyed if its challenge rating is at or below 1/2.' },
    ],
    6: [
      { name: 'Channel Divinity (2/rest)', description: 'You can use your Channel Divinity twice between rests.' },
      { name: 'Divine Domain Feature', description: 'You gain a feature from your Divine Domain.' },
    ],
    7: [],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
      { name: 'Destroy Undead (CR 1)', description: 'Your Turn Undead now destroys undead of CR 1 or lower.' },
      { name: 'Divine Domain Feature', description: 'You gain a powerful feature from your Divine Domain (often a Divine Strike or Potent Spellcasting).' },
    ],
    9: [],
    10: [
      { name: 'Divine Intervention', description: 'You can call on your deity to intervene on your behalf when your need is great. Implore your deity\'s aid using your action. Describe the assistance you seek and roll percentile dice. If you roll a number equal to or lower than your cleric level, your deity intervenes. The DM chooses the nature of the intervention. If the intervention is successful, you can\'t use this feature again for 7 days. Otherwise, you can use it again after a long rest.' },
    ],
    11: [
      { name: 'Destroy Undead (CR 2)', description: 'Your Turn Undead now destroys undead of CR 2 or lower.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [],
    14: [
      { name: 'Destroy Undead (CR 3)', description: 'Your Turn Undead now destroys undead of CR 3 or lower.' },
    ],
    15: [],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [
      { name: 'Destroy Undead (CR 4)', description: 'Your Turn Undead now destroys undead of CR 4 or lower.' },
      { name: 'Divine Domain Feature', description: 'You gain a capstone feature from your Divine Domain.' },
    ],
    18: [
      { name: 'Channel Divinity (3/rest)', description: 'You can use your Channel Divinity three times between rests.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Divine Intervention Improvement', description: 'Your Divine Intervention call succeeds automatically, no roll required. Once you use it, you must finish 7 days before you can use it again.' },
    ],
  },

  Druid: {
    1: [
      { name: 'Druidic', description: 'You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages. You and others who know this language automatically spot such a message. Others spot the message\'s presence with a successful DC 15 Wisdom (Perception) check but can\'t decipher it without magic.' },
      { name: 'Spellcasting', description: 'Drawing on the divine essence of nature itself, you can cast druid spells. Wisdom is your spellcasting ability. You prepare a number of spells equal to your Wisdom modifier + your druid level (minimum 1).' },
    ],
    2: [
      { name: 'Wild Shape', description: 'You can use your action to magically assume the shape of a beast you have seen before. You can use this feature twice, regaining uses on a short or long rest. At level 2 you can transform into beasts with CR 1/4 or lower that lack a swim or fly speed. The limit increases at higher levels.' },
      { name: 'Druid Circle', description: 'You choose to identify with a circle of druids. Your choice grants you features at 2nd, 6th, 10th, and 14th level.' },
    ],
    3: [],
    4: [
      { name: 'Wild Shape Improvement (CR 1/2, swim)', description: 'You can now transform into beasts with CR 1/2 or lower, including those with a swim speed.' },
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [],
    6: [
      { name: 'Druid Circle Feature', description: 'You gain a feature from your Druid Circle.' },
    ],
    7: [],
    8: [
      { name: 'Wild Shape Improvement (CR 1, fly)', description: 'You can now transform into beasts with CR 1 or lower, including those with a fly speed.' },
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [],
    10: [
      { name: 'Druid Circle Feature', description: 'You gain a feature from your Druid Circle.' },
    ],
    11: [],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [],
    14: [
      { name: 'Druid Circle Feature', description: 'You gain a feature from your Druid Circle.' },
    ],
    15: [],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [],
    18: [
      { name: 'Timeless Body', description: 'The primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year.' },
      { name: 'Beast Spells', description: 'You can cast many of your druid spells in any shape you assume using Wild Shape. You can perform the somatic and verbal components of a druid spell while in a beast shape, but you aren\'t able to provide material components.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Archdruid', description: 'You can use your Wild Shape an unlimited number of times. Additionally, you can ignore the verbal and somatic components of your druid spells, as well as any material components that lack a cost and aren\'t consumed by a spell. You gain this benefit in both your normal shape and your beast shape from Wild Shape.' },
    ],
  },

  Fighter: {
    1: [
      { name: 'Fighting Style', description: 'You adopt a particular style of fighting as your specialty. Choose one from: Archery (+2 attack rolls with ranged weapons), Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed melee weapon if no other melee weapon), Great Weapon Fighting (reroll 1s and 2s on damage with two-handed weapons), Protection (impose disadvantage on attacks against adjacent allies when you have a shield), Two-Weapon Fighting (add ability modifier to off-hand attacks).' },
      { name: 'Second Wind', description: 'You can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.' },
    ],
    2: [
      { name: 'Action Surge (1/rest)', description: 'You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again. (You gain a second use at 17th level.)' },
    ],
    3: [
      { name: 'Martial Archetype', description: 'You choose an archetype that you strive to emulate in your combat styles and techniques. Your archetype grants you features at 3rd, 7th, 10th, 15th, and 18th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [
      { name: 'Extra Attack (2 attacks)', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    ],
    6: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    7: [
      { name: 'Martial Archetype Feature', description: 'You gain a feature from your Martial Archetype.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [
      { name: 'Indomitable (1/rest)', description: 'You can reroll a saving throw that you fail. If you do so, you must use the new roll, and you can\'t use this feature again until you finish a long rest. You gain two additional uses at 13th level (2/rest) and 17th level (3/rest).' },
    ],
    10: [
      { name: 'Martial Archetype Feature', description: 'You gain a feature from your Martial Archetype.' },
    ],
    11: [
      { name: 'Extra Attack (3 attacks)', description: 'You can attack three times whenever you take the Attack action on your turn.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [
      { name: 'Indomitable (2/rest)', description: 'You can use Indomitable twice between long rests.' },
    ],
    14: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    15: [
      { name: 'Martial Archetype Feature', description: 'You gain a feature from your Martial Archetype.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [
      { name: 'Action Surge (2/rest)', description: 'You can use Action Surge twice between rests, but only once per turn.' },
      { name: 'Indomitable (3/rest)', description: 'You can use Indomitable three times between long rests.' },
    ],
    18: [
      { name: 'Martial Archetype Feature', description: 'You gain a feature from your Martial Archetype.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Extra Attack (4 attacks)', description: 'You can attack four times whenever you take the Attack action on your turn.' },
    ],
  },

  Monk: {
    1: [
      { name: 'Unarmored Defense', description: 'While you are wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.' },
      { name: 'Martial Arts', description: 'Your practice of martial arts gives you mastery of combat styles that use unarmed strikes and monk weapons. You gain the following benefits: use Dexterity instead of Strength for attacks, use the Martial Arts die instead of normal damage (d4 at 1st, d6 at 5th, d8 at 11th, d10 at 17th), and make one unarmed strike as a bonus action when you take the Attack action.' },
    ],
    2: [
      { name: 'Ki', description: 'Your training allows you to harness the mystic energy of ki. Your ki points equal your monk level. Regain all ki on a short or long rest. Use ki to fuel: Flurry of Blows (2 ki: two bonus unarmed strikes), Patient Defense (1 ki: Dodge as bonus action), Step of the Wind (1 ki: Dash/Disengage as bonus action).' },
      { name: 'Unarmored Movement', description: 'Your speed increases by 10 feet while you are not wearing armor or wielding a shield. This bonus increases at higher levels.' },
    ],
    3: [
      { name: 'Monastic Tradition', description: 'You commit yourself to a monastic tradition. Your tradition grants you features at 3rd, 6th, 11th, and 17th level.' },
      { name: 'Deflect Missiles', description: 'You can use your reaction to deflect or catch the missile when you are hit by a ranged weapon attack. When you do so, the damage is reduced by 1d10 + your Dexterity modifier + your monk level. If the damage is reduced to 0, you can catch the missile and throw it back for 1 ki point.' },
    ],
    4: [
      { name: 'Slow Fall', description: 'You can use your reaction when you fall to reduce any falling damage by an amount equal to five times your monk level.' },
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [
      { name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
      { name: 'Stunning Strike', description: 'When you hit another creature with a melee weapon attack, you can spend 1 ki point to attempt a stunning strike. The target must succeed on a Constitution saving throw or be stunned until the end of your next turn.' },
    ],
    6: [
      { name: 'Ki-Empowered Strikes', description: 'Your unarmed strikes count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.' },
      { name: 'Monastic Tradition Feature', description: 'You gain a feature from your Monastic Tradition.' },
    ],
    7: [
      { name: 'Evasion', description: 'Your instinctive agility lets you dodge out of the way of certain area effects. When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed and only half damage if you fail.' },
      { name: 'Stillness of Mind', description: 'You can use your action to end one effect on yourself that is causing you to be charmed or frightened.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [
      { name: 'Unarmored Movement Improvement', description: 'You gain the ability to move along vertical surfaces and across liquids on your turn without falling during the move.' },
    ],
    10: [
      { name: 'Purity of Body', description: 'Your mastery of the ki flowing through you makes you immune to disease and poison.' },
    ],
    11: [
      { name: 'Monastic Tradition Feature', description: 'You gain a feature from your Monastic Tradition.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [
      { name: 'Tongue of the Sun and Moon', description: 'You learn to touch the ki of other minds so that you understand all spoken languages. Moreover, any creature that can understand a language can understand what you say.' },
    ],
    14: [
      { name: 'Diamond Soul', description: 'Your mastery of ki grants you proficiency in all saving throws. Additionally, whenever you make a saving throw and fail, you can spend 1 ki point to reroll it and take the second result.' },
    ],
    15: [
      { name: 'Timeless Body', description: 'Your ki sustains you so that you suffer none of the frailty of old age, and you can\'t be aged magically. You can still die of old age, however. In addition, you no longer need food or water.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [
      { name: 'Monastic Tradition Feature', description: 'You gain a feature from your Monastic Tradition.' },
    ],
    18: [
      { name: 'Empty Body', description: 'You can use your action to spend 4 ki points to become invisible for 1 minute. During that time, you also have resistance to all damage but force damage. Additionally, you can spend 8 ki points to cast the astral projection spell without needing material components.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Perfect Self', description: 'When you roll for initiative and have no ki points remaining, you regain 4 ki points.' },
    ],
  },

  Paladin: {
    1: [
      { name: 'Divine Sense', description: 'The presence of strong evil registers on your senses like a noxious odor. As an action, you can open your awareness to detect such forces. Until the end of your next turn, you know the location of any celestial, fiend, or undead within 60 feet that is not behind total cover. You can use this feature a number of times equal to 1 + your Charisma modifier. You regain all uses when you finish a long rest.' },
      { name: 'Lay on Hands', description: 'Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you take a long rest equal to your paladin level × 5. As an action, you can touch a creature and draw power from the pool to restore a number of hit points to that creature, up to the maximum amount remaining in your pool. You can also spend 5 hit points from the pool to cure the target of one disease or neutralize one poison.' },
    ],
    2: [
      { name: 'Fighting Style', description: 'Adopt a fighting style specialty: Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed weapon), Great Weapon Fighting (reroll 1s and 2s on damage), or Protection (impose disadvantage on attacks against adjacent allies when you have a shield).' },
      { name: 'Spellcasting (half-caster, starts L2)', description: 'You gain the ability to cast paladin spells, starting at 2nd level. Charisma is your spellcasting ability. You prepare spells equal to your Charisma modifier + half your paladin level, rounded down. Spell slots are as a half-caster (1st-level slots at 2nd, up to 5th-level slots at 17th).' },
      { name: 'Divine Smite', description: 'When you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target. The extra damage is 2d8 for a 1st-level slot, plus 1d8 for each spell level higher (maximum 5d8). The damage increases by 1d8 against undead or fiends.' },
    ],
    3: [
      { name: 'Divine Health', description: 'By 3rd level, the divine magic flowing through you makes you immune to disease.' },
      { name: 'Sacred Oath', description: 'You swear the oath that binds you as a paladin forever. Your choice grants you features at 3rd, 7th, 15th, and 20th level. These features include your oath spells and Channel Divinity.' },
      { name: 'Channel Divinity', description: 'Your Sacred Oath lets you channel divine energy to fuel magical effects. Each Channel Divinity option tells you how to use it. You have one use per short or long rest. Some uses expend the use and some don\'t.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [
      { name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    ],
    6: [
      { name: 'Aura of Protection', description: 'Whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus to the saving throw equal to your Charisma modifier (minimum 1). You must be conscious to grant this bonus. At 18th level, the range of this aura increases to 30 feet.' },
    ],
    7: [
      { name: 'Sacred Oath Feature', description: 'You gain a feature from your Sacred Oath.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [],
    10: [
      { name: 'Aura of Courage', description: 'You and friendly creatures within 10 feet of you can\'t be frightened while you are conscious. At 18th level, the range of this aura increases to 30 feet.' },
    ],
    11: [
      { name: 'Improved Divine Smite', description: 'By 11th level, you are so suffused with righteous might that all your melee weapon strikes carry divine power with them. Whenever you hit a creature with a melee weapon, the creature takes an extra 1d8 radiant damage. If you also use Divine Smite, you add this damage to the extra damage of your Divine Smite.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [],
    14: [
      { name: 'Cleansing Touch', description: 'You can use your action to end one spell on yourself or on one willing creature that you touch. You can use this feature a number of times equal to your Charisma modifier (minimum 1). You regain expended uses when you finish a long rest.' },
    ],
    15: [
      { name: 'Sacred Oath Feature', description: 'You gain a feature from your Sacred Oath.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [],
    18: [
      { name: 'Aura Improvements', description: 'The range of your Aura of Protection and Aura of Courage increases to 30 feet.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Sacred Oath Feature', description: 'You gain your oath\'s capstone feature.' },
    ],
  },

  Ranger: {
    1: [
      { name: 'Favored Enemy', description: 'Choose a type of favored enemy: aberrations, beasts, celestials, constructs, dragons, elementals, fey, fiends, giants, monstrosities, oozes, plants, or undead. Alternatively, choose two races of humanoid (such as gnolls and orcs). You have advantage on Survival checks to track your favored enemies, as well as on Intelligence checks to recall information about them. When you gain this feature, you also learn one language of your choice that is spoken by your favored enemies.' },
      { name: 'Natural Explorer', description: 'You are particularly familiar with one type of natural environment (arctic, coast, desert, forest, grassland, mountain, swamp, or Underdark). When you make an Intelligence or Wisdom check related to your favored terrain, your proficiency bonus is doubled. You gain additional benefits while traveling in that terrain.' },
    ],
    2: [
      { name: 'Fighting Style', description: 'Choose a fighting style specialty from: Archery (+2 to ranged attack rolls), Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed weapon), or Two-Weapon Fighting (add ability modifier to off-hand attacks).' },
      { name: 'Spellcasting (half-caster, starts L1)', description: 'You have learned to use the magical essence of nature to cast spells. Wisdom is your spellcasting ability. Ranger spell slots start at 1st level (2 slots), scaling to 3rd-level slots by 9th level.' },
    ],
    3: [
      { name: 'Ranger Archetype', description: 'You choose an archetype that you strive to emulate, such as Hunter or Beast Master. Your choice grants you features at 3rd, 7th, 11th, and 15th level.' },
      { name: 'Primeval Awareness', description: 'You can use your action and expend one ranger spell slot to focus your awareness on the region around you. For 1 minute per level of the spell slot you expend, you can sense whether the following types of creatures are present within 1 mile of you (or 6 miles in your favored terrain): aberrations, celestials, dragons, elementals, fey, fiends, and undead.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [
      { name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    ],
    6: [
      { name: 'Favored Enemy and Natural Explorer Improvements', description: 'You choose one more favored enemy, and one more favored terrain type.' },
    ],
    7: [
      { name: 'Ranger Archetype Feature', description: 'You gain a feature from your Ranger Archetype.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
      { name: 'Land\'s Stride', description: 'Moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed or taking damage, and you have advantage on saving throws against plants that are magically created or manipulated.' },
    ],
    9: [],
    10: [
      { name: 'Natural Explorer Improvement', description: 'You choose one more favored terrain type.' },
      { name: 'Hide in Plain Sight', description: 'You can spend 1 minute creating camouflage for yourself. You must have access to fresh mud, dirt, plants, soot, and other naturally occurring materials. Once you are camouflaged in this way, you can try to hide by pressing yourself up against a solid surface (such as a tree or wall) that is at least as tall and wide as you are. You gain a +10 bonus to Dexterity (Stealth) checks as long as you remain there without moving or taking actions.' },
    ],
    11: [
      { name: 'Ranger Archetype Feature', description: 'You gain a feature from your Ranger Archetype.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [],
    14: [
      { name: 'Favored Enemy Improvement', description: 'You choose one more favored enemy, and the language associated with it.' },
      { name: 'Vanish', description: 'You can use the Hide action as a bonus action on your turn. Also, you can\'t be tracked by nonmagical means, unless you choose to leave a trail.' },
    ],
    15: [
      { name: 'Ranger Archetype Feature', description: 'You gain a feature from your Ranger Archetype.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [],
    18: [
      { name: 'Feral Senses', description: 'You gain preternatural senses that help you fight creatures you can\'t see. When you attack a creature you can\'t see, your inability to see it doesn\'t impose disadvantage on your attack rolls against it. You are also aware of the location of any invisible creature within 30 feet of you, provided that the creature isn\'t hidden from you and you aren\'t blinded or deafened.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Foe Slayer', description: 'You become an unparalleled hunter of your enemies. Once on each of your turns, you can add your Wisdom modifier to the attack roll or the damage roll of an attack you make against one of your favored enemies. You can choose to use this feature before or after the roll, but before any effects of the roll are applied.' },
    ],
  },

  Rogue: {
    1: [
      { name: 'Expertise', description: 'Choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves\' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.' },
      { name: 'Sneak Attack', description: 'Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it. The attack must use a finesse or a ranged weapon. The damage increases as you gain levels (see table).' },
      { name: 'Thieves\' Cant', description: 'During your rogue training you learned thieves\' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation. It takes 4 times longer to convey such a message than to speak plainly. You also understand a set of secret signs and symbols used to convey short, simple messages.' },
    ],
    2: [
      { name: 'Cunning Action', description: 'Your quick thinking and agility allow you to move and act quickly. You can take a bonus action on each of your turns to take the Dash, Disengage, or Hide action.' },
    ],
    3: [
      { name: 'Roguish Archetype', description: 'You choose an archetype that you emulate in the exercise of your rogue abilities. Your archetype grants you features at 3rd, 9th, 13th, and 17th level.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [
      { name: 'Uncanny Dodge', description: 'When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack\'s damage against you.' },
    ],
    6: [
      { name: 'Expertise', description: 'Choose two more of your skill proficiencies. Your proficiency bonus is doubled for those checks.' },
    ],
    7: [
      { name: 'Evasion', description: 'You can nimbly dodge out of the way of certain area effects. When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed and only half damage if you fail.' },
    ],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [
      { name: 'Roguish Archetype Feature', description: 'You gain a feature from your Roguish Archetype.' },
    ],
    10: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    11: [
      { name: 'Reliable Talent', description: 'You have refined your chosen skills until they approach perfection. Whenever you make an ability check that lets you add your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [
      { name: 'Roguish Archetype Feature', description: 'You gain a feature from your Roguish Archetype.' },
    ],
    14: [
      { name: 'Blindsense', description: 'If you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you.' },
    ],
    15: [
      { name: 'Slippery Mind', description: 'You have acquired greater mental strength. You gain proficiency in Wisdom saving throws.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [
      { name: 'Roguish Archetype Feature', description: 'You gain a feature from your Roguish Archetype.' },
    ],
    18: [
      { name: 'Elusive', description: 'Beginning at 18th level, you are so evasive that attackers rarely gain the upper hand against you. No attack roll has advantage against you while you aren\'t incapacitated.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Stroke of Luck', description: 'You have an uncanny knack for succeeding when you need to. If your attack misses a target within range, you can turn the miss into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20. Once you use this feature, you can\'t use it again until you finish a short or long rest.' },
    ],
  },

  Sorcerer: {
    1: [
      { name: 'Spellcasting', description: 'An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic. This font of magic, whatever its origin, fuels your spells. Charisma is your spellcasting ability. You know 2 cantrips and 2 1st-level spells from the sorcerer list.' },
      { name: 'Sorcerous Origin', description: 'Choose a sorcerous origin, which describes the source of your innate magical power. Your choice grants you features when you choose it at 1st level and again at 6th, 14th, and 18th level.' },
    ],
    2: [
      { name: 'Font of Magic / Sorcery Points', description: 'You tap into a deep wellspring of magic within yourself. You have 2 sorcery points (increasing by 1 each level). You can regain spell slots using sorcery points (Flexible Casting): 2 pts→1st, 3 pts→2nd, 5 pts→3rd, 6 pts→4th, 7 pts→5th. Or convert spell slots to sorcery points (1 pt per slot level).' },
    ],
    3: [
      { name: 'Metamagic', description: 'You gain the ability to twist your spells to suit your needs. You gain 2 Metamagic options (gaining 2 more at 10th and 17th level). Options include: Careful Spell, Distant Spell, Empowered Spell, Extended Spell, Heightened Spell, Quickened Spell, Subtle Spell, Twinned Spell.' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [],
    6: [
      { name: 'Sorcerous Origin Feature', description: 'You gain a feature from your Sorcerous Origin.' },
    ],
    7: [],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [],
    10: [
      { name: 'Metamagic', description: 'You learn two more Metamagic options of your choice.' },
    ],
    11: [],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [],
    14: [
      { name: 'Sorcerous Origin Feature', description: 'You gain a feature from your Sorcerous Origin.' },
    ],
    15: [],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [
      { name: 'Metamagic', description: 'You learn two more Metamagic options of your choice.' },
    ],
    18: [
      { name: 'Sorcerous Origin Feature', description: 'You gain a feature from your Sorcerous Origin.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Sorcerous Restoration', description: 'You regain 4 expended sorcery points whenever you finish a short rest.' },
    ],
  },

  Warlock: {
    1: [
      { name: 'Otherworldly Patron', description: 'You have struck a bargain with an otherworldly being of your choice: the Archfey, the Fiend, or the Great Old One. Your choice grants you features at 1st, 6th, 10th, and 14th level.' },
      { name: 'Pact Magic', description: 'Your arcane research and the magic bestowed on you by your patron have given you facility with spells. Charisma is your spellcasting ability. Your spell slots all recover on a short or long rest. You start with 1 slot that refreshes on short rest, scaling to 2 slots of increasing level through level 9.' },
    ],
    2: [
      { name: 'Eldritch Invocations', description: 'In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability. You gain 2 Eldritch Invocations (gaining more as you level). Once you gain an invocation, you always have it prepared. Some invocations require a certain pact boon or minimum level.' },
    ],
    3: [
      { name: 'Pact Boon', description: 'Your otherworldly patron bestows a gift upon you for your loyal service. You gain one of the following: Pact of the Chain (improved familiar), Pact of the Blade (create a melee weapon bonded to you), or Pact of the Tome (Book of Shadows: 3 extra cantrips from any class list).' },
    ],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [],
    6: [
      { name: 'Otherworldly Patron Feature', description: 'You gain a feature from your Otherworldly Patron.' },
    ],
    7: [],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [],
    10: [
      { name: 'Otherworldly Patron Feature', description: 'You gain a feature from your Otherworldly Patron.' },
    ],
    11: [
      { name: 'Mystic Arcanum (6th level)', description: 'Your patron bestows upon you a magical secret called an arcanum. Choose one 6th-level spell from the warlock spell list as this arcanum. You can cast your arcanum spell once without expending a spell slot. You must finish a long rest before you can do so again.' },
    ],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [
      { name: 'Mystic Arcanum (7th level)', description: 'Choose one 7th-level spell from the warlock spell list as an arcanum. Cast it once per long rest without a spell slot.' },
    ],
    14: [
      { name: 'Otherworldly Patron Feature', description: 'You gain a feature from your Otherworldly Patron.' },
    ],
    15: [
      { name: 'Mystic Arcanum (8th level)', description: 'Choose one 8th-level spell from the warlock spell list as an arcanum. Cast it once per long rest without a spell slot.' },
    ],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [
      { name: 'Mystic Arcanum (9th level)', description: 'Choose one 9th-level spell from the warlock spell list as an arcanum. Cast it once per long rest without a spell slot.' },
    ],
    18: [],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Eldritch Master', description: 'You can spend 1 minute entreating your patron for aid to regain all your expended spell slots from Pact Magic. Once you regain spell slots with this feature, you must finish a long rest before you can do so again.' },
    ],
  },

  Wizard: {
    1: [
      { name: 'Spellcasting', description: 'As a student of arcane magic, you have a spellbook containing 6 spells of 1st level. You can prepare spells equal to your Intelligence modifier + your wizard level (minimum 1). Intelligence is your spellcasting ability.' },
      { name: 'Arcane Recovery', description: 'You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher.' },
    ],
    2: [
      { name: 'Arcane Tradition', description: 'You choose an arcane tradition from the Schools of Magic (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, or Transmutation). Your choice grants you features at 2nd, 6th, 10th, and 14th level.' },
    ],
    3: [],
    4: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    5: [],
    6: [
      { name: 'Arcane Tradition Feature', description: 'You gain a feature from your Arcane Tradition.' },
    ],
    7: [],
    8: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    9: [],
    10: [
      { name: 'Arcane Tradition Feature', description: 'You gain a feature from your Arcane Tradition.' },
    ],
    11: [],
    12: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    13: [],
    14: [
      { name: 'Arcane Tradition Feature', description: 'You gain a feature from your Arcane Tradition.' },
    ],
    15: [],
    16: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    17: [],
    18: [
      { name: 'Spell Mastery', description: 'You have achieved such mastery over certain spells that you can cast them at will. Choose a 1st-level spell and a 2nd-level spell from your spellbook. You can cast those spells at their lowest level without expending a spell slot when you have them prepared.' },
    ],
    19: [
      { name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. You can\'t increase a score above 20. Alternatively, with your DM\'s approval, you can take a feat instead.' },
    ],
    20: [
      { name: 'Signature Spells', description: 'You gain mastery over two powerful spells and can cast them with little effort. Choose two 3rd-level spells from your spellbook as your signature spells. You always have these spells prepared, they don\'t count against the number of spells you have prepared, and you can cast each of them once at 3rd level without expending a spell slot. When you do so, you can\'t do so again until you finish a short or long rest.' },
    ],
  },

};
