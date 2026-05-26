// Cleric 2024 subclass feature levels differ (L3/L6/L8/L17) but domains are the same.
// Features below use 5e timing; 2024 entries note the adjusted levels.

const DOMAINS_5E = {
  'Life Domain': {
    flavorText: 'The Life domain focuses on the vibrant positive energy — one of the fundamental forces of the universe — that sustains all life. The gods of life promote vitality and health through healing the sick, tending to the injured, and driving away the forces of death and undeath.',
    features: [
      { level: 1, name: 'Bonus Proficiency', description: 'You gain proficiency with heavy armor.' },
      { level: 1, name: 'Disciple of Life', description: 'Your healing spells are more effective. Whenever you use a spell of 1st level or higher to restore hit points to a creature, the creature regains additional HP equal to 2 + the spell\'s level.' },
      { level: 2, name: 'Preserve Life', description: 'Channel Divinity: As an action, present your holy symbol and evoke healing energy. Choose creatures within 30 ft, distributing up to 5 × your cleric level in HP among them. No creature can regain more than half its maximum HP this way.' },
      { level: 6, name: 'Blessed Healer', description: 'When you cast a healing spell of 1st level or higher that restores HP to another creature, you regain HP equal to 2 + the spell\'s level.' },
      { level: 8, name: 'Divine Strike', description: 'Once per turn, when you hit a creature with a weapon attack, you deal an additional 1d8 radiant damage (2d8 at level 14).' },
      { level: 17, name: 'Supreme Healing', description: 'When you would normally roll one or more dice to restore hit points with a spell, you instead use the highest number possible for each die.' },
    ],
  },
  'Light Domain': {
    flavorText: 'Gods of light — including Helm, Lathander, Pholtus, Branchala, the Silver Flame, Belenus, Apollo, and Re-Horakhty — promote the ideals of rebirth and renewal, truth, vigilance, and beauty, often using the metaphor of light as a tool for obtaining these goals.',
    features: [
      { level: 1, name: 'Bonus Cantrip', description: 'You gain the light cantrip if you don\'t already know it.' },
      { level: 1, name: 'Warding Flare', description: 'When you or a creature within 30 ft is attacked, you can use your reaction to impose disadvantage on the attack roll (requires you not being blinded). Usable a number of times equal to your Wisdom modifier per long rest.' },
      { level: 2, name: 'Radiance of the Dawn', description: 'Channel Divinity: As an action, present your holy symbol and dispel magical darkness in a 30 ft radius. Each hostile creature in that area must make a Constitution saving throw, taking 2d10 + your cleric level radiant damage (half on success).' },
      { level: 6, name: 'Improved Flare', description: 'Your Warding Flare feature now also works when a creature within 30 ft is attacked, not just you.' },
      { level: 8, name: 'Potent Spellcasting', description: 'You add your Wisdom modifier to the damage you deal with cleric cantrips.' },
      { level: 17, name: 'Corona of Light', description: 'As an action, activate an aura of sunlight that lasts 1 minute. Bright light fills a 60 ft radius around you; hostile creatures in it have disadvantage on saving throws against spells that deal fire or radiant damage.' },
    ],
  },
  'Trickery Domain': {
    flavorText: 'Gods of trickery — such as Tymora, Beshaba, Olidammara, the Traveler, Garl Glittergold, and Loki — are mischief-makers and instigators who stand as a constant challenge to the accepted order among both gods and mortals. They\'re patrons of thieves, scoundrels, gamblers, rebels, and liberators.',
    features: [
      { level: 1, name: 'Blessing of the Trickster', description: 'You can use your action to touch a willing creature other than yourself to give it advantage on Dexterity (Stealth) checks for 1 hour. This feature ends if you use it again.' },
      { level: 2, name: 'Invoke Duplicity', description: 'Channel Divinity: As an action, create a perfect illusion of yourself in an unoccupied space within 30 ft that lasts 1 minute (concentration). You can move it up to 30 ft and can cast spells as though you were in its space. While it\'s within 5 ft of a creature, you have advantage on attack rolls against that creature.' },
      { level: 6, name: 'Cloak of Shadows', description: 'Channel Divinity: As an action, become invisible until the end of your next turn. You become visible if you attack or cast a spell.' },
      { level: 8, name: 'Divine Strike', description: 'Once per turn, when you hit with a weapon attack, deal an additional 1d8 poison damage (2d8 at level 14).' },
      { level: 17, name: 'Improved Duplicity', description: 'You can create up to four duplicates of yourself with Invoke Duplicity instead of one. As a bonus action, move any number of them up to 30 ft.' },
    ],
  },
  'Knowledge Domain': {
    flavorText: 'The gods of knowledge — including Oghma, Boccob, Gilean, Aureon, and Thoth — value learning and understanding above all. Some teach that knowledge is to be gathered and shared in libraries and universities, or promote the practical knowledge of craft and invention.',
    features: [
      { level: 1, name: 'Blessings of Knowledge', description: 'You learn two languages of your choice. You also become proficient in your choice of two of the following skills: Arcana, History, Nature, or Religion. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen skills.' },
      { level: 2, name: 'Knowledge of the Ages', description: 'Channel Divinity: As an action, choose a skill or tool. For 10 minutes, you have proficiency with that skill or tool.' },
      { level: 2, name: 'Read Thoughts', description: 'Channel Divinity: As an action, read the surface thoughts of a creature within 60 ft (WIS save). On a fail, read their thoughts for 1 minute and cast suggestion (no slot) once against them.' },
      { level: 6, name: 'Channel Divinity', description: 'You can use both Knowledge of the Ages and Read Thoughts as Channel Divinity options.' },
      { level: 8, name: 'Potent Spellcasting', description: 'You add your Wisdom modifier to the damage you deal with cleric cantrips.' },
      { level: 17, name: 'Visions of the Past', description: 'Spend 1 minute meditating on an object or location to receive impressions of its history — who owned it, how it was used, or events that transpired there.' },
    ],
  },
  'Nature Domain': {
    flavorText: 'Gods of nature are as varied as the natural world itself. Some embrace nature\'s wildness (Silvanus, Obad-Hai), others focus on beauty and love (Eldath), and others tend to the agricultural cycles that keep civilization alive. In cities, temples to nature gods share space with civic temples.',
    features: [
      { level: 1, name: 'Acolyte of Nature', description: 'You learn one druid cantrip of your choice. You also gain proficiency in one of these skills: Animal Handling, Nature, or Survival.' },
      { level: 2, name: 'Charm Animals and Plants', description: 'Channel Divinity: As an action, present your holy symbol and invoke your deity\'s name. All beasts and plant creatures within 30 ft that can see you are charmed for 1 minute or until they take damage.' },
      { level: 6, name: 'Dampen Elements', description: 'When you or a creature within 30 ft takes acid, cold, fire, lightning, or thunder damage, you can use your reaction to grant resistance to that instance of damage.' },
      { level: 8, name: 'Divine Strike', description: 'Once per turn, when you hit with a weapon attack, deal an additional 1d8 cold, fire, or lightning damage (your choice; 2d8 at level 14).' },
      { level: 17, name: 'Master of Nature', description: 'You gain the ability to command animals and plant creatures. While creatures are charmed by your Charm Animals and Plants, you can take a bonus action to verbally command what each creature will do on its next turn.' },
    ],
  },
  'Tempest Domain': {
    flavorText: 'Gods whose portfolios include the Tempest domain — including Talos, Umberlee, Kord, Zeboim, the Devourer, Zeus, and Thor — govern storms, sea, and sky. They include gods of lightning and thunder, gods of earthquakes, some fire gods, and certain gods of violence, physical strength, and courage.',
    features: [
      { level: 1, name: 'Bonus Proficiencies', description: 'You gain proficiency with martial weapons and heavy armor.' },
      { level: 2, name: 'Destructive Wrath', description: 'Channel Divinity: When you roll lightning or thunder damage, use your Channel Divinity to deal maximum damage instead of rolling.' },
      { level: 6, name: 'Thunderbolt Strike', description: 'When you deal lightning damage to a Large or smaller creature, you can also push it up to 10 ft away from you.' },
      { level: 8, name: 'Divine Strike', description: 'Once per turn, when you hit a creature with a weapon attack, deal an additional 1d8 thunder damage (2d8 at level 14).' },
      { level: 17, name: 'Stormborn', description: 'You have a fly speed equal to your current walking speed whenever you are not underground or indoors.' },
    ],
  },
  'War Domain': {
    flavorText: 'War has many manifestations. It can make heroes of ordinary people. It can be desperate and horrific, with acts of cruelty and cowardice eclipsing instances of excellence and courage. Clerics who follow the War domain — such as Tempus, Hextor, Maglubiyet, Nuada, Erythnul — are among the most martial of all clerics.',
    features: [
      { level: 1, name: 'Bonus Proficiencies', description: 'You gain proficiency with martial weapons and heavy armor.' },
      { level: 1, name: 'War Priest', description: 'When you use the Attack action, you can make one weapon attack as a bonus action. You can use this feature a number of times equal to your Wisdom modifier per long rest.' },
      { level: 2, name: 'Guided Strike', description: 'Channel Divinity: When you make an attack roll, you can use your Channel Divinity to gain a +10 bonus to the roll. You make this choice after you see the roll but before the DM says whether the attack hits or misses.' },
      { level: 6, name: 'War God\'s Blessing', description: 'Channel Divinity: When another creature within 30 ft makes an attack roll, you can use your reaction to grant a +10 bonus to the roll using your Channel Divinity.' },
      { level: 8, name: 'Divine Strike', description: 'Once per turn, when you hit with a weapon attack, deal an additional 1d8 damage of the same type as the weapon (2d8 at level 14).' },
      { level: 17, name: 'Avatar of Battle', description: 'You gain resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.' },
    ],
  },
  'Arcana Domain': {
    flavorText: 'Magic is an energy that suffuses the multiverse and that fuels both destruction and creation. Gods of the Arcana domain know the secrets and potential of magic intimately. Ioun, Boccob, and Mystra are arcana domain deities, and they value learning and scholarly pursuit above all.',
    features: [
      { level: 1, name: 'Arcane Initiate', description: 'You gain proficiency in the Arcana skill. You also learn two cantrips of your choice from the wizard spell list.' },
      { level: 2, name: 'Arcane Abjuration', description: 'Channel Divinity: As an action, present your holy symbol and one celestial, elemental, fey, or fiend within 30 ft must make a Wisdom saving throw or be turned for 1 minute or until it takes damage.' },
      { level: 6, name: 'Spell Breaker', description: 'When you restore hit points to an ally with a spell of 1st level or higher, you can also end one spell of your choice on that creature, as long as the spell\'s level is equal to or less than the level of the healing spell.' },
      { level: 8, name: 'Potent Spellcasting', description: 'You add your Wisdom modifier to the damage you deal with any cleric cantrip.' },
      { level: 17, name: 'Arcane Mastery', description: 'You choose four spells from the wizard spell list, one from each of the following levels: 6th, 7th, 8th, and 9th. You add them to your list of domain spells, and they are always prepared.' },
    ],
  },
  'Death Domain': {
    flavorText: 'The Death domain is concerned with the forces that cause death, as well as the negative energy that gives rise to undead creatures. Deities such as Chemosh, Myrkul, and Wee Jas are patrons of necromancers, death knights, liches, mummy lords, and vampires. This domain is typically reserved for villain NPCs.',
    features: [
      { level: 1, name: 'Bonus Proficiency', description: 'You gain proficiency with martial weapons.' },
      { level: 1, name: 'Reaper', description: 'You learn one necromancy cantrip of your choice from any spell list. When you cast a necromancy cantrip that normally targets only one creature, the spell can instead target two creatures within range and within 5 ft of each other.' },
      { level: 2, name: 'Touch of Death', description: 'Channel Divinity: When you hit a creature with a melee attack, you deal extra necrotic damage equal to 5 + twice your cleric level.' },
      { level: 6, name: 'Inescapable Destruction', description: 'Your ability to channel negative energy becomes more potent. Necrotic damage dealt by your cleric spells and Channel Divinity options ignores resistance to necrotic damage.' },
      { level: 8, name: 'Divine Strike', description: 'Once per turn, when you hit with a weapon attack, deal an additional 1d8 necrotic damage (2d8 at level 14).' },
      { level: 17, name: 'Improved Reaper', description: 'When you cast a necromancy spell of 1st through 5th level that targets only one creature, the spell can instead target two creatures within range and within 5 ft of each other. If the spell consumes material components, you must provide them for each target.' },
    ],
  },
  'Forge Domain': {
    flavorText: 'The gods of the forge are patrons of artisans who work with metal, from a humble blacksmith who keeps a village in horseshoes and plowshares to the mighty elf artisan whose diamond-tipped arrows of mithral have felled demon lords. The forge gods — Gond, Reorx, Onatar, Moradin, Hephaestus, and Goibhniu — teach that, with patience and hard work, even the most intractable metal can be given a stunning and useful form.',
    features: [
      { level: 1, name: 'Bonus Proficiencies', description: 'You gain proficiency with heavy armor and smith\'s tools.' },
      { level: 1, name: 'Blessing of the Forge', description: 'At the end of a long rest, touch one nonmagical weapon or armor. Until the end of your next long rest, it becomes a magic weapon or armor with a +1 bonus to attack and damage (weapon) or AC (armor). You lose this benefit if you use the feature again.' },
      { level: 2, name: 'Artisan\'s Blessing', description: 'Channel Divinity: Conduct a 1-hour ritual to create a simple or martial weapon, ammunition, a suit of armor, a set of tools, or another metal object. The item is worth up to 100 gp and must include some metal.' },
      { level: 6, name: 'Soul of the Forge', description: 'Your mastery of the forge grants you special abilities: resistance to fire damage, and a +1 bonus to AC while wearing heavy armor.' },
      { level: 8, name: 'Divine Strike', description: 'Once per turn, when you hit with a weapon attack, deal an additional 1d8 fire damage (2d8 at level 14).' },
      { level: 17, name: 'Saint of Forge and Fire', description: 'Your blessed affinity with fire and metal becomes more powerful: immunity to fire damage, and while wearing heavy armor any critical hit against you is treated as a normal hit.' },
    ],
  },
  'Grave Domain': {
    flavorText: 'Gods of the grave watch over the line between life and death. To these deities, death and the afterlife are a foundational part of the multiverse. To desecrate the peace of the dead is an abomination. Deities such as Kelemvor, Wee Jas, the ancestral spirits of the Undying Court, Hades, Anubis, and Osiris watch over this domain.',
    features: [
      { level: 1, name: 'Circle of Mortality', description: 'When you would normally roll one or more dice to restore hit points with a spell to a creature at 0 hit points, you instead use the highest number possible. You also learn the spare the dying cantrip, which doesn\'t count against cantrips known.' },
      { level: 2, name: 'Eyes of the Grave', description: 'As an action, you can open your grave-sight. Until the end of your next turn, you know the location of any undead within 60 ft that isn\'t behind total cover. Usable PB times per long rest.' },
      { level: 2, name: 'Path to the Grave', description: 'Channel Divinity: As an action, curse a creature within 30 ft. The next time you or an ally hits the creature with an attack before the end of your next turn, the creature has vulnerability to all of that attack\'s damage.' },
      { level: 6, name: 'Sentinel at Death\'s Door', description: 'As a reaction when you or a creature you can see within 30 ft suffers a critical hit, turn the hit into a normal hit. Usable PB times per long rest.' },
      { level: 8, name: 'Potent Spellcasting', description: 'You add your Wisdom modifier to the damage you deal with any cleric cantrip.' },
      { level: 17, name: 'Keeper of Souls', description: 'You can seize a trace of vitality from a parting soul. When an enemy you can see dies within 60 ft, you or one creature of your choice within 60 ft regains hit points equal to the enemy\'s number of Hit Dice. This feature can be used only once per turn.' },
    ],
  },
  'Order Domain': {
    flavorText: 'The Order Domain represents discipline, as well as devotion to the laws that govern a society, an institution, or a philosophy. Clerics of Order meditate on logic and justice as they serve their gods, examples of which include Tyr, Pholtus, Wee Jas, Aureon, Bane, Primus, and Majestrix.',
    features: [
      { level: 1, name: 'Bonus Proficiencies', description: 'You gain proficiency with heavy armor and with the Persuasion or Intimidation skill (your choice).' },
      { level: 1, name: 'Voice of Authority', description: 'When you cast a spell of 1st level or higher using a spell slot on a friendly creature, that creature can use its reaction to make one weapon attack against a target of your choice that you can see.' },
      { level: 2, name: 'Order\'s Demand', description: 'Channel Divinity: As an action, present your holy symbol; each creature of your choice within 30 ft must succeed on a Wisdom saving throw or be charmed for 1 minute. Charmed creatures drop whatever they\'re holding and become incapacitated until the end of your next turn.' },
      { level: 6, name: 'Embodiment of the Law', description: 'You become remarkably adept at channeling magical authority. If you cast a spell of the enchantment school using a spell slot of 1st level or higher, you can change its casting time from 1 action to 1 bonus action.' },
      { level: 8, name: 'Divine Strike', description: 'Once per turn, when you hit with a weapon attack, deal an additional 1d8 psychic damage (2d8 at level 14).' },
      { level: 17, name: 'Order\'s Wrath', description: 'Enemies you smite cower under the weight of divine authority. If you deal Divine Strike damage on your turn, you can curse the target until the start of your next turn. The first time a creature hits the target while it\'s cursed, that creature can deal 2d8 extra psychic damage as a reaction.' },
    ],
  },
  'Peace Domain': {
    flavorText: 'The balm of peace thrives at the heart of healthy communities, between friendly nations, and in the souls of the kindhearted. The gods of peace inspire people of all sorts to resolve conflict and to stand together against those who would destroy what accords have built. The Platinum Dragon, Bahamut, is revered in many multiverse pantheons as a god of peace, along with Eldath, Rao, and St. Cuthbert.',
    features: [
      { level: 1, name: 'Implement of Peace', description: 'You gain proficiency in the Insight, Performance, or Persuasion skill (your choice).' },
      { level: 1, name: 'Emboldening Bond', description: 'Bond up to a number of creatures equal to your proficiency bonus within 30 ft for 10 minutes. Bonded creatures add 1d4 to attack rolls, ability checks, and saving throws while within 30 ft of at least one other bonded creature. Usable PB times per long rest.' },
      { level: 2, name: 'Balm of Peace', description: 'Channel Divinity: As an action, you move up to your speed without provoking opportunity attacks. As you move, you can restore HP to any creature you pass within 5 ft, up to 2d6 + your Wisdom modifier HP.' },
      { level: 6, name: 'Protective Bond', description: 'The bond you forge between people helps them protect each other. When a bonded creature is about to take damage, a second bonded creature within 60 ft can use its reaction to teleport to the first creature\'s space, taking the damage instead (requires expending a spell slot).' },
      { level: 8, name: 'Potent Spellcasting', description: 'You add your Wisdom modifier to the damage you deal with any cleric cantrip.' },
      { level: 17, name: 'Expansive Bond', description: 'The benefits of your Emboldening Bond and Protective Bond now work when the bonded creatures are up to 300 ft from each other. Additionally, when a bonded creature uses Protective Bond to absorb damage, it gains resistance to that damage.' },
    ],
  },
  'Twilight Domain': {
    flavorText: 'The twilight domain governs the transitional space between light and darkness, the threshold between wakefulness and dreaming. This domain includes gods of night, sleep, stars, and the moon. These deities celebrate the dim time between sunset and sunrise, when the world of dreams mingles with the waking realm.',
    features: [
      { level: 1, name: 'Bonus Proficiencies', description: 'You gain proficiency with martial weapons and heavy armor.' },
      { level: 1, name: 'Eyes of Night', description: 'You can see through magical and nonmagical darkness out to 300 ft. As an action, share this darkvision with willing creatures within 10 ft for 1 hour. Usable WIS modifier times per long rest.' },
      { level: 1, name: 'Vigilant Blessing', description: 'The night has taught you to be vigilant. You can bestow advantage on the next initiative roll to a creature you touch at the end of a long rest. You lose this benefit once you bestow it or when you finish a short rest.' },
      { level: 2, name: 'Twilight Sanctuary', description: 'Channel Divinity: As an action, present your holy symbol and a sphere of twilight emanates from you (30 ft radius, concentration, 1 minute). At the start of each creature\'s turn in the sphere, you can choose: grant 1d6 + cleric level temp HP, or end one effect causing the creature to be charmed or frightened.' },
      { level: 6, name: 'Steps of Night', description: 'You can draw on the mystical power of night to grant yourself the gift of flight. As a bonus action while in dim light or darkness, grant a fly speed equal to your walking speed for 1 minute. Usable PB times per long rest.' },
      { level: 8, name: 'Divine Strike', description: 'Once per turn, when you hit with a weapon attack, deal an additional 1d8 radiant damage (2d8 at level 14).' },
      { level: 17, name: 'Twilight Shroud', description: 'The twilight that you summon offers comfort to your allies. Any creature in the sphere you create with Twilight Sanctuary gains half cover while there.' },
    ],
  },
};

// Build 2024 entries by shifting feature levels: L2→L3, L6→L6, L8→L8, L17→L17
// (Cleric in 2024 chooses subclass at L3, not L1; first two features come at L3)
function make2024(domain5e) {
  return {
    flavorText: domain5e.flavorText,
    features: domain5e.features.map(f => ({
      ...f,
      level: f.level === 1 ? 3 : f.level === 2 ? 3 : f.level,
    })).filter((f, i, arr) =>
      // Deduplicate features collapsed onto L3
      i === arr.findIndex(x => x.level === f.level && x.name === f.name)
    ),
  };
}

export const CLERIC = {
  '5e': DOMAINS_5E,
  '5.5e': Object.fromEntries(
    Object.entries(DOMAINS_5E).map(([name, data]) => [name, make2024(data)])
  ),
};
