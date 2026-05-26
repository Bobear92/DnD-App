export const RANGER = {
  '5e': {
    'Beast Master': {
      flavorText: 'The Beast Master archetype embodies a friendship between the civilized races and the beasts of the world. United in focus, beast and ranger work as one to hunt the enemy. Joining the Beast Master archetype means committing yourself to this ideal, working in partnership with an animal as its companion and friend.',
      features: [
        { level: 3, name: 'Ranger\'s Companion', description: 'Choose a beast no larger than Medium and of CR 1/4 or lower. It obeys your commands, gains extra HP and attack bonuses from your proficiency bonus, acts on your initiative, and uses your proficiency bonus for attack rolls and ability checks. On death, a new companion is obtained after a long rest.' },
        { level: 7, name: 'Exceptional Training', description: 'On any of your turns when your companion doesn\'t attack, you can use a bonus action to command the beast to take the Dash, Disengage, Help, or Hide action. Your companion\'s attacks now count as magical.' },
        { level: 11, name: 'Bestial Fury', description: 'Your beast companion can now make two attacks when you command it to attack.' },
        { level: 15, name: 'Share Spells', description: 'When you cast a spell targeting yourself, you can also affect your beast companion with the spell if the companion is within 30 ft of you.' },
      ],
    },
    'Gloom Stalker': {
      flavorText: 'Gloom Stalkers are at home in the darkest places: deep under the earth, in gloomy alleyways, in primeval forests, and wherever else the light dims. Most folk enter such places with trepidation, but a Gloom Stalker ventures boldly into the darkness, finding it a perfect blur for an ambush.',
      features: [
        { level: 3, name: 'Dread Ambusher', description: 'You master the art of the ambush. You have advantage on initiative rolls. In the first round of combat, you get an extra attack as part of your Attack action. If that attack hits, it deals an extra 1d8 damage.' },
        { level: 3, name: 'Umbral Sight', description: 'You gain darkvision out to 60 ft. If you already have darkvision, it extends to 120 ft. You are also adept at evading creatures that rely on darkvision. While in darkness, you are invisible to creatures that rely on darkvision to see you.' },
        { level: 7, name: 'Iron Mind', description: 'You honed your ability to resist the mind-altering powers of your prey. You gain proficiency in Wisdom saving throws. If you already have this proficiency, you instead gain proficiency in Intelligence or Charisma saving throws (your choice).' },
        { level: 11, name: 'Stalker\'s Flurry', description: 'You learn to attack with such unexpected speed that you can turn a miss into another strike. Once on each of your turns when you miss with a weapon attack, you can make another weapon attack as part of the same action.' },
        { level: 15, name: 'Shadowy Dodge', description: 'Whenever a creature makes an attack roll against you and doesn\'t have advantage on the roll, you can use your reaction to impose disadvantage on it. You must use this feature before you know whether the attack hits or misses.' },
      ],
    },
    'Horizon Walker': {
      flavorText: 'Horizon Walkers guard the world against threats that originate from other planes or that seek to ravage the mortal realm with otherworldly magic. They seek out planar portals and keep watch over them, venturing to the Inner Planes, the Outer Planes, or even the Far Realm to better understand the threats they face.',
      features: [
        { level: 3, name: 'Detect Portal', description: 'As an action, detect the distance and direction to the closest planar portal within 1 mile of you. Once used, you must finish a short or long rest before using this feature again.' },
        { level: 3, name: 'Planar Warrior', description: 'As a bonus action, choose a creature you can see within 30 ft. The first hit against that creature on this turn deals an extra 1d8 force damage (2d8 at level 11). The creature also loses its resistances and immunities to your attacks until the end of your turn.' },
        { level: 7, name: 'Ethereal Step', description: 'Learn the etherealness spell. You can cast it once without using a spell slot, using only a bonus action (instead of an action). Usable once per short or long rest.' },
        { level: 11, name: 'Distant Strike', description: 'You gain the ability to pass between the planes in the blink of an eye. When you use the Attack action, you can teleport up to 10 ft before each attack to an unoccupied space you can see.' },
        { level: 15, name: 'Spectral Defense', description: 'Your ability to move between planes enables you to slip through the planar boundaries to lessen the harm done to you. When you take damage from an attack, use your reaction to give yourself resistance to all of that attack\'s damage on this turn.' },
      ],
    },
    'Hunter': {
      flavorText: 'Emulating the Hunter archetype means accepting your place as a bulwark between the people you protect and the terrors of the wilderness. As you walk the Hunter\'s path, you learn specialized techniques for fighting the threats you face, from rampaging ogres and hordes of orcs to towering giants and terrifying dragons.',
      features: [
        { level: 3, name: 'Hunter\'s Prey', description: 'Choose one of: Colossus Slayer (extra 1d8 vs. injured creatures once per turn), Giant Killer (reaction attack vs. Large or larger creature when it misses you), or Horde Breaker (extra attack vs. adjacent creature to your first Attack action target).' },
        { level: 7, name: 'Defensive Tactics', description: 'Choose one of: Escape the Horde (opportunity attacks against you have disadvantage), Multiattack Defense (+4 AC against additional attacks after the first from the same creature), or Steel Will (advantage on WIS saves against being frightened).' },
        { level: 11, name: 'Multiattack', description: 'Choose one of: Volley (use your action to make a ranged attack against any number of creatures within 10 ft of a point you can see within range), or Whirlwind Attack (use action to make melee attacks against any number of creatures within 5 ft).' },
        { level: 15, name: 'Superior Hunter\'s Defense', description: 'Choose one of: Evasion (DEX save for no damage on success, half on fail for area effects), Stand Against the Tide (when a creature misses you with melee, use reaction to force it to re-attack another creature of your choice), or Uncanny Dodge (use reaction to halve damage from an attack you can see).' },
      ],
    },
    'Monster Slayer': {
      flavorText: 'You have dedicated yourself to hunting down creatures of the night and wielders of grim magic. A Monster Slayer seeks out vampires, dragons, evil fey, fiends, and other magical threats. Trained in supernatural techniques to overcome such monsters, slayers are experts at finding and defeating mighty, seemingly impervious creatures.',
      features: [
        { level: 3, name: 'Hunter\'s Sense', description: 'As an action, choose a creature you can see within 60 ft. Know its damage immunities, resistances, and vulnerabilities (if any). Usable WIS modifier times per long rest.' },
        { level: 3, name: 'Slayer\'s Prey', description: 'As a bonus action, designate a creature as your Slayer\'s Prey. Your first attack on that target each turn deals an extra 1d6 damage. Lasts until the target dies or you use this feature again.' },
        { level: 7, name: 'Supernatural Defense', description: 'You gain extra protection against your prey\'s powers. When your Slayer\'s Prey forces you to make a saving throw, add 1d6 to the roll. Also add 1d6 to all checks to escape the prey\'s grapple.' },
        { level: 11, name: 'Magic-User\'s Nemesis', description: 'When a creature in range casts a spell or teleports, use your reaction to make a weapon attack against that creature. On a hit, the creature\'s spell fails and is wasted (or teleportation fails). Usable once per short or long rest.' },
        { level: 15, name: 'Slayer\'s Counter', description: 'When your Slayer\'s Prey forces you to make a saving throw, use your reaction to make one weapon attack against the prey. On a hit, you automatically succeed on the saving throw.' },
      ],
    },
    'Fey Wanderer': {
      flavorText: 'A fey wanderer is a ranger who carries a touch of the Feywild\'s magic into the world. Fey wanderers dwell in two worlds at once — the mortal realm and the Feywild — and their magic combines the beauty and strangeness of both.',
      features: [
        { level: 3, name: 'Dreadful Strikes', description: 'You can augment your weapons with fey power. On your turn when you hit a creature with a weapon attack, deal an extra 1d4 psychic damage (1d6 at level 11). The creature also can\'t take reactions until your next turn.' },
        { level: 3, name: 'Otherworldly Glamour', description: 'Your fey qualities give you a supernatural charm. Add your WIS modifier to all Charisma checks. Gain proficiency in Deception, Performance, or Persuasion (your choice).' },
        { level: 7, name: 'Beguiling Twist', description: 'The magic of the Feywild guards you. Advantage on saves against charmed or frightened. When a creature within 120 ft fails a save against charmed or frightened, use your reaction to redirect that condition to a different creature within 30 ft of the original target (WIS save to resist).' },
        { level: 11, name: 'Fey Reinforcements', description: 'You can cast summon fey once without using a spell slot and without material components. Once cast, can\'t use this feature again until you finish a long rest. You can also cast it using spell slots.' },
        { level: 15, name: 'Misty Wanderer', description: 'Teleport up to 30 ft to an unoccupied space you can see (bonus action). Bring one willing creature within 5 ft. Use this a number of times equal to WIS modifier per long rest.' },
      ],
    },
    'Swarmkeeper': {
      flavorText: 'Feeling a deep connection to the natural world around them, some rangers are at home when surrounded by a cloud of insects, a flock of birds, a swarm of small beasts, or some other living collection. This connection manifests as a Swarmkeeper who can call upon these creatures to act as a natural ally.',
      features: [
        { level: 3, name: 'Gathered Swarm', description: 'You are bonded to a swarm of Tiny creatures (choose insects, birds, or other beasts). The swarm moves with you. Once per turn when you hit with an attack roll, the swarm does one of: deal extra 1d6 piercing damage, move the target 15 ft (STR save), or move yourself 5 ft without provoking opportunity attacks.' },
        { level: 3, name: 'Writhing Tide', description: 'As a bonus action, the swarm carries you — gain a fly or swim speed of 10 ft until end of turn. Usable WIS modifier times per long rest.' },
        { level: 7, name: 'Mighty Swarm', description: 'Your Gathered Swarm\'s effects improve: extra damage increases to 1d8; the movement imposed grows to 30 ft; a creature moved by your swarm\'s push must succeed a STR save or fall prone.' },
        { level: 11, name: 'Carrion Flies', description: 'You can call a swarm of carrion flies to assist you. Once per long rest, cast insect plague (no slot, no concentration) using your spell save DC.' },
        { level: 15, name: 'Swarming Dispersal', description: 'When you take damage, use your reaction to disperse into the swarm and teleport up to 30 ft to an unoccupied space you can see, becoming resistant to the triggering damage. You re-form at the end of the teleport. Usable WIS modifier times per long rest.' },
      ],
    },
    'Drakewarden': {
      flavorText: 'Your connection to the natural world takes the form of a draconic spirit, which can manifest in physical form as a drake. As your bond with your drake grows, your drake grows to become a fearsome creature alongside you. A Drakewarden\'s drake might be a loyal companion from the wild or a creature you received from a dragon patron.',
      features: [
        { level: 3, name: 'Drake Companion', description: 'Your link to draconic power allows you to summon a drake spirit of Large size or smaller. It obeys your commands, acts on your initiative, and gains benefits from your proficiency bonus. If it dies, you can summon a new one over a 1-hour ritual.' },
        { level: 3, name: 'Bond of Fang and Scale', description: 'Your bond with your drake allows each of you to gain the other\'s senses. You can cast spells as though your drake were the caster (within range). The drake\'s type matches your chosen draconic damage element (acid, cold, fire, lightning, or poison).' },
        { level: 7, name: 'Drake\'s Breath', description: 'As an action or bonus action, you can cause the drake to expel a 30 ft cone of elemental energy — all targets must make a DEX save or take 4d6 damage of your element type. Usable PB times per long rest.' },
        { level: 11, name: 'Perfected Bond', description: 'The drake grows wings and gains a fly speed of 40 ft. You also share resistance to its damage type (and so does your drake), and the drake gains the ability to use its breath weapon on your command.' },
        { level: 15, name: 'Drake\'s Ascent', description: 'You can mount the drake as a bonus action (if size-appropriate). While mounted, share all your spell effects that target you, and the drake can make bite attacks as reactions when you use the Attack action.' },
      ],
    },
  },

  '5.5e': {
    'Beast Master': {
      flavorText: 'The Beast Master bonds with an animal companion, working in harmony to hunt their quarry. The 2024 rules give the Primal Beast companion its own dedicated stat block — chosen at level 3 — with significantly improved capabilities compared to older editions.',
      features: [
        { level: 3, name: 'Primal Companion', description: 'Bond with one of three Primal Beasts (Beast of the Land, Beast of the Sea, Beast of the Sky). It has its own stat block with HP scaling from your ranger level, uses your proficiency bonus, and acts on your initiative. Replaced with a 1-hour ritual after death.' },
        { level: 7, name: 'Exceptional Training', description: 'On your turn when your companion doesn\'t attack, command it as a Bonus Action to take Dash, Disengage, Dodge, or Help. Your companion\'s attacks count as magical.' },
        { level: 11, name: 'Bestial Fury', description: 'Your companion can make two attacks when you command it to attack.' },
        { level: 15, name: 'Share Spells', description: 'When you cast a spell targeting yourself, you can also affect your companion if it\'s within 30 ft.' },
      ],
    },
    'Fey Wanderer': {
      flavorText: 'A Fey Wanderer carries the Feywild\'s touch into the mortal world. The 2024 rules refine Dreadful Strikes for cleaner action economy and sharpen Misty Wanderer into a reliable teleportation tool at high levels.',
      features: [
        { level: 3, name: 'Dreadful Strikes', description: 'Once per turn when you hit with a weapon attack, deal an extra 1d4 psychic damage and prevent the target from taking reactions until your next turn (1d6 at level 11).' },
        { level: 3, name: 'Otherworldly Glamour', description: 'Add WIS modifier to all CHA checks; gain proficiency in Deception, Performance, or Persuasion.' },
        { level: 7, name: 'Beguiling Twist', description: 'Advantage on saves against Charmed and Frightened. When a creature within 120 ft fails a save against Charmed or Frightened, redirect that condition to a different creature within 30 ft (WIS save to resist).' },
        { level: 11, name: 'Fey Reinforcements', description: 'Cast summon fey once per long rest without a spell slot; can also cast using spell slots.' },
        { level: 15, name: 'Misty Wanderer', description: 'As a Bonus Action, teleport up to 30 ft to an unoccupied visible space, bringing one willing creature. Usable WIS modifier times per long rest.' },
      ],
    },
    'Gloom Stalker': {
      flavorText: 'Gloom Stalkers haunt the dark places of the world, striking swiftly and disappearing before foes can react. The 2024 revision keeps the signature first-round extra attack and darkvision ambush, while tightening the Stalker\'s Flurry miss-recovery mechanic.',
      features: [
        { level: 3, name: 'Dread Ambusher', description: 'Advantage on initiative rolls. In the first round of combat, one extra attack as part of the Attack action — if it hits, deal +1d8 damage.' },
        { level: 3, name: 'Umbral Sight', description: 'Gain 60 ft darkvision (or extend existing darkvision to 120 ft). While in darkness, you\'re invisible to creatures that rely on darkvision.' },
        { level: 7, name: 'Iron Mind', description: 'Gain proficiency in WIS saving throws (or INT/CHA if already proficient).' },
        { level: 11, name: 'Stalker\'s Flurry', description: 'Once per turn, when you miss with a weapon attack, make another weapon attack against the same target.' },
        { level: 15, name: 'Shadowy Dodge', description: 'When a creature makes an attack roll against you without advantage, use your reaction to impose disadvantage on it.' },
      ],
    },
    'Hunter': {
      flavorText: 'The Hunter embodies the ranger\'s role as a specialist in fighting specific types of foes. The 2024 rules reorganize the Hunter\'s menu of choices into a streamlined set of options that remain powerful and distinct throughout all levels of play.',
      features: [
        { level: 3, name: 'Hunter\'s Prey', description: 'Choose one: Colossus Slayer (+1d8 vs. injured creatures), Giant Killer (reaction attack when Large+ creature misses you), or Horde Breaker (extra attack vs. an adjacent creature after attacking another).' },
        { level: 7, name: 'Defensive Tactics', description: 'Choose one: Escape the Horde (disadvantage on opportunity attacks against you), Multiattack Defense (+4 AC vs. additional attacks from the same creature), or Steel Will (advantage on WIS saves vs. frightened).' },
        { level: 11, name: 'Multiattack', description: 'Choose one: Volley (ranged attack vs. all creatures within 10 ft of a point) or Whirlwind Attack (melee attack vs. all creatures within 5 ft).' },
        { level: 15, name: 'Superior Hunter\'s Defense', description: 'Choose one: Evasion, Stand Against the Tide (redirect missed melee attack to another creature), or Uncanny Dodge (halve damage from a seen attack).' },
      ],
    },
    'Monster Slayer': {
      flavorText: 'Monster Slayers specialize in hunting supernatural creatures — vampires, fiends, dragons, and other powerful beasts. The 2024 rules keep the Slayer\'s Prey damage bonus and Hunter\'s Sense while tightening the late-game Slayer\'s Counter into a more reliable defensive tool.',
      features: [
        { level: 3, name: 'Hunter\'s Sense', description: 'As an action, learn a creature\'s damage immunities, resistances, and vulnerabilities. Usable WIS modifier times per long rest.' },
        { level: 3, name: 'Slayer\'s Prey', description: 'As a Bonus Action, mark a creature. Your first attack on the target each turn deals +1d6 damage. Lasts until the target dies or you use this feature again.' },
        { level: 7, name: 'Supernatural Defense', description: 'Add 1d6 to saves against your Slayer\'s Prey\'s abilities and to escape its grapples.' },
        { level: 11, name: 'Magic-User\'s Nemesis', description: 'When a creature in range casts a spell or teleports, use your reaction to attack it. On a hit, the spell fails or the teleport is negated. Usable once per short or long rest.' },
        { level: 15, name: 'Slayer\'s Counter', description: 'When your Slayer\'s Prey forces you to save, use your reaction to attack it. On a hit, you automatically succeed on the save.' },
      ],
    },
    'Swarmkeeper': {
      flavorText: 'A Swarmkeeper is bonded to a swarm of Tiny creatures — insects, birds, or other beasts — that acts as a natural ally. The 2024 revision streamlines the Gathered Swarm\'s action economy and makes the swarm\'s utility options more flexible throughout all tiers of play.',
      features: [
        { level: 3, name: 'Gathered Swarm', description: 'A swarm moves with you. Once per turn on a hit, choose: deal +1d6 piercing damage, move the target up to 15 ft (STR save), or move yourself 5 ft without opportunity attacks.' },
        { level: 7, name: 'Writhing Tide', description: 'As a Bonus Action, gain a 10 ft fly or swim speed until end of turn. Usable WIS modifier times per long rest.' },
        { level: 11, name: 'Mighty Swarm', description: 'Gathered Swarm damage increases to 1d8; forced movement increases to 30 ft; targets moved against their will must STR save or fall prone.' },
        { level: 15, name: 'Swarming Dispersal', description: 'When you take damage, use your reaction to disperse and teleport up to 30 ft, gaining resistance to the triggering damage. Usable WIS modifier times per long rest.' },
      ],
    },
  },
};
