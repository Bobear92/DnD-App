export const BARBARIAN = {
  '5e': {
    'Path of the Berserker': {
      flavorText: 'For some barbarians, rage is a means to an end — that end being violence. The Path of the Berserker is a path of untrammeled fury, slick with blood. As you enter the berserker\'s rage, you thrill in the chaos of battle, heedless of your own health or well-being.',
      features: [
        { level: 3, name: 'Frenzy', description: 'While raging you can go into a frenzy. For the duration you can make a single melee weapon attack as a bonus action on each of your turns. When your rage ends, you suffer one level of exhaustion.' },
        { level: 6, name: 'Mindless Rage', description: 'You can\'t be charmed or frightened while raging. If you are charmed or frightened when you enter your rage, the effect is suspended for the duration of the rage.' },
        { level: 10, name: 'Intimidating Presence', description: 'Use your action to frighten a creature you can see within 30 ft. It must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + your Charisma modifier) or be frightened of you until the end of your next turn. You can repeat this each turn.' },
        { level: 14, name: 'Retaliation', description: 'When you take damage from a creature within 5 ft of you, you can use your reaction to make a melee weapon attack against that creature.' },
      ],
    },
    'Path of the Totem Warrior': {
      flavorText: 'The Path of the Totem Warrior is a spiritual journey, as the barbarian accepts a spirit animal as guide, protector, and inspiration. In battle, your totem spirit fills you with supernatural might. Most barbarian tribes consider a totem animal to be kin to a particular clan.',
      features: [
        { level: 3, name: 'Spirit Seeker', description: 'Yours is a path that seeks attunement with the natural world. You can cast beast sense and speak with animals as rituals.' },
        { level: 3, name: 'Totem Spirit', description: 'Choose a totem spirit — Bear (resistance to all damage except psychic while raging), Eagle (no opportunity attacks against you; Dash as bonus action while raging), or Wolf (allies have advantage on melee attacks against any creature within 5 ft of you while raging).' },
        { level: 6, name: 'Aspect of the Beast', description: 'You gain a magical benefit based on your totem. Bear (carry capacity doubled; advantage on STR checks), Eagle (see clearly up to 1 mile; dim light as bright light), or Wolf (track at a fast pace; move stealthily at a normal pace).' },
        { level: 10, name: 'Spirit Walker', description: 'You can cast commune with nature as a ritual, calling on your totem spirit to grant insight into the surrounding territory.' },
        { level: 14, name: 'Totemic Attunement', description: 'Gain a powerful benefit while raging based on your totem. Bear (enemies within 5 ft are frightened if they attack others), Eagle (fly speed equal to walking speed), or Wolf (knock a Large or smaller creature prone when you hit it with a melee attack).' },
      ],
    },
    'Path of the Ancestral Guardian': {
      flavorText: 'Some barbarians hail from cultures that revere their ancestors. These tribes teach that the warriors of the past linger in the world as mighty spirits, who can guide and protect the living. When a barbarian who follows this path rages, the barbarian contacts the spirit world and calls on these guardian spirits for aid.',
      features: [
        { level: 3, name: 'Ancestral Protectors', description: 'While you\'re raging, the first creature you hit on each of your turns becomes the focus of your ancestral spirits. Until the start of your next turn, that target has disadvantage on attack rolls against targets other than you, and those targets gain resistance to all damage from it.' },
        { level: 6, name: 'Spirit Shield', description: 'The guardian spirits that aid you can provide supernatural protection. When another creature you can see within 30 ft takes damage while you\'re raging, you can use your reaction to reduce that damage by 2d6 (3d6 at level 10, 4d6 at level 14).' },
        { level: 10, name: 'Consult the Spirits', description: 'You gain the ability to consult with your ancestral spirits. You can cast clairvoyance twice per short or long rest without using a spell slot or material components.' },
        { level: 14, name: 'Vengeful Ancestors', description: 'Your ancestral spirits grow powerful enough to retaliate. When you use Spirit Shield to reduce the damage of an attack, the attacker takes an amount of force damage equal to the damage that your Spirit Shield prevented.' },
      ],
    },
    'Path of the Storm Herald': {
      flavorText: 'Typical barbarians harbor a fury that dwells within. Their rage is a connection to a primordial anger that dwells within their souls. But some barbarians channel their rage into a tempest that engulfs them. When in a fury, a barbarian of this path surrounds themselves with a storm aura reflecting their chosen environment.',
      features: [
        { level: 3, name: 'Storm Aura', description: 'You emanate a stormy magical aura of 10 ft while raging. Choose an environment — Arctic (cold damage to creatures who start their turn in your aura), Desert (lightning damage at the start of your turn to all creatures in your aura), or Sea (lightning damage to one target of your choice in your aura).' },
        { level: 6, name: 'Storm Soul', description: 'The storm within you grows more powerful, granting passive benefits. Arctic (fire resistance; no cold damage to yourself), Desert (no fire damage to yourself; Dash as a bonus action while raging), Sea (swim speed equal to walking speed; breathe underwater).' },
        { level: 10, name: 'Shielding Storm', description: 'You learn to use your mastery of the storm to protect others. Each creature you choose within your Storm Aura gains the resistance you acquired from Storm Soul.' },
        { level: 14, name: 'Raging Storm', description: 'The power of the storm you channel grows mightier. Arctic (creatures taking cold damage from your aura must STR save or fall prone), Desert (creatures taking fire damage must DEX save or be blinded), Sea (creatures taking lightning damage must STR save or be pushed 20 ft away from you).' },
      ],
    },
    'Path of the Zealot': {
      flavorText: 'Some deities inspire their followers to pitch themselves into a ferocious battle fury. These barbarians are zealots — warriors who channel their rage into powerful displays of divine power. A variety of gods across the worlds of D&D inspire their followers to embrace this path.',
      features: [
        { level: 3, name: 'Divine Fury', description: 'While raging, the first creature you hit on each of your turns with a weapon attack takes extra damage equal to 1d6 + half your barbarian level. This damage is radiant or necrotic (your choice when you gain this feature).' },
        { level: 3, name: 'Warrior of the Gods', description: 'Your soul is marked for endless battle. A spell that would restore you to life (like revivify) doesn\'t require material components when cast on you.' },
        { level: 6, name: 'Fanatical Focus', description: 'The divine power that fuels your rage can protect you. If you fail a saving throw while you\'re raging, you can reroll it, and you must use the new roll. You can use this ability only once per rage.' },
        { level: 10, name: 'Zealous Presence', description: 'You learn to channel divine power to inspire zealotry in others. As a bonus action, you unleash a battle cry — up to 10 creatures within 60 ft that you choose gain advantage on attack rolls and saving throws until the start of your next turn.' },
        { level: 14, name: 'Rage Beyond Death', description: 'The divine power that fuels your rage allows you to shrug off fatal blows. While raging, having 0 hit points doesn\'t knock you unconscious. You still die if you fail three death saving throws. Rage ends normally if you\'re still at 0 HP when it ends.' },
      ],
    },
    'Path of the Beast': {
      flavorText: 'Barbarians who walk the Path of the Beast draw their rage from a bestial spark burning within their souls. That beast bursts forth in the throes of rage, physically transforming the barbarian. Such barbarians are sometimes called skinchangers, though they differ from true lycanthropes.',
      features: [
        { level: 3, name: 'Form of the Beast', description: 'While raging, you can channel the beast within to manifest one natural weapon — Bite (1d8 piercing + heal HP once per turn on hit), Claws (extra claw attack as bonus action), or Tail (reaction to add 1d8 to AC against one attack when hit).' },
        { level: 6, name: 'Bestial Soul', description: 'The feral power within you grows, causing your natural weapons to count as magical. You can also choose one: swim speed + breathe underwater, climb speed + scale difficult surfaces, double jump distances.' },
        { level: 10, name: 'Infectious Fury', description: 'When you hit a creature with your natural weapon while raging, the creature must succeed on a Wisdom saving throw (DC 8 + PB + CON) or suffer one effect: take 2d12 psychic damage, or use its reaction to attack another creature of your choice.' },
        { level: 14, name: 'Call the Hunt', description: 'When you enter your rage, you can inspire up to five other willing creatures to share your ferocity. Each of them gains 5 temporary HP and can use your Form of the Beast\'s bonus attack once. For each creature that joins the hunt, you gain 5 temporary HP.' },
      ],
    },
    'Path of Wild Magic': {
      flavorText: 'Many places in the multiverse abound with beauty, intense emotion, and rampant magic; the Feywild, the Upper Planes, and other realms of supernatural power radiate with such forces and can profoundly influence people. As folk of deep feeling, barbarians are especially susceptible to these outside forces.',
      features: [
        { level: 3, name: 'Magic Awareness', description: 'As an action, you open your awareness to the presence of concentrated magic. Until the end of your next turn, you know the location of any spell or magic item within 60 ft not behind total cover. You can use this feature a number of times equal to your proficiency bonus per long rest.' },
        { level: 3, name: 'Wild Surge', description: 'Each time you enter rage, roll on the Wild Surge table for a random magical effect — effects range from a spectral maw that bites enemies, teleporting to safety, creating a healing aura, to casting spells involuntarily.' },
        { level: 6, name: 'Bolstering Magic', description: 'You can harness wild magic to bolster yourself or a companion. As an action, touch a willing creature to give it one of: a d3 bonus to attack rolls and ability checks for 10 minutes, or regain one expended spell slot of 3rd level or lower. Use this a number of times equal to your proficiency bonus per long rest.' },
        { level: 10, name: 'Unstable Backlash', description: 'When you take damage or fail a saving throw while raging, you can use your reaction to roll on the Wild Surge table and immediately apply the result.' },
        { level: 14, name: 'Controlled Surge', description: 'Whenever you roll on the Wild Surge table, you can roll the die twice and choose which of the two effects to apply. If you roll the same number on both dice, you can ignore the number and choose any effect on the table.' },
      ],
    },
  },

  '5.5e': {
    'Path of the Berserker': {
      flavorText: 'For some barbarians, rage is a means to an end — that end being violence. The Path of the Berserker is a path of untrammeled fury. In 2024 rules, the berserker gains the ability to frenzy without the exhaustion cost that plagued earlier practitioners of this path.',
      features: [
        { level: 3, name: 'Frenzy', description: 'While raging, you can make one melee weapon attack as a bonus action on each of your turns. Unlike older traditions, this frenzy no longer causes exhaustion when the rage ends.' },
        { level: 6, name: 'Mindless Rage', description: 'You can\'t be charmed or frightened while raging. If you are charmed or frightened when you enter rage, the effect is suspended for the duration of the rage.' },
        { level: 10, name: 'Retaliation', description: 'When you take damage from a creature within 5 ft of you, you can use your reaction to make a melee weapon attack against that creature.' },
        { level: 14, name: 'Intimidating Presence', description: 'Use your action to frighten a creature within 30 ft. On a failed Wisdom saving throw (DC 8 + PB + CHA) it is frightened until the end of your next turn. You can repeat this effect on subsequent turns.' },
      ],
    },
    'Path of the Wild Heart': {
      flavorText: 'Barbarians who walk the Path of the Wild Heart believe that they are kin to animals and that they can draw strength and fury from that kinship. This is the 2024 revision of the Path of the Totem Warrior, expanding the totem choices and refining the benefits for modern play.',
      features: [
        { level: 3, name: 'Animal Speaker', description: 'You gain the ability to cast beast sense and speak with animals as rituals, reflecting your bond with the natural world.' },
        { level: 3, name: 'Totem Spirit', description: 'Choose a totem: Bear (resistance to all damage except psychic while raging), Eagle (enemies have disadvantage on opportunity attacks against you; Dash as bonus action while raging), Elk (+15 ft speed while raging; knock Huge or smaller creature prone on a hit), or Wolf (allies have advantage on attacks against creatures within 5 ft of you while raging).' },
        { level: 6, name: 'Aspect of the Animal', description: 'Gain a magical benefit from your totem animal. Bear (carrying capacity doubled; advantage on STR checks), Eagle (see 1 mile clearly; dim light as bright light), Elk (enhanced tracking; difficult terrain doesn\'t slow your group), or Wolf (track at fast pace; stealth at normal pace).' },
        { level: 10, name: 'Commune with Nature', description: 'You can cast commune with nature as a ritual, contacting the spirit world for guidance about the surrounding terrain and its creatures.' },
        { level: 14, name: 'Power of the Animal', description: 'While raging, gain a powerful benefit from your totem. Bear (enemies are frightened if they attack others while within 5 ft of you), Eagle (fly speed equal to walking speed), Elk (use movement to knock a Large or smaller enemy prone), or Wolf (knock a Large or smaller enemy prone on hit).' },
      ],
    },
    'Path of the World Tree': {
      flavorText: 'Barbarians who follow the Path of the World Tree connect with the cosmic World Tree, Yggdrasil — a force of universal connection. Through their rage, these barbarians can reach into the tree\'s vast network to protect allies, cross distances, and channel its primordial vitality.',
      features: [
        { level: 3, name: 'Vitality of the Tree', description: 'When you enter a rage, you gain temporary HP equal to your Barbarian level. While raging, you can expend one use of your rage to regain HP equal to your Barbarian level.' },
        { level: 6, name: 'Branches of the Tree', description: 'When a creature attacks one of your allies while you\'re raging, you can use your reaction to teleport that creature to a space adjacent to you, forcing it to deal with you instead.' },
        { level: 10, name: 'Battering Roots', description: 'Your melee weapons gain the Reach property while you\'re raging. When you knock a creature prone with a melee attack, you deal an additional 1d8 bludgeoning damage.' },
        { level: 14, name: 'Travel Along the Tree', description: 'Once per turn while raging, you can teleport up to 60 ft to an unoccupied space you can see. You can bring up to six willing creatures within your reach along with you.' },
      ],
    },
    'Path of the Zealot': {
      flavorText: 'Some deities inspire their followers to pitch themselves into a ferocious battle fury. These barbarians are zealots — warriors who channel their rage into powerful displays of divine power. The 2024 rules refine this path\'s features while maintaining the core fantasy of a warrior who cannot be stopped by death itself.',
      features: [
        { level: 3, name: 'Divine Fury', description: 'While raging, the first creature you hit on each turn takes extra radiant or necrotic damage equal to 1d6 + half your Barbarian level (your choice of type when you take this feature).' },
        { level: 3, name: 'Warrior of the Gods', description: 'Your soul is marked for endless battle. Spells that restore you to life require no material components when cast on you.' },
        { level: 6, name: 'Fanatical Focus', description: 'If you fail a saving throw while raging, you can reroll it once and must use the new roll. Usable once per rage.' },
        { level: 10, name: 'Zealous Presence', description: 'As a bonus action, unleash a battle cry. Up to 10 creatures you choose within 60 ft gain advantage on attack rolls and saving throws until the start of your next turn.' },
        { level: 14, name: 'Rage Beyond Death', description: 'While raging, having 0 HP doesn\'t knock you unconscious. You still die on three failed death saves, but you can keep fighting until your rage ends or you succeed.' },
      ],
    },
    'Path of Wild Magic': {
      flavorText: 'The savage power of wild magic can erupt within a barbarian, connecting them to the chaotic energies of the multiverse. Barbarians on this path channel that instability into their rage, producing unpredictable magical effects that can devastate enemies and aid allies alike.',
      features: [
        { level: 3, name: 'Magic Awareness', description: 'As an action, open your awareness to detect concentrated magic within 60 ft until end of your next turn. You can use this a number of times equal to your proficiency bonus per long rest.' },
        { level: 3, name: 'Wild Surge', description: 'When you enter a rage, roll a d8 on the Wild Surge table for a chaotic magical effect that accompanies your fury.' },
        { level: 6, name: 'Bolstering Magic', description: 'As an action, touch a willing creature to grant one of: a d3 bonus to attack rolls and ability checks for 10 minutes, or restore one expended spell slot of 3rd level or lower. Usable PB times per long rest.' },
        { level: 10, name: 'Unstable Backlash', description: 'When you take damage or fail a saving throw while raging, you can use your reaction to immediately roll on the Wild Surge table.' },
        { level: 14, name: 'Controlled Surge', description: 'When you roll on Wild Surge, roll twice and choose which effect to apply. On matching numbers, you can choose any effect from the table.' },
      ],
    },
  },
};
