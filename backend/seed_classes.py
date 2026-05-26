"""
Seed script: populates character_classes and class_features tables
for all 12 classes in both 5e (2014) and 5.5e (2024) editions.

Run: python seed_classes.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from shared.database import SessionLocal
from players.classes.models import CharacterClass, ClassFeature
from shared.enums import OwnerType

# ---------------------------------------------------------------------------
# Flavor text (same lore for both editions)
# ---------------------------------------------------------------------------
FLAVOR_TEXTS = {
    "Barbarian": (
        "Barbarians are fierce warriors who channel primal rage to overcome their enemies. "
        "Whether they hail from nomadic tribes on windswept plains, savage wilderness clans, or simply carry the burning fury of a hard life within them, "
        "barbarians fight with a ferocity that most civilized warriors cannot match. "
        "Their power comes not from formal training but from a deep connection to raw, primal emotion."
        "\n\n"
        "In battle, a barbarian lets that fury loose — muscles swell, reflexes sharpen, and pain becomes irrelevant. "
        "Their rage is more than mere anger. It is a spiritual state that connects them to the beast, the storm, or the ancestor spirits of their people. "
        "When the rage fades, they are left breathless but alive, standing over those foolish enough to stand in their way."
        "\n\n"
        "Some barbarians belong to tribes and fight as protectors of their people. "
        "Others are wanderers, mercenaries, or outcasts who have learned that strength and ferocity are the only currencies that matter in a dangerous world. "
        "Whatever drives them, barbarians are among the most terrifying forces on any battlefield."
    ),
    "Bard": (
        "Bards are the wandering storytellers, musicians, and loremasters of the adventuring world. "
        "They draw on the power of music and the spoken word to weave actual magic, inspiring allies, beguiling enemies, "
        "and unraveling the fabric of reality with a perfectly timed note or phrase. "
        "Their magic comes not from a patron or a deity, but from the fundamental truth that the universe itself was sung into existence."
        "\n\n"
        "A bard's education is eclectic by necessity. They study in colleges that teach not just music but history, rhetoric, swordplay, alchemy, and secrets whispered only between those who know the right words. "
        "The result is a generalist of extraordinary breadth — a class that can pick a lock, lift a coin purse, sway a crowd, or plunge a rapier with equal facility."
        "\n\n"
        "What separates a great bard from a mere entertainer is conviction. "
        "The magic of bardic inspiration is real because the bard believes it to be real — and makes others believe it too. "
        "In dungeons and courts alike, the bard's voice cuts through the chaos and reminds their companions why they fight."
    ),
    "Cleric": (
        "Clerics are intermediaries between the mortal world and the distant realms of the divine. "
        "They are not simply priests who pray for favor — they are warriors of faith, granted true magical power by gods who have chosen them as instruments of divine will. "
        "The cleric's power flows from an unbroken channel of devotion between themselves and their deity."
        "\n\n"
        "Different deities demand different things of their clerics. "
        "A cleric of the god of war is armored and ferocious, leading charges with a weapon in one hand and a holy symbol in the other. "
        "A cleric of the healing goddess works quietly in the background, mending the broken bodies of the fallen. "
        "A cleric of the trickster god operates through misdirection, turning enemies' plans against themselves. "
        "The divine domain a cleric follows shapes every aspect of their power and purpose."
        "\n\n"
        "Clerics occupy a unique role in most adventuring parties: they can fight, they can heal, they can commune with the divine, and they can channel sacred energy to destroy the undead. "
        "Few classes are as versatile, and fewer still carry the weight of divine expectation that a cleric bears every day they live."
    ),
    "Druid": (
        "Druids are the guardians of the natural world, wielding the primal magic that flows through soil, storm, and living creature. "
        "They serve as priests of the Old Faith — not worshippers of individual gods, but devotees of the natural order itself. "
        "Their power comes from the deep magic that existed before the first civilization was built and will persist long after the last city crumbles."
        "\n\n"
        "A druid's most iconic ability is Wild Shape — the power to transform into animals and experience the world through non-human senses. "
        "This is not merely a combat technique but a spiritual practice, a reminder that humanity is one thread among many in the vast tapestry of life. "
        "Druids who push this ability to its limits can become something barely recognizable as human, preferring the company of wolves and ravens to that of their own kind."
        "\n\n"
        "Druids organize themselves into secret circles that gather in hidden forest clearings, mountain caves, or on windswept coastlines far from civilization. "
        "Some circles preserve ancient knowledge. Others police the boundary between civilization and the wild. "
        "All of them carry the unspoken understanding that when the balance is broken, the druids are the ones who must set it right — regardless of the cost."
    ),
    "Fighter": (
        "Fighters are the masters of martial combat, trained professionals who have dedicated their lives to learning how to survive — and win — in battle. "
        "Where a barbarian fights with instinct and fury, a fighter fights with technique. "
        "Every swing, every step, every decision in combat has been drilled into a fighter's muscle memory until it becomes second nature."
        "\n\n"
        "Fighters come from every background imaginable: soldiers and mercenaries, knights and gladiators, street brawlers and dueling champions. "
        "What unites them is not background but commitment — the willingness to practice their craft until it is perfect, "
        "and the physical and mental fortitude to keep fighting when anyone else would collapse. "
        "Action Surge and Second Wind are not magical gifts. They are the results of pushing the body beyond its normal limits through years of relentless training."
        "\n\n"
        "At higher levels, fighters become virtually unstoppable engines of destruction, capable of launching more attacks per round than any other class. "
        "When a fighter chooses a Martial Archetype at 3rd level, they specialize further — the eldritch-infused Eldritch Knight, "
        "the tactically brilliant Battle Master, or the supernaturally enduring Champion each represent a different philosophy of what a fighter can become."
    ),
    "Monk": (
        "Monks are the perfect union of body and spirit, warriors who have transcended the ordinary limits of physical form through decades of disciplined training. "
        "They strike without weapons and shrug off blows that would fell lesser warriors, channeling an inner energy called ki — or focus — "
        "to augment their natural abilities far beyond what flesh and bone should allow."
        "\n\n"
        "A monk's training is a lifelong commitment. Most begin as children, entering a monastery where every waking hour is devoted to physical conditioning, "
        "philosophical study, and the careful cultivation of inner stillness. "
        "The result is not a soldier but something closer to a force of nature — a person whose body has become an instrument of almost supernatural precision."
        "\n\n"
        "Monks choose a Monastic Tradition that further shapes their development. "
        "Some traditions turn the monk into an open-hand striker of terrifying efficiency. "
        "Others pursue shadow and silence, or elemental fury, or the long-range channeling of devastating ki blasts. "
        "All of them share the same foundation: an unshakeable belief that the path to power runs inward, not outward."
    ),
    "Paladin": (
        "Paladins are holy warriors bound by sacred oaths to serve a cause greater than themselves. "
        "They are not merely soldiers with religious convictions — they are living embodiments of a divine compact, "
        "their very bodies infused with the power of their vow. "
        "To break that oath is not just a failure of character but a catastrophic spiritual event that can unravel a paladin's power entirely."
        "\n\n"
        "The paladin's oath defines everything: the enemies they face, the powers they wield, and the code they live by. "
        "An Oath of Devotion produces the classic shining knight, incorruptible and righteous. "
        "An Oath of the Ancients binds the paladin to protect the light of life against the darkness of decay. "
        "An Oath of Vengeance produces a relentless hunter, willing to compromise mercy in pursuit of justice. "
        "Different oaths, different expressions of the same sacred fire."
        "\n\n"
        "In battle, paladins are a terrifying combination of warrior and spellcaster. "
        "Their Divine Smite turns every melee hit into a potential thunderclap of radiant energy. "
        "Their auras protect everyone around them. And their Lay on Hands keeps their companions alive through wounds that would otherwise be fatal. "
        "Few adventuring parties are stronger with a paladin than without one."
    ),
    "Ranger": (
        "Rangers are hunters and scouts who have mastered the wild places of the world — the trackless forests, frozen tundra, scorching deserts, "
        "and monster-haunted wilderness that ordinary people dare not enter. "
        "They are not merely survivalists but specialists in a particular kind of warfare: the hunt, the ambush, the long pursuit across difficult terrain."
        "\n\n"
        "A ranger's power comes from intimate knowledge of the natural world combined with combat training honed against the most dangerous creatures alive. "
        "They know where the wolves den, which mushrooms are poison, how to read the signs of a giant's passing in broken treeline and bloodstained stone. "
        "This knowledge is their greatest weapon — before a ranger ever draws a bow, they already know how the fight will end."
        "\n\n"
        "Rangers occupy a unique position between martial fighters and nature-attuned spellcasters. "
        "Their spell list tends toward utility and damage, and their magic is less a religious gift than a natural instinct refined into technique. "
        "At their best, rangers are nearly invisible, striking from ambush with lethal precision and vanishing back into the wilderness before their enemies know what hit them."
    ),
    "Rogue": (
        "Rogues are the masters of cunning, stealth, and precise lethality. "
        "They do not overpower their enemies through brute strength or magical might — they outmaneuver them, striking exactly where it hurts most, "
        "then disappearing before retaliation is possible. "
        "Every rogue is a specialist in finding the gap between intention and execution and exploiting it ruthlessly."
        "\n\n"
        "The rogue's signature ability is Sneak Attack — the capacity to deal enormous damage when conditions are right. "
        "This is not a magical effect but a mundane truth: a knife in the back from someone who knows exactly where to put it will always outperform a sword swung in anger. "
        "Rogues know where to put it. Expertise means that when a rogue is good at something, they are extraordinarily good at it — "
        "better than almost anyone else could hope to be through raw talent alone."
        "\n\n"
        "Rogue archetypes diverge dramatically. The Thief optimizes for speed and larceny. "
        "The Assassin turns their skill set toward the art of the perfect kill. "
        "The Arcane Trickster weaves illusion and enchantment into their craft. "
        "But all rogues share the same philosophical foundation: success comes not to the strongest or most powerful, but to the smartest."
    ),
    "Sorcerer": (
        "Sorcerers are born with magic in their blood. Where wizards study and warlocks bargain, sorcerers simply are — "
        "vessels for arcane power that flows through them as naturally as breath. "
        "This power comes from somewhere: a dragon ancestor, a wild magic surge that touched a parent at the moment of conception, "
        "a blessing or curse from a divine source. Whatever its origin, it is as much a part of the sorcerer as their heartbeat."
        "\n\n"
        "The double-edged nature of innate magic is the central tension of a sorcerer's life. "
        "Power that comes without study can be difficult to control. "
        "Wild Magic sorcerers know this better than anyone — they never know when a spell might trigger a wild surge that transforms nearby creatures into sheep "
        "or causes the sorcerer to glow like a lantern for 24 hours. "
        "The magical bloodline that empowers the sorcerer also makes them unpredictable."
        "\n\n"
        "What sorcerers bring to an arcane arsenal that wizards cannot replicate is Metamagic — "
        "the ability to reshape spells in flight, extending their range, twinning them to hit two targets, or casting them without a single visible word or gesture. "
        "A sorcerer may know fewer spells than a wizard, but each spell they know becomes a tool they can wield in a dozen different ways."
    ),
    "Warlock": (
        "Warlocks have made a bargain with something beyond mortal comprehension. "
        "Whether their patron is an archfey of maddening beauty, a fiend of incomprehensible cruelty, or a Great Old One whose very name causes lesser minds to fracture, "
        "the warlock has traded a fragment of their autonomy for genuine power. "
        "They are not servants — or so they tell themselves. They are partners in an arrangement that benefits both parties."
        "\n\n"
        "The nature of Pact Magic reflects this relationship. "
        "Unlike other spellcasters who draw on deep reservoirs of magical energy, warlocks have fewer slots — "
        "but those slots recharge on a short rest, as if the patron is always ready to extend another measure of power when called upon. "
        "The warlock is never truly out of resources for long. But they are always, in some sense, in debt."
        "\n\n"
        "Eldritch Invocations are the most flexible aspect of warlock advancement — "
        "a menu of arcane tricks and enhancements that the patron teaches to their favored servants. "
        "The Pact Boon deepens the relationship further, granting a familiar, a bonded blade, or a Book of Shadows filled with stolen knowledge. "
        "By the time a warlock reaches high levels, they are something genuinely strange: a human-shaped vessel for an alien power, "
        "pursuing goals that may or may not align with those of anyone else at the table."
    ),
    "Wizard": (
        "Wizards are the supreme masters of arcane magic, scholars who have devoted their lives to understanding the fundamental laws of the universe "
        "and learning to rewrite them at will. "
        "Their power comes not from blood or bargain or divine favor, but from pure, hard-won knowledge — "
        "the accumulated wisdom of ten thousand years of magical research, stored in a spellbook that is at once a tool, a library, and a deeply personal artifact."
        "\n\n"
        "The wizard's greatest strength is versatility. "
        "With enough time to prepare, a wizard can have exactly the right spell for almost any situation. "
        "Their spell list is the broadest in the game, their access to ritual casting the most reliable, "
        "and their potential for combining spells in creative ways essentially unlimited. "
        "What limits them is time — both the hours needed to study and the spell slots needed to cast."
        "\n\n"
        "Arcane Traditions represent the wizard's specialization within the vast field of magical theory. "
        "An Evoker pursues raw destructive power. An Illusionist bends perception. "
        "A Diviner peers through time itself to see what will be. "
        "Regardless of tradition, all wizards share the same fundamental conviction: "
        "that the universe has rules, and that with sufficient intelligence and dedication, those rules can be mastered — and bent."
    ),
}

# ---------------------------------------------------------------------------
# Proficiency data per class
# ---------------------------------------------------------------------------
PROFICIENCY_DATA = {
    "Barbarian": {
        "hit_die": 12,
        "primary_ability": "Strength",
        "spellcasting_ability": None,
        "saving_throws": ["Strength", "Constitution"],
        "armor_proficiencies": ["Light armor", "Medium armor", "Shields"],
        "weapon_proficiencies": ["Simple weapons", "Martial weapons"],
        "tool_proficiencies": [],
        "skill_count": 2,
        "skills_available": ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
    },
    "Bard": {
        "hit_die": 8,
        "primary_ability": "Charisma",
        "spellcasting_ability": "Charisma",
        "saving_throws": ["Dexterity", "Charisma"],
        "armor_proficiencies": ["Light armor"],
        "weapon_proficiencies": ["Simple weapons", "Hand crossbows", "Longswords", "Rapiers", "Shortswords"],
        "tool_proficiencies": ["Three musical instruments of your choice"],
        "skill_count": 3,
        "skills_available": [
            "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
            "History", "Insight", "Intimidation", "Investigation", "Medicine",
            "Nature", "Perception", "Performance", "Persuasion", "Religion",
            "Sleight of Hand", "Stealth", "Survival",
        ],
    },
    "Cleric": {
        "hit_die": 8,
        "primary_ability": "Wisdom",
        "spellcasting_ability": "Wisdom",
        "saving_throws": ["Wisdom", "Charisma"],
        "armor_proficiencies": ["Light armor", "Medium armor", "Shields"],
        "weapon_proficiencies": ["Simple weapons"],
        "tool_proficiencies": [],
        "skill_count": 2,
        "skills_available": ["History", "Insight", "Medicine", "Persuasion", "Religion"],
    },
    "Druid": {
        "hit_die": 8,
        "primary_ability": "Wisdom",
        "spellcasting_ability": "Wisdom",
        "saving_throws": ["Intelligence", "Wisdom"],
        "armor_proficiencies": ["Light armor (non-metal)", "Medium armor (non-metal)", "Shields (non-metal)"],
        "weapon_proficiencies": ["Clubs", "Daggers", "Darts", "Javelins", "Maces", "Quarterstaffs", "Scimitars", "Sickles", "Slings", "Spears"],
        "tool_proficiencies": ["Herbalism kit"],
        "skill_count": 2,
        "skills_available": ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"],
    },
    "Fighter": {
        "hit_die": 10,
        "primary_ability": "Strength or Dexterity",
        "spellcasting_ability": None,
        "saving_throws": ["Strength", "Constitution"],
        "armor_proficiencies": ["All armor", "Shields"],
        "weapon_proficiencies": ["Simple weapons", "Martial weapons"],
        "tool_proficiencies": [],
        "skill_count": 2,
        "skills_available": ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    },
    "Monk": {
        "hit_die": 8,
        "primary_ability": "Dexterity and Wisdom",
        "spellcasting_ability": None,
        "saving_throws": ["Strength", "Dexterity"],
        "armor_proficiencies": [],
        "weapon_proficiencies": ["Simple weapons", "Shortswords"],
        "tool_proficiencies": ["One artisan's tool or musical instrument of your choice"],
        "skill_count": 2,
        "skills_available": ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
    },
    "Paladin": {
        "hit_die": 10,
        "primary_ability": "Strength and Charisma",
        "spellcasting_ability": "Charisma",
        "saving_throws": ["Wisdom", "Charisma"],
        "armor_proficiencies": ["All armor", "Shields"],
        "weapon_proficiencies": ["Simple weapons", "Martial weapons"],
        "tool_proficiencies": [],
        "skill_count": 2,
        "skills_available": ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"],
    },
    "Ranger": {
        "hit_die": 10,
        "primary_ability": "Dexterity and Wisdom",
        "spellcasting_ability": "Wisdom",
        "saving_throws": ["Strength", "Dexterity"],
        "armor_proficiencies": ["Light armor", "Medium armor", "Shields"],
        "weapon_proficiencies": ["Simple weapons", "Martial weapons"],
        "tool_proficiencies": [],
        "skill_count": 3,
        "skills_available": ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
    },
    "Rogue": {
        "hit_die": 8,
        "primary_ability": "Dexterity",
        "spellcasting_ability": None,
        "saving_throws": ["Dexterity", "Intelligence"],
        "armor_proficiencies": ["Light armor"],
        "weapon_proficiencies": ["Simple weapons", "Hand crossbows", "Longswords", "Rapiers", "Shortswords"],
        "tool_proficiencies": ["Thieves' tools"],
        "skill_count": 4,
        "skills_available": [
            "Acrobatics", "Athletics", "Deception", "Insight", "Intimidation",
            "Investigation", "Perception", "Performance", "Persuasion",
            "Sleight of Hand", "Stealth",
        ],
    },
    "Sorcerer": {
        "hit_die": 6,
        "primary_ability": "Charisma",
        "spellcasting_ability": "Charisma",
        "saving_throws": ["Constitution", "Charisma"],
        "armor_proficiencies": [],
        "weapon_proficiencies": ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light crossbows"],
        "tool_proficiencies": [],
        "skill_count": 2,
        "skills_available": ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"],
    },
    "Warlock": {
        "hit_die": 8,
        "primary_ability": "Charisma",
        "spellcasting_ability": "Charisma",
        "saving_throws": ["Wisdom", "Charisma"],
        "armor_proficiencies": ["Light armor"],
        "weapon_proficiencies": ["Simple weapons"],
        "tool_proficiencies": [],
        "skill_count": 2,
        "skills_available": ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"],
    },
    "Wizard": {
        "hit_die": 6,
        "primary_ability": "Intelligence",
        "spellcasting_ability": "Intelligence",
        "saving_throws": ["Intelligence", "Wisdom"],
        "armor_proficiencies": [],
        "weapon_proficiencies": ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light crossbows"],
        "tool_proficiencies": [],
        "skill_count": 2,
        "skills_available": ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
    },
}

# ---------------------------------------------------------------------------
# Features — 5e (2014)
# Each entry: (level, name, description)
# ---------------------------------------------------------------------------
FEATURES_5E = {
    "Barbarian": [
        (1, "Rage", "On your turn you can enter a rage as a bonus action. While raging you gain advantage on Strength checks and saving throws, a damage bonus to melee Strength attacks (+2 at levels 1–8, +3 at 9–15, +4 at 16+), and resistance to bludgeoning, piercing, and slashing damage. Rage lasts 1 minute, ends early if you are knocked unconscious or if your turn ends without you attacking a hostile creature or taking damage. You can rage 2 times per long rest (increases at higher levels)."),
        (1, "Unarmored Defense", "While not wearing armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit."),
        (2, "Reckless Attack", "When you make your first attack on your turn, you can decide to attack recklessly, giving you advantage on melee weapon attack rolls using Strength during this turn. However, attack rolls against you have advantage until your next turn."),
        (2, "Danger Sense", "You have advantage on Dexterity saving throws against effects you can see, such as traps and spells. To gain this benefit, you can't be blinded, deafened, or incapacitated."),
        (3, "Primal Path", "You choose a Primal Path that shapes the nature of your rage. Your choice grants features at 3rd, 6th, 10th, and 14th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (5, "Extra Attack", "You can attack twice, instead of once, whenever you take the Attack action on your turn."),
        (5, "Fast Movement", "Your speed increases by 10 feet while you aren't wearing heavy armor."),
        (6, "Path Feature", "You gain a feature from your Primal Path."),
        (7, "Feral Instinct", "Your instincts are so honed that you have advantage on initiative rolls. Additionally, if you are surprised at the beginning of combat and aren't incapacitated, you can act normally on your first turn, but only if you enter your rage before doing anything else on that turn."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (9, "Brutal Critical (1 die)", "You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack."),
        (10, "Path Feature", "You gain a feature from your Primal Path."),
        (11, "Relentless Rage", "Your rage can keep you fighting despite grievous wounds. If you drop to 0 hit points while raging and don't die outright, you can make a DC 10 Constitution saving throw. If you succeed, you drop to 1 hit point instead. Each time you use this feature after the first, the DC increases by 5."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (13, "Brutal Critical (2 dice)", "You can roll two additional weapon damage dice when determining the extra damage for a critical hit with a melee attack."),
        (14, "Path Feature", "You gain a feature from your Primal Path."),
        (15, "Persistent Rage", "Your rage is so fierce that it ends early only if you fall unconscious or if you choose to end it."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (17, "Brutal Critical (3 dice)", "You can roll three additional weapon damage dice when determining the extra damage for a critical hit with a melee attack."),
        (18, "Indomitable Might", "If your total for a Strength check is less than your Strength score, you can use that score in place of the total."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Primal Champion", "Your Strength score increases by 4 and your Constitution score increases by 4. Your maximum for those scores is now 24."),
    ],
    "Bard": [
        (1, "Spellcasting", "You have learned to untangle and reshape the fabric of reality in harmony with your wishes and music. Your spells are part of your vast repertoire, magic that you can tune to different situations. You know two cantrips from the bard spell list and four 1st-level spells. Charisma is your spellcasting ability."),
        (1, "Bardic Inspiration", "You can inspire others through stirring words or music. As a bonus action, you can choose one creature other than yourself within 60 feet who can hear you, and give them a Bardic Inspiration die (d6, increasing to d8 at 5th, d10 at 10th, d12 at 15th). The creature can add the die to one ability check, attack roll, or saving throw it makes in the next 10 minutes. You can use this feature a number of times equal to your Charisma modifier (minimum 1). You regain all uses on a long rest (short rest at 5th level)."),
        (2, "Jack of All Trades", "You can add half your proficiency bonus, rounded down, to any ability check you make that doesn't already include your proficiency bonus."),
        (2, "Song of Rest", "You can use soothing music or oration to help revitalize your wounded allies during a short rest. If you or any friendly creatures who can hear your performance regain hit points at the end of the short rest by spending one or more Hit Dice, each of those creatures regains an extra 1d6 hit points (1d8 at 9th, 1d10 at 13th, 1d12 at 17th)."),
        (3, "Bard College", "You delve into the advanced techniques of a bard college of your choice. Your choice grants you features at 3rd, 6th, and 14th level."),
        (3, "Expertise", "Choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (5, "Bardic Inspiration (d8)", "Your Bardic Inspiration die increases to d8. Additionally, you regain all your uses of Bardic Inspiration when you finish a short or long rest."),
        (5, "Font of Inspiration", "You regain all your uses of Bardic Inspiration when you finish a short or long rest."),
        (6, "Countercharm", "As an action, you can start a performance that lasts until the end of your next turn. During that time, you and any friendly creatures within 30 feet have advantage on saving throws against being frightened or charmed."),
        (6, "Bard College Feature", "You gain a feature from your Bard College."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (9, "Song of Rest (d8)", "The extra hit points granted by your Song of Rest increases to 1d8."),
        (10, "Bardic Inspiration (d10)", "Your Bardic Inspiration die increases to d10."),
        (10, "Expertise", "Choose two more skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies."),
        (10, "Magical Secrets", "You have plundered magical knowledge from a wide spectrum of disciplines. Choose two spells from any classes. A spell you choose must be of a level you can cast. You learn the two spells, which are treated as bard spells for you."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (13, "Song of Rest (d10)", "The extra hit points granted by your Song of Rest increases to 1d10."),
        (14, "Magical Secrets", "Choose two more spells from any classes. A spell you choose must be of a level you can cast, as shown on the Bard table."),
        (14, "Bard College Feature", "You gain a feature from your Bard College."),
        (15, "Bardic Inspiration (d12)", "Your Bardic Inspiration die increases to d12."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (17, "Song of Rest (d12)", "The extra hit points granted by your Song of Rest increases to 1d12."),
        (18, "Magical Secrets", "Choose two more spells from any classes. A spell you choose must be of a level you can cast, as shown on the Bard table."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Superior Inspiration", "When you roll initiative and have no uses of Bardic Inspiration left, you regain one use."),
    ],
    "Cleric": [
        (1, "Spellcasting", "As a conduit for divine power, you can cast cleric spells. Wisdom is your spellcasting ability. You prepare spells from the cleric spell list equal to your Wisdom modifier + your cleric level (minimum 1)."),
        (1, "Divine Domain", "Choose one domain related to your deity. Your choice grants you domain spells and other features when you choose it at 1st level, and again at 2nd, 6th, 8th, and 17th level."),
        (2, "Channel Divinity (1/rest)", "You gain the ability to channel divine energy directly from your deity. You have one use per short or long rest, gaining additional uses at 6th (2/rest) and 18th (3/rest) level. You always have the Turn Undead option, and your domain gives you additional Channel Divinity options."),
        (2, "Turn Undead", "As an action, you present your holy symbol and speak a prayer censuring the undead. Each undead that can see or hear you within 30 feet must make a Wisdom saving throw. If the creature fails its saving throw, it is turned for 1 minute or until it takes any damage."),
        (2, "Divine Domain Feature", "You gain a feature from your Divine Domain."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (5, "Destroy Undead (CR 1/2)", "When an undead fails its saving throw against your Turn Undead feature, the creature is instantly destroyed if its challenge rating is at or below 1/2."),
        (6, "Channel Divinity (2/rest)", "You can use your Channel Divinity twice between rests."),
        (6, "Divine Domain Feature", "You gain a feature from your Divine Domain."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (8, "Destroy Undead (CR 1)", "Your Turn Undead now destroys undead of CR 1 or lower."),
        (8, "Divine Domain Feature", "You gain a powerful feature from your Divine Domain (often a Divine Strike or Potent Spellcasting)."),
        (10, "Divine Intervention", "You can call on your deity to intervene on your behalf when your need is great. Implore your deity's aid using your action. Describe the assistance you seek and roll percentile dice. If you roll a number equal to or lower than your cleric level, your deity intervenes. The DM chooses the nature of the intervention. If the intervention is successful, you can't use this feature again for 7 days. Otherwise, you can use it again after a long rest."),
        (11, "Destroy Undead (CR 2)", "Your Turn Undead now destroys undead of CR 2 or lower."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (14, "Destroy Undead (CR 3)", "Your Turn Undead now destroys undead of CR 3 or lower."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (17, "Destroy Undead (CR 4)", "Your Turn Undead now destroys undead of CR 4 or lower."),
        (17, "Divine Domain Feature", "You gain a capstone feature from your Divine Domain."),
        (18, "Channel Divinity (3/rest)", "You can use your Channel Divinity three times between rests."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Divine Intervention Improvement", "Your Divine Intervention call succeeds automatically, no roll required. Once you use it, you must finish 7 days before you can use it again."),
    ],
    "Druid": [
        (1, "Druidic", "You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages. You and others who know this language automatically spot such a message. Others spot the message's presence with a successful DC 15 Wisdom (Perception) check but can't decipher it without magic."),
        (1, "Spellcasting", "Drawing on the divine essence of nature itself, you can cast druid spells. Wisdom is your spellcasting ability. You prepare a number of spells equal to your Wisdom modifier + your druid level (minimum 1)."),
        (2, "Wild Shape", "You can use your action to magically assume the shape of a beast you have seen before. You can use this feature twice, regaining uses on a short or long rest. At level 2 you can transform into beasts with CR 1/4 or lower that lack a swim or fly speed. The limit increases at higher levels."),
        (2, "Druid Circle", "You choose to identify with a circle of druids. Your choice grants you features at 2nd, 6th, 10th, and 14th level."),
        (4, "Wild Shape Improvement (CR 1/2, swim)", "You can now transform into beasts with CR 1/2 or lower, including those with a swim speed."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (6, "Druid Circle Feature", "You gain a feature from your Druid Circle."),
        (8, "Wild Shape Improvement (CR 1, fly)", "You can now transform into beasts with CR 1 or lower, including those with a fly speed."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (10, "Druid Circle Feature", "You gain a feature from your Druid Circle."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (14, "Druid Circle Feature", "You gain a feature from your Druid Circle."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (18, "Timeless Body", "The primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year."),
        (18, "Beast Spells", "You can cast many of your druid spells in any shape you assume using Wild Shape. You can perform the somatic and verbal components of a druid spell while in a beast shape, but you aren't able to provide material components."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Archdruid", "You can use your Wild Shape an unlimited number of times. Additionally, you can ignore the verbal and somatic components of your druid spells, as well as any material components that lack a cost and aren't consumed by a spell. You gain this benefit in both your normal shape and your beast shape from Wild Shape."),
    ],
    "Fighter": [
        (1, "Fighting Style", "You adopt a particular style of fighting as your specialty. Choose one from: Archery (+2 attack rolls with ranged weapons), Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed melee weapon if no other melee weapon), Great Weapon Fighting (reroll 1s and 2s on damage with two-handed weapons), Protection (impose disadvantage on attacks against adjacent allies when you have a shield), Two-Weapon Fighting (add ability modifier to off-hand attacks)."),
        (1, "Second Wind", "You can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again."),
        (2, "Action Surge (1/rest)", "You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again. (You gain a second use at 17th level.)"),
        (3, "Martial Archetype", "You choose an archetype that you strive to emulate in your combat styles and techniques. Your archetype grants you features at 3rd, 7th, 10th, 15th, and 18th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (5, "Extra Attack (2 attacks)", "You can attack twice, instead of once, whenever you take the Attack action on your turn."),
        (6, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (7, "Martial Archetype Feature", "You gain a feature from your Martial Archetype."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (9, "Indomitable (1/rest)", "You can reroll a saving throw that you fail. If you do so, you must use the new roll, and you can't use this feature again until you finish a long rest. You gain two additional uses at 13th level (2/rest) and 17th level (3/rest)."),
        (10, "Martial Archetype Feature", "You gain a feature from your Martial Archetype."),
        (11, "Extra Attack (3 attacks)", "You can attack three times whenever you take the Attack action on your turn."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (13, "Indomitable (2/rest)", "You can use Indomitable twice between long rests."),
        (14, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (15, "Martial Archetype Feature", "You gain a feature from your Martial Archetype."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (17, "Action Surge (2/rest)", "You can use Action Surge twice between rests, but only once per turn."),
        (17, "Indomitable (3/rest)", "You can use Indomitable three times between long rests."),
        (18, "Martial Archetype Feature", "You gain a feature from your Martial Archetype."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Extra Attack (4 attacks)", "You can attack four times whenever you take the Attack action on your turn."),
    ],
    "Monk": [
        (1, "Unarmored Defense", "While you are wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier."),
        (1, "Martial Arts", "Your practice of martial arts gives you mastery of combat styles that use unarmed strikes and monk weapons. You gain the following benefits: use Dexterity instead of Strength for attacks, use the Martial Arts die instead of normal damage (d4 at 1st, d6 at 5th, d8 at 11th, d10 at 17th), and make one unarmed strike as a bonus action when you take the Attack action."),
        (2, "Ki", "Your training allows you to harness the mystic energy of ki. Your ki points equal your monk level. Regain all ki on a short or long rest. Use ki to fuel: Flurry of Blows (2 ki: two bonus unarmed strikes), Patient Defense (1 ki: Dodge as bonus action), Step of the Wind (1 ki: Dash/Disengage as bonus action)."),
        (2, "Unarmored Movement", "Your speed increases by 10 feet while you are not wearing armor or wielding a shield. This bonus increases at higher levels."),
        (3, "Monastic Tradition", "You commit yourself to a monastic tradition. Your tradition grants you features at 3rd, 6th, 11th, and 17th level."),
        (3, "Deflect Missiles", "You can use your reaction to deflect or catch the missile when you are hit by a ranged weapon attack. When you do so, the damage is reduced by 1d10 + your Dexterity modifier + your monk level. If the damage is reduced to 0, you can catch the missile and throw it back for 1 ki point."),
        (4, "Slow Fall", "You can use your reaction when you fall to reduce any falling damage by an amount equal to five times your monk level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (5, "Extra Attack", "You can attack twice, instead of once, whenever you take the Attack action on your turn."),
        (5, "Stunning Strike", "When you hit another creature with a melee weapon attack, you can spend 1 ki point to attempt a stunning strike. The target must succeed on a Constitution saving throw or be stunned until the end of your next turn."),
        (6, "Ki-Empowered Strikes", "Your unarmed strikes count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage."),
        (6, "Monastic Tradition Feature", "You gain a feature from your Monastic Tradition."),
        (7, "Evasion", "Your instinctive agility lets you dodge out of the way of certain area effects. When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed and only half damage if you fail."),
        (7, "Stillness of Mind", "You can use your action to end one effect on yourself that is causing you to be charmed or frightened."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (9, "Unarmored Movement Improvement", "You gain the ability to move along vertical surfaces and across liquids on your turn without falling during the move."),
        (10, "Purity of Body", "Your mastery of the ki flowing through you makes you immune to disease and poison."),
        (11, "Monastic Tradition Feature", "You gain a feature from your Monastic Tradition."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (13, "Tongue of the Sun and Moon", "You learn to touch the ki of other minds so that you understand all spoken languages. Moreover, any creature that can understand a language can understand what you say."),
        (14, "Diamond Soul", "Your mastery of ki grants you proficiency in all saving throws. Additionally, whenever you make a saving throw and fail, you can spend 1 ki point to reroll it and take the second result."),
        (15, "Timeless Body", "Your ki sustains you so that you suffer none of the frailty of old age, and you can't be aged magically. You can still die of old age, however. In addition, you no longer need food or water."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (17, "Monastic Tradition Feature", "You gain a feature from your Monastic Tradition."),
        (18, "Empty Body", "You can use your action to spend 4 ki points to become invisible for 1 minute. During that time, you also have resistance to all damage but force damage. Additionally, you can spend 8 ki points to cast the astral projection spell without needing material components."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Perfect Self", "When you roll for initiative and have no ki points remaining, you regain 4 ki points."),
    ],
    "Paladin": [
        (1, "Divine Sense", "The presence of strong evil registers on your senses like a noxious odor. As an action, you can open your awareness to detect such forces. Until the end of your next turn, you know the location of any celestial, fiend, or undead within 60 feet that is not behind total cover. You can use this feature a number of times equal to 1 + your Charisma modifier. You regain all uses when you finish a long rest."),
        (1, "Lay on Hands", "Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you take a long rest equal to your paladin level × 5. As an action, you can touch a creature and draw power from the pool to restore a number of hit points to that creature. You can also spend 5 hit points from the pool to cure the target of one disease or neutralize one poison."),
        (2, "Fighting Style", "Adopt a fighting style specialty: Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed weapon), Great Weapon Fighting (reroll 1s and 2s on damage), or Protection (impose disadvantage on attacks against adjacent allies when you have a shield)."),
        (2, "Spellcasting (half-caster, starts L2)", "You gain the ability to cast paladin spells, starting at 2nd level. Charisma is your spellcasting ability. You prepare spells equal to your Charisma modifier + half your paladin level, rounded down. Spell slots are as a half-caster (1st-level slots at 2nd, up to 5th-level slots at 17th)."),
        (2, "Divine Smite", "When you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target. The extra damage is 2d8 for a 1st-level slot, plus 1d8 for each spell level higher (maximum 5d8). The damage increases by 1d8 against undead or fiends."),
        (3, "Divine Health", "By 3rd level, the divine magic flowing through you makes you immune to disease."),
        (3, "Sacred Oath", "You swear the oath that binds you as a paladin forever. Your choice grants you features at 3rd, 7th, 15th, and 20th level. These features include your oath spells and Channel Divinity."),
        (3, "Channel Divinity", "Your Sacred Oath lets you channel divine energy to fuel magical effects. You have one use per short or long rest."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (5, "Extra Attack", "You can attack twice, instead of once, whenever you take the Attack action on your turn."),
        (6, "Aura of Protection", "Whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus to the saving throw equal to your Charisma modifier (minimum 1). You must be conscious to grant this bonus. At 18th level, the range of this aura increases to 30 feet."),
        (7, "Sacred Oath Feature", "You gain a feature from your Sacred Oath."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (10, "Aura of Courage", "You and friendly creatures within 10 feet of you can't be frightened while you are conscious. At 18th level, the range of this aura increases to 30 feet."),
        (11, "Improved Divine Smite", "By 11th level, you are so suffused with righteous might that all your melee weapon strikes carry divine power with them. Whenever you hit a creature with a melee weapon, the creature takes an extra 1d8 radiant damage."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (14, "Cleansing Touch", "You can use your action to end one spell on yourself or on one willing creature that you touch. You can use this feature a number of times equal to your Charisma modifier (minimum 1). You regain expended uses when you finish a long rest."),
        (15, "Sacred Oath Feature", "You gain a feature from your Sacred Oath."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (18, "Aura Improvements", "The range of your Aura of Protection and Aura of Courage increases to 30 feet."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Sacred Oath Feature", "You gain your oath's capstone feature."),
    ],
    "Ranger": [
        (1, "Favored Enemy", "Choose a type of favored enemy: aberrations, beasts, celestials, constructs, dragons, elementals, fey, fiends, giants, monstrosities, oozes, plants, or undead. You have advantage on Survival checks to track your favored enemies, as well as on Intelligence checks to recall information about them."),
        (1, "Natural Explorer", "You are particularly familiar with one type of natural environment. When you make an Intelligence or Wisdom check related to your favored terrain, your proficiency bonus is doubled. You gain additional benefits while traveling in that terrain."),
        (2, "Fighting Style", "Choose a fighting style specialty from: Archery (+2 to ranged attack rolls), Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed weapon), or Two-Weapon Fighting (add ability modifier to off-hand attacks)."),
        (2, "Spellcasting (half-caster, starts L1)", "You have learned to use the magical essence of nature to cast spells. Wisdom is your spellcasting ability. Ranger spell slots start at 1st level (2 slots), scaling to 3rd-level slots by 9th level."),
        (3, "Ranger Archetype", "You choose an archetype that you strive to emulate, such as Hunter or Beast Master. Your choice grants you features at 3rd, 7th, 11th, and 15th level."),
        (3, "Primeval Awareness", "You can use your action and expend one ranger spell slot to focus your awareness on the region around you. For 1 minute per level of the spell slot you expend, you can sense whether certain types of creatures are present within 1 mile of you."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (5, "Extra Attack", "You can attack twice, instead of once, whenever you take the Attack action on your turn."),
        (6, "Favored Enemy and Natural Explorer Improvements", "You choose one more favored enemy, and one more favored terrain type."),
        (7, "Ranger Archetype Feature", "You gain a feature from your Ranger Archetype."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (8, "Land's Stride", "Moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed or taking damage."),
        (10, "Natural Explorer Improvement", "You choose one more favored terrain type."),
        (10, "Hide in Plain Sight", "You can spend 1 minute creating camouflage for yourself. Once camouflaged against a solid surface, you gain a +10 bonus to Dexterity (Stealth) checks as long as you remain still."),
        (11, "Ranger Archetype Feature", "You gain a feature from your Ranger Archetype."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (14, "Favored Enemy Improvement", "You choose one more favored enemy, and the language associated with it."),
        (14, "Vanish", "You can use the Hide action as a bonus action on your turn. Also, you can't be tracked by nonmagical means, unless you choose to leave a trail."),
        (15, "Ranger Archetype Feature", "You gain a feature from your Ranger Archetype."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (18, "Feral Senses", "You gain preternatural senses that help you fight creatures you can't see. When you attack a creature you can't see, your inability to see it doesn't impose disadvantage on your attack rolls against it."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Foe Slayer", "You become an unparalleled hunter of your enemies. Once on each of your turns, you can add your Wisdom modifier to the attack roll or the damage roll of an attack you make against one of your favored enemies."),
    ],
    "Rogue": [
        (1, "Expertise", "Choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies."),
        (1, "Sneak Attack", "Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it. The attack must use a finesse or a ranged weapon. The damage increases as you gain levels."),
        (1, "Thieves' Cant", "During your rogue training you learned thieves' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation."),
        (2, "Cunning Action", "Your quick thinking and agility allow you to move and act quickly. You can take a bonus action on each of your turns to take the Dash, Disengage, or Hide action."),
        (3, "Roguish Archetype", "You choose an archetype that you emulate in the exercise of your rogue abilities. Your archetype grants you features at 3rd, 9th, 13th, and 17th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (5, "Uncanny Dodge", "When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you."),
        (6, "Expertise", "Choose two more of your skill proficiencies. Your proficiency bonus is doubled for those checks."),
        (7, "Evasion", "You can nimbly dodge out of the way of certain area effects. When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed and only half damage if you fail."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (9, "Roguish Archetype Feature", "You gain a feature from your Roguish Archetype."),
        (10, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (11, "Reliable Talent", "You have refined your chosen skills until they approach perfection. Whenever you make an ability check that lets you add your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (13, "Roguish Archetype Feature", "You gain a feature from your Roguish Archetype."),
        (14, "Blindsense", "If you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you."),
        (15, "Slippery Mind", "You have acquired greater mental strength. You gain proficiency in Wisdom saving throws."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (17, "Roguish Archetype Feature", "You gain a feature from your Roguish Archetype."),
        (18, "Elusive", "Beginning at 18th level, you are so evasive that attackers rarely gain the upper hand against you. No attack roll has advantage against you while you aren't incapacitated."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Stroke of Luck", "You have an uncanny knack for succeeding when you need to. If your attack misses a target within range, you can turn the miss into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20. Once you use this feature, you can't use it again until you finish a short or long rest."),
    ],
    "Sorcerer": [
        (1, "Spellcasting", "An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic. This font of magic, whatever its origin, fuels your spells. Charisma is your spellcasting ability. You know 2 cantrips and 2 1st-level spells from the sorcerer list."),
        (1, "Sorcerous Origin", "Choose a sorcerous origin, which describes the source of your innate magical power. Your choice grants you features when you choose it at 1st level and again at 6th, 14th, and 18th level."),
        (2, "Font of Magic / Sorcery Points", "You tap into a deep wellspring of magic within yourself. You have 2 sorcery points (increasing by 1 each level). You can regain spell slots using sorcery points (Flexible Casting): 2 pts→1st, 3 pts→2nd, 5 pts→3rd, 6 pts→4th, 7 pts→5th. Or convert spell slots to sorcery points (1 pt per slot level)."),
        (3, "Metamagic", "You gain the ability to twist your spells to suit your needs. You gain 2 Metamagic options (gaining 2 more at 10th and 17th level). Options include: Careful Spell, Distant Spell, Empowered Spell, Extended Spell, Heightened Spell, Quickened Spell, Subtle Spell, Twinned Spell."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (6, "Sorcerous Origin Feature", "You gain a feature from your Sorcerous Origin."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (10, "Metamagic", "You learn two more Metamagic options of your choice."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (14, "Sorcerous Origin Feature", "You gain a feature from your Sorcerous Origin."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (17, "Metamagic", "You learn two more Metamagic options of your choice."),
        (18, "Sorcerous Origin Feature", "You gain a feature from your Sorcerous Origin."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Sorcerous Restoration", "You regain 4 expended sorcery points whenever you finish a short rest."),
    ],
    "Warlock": [
        (1, "Otherworldly Patron", "You have struck a bargain with an otherworldly being of your choice: the Archfey, the Fiend, or the Great Old One. Your choice grants you features at 1st, 6th, 10th, and 14th level."),
        (1, "Pact Magic", "Your arcane research and the magic bestowed on you by your patron have given you facility with spells. Charisma is your spellcasting ability. Your spell slots all recover on a short or long rest. You start with 1 slot that refreshes on short rest, scaling to 2 slots of increasing level through level 9."),
        (2, "Eldritch Invocations", "In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability. You gain 2 Eldritch Invocations (gaining more as you level). Once you gain an invocation, you always have it prepared."),
        (3, "Pact Boon", "Your otherworldly patron bestows a gift upon you for your loyal service. You gain one of the following: Pact of the Chain (improved familiar), Pact of the Blade (create a melee weapon bonded to you), or Pact of the Tome (Book of Shadows: 3 extra cantrips from any class list)."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (6, "Otherworldly Patron Feature", "You gain a feature from your Otherworldly Patron."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (10, "Otherworldly Patron Feature", "You gain a feature from your Otherworldly Patron."),
        (11, "Mystic Arcanum (6th level)", "Your patron bestows upon you a magical secret called an arcanum. Choose one 6th-level spell from the warlock spell list as this arcanum. You can cast your arcanum spell once without expending a spell slot. You must finish a long rest before you can do so again."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (13, "Mystic Arcanum (7th level)", "Choose one 7th-level spell from the warlock spell list as an arcanum. Cast it once per long rest without a spell slot."),
        (14, "Otherworldly Patron Feature", "You gain a feature from your Otherworldly Patron."),
        (15, "Mystic Arcanum (8th level)", "Choose one 8th-level spell from the warlock spell list as an arcanum. Cast it once per long rest without a spell slot."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (17, "Mystic Arcanum (9th level)", "Choose one 9th-level spell from the warlock spell list as an arcanum. Cast it once per long rest without a spell slot."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Eldritch Master", "You can spend 1 minute entreating your patron for aid to regain all your expended spell slots from Pact Magic. Once you regain spell slots with this feature, you must finish a long rest before you can do so again."),
    ],
    "Wizard": [
        (1, "Spellcasting", "As a student of arcane magic, you have a spellbook containing 6 spells of 1st level. You can prepare spells equal to your Intelligence modifier + your wizard level (minimum 1). Intelligence is your spellcasting ability."),
        (1, "Arcane Recovery", "You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher."),
        (2, "Arcane Tradition", "You choose an arcane tradition from the Schools of Magic (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, or Transmutation). Your choice grants you features at 2nd, 6th, 10th, and 14th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (6, "Arcane Tradition Feature", "You gain a feature from your Arcane Tradition."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (10, "Arcane Tradition Feature", "You gain a feature from your Arcane Tradition."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (14, "Arcane Tradition Feature", "You gain a feature from your Arcane Tradition."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (18, "Spell Mastery", "You have achieved such mastery over certain spells that you can cast them at will. Choose a 1st-level spell and a 2nd-level spell from your spellbook. You can cast those spells at their lowest level without expending a spell slot when you have them prepared."),
        (19, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase a score above 20. Alternatively, with your DM's approval, you can take a feat instead."),
        (20, "Signature Spells", "You gain mastery over two powerful spells and can cast them with little effort. Choose two 3rd-level spells from your spellbook as your signature spells. You always have these spells prepared, they don't count against the number of spells you have prepared, and you can cast each of them once at 3rd level without expending a spell slot. When you do so, you can't do so again until you finish a short or long rest."),
    ],
}

# ---------------------------------------------------------------------------
# Features — 5.5e (2024)
# ---------------------------------------------------------------------------
FEATURES_2024 = {
    "Barbarian": [
        (1, "Rage", "On your turn you can enter a rage as a bonus action. While raging you gain advantage on Strength checks and saving throws, a damage bonus to melee Strength attacks (+2 at levels 1–8, +3 at 9–15, +4 at 16+), and resistance to bludgeoning, piercing, and slashing damage. You can rage 2 times per long rest (increases at higher levels). Starting at 3rd level, you can enter rage as part of your initiative roll."),
        (1, "Unarmored Defense", "While not wearing armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit."),
        (1, "Weapon Mastery", "Your training with weapons allows you to use the mastery properties of two kinds of Simple or Martial Melee weapons of your choice. You can change your mastery weapon choices when you finish a Long Rest."),
        (2, "Danger Sense", "You have advantage on Dexterity saving throws against effects you can see, such as traps and spells. To gain this benefit, you can't be blinded, deafened, or incapacitated."),
        (2, "Reckless Attack", "When you make your first attack on your turn, you can decide to attack recklessly. Doing so gives you Advantage on melee weapon attack rolls using Strength during this turn, but attack rolls against you have Advantage until your next turn."),
        (3, "Primal Knowledge", "You gain proficiency in one skill of your choice from the Barbarian skill list."),
        (3, "Primal Path", "You choose a Primal Path. Your choice grants you features at 3rd, 6th, 10th, and 14th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (5, "Extra Attack", "You can attack twice, instead of once, whenever you take the Attack action on your turn."),
        (5, "Fast Movement", "Your speed increases by 10 feet while you aren't wearing heavy armor."),
        (6, "Path Feature", "You gain a feature from your Primal Path."),
        (7, "Feral Instinct", "You have Advantage on Initiative rolls. Additionally, if you are Surprised at the start of combat, you can take your first turn as normal if you enter a Rage during that turn."),
        (7, "Instinctive Pounce", "As part of the Bonus Action you take to enter your Rage, you can move up to half your Speed."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (9, "Brutal Strike", "If you use Reckless Attack, you can forgo Advantage on one Strength-based attack in the current turn. If that attack hits, the target takes an extra 1d10 damage of the same type as the weapon and you can apply a Brutal Strike effect: Forceful Blow (push 15 ft) or Hamstring Blow (halve target's speed until start of your next turn). More effects unlock at 13th and 17th level."),
        (10, "Path Feature", "You gain a feature from your Primal Path."),
        (11, "Relentless Rage", "If you drop to 0 HP while raging, you can make a DC 10 Con save to drop to 1 HP instead. Each use after the first increases the DC by 5. Resets on a long rest."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (13, "Brutal Strike Improvement", "Unlock two more Brutal Strike effects: Staggering Blow (Disadvantage on next attack before your next turn) and Sundering Blow (the next attack roll against the target has Advantage)."),
        (14, "Path Feature", "You gain a feature from your Primal Path."),
        (15, "Persistent Rage", "Your rage can now only end early if you choose to end it or you fall Unconscious."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (17, "Brutal Strike Improvement", "Brutal Strike deals 2d10 extra damage instead of 1d10."),
        (18, "Indomitable Might", "If your total for a Strength check is less than your Strength score, you can use that score in place of the total."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Primal Champion", "Your Strength and Constitution each increase by 4. Their maximum is now 25."),
    ],
    "Bard": [
        (1, "Bardic Inspiration", "As a Bonus Action, give a Bardic Inspiration die (d6, upgraded later) to one creature within 60 feet who can hear you. They can use it within 10 minutes on an attack roll, ability check, or saving throw. You can use this a number of times equal to your Charisma modifier, regaining all uses on a short or long rest."),
        (1, "Spellcasting", "You know two cantrips and four 1st-level spells from the bard spell list. Charisma is your spellcasting ability."),
        (2, "Expertise", "Choose two skills you're proficient in. Double your proficiency bonus for those skills."),
        (2, "Jack of All Trades", "Add half your proficiency bonus (rounded down) to any ability check that doesn't already use your proficiency bonus."),
        (3, "Bard Subclass", "Choose a Bard subclass (College). Your choice grants you features at 3rd, 6th, and 14th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (5, "Font of Inspiration", "Bardic Inspiration die increases to d8. You regain uses on a Short or Long Rest."),
        (6, "Subclass Feature", "You gain a feature from your Bard Subclass."),
        (6, "Countercharm", "As an Action, start a performance lasting until the end of your next turn. You and friendly creatures within 30 feet have Advantage on saves against being Charmed or Frightened."),
        (7, "Expertise", "Choose two more skill proficiencies to double with your proficiency bonus."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (9, "Magical Secrets", "Choose two spells from any class list. They count as bard spells for you."),
        (10, "Bardic Inspiration (d10)", "Your Bardic Inspiration die increases to d10."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (13, "Magical Secrets", "Choose two more spells from any class list."),
        (14, "Subclass Feature", "You gain a feature from your Bard Subclass."),
        (15, "Bardic Inspiration (d12)", "Your Bardic Inspiration die increases to d12."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (17, "Magical Secrets", "Choose two more spells from any class list."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Words of Creation", "You learn the Power Word Heal and Power Word Kill spells. These are always prepared and don't count against your prepared spells. You can cast each once without a slot per long rest."),
    ],
    "Cleric": [
        (1, "Divine Order", "Choose Protector (gain Martial weapon proficiency and Heavy armor proficiency) or Thaumaturge (learn one extra cantrip from the cleric list and Cleric spells you cast ignore verbal components)."),
        (1, "Spellcasting", "Wisdom is your spellcasting ability. You prepare cleric spells equal to your Wisdom modifier + your cleric level. You always have your Domain spells prepared."),
        (2, "Channel Divinity", "You gain two Channel Divinity uses (recharge on Short or Long Rest). You always have Divine Spark and Turn Undead."),
        (2, "Divine Spark", "Spend one Channel Divinity use to restore or deal (1d8 per 2 cleric levels) radiant or necrotic damage/healing to a creature within 30 feet."),
        (2, "Turn Undead", "Spend one Channel Divinity use: each undead within 30 feet must make a Wisdom save or be Turned for 1 minute."),
        (3, "Cleric Subclass", "You choose a Divine Domain subclass at 3rd level. Your choice grants features at 3rd, 6th, 8th, and 17th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (5, "Sear Undead", "When undead fail their Turn Undead save, they also take radiant damage equal to your Wisdom modifier (minimum 1)."),
        (6, "Subclass Feature", "You gain a feature from your Divine Domain."),
        (7, "Blessed Strikes", "Divine power infuses your attacks. When you hit a creature with a weapon or cantrip, you can cause the hit to deal an extra 1d8 radiant or necrotic damage. Once per turn."),
        (8, "Subclass Feature", "You gain a feature from your Divine Domain."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (10, "Divine Intervention", "Call on your deity for aid using your Action. Roll d100. If you roll ≤ your cleric level, your deity intervenes. Success: unavailable for 7 days. Failure: available again after a Long Rest."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (17, "Subclass Feature", "You gain a capstone feature from your Divine Domain."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Greater Divine Intervention", "Your Divine Intervention succeeds automatically, no die roll required. Once used, you can't use it again for 2d4 days."),
    ],
    "Druid": [
        (1, "Primal Order", "Choose Magician (learn one extra cantrip from any list; use Wisdom for it) or Warden (gain Martial weapon proficiency and Medium armor training)."),
        (1, "Spellcasting", "Wisdom is your spellcasting ability. You prepare spells equal to your Wisdom modifier + your druid level."),
        (1, "Druidic", "You know the Druidic language and can leave hidden nature messages in the wild."),
        (2, "Wild Shape", "As a Bonus Action, transform into a beast with CR ≤ floor(your level / 3). At 2nd level this is CR 1/3 beasts only. Duration: 1 hour or until you drop to 0 HP. You regain 2 Wild Shape uses on a Short or Long Rest."),
        (2, "Wild Companion", "Spend a Wild Shape use to cast Find Familiar as a ritual (no material components). The familiar is a Fey Spirit."),
        (3, "Druid Subclass", "Choose a Circle subclass at 3rd level. Features at 3rd, 6th, 10th, and 14th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (4, "Wild Shape Improvement", "You can now use Wild Shape as a Bonus Action."),
        (5, "Wild Resurgence", "Once per turn, if you have no Wild Shape uses remaining, you can expend one spell slot (any level) to gain one Wild Shape use. Also, if you have no 1st-level spell slots remaining, you can spend one Wild Shape use to gain one 1st-level slot."),
        (6, "Subclass Feature", "You gain a feature from your Druid Circle."),
        (6, "Elemental Fury", "Choose an Elemental Fury option each time you prepare spells: Potent Spellcasting (add Wisdom modifier to cantrip damage) or Primal Strike (weapon + Wild Shape attacks count as magical and deal extra damage equal to your Wisdom modifier)."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (10, "Subclass Feature", "You gain a feature from your Druid Circle."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (14, "Subclass Feature", "You gain a feature from your Druid Circle."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (18, "Beast Spells", "You can cast many of your druid spells in any Wild Shape form (verbal and somatic components only)."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Archdruid", "You can use your Wild Shape an unlimited number of times. Additionally, the Primal Strike Elemental Fury option deals extra damage equal to your Wisdom modifier every time you hit, not just once per turn."),
    ],
    "Fighter": [
        (1, "Fighting Style", "Choose one fighting style specialty: Archery (+2 to ranged attack rolls), Blind Fighting (10 ft. blindsight), Defense (+1 AC while armored), Dueling (+2 damage with one-handed weapon), Great Weapon Fighting (reroll 1s/2s on damage), Interception (reaction: reduce damage to nearby creature by 1d10 + PB), Protection (impose Disadvantage on attack against adjacent creature when shielded), Thrown Weapon Fighting (draw thrown weapon as part of attack, +2 damage), Two-Weapon Fighting (add modifier to off-hand attack), Unarmed Fighting (1d6 or 1d8 unarmed strikes, grappled target takes 1d4 bludgeoning)."),
        (1, "Second Wind", "Bonus Action: regain 1d10 + Fighter level HP. Uses equal to your Constitution modifier (minimum 1), all regained on a Short or Long Rest."),
        (1, "Weapon Mastery", "You can use the mastery property of three weapons you're proficient with. You can change which weapons at the end of a Long Rest."),
        (2, "Action Surge", "Once per turn, take one additional Action on your turn. Recharges on Short or Long Rest. Gain a second use at 17th level."),
        (2, "Tactical Mind", "When you fail an ability check, you can expend one use of Second Wind to add 1d10 to the check, potentially turning it into a success."),
        (3, "Fighter Subclass", "Choose a Martial Archetype subclass. Features at 3rd, 7th, 10th, 15th, and 18th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (5, "Extra Attack", "You can attack twice whenever you take the Attack action."),
        (6, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (7, "Subclass Feature", "You gain a feature from your Martial Archetype."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (9, "Tactical Shift", "Whenever you activate Second Wind, you can move up to half your speed without provoking Opportunity Attacks."),
        (9, "Indomitable", "Reroll a failed saving throw once per Long Rest (2/LR at 13th, 3/LR at 17th)."),
        (10, "Subclass Feature", "You gain a feature from your Martial Archetype."),
        (11, "Extra Attack (3)", "You can attack three times whenever you take the Attack action."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (13, "Indomitable (2/LR)", "You can use Indomitable twice between Long Rests."),
        (13, "Studied Attacks", "When you miss with an attack, the next attack roll you make against the same target has Advantage (provided it occurs before the end of your next turn)."),
        (14, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (15, "Subclass Feature", "You gain a feature from your Martial Archetype."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (16, "Weapon Mastery (6 weapons)", "You can now use the mastery property of six weapons."),
        (17, "Action Surge (2/rest)", "You can use Action Surge twice between rests."),
        (17, "Indomitable (3/LR)", "You can use Indomitable three times between Long Rests."),
        (18, "Subclass Feature", "You gain a feature from your Martial Archetype."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Extra Attack (4)", "You can attack four times whenever you take the Attack action."),
    ],
    "Monk": [
        (1, "Martial Arts", "Unarmed strikes and monk weapons use your Martial Arts die (d6→d8 at 5→d10 at 11→d12 at 17). You can use Dex or Str for attack and damage rolls with these weapons. You can make one Unarmed Strike as a Bonus Action when you take the Attack action with these weapons."),
        (1, "Unarmored Defense", "AC = 10 + Dex modifier + Wis modifier while wearing no armor and no shield."),
        (1, "Weapon Mastery", "Use the mastery property of one Simple or Martial Melee weapon you're proficient with. Change choice on Long Rest."),
        (2, "Monk's Focus (Ki, renamed)", "You have Focus Points equal to your Monk level, regained on Short or Long Rest. Use them for: Flurry of Blows (1 pt: two Unarmed Strikes as Bonus Action), Patient Defense (1 pt: Dodge as Bonus Action), Step of the Wind (1 pt: Disengage or Dash as Bonus Action; jump distance doubled)."),
        (2, "Unarmored Movement", "Speed increases by 10 ft while unarmored and unshielded (increases at higher levels)."),
        (2, "Uncanny Metabolism", "When you roll Initiative, you can regain Focus Points equal to your Proficiency Bonus. 1/Long Rest."),
        (3, "Deflect Attacks", "As a Reaction when hit by an attack, reduce damage by 1d10 + Dex + Monk level. If reduced to 0, you can spend 1 Focus Point to redirect the attack (30 ft range, +5 to hit, same damage type)."),
        (3, "Monk Subclass", "Choose a Monastic Tradition subclass. Features at 3rd, 6th, 11th, and 17th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (4, "Slow Fall", "Reaction: reduce falling damage by 5× Monk level."),
        (5, "Extra Attack", "Attack twice whenever you take the Attack action."),
        (5, "Stunning Strike", "Spend 1 Focus Point when you hit a creature with an attack. Target makes a Con save or is Stunned until the start of your next turn."),
        (6, "Empowered Strikes", "Your Unarmed Strikes count as magical for purposes of overcoming resistance and immunity."),
        (6, "Subclass Feature", "You gain a feature from your Monastic Tradition."),
        (7, "Evasion", "You take no damage on a successful Dexterity save against effects that deal half on a save, and only half on a failure."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (9, "Acrobatic Movement", "While not wearing armor or using a shield, you can move along vertical surfaces and across liquids on your turn without falling if you end your turn on a surface or object."),
        (10, "Heightened Focus", "Benefits from Flurry of Blows, Patient Defense, and Step of the Wind improve: Flurry causes disadvantage on saves vs. Stunning Strike; Patient Defense grants Dodge for the full turn; Step of the Wind triples jump distance."),
        (10, "Self Restoration", "At the end of each of your turns, you can end one of the following conditions affecting yourself: Charmed, Frightened, or Poisoned (no action or Focus Point required)."),
        (11, "Subclass Feature", "You gain a feature from your Monastic Tradition."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (13, "Deflect Energy", "You can now use Deflect Attacks against ranged spell attacks, as well as melee weapon attacks and ranged weapon attacks."),
        (14, "Disciplined Survivor", "You gain proficiency in all saving throws. Whenever you make a saving throw and fail, you can spend 1 Focus Point to reroll it and take the second result."),
        (15, "Perfect Focus", "When you roll Initiative and have fewer Focus Points than your Proficiency Bonus, your total becomes equal to your Proficiency Bonus."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (17, "Subclass Feature", "You gain a feature from your Monastic Tradition."),
        (18, "Superior Defense", "At the start of your turn, you can spend 3 Focus Points to give yourself resistance to all damage types until the start of your next turn."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Body and Mind", "Your Dexterity and Wisdom each increase by 4. Their maximum is now 25."),
    ],
    "Paladin": [
        (1, "Divine Sense", "As a Bonus Action, detect the presence of Aberrations, Celestials, Fiends, and Undead within 60 feet (not behind total cover) until the end of your next turn. Uses = 1 + Cha modifier, regained on Long Rest."),
        (1, "Lay on Hands", "Pool = 5 × Paladin level. As an Action, restore HP to a touched creature. Also spend 5 HP from pool to end one disease or poison."),
        (1, "Spellcasting (starts at level 1)", "Unlike 2014, Paladin spell slots begin at 1st level. Charisma is your spellcasting ability. Prepare spells equal to half your Paladin level + Charisma modifier."),
        (1, "Weapon Mastery", "Use the mastery property of two weapons you're proficient with. Change choices at the end of a Long Rest."),
        (2, "Fighting Style", "Choose a fighting style specialty (Defense, Dueling, Great Weapon Fighting, Protection, Blessed Warrior, or Blind Fighting)."),
        (2, "Paladin's Smite", "When you hit a creature with a melee weapon or unarmed strike, you can expend a spell slot to deal extra radiant damage: 2d8 per slot level. +1d8 against Undead or Fiends. You can use this even after seeing the roll."),
        (3, "Channel Divinity", "Gain 2 uses that recharge on Short or Long Rest. You always have Divine Smite and Sacred Weapon options; your subclass oath adds more."),
        (3, "Paladin Subclass (Sacred Oath)", "You swear your Sacred Oath at 3rd level. Features at 3rd, 7th, 15th, and 20th level."),
        (3, "Divine Health", "You are immune to disease."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (5, "Extra Attack", "Attack twice whenever you take the Attack action."),
        (5, "Faithful Steed", "You can cast Find Steed without using a spell slot. 1/Long Rest."),
        (6, "Aura of Protection", "You and friendly creatures within 10 ft add your Charisma modifier (minimum 1) to all saving throws while you are conscious. Expands to 30 ft at 18th level."),
        (7, "Subclass Feature", "You gain a feature from your Sacred Oath."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (9, "Abjure Foes", "As an Action, expend one Channel Divinity use. Up to a number of creatures equal to your Charisma modifier (minimum 1) within 60 feet must make Wisdom saves or be Frightened and Incapacitated for 1 minute."),
        (10, "Aura of Courage", "You and friendly creatures within 10 feet can't be Frightened while you are conscious. Expands to 30 ft at 18th level."),
        (11, "Radiant Strikes", "Your melee weapon and unarmed strikes deal an extra 1d8 radiant damage on a hit."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (14, "Restoring Touch", "When you use Lay on Hands to restore HP, you can also remove one of the following: Blinded, Deafened, Paralyzed, Poisoned, or Stunned. No HP cost."),
        (15, "Subclass Feature", "You gain a feature from your Sacred Oath."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (18, "Aura Expansion", "Your Aura of Protection and Aura of Courage now extend to 30 feet."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Subclass Feature", "You gain your Sacred Oath's capstone feature."),
    ],
    "Ranger": [
        (1, "Deft Explorer", "Gain the Expertise benefit for one skill you're proficient in, plus two languages of your choice."),
        (1, "Favored Enemy", "Choose a type of favored enemy. You always have Hunter's Mark prepared and can cast it once without using a spell slot (regain on Long Rest). Gain Advantage on checks to track or recall knowledge about your favored prey."),
        (1, "Spellcasting (starts at level 1)", "Wisdom is your spellcasting ability. Ranger spell slots begin at 1st level in the 2024 rules."),
        (1, "Weapon Mastery", "Use the mastery property of two weapons you're proficient with. Change choices on Long Rest."),
        (2, "Deft Explorer Improvement", "You gain the Roving benefit: your Speed increases by 10 feet, and you gain a Climb and Swim speed equal to your Speed."),
        (2, "Fighting Style", "Choose a fighting style specialty (Archery, Defense, Druidic Warrior, Thrown Weapon Fighting, or Two-Weapon Fighting)."),
        (3, "Ranger Subclass", "Choose a Ranger subclass (e.g. Hunter, Beast Master, Gloom Stalker). Features at 3rd, 7th, 11th, and 15th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (5, "Extra Attack", "Attack twice whenever you take the Attack action."),
        (6, "Deft Explorer Improvement (Tireless)", "As an Action, gain Temporary HP equal to 1d8 + Wisdom modifier. 1/Long Rest (plus additional uses on Short Rests up to your Wisdom modifier times)."),
        (7, "Subclass Feature", "You gain a feature from your Ranger Subclass."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (8, "Relentless Hunter", "When you cast Hunter's Mark, you can maintain concentration on it and one other concentration spell at the same time."),
        (9, "Conjure Barrage", "You always have Conjure Barrage prepared and can cast it once without a slot (regain on Long Rest)."),
        (10, "Deft Explorer Improvement (Nature's Veil)", "As a Bonus Action, become invisible until the start of your next turn. Uses equal to Wisdom modifier (minimum 1), regained on Long Rest."),
        (11, "Subclass Feature", "You gain a feature from your Ranger Subclass."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (13, "Conjure Volley", "You always have Conjure Volley prepared and can cast it once without a slot (regain on Long Rest)."),
        (14, "Precise Hunter", "You have Advantage on attack rolls against the creature currently marked by your Hunter's Mark."),
        (15, "Subclass Feature", "You gain a feature from your Ranger Subclass."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (18, "Feral Senses", "You gain Blindsight with a range of 30 feet."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Foe Slayer", "Once per turn, when you hit a creature with a weapon, you can add your Wisdom modifier to the damage roll."),
    ],
    "Rogue": [
        (1, "Expertise", "Double your proficiency bonus for two skill proficiencies of your choice."),
        (1, "Sneak Attack", "Once per turn, deal 1d6 extra damage (scaling per level) to a creature you hit with a Finesse or Ranged weapon if you have Advantage or an ally is adjacent to the target."),
        (1, "Thieves' Cant", "You know the secret language and signs used by thieves to convey short messages to one another."),
        (1, "Weapon Mastery", "Use the mastery property of two weapons you're proficient with. Change on Long Rest."),
        (2, "Cunning Action", "Bonus Action each turn: take the Dash, Disengage, or Hide action."),
        (3, "Rogue Subclass", "Choose a Roguish Archetype subclass. Features at 3rd, 9th, 13th, and 17th level."),
        (3, "Steady Aim", "As a Bonus Action, give yourself Advantage on your next attack roll this turn — but your Speed must be 0 until the end of the turn."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (5, "Cunning Strike", "When you deal Sneak Attack damage, you can forgo one die of Sneak Attack damage to impose one of the following effects on the target: Disarm, Poison, Trip."),
        (5, "Uncanny Dodge", "Reaction when hit by an attack: halve the damage."),
        (6, "Expertise", "Choose two more skill proficiencies to double with your proficiency bonus."),
        (7, "Evasion", "No damage on a successful Dex save against half-damage effects; only half on failure."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (9, "Subclass Feature", "You gain a feature from your Roguish Archetype."),
        (10, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (11, "Reliable Talent", "When you add your proficiency bonus to an ability check, treat a d20 roll of 9 or lower as a 10."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (13, "Subclass Feature", "You gain a feature from your Roguish Archetype."),
        (14, "Devious Strikes", "Expand Cunning Strike options with Daze, Knock Out, and Obscure at the cost of more Sneak Attack dice."),
        (15, "Slippery Mind", "You gain proficiency in Wisdom and Charisma saving throws."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (17, "Subclass Feature", "You gain a feature from your Roguish Archetype."),
        (18, "Elusive", "No attack roll has Advantage against you while you're not Incapacitated."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Stroke of Luck", "Turn a missed attack into a hit, or a failed ability check into a 20 (treat d20 as 20). 1/Short or Long Rest."),
    ],
    "Sorcerer": [
        (1, "Innate Sorcery", "As a Bonus Action, enter a 1-minute state of magical empowerment. While active, the save DC of your spells increases by 1 and you have Advantage on attack rolls of spells you cast. 2/Long Rest."),
        (1, "Spellcasting", "Charisma is your spellcasting ability. You know 2 cantrips and 2 1st-level spells."),
        (1, "Sorcerous Origin", "Choose a subclass at 1st level. Features at 1st, 6th, 14th, and 18th level."),
        (2, "Font of Magic", "Gain 2 sorcery points (+1 per level). Convert sorcery points to spell slots or slots to points. Same costs as 2014."),
        (3, "Metamagic", "Gain 2 Metamagic options (2 more at 10th, and another at 17th). Options: Careful, Distant, Empowered, Extended, Heightened, Quickened, Seeking, Subtle, Transmuted, Twinned."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (5, "Sorcerous Restoration", "When you finish a Short Rest, you can regain expended sorcery points. The total regained can't exceed half your maximum (rounded up). 1/Long Rest."),
        (6, "Subclass Feature", "You gain a feature from your Sorcerous Origin."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (10, "Metamagic", "Learn two more Metamagic options."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (14, "Subclass Feature", "You gain a feature from your Sorcerous Origin."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (17, "Metamagic", "Learn one more Metamagic option."),
        (18, "Subclass Feature", "You gain a feature from your Sorcerous Origin."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Arcane Apotheosis", "While your Innate Sorcery is active, you can use one Metamagic option on each of your turns without spending sorcery points (once per turn)."),
    ],
    "Warlock": [
        (1, "Eldritch Invocations", "Learn 2 Eldritch Invocations of your choice (starting at 1st level). Gain more as you level. You can replace one invocation whenever you gain a Warlock level."),
        (1, "Pact Magic", "Charisma is your spellcasting ability. Your spell slots refresh on Short or Long Rest. Slot level increases: 1st at level 1, 2nd at 3rd, 3rd at 5th, 4th at 7th, 5th at 9th."),
        (1, "Otherworldly Patron", "Choose your patron at 1st level. Features at 1st, 6th, 10th, and 14th level."),
        (2, "Magical Cunning", "If you have no Pact Magic slots remaining, you can perform a 1-minute ritual to regain half your maximum slots (rounded up). 1/Long Rest."),
        (3, "Warlock Subclass Feature", "You gain a feature from your Otherworldly Patron."),
        (3, "Pact Boon", "Expand your invocation access to pact boon invocations now that you've reached 3rd level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (5, "Contact Patron", "As an Action, ask your patron a question. They can choose to answer or remain silent. 1/Long Rest."),
        (6, "Subclass Feature", "You gain a feature from your Otherworldly Patron."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (10, "Subclass Feature", "You gain a feature from your Otherworldly Patron."),
        (11, "Mystic Arcanum (6th level)", "Gain a 6th-level spell as a Mystic Arcanum. Cast once per Long Rest without a slot."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (13, "Mystic Arcanum (7th level)", "Gain a 7th-level spell as a Mystic Arcanum."),
        (14, "Subclass Feature", "You gain a feature from your Otherworldly Patron."),
        (15, "Mystic Arcanum (8th level)", "Gain an 8th-level spell as a Mystic Arcanum."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (17, "Mystic Arcanum (9th level)", "Gain a 9th-level spell as a Mystic Arcanum."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Eldritch Master", "Spend 1 minute entreating your patron to regain all Pact Magic slots. 1/Long Rest."),
    ],
    "Wizard": [
        (1, "Arcane Recovery", "Once per day after a Short Rest, recover spell slots with combined level ≤ half your Wizard level (rounded up, max 5th level slots)."),
        (1, "Memorize Spell", "When you finish a Short Rest, you can study your spellbook and replace one of your currently prepared Wizard spells with another from the book. 1/Short Rest."),
        (1, "Spellcasting", "Intelligence is your spellcasting ability. Your spellbook contains 6 spells. You prepare spells equal to your Intelligence modifier + your Wizard level."),
        (2, "Scholar", "Choose a field of study from: Arcane, Biologist, Historian, Mathematician, Naturalist, or Tactician. Gain Expertise in one skill related to that field, plus one language."),
        (3, "Wizard Subclass", "Choose an Arcane Tradition subclass at 3rd level. Features at 3rd, 6th, 10th, and 14th level."),
        (4, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (6, "Subclass Feature", "You gain a feature from your Arcane Tradition."),
        (6, "Memorize Spell Improvement", "You can now swap two prepared spells per Short Rest (instead of one)."),
        (8, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (10, "Subclass Feature", "You gain a feature from your Arcane Tradition."),
        (12, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (14, "Subclass Feature", "You gain a feature from your Arcane Tradition."),
        (16, "Ability Score Improvement", "You can increase one ability score by 2, or two ability scores by 1 each (max 20), or take a feat."),
        (18, "Spell Mastery", "Choose one 1st-level and one 2nd-level spell from your spellbook. You can cast those spells at their lowest level without expending a slot while they are prepared."),
        (19, "Epic Boon", "You gain an Epic Boon feat."),
        (20, "Signature Spells", "Two 3rd-level spells from your spellbook become signature spells. They're always prepared, don't count against your total, and can each be cast once at 3rd level without a slot per Short or Long Rest."),
    ],
}

# ---------------------------------------------------------------------------
# Seed function
# ---------------------------------------------------------------------------
CLASSES = [
    "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
    "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard",
]

EDITIONS = [("5e", FEATURES_5E), ("5.5e", FEATURES_2024)]


def seed():
    db = SessionLocal()
    try:
        created = 0
        skipped = 0
        for class_name in CLASSES:
            prof = PROFICIENCY_DATA[class_name]
            flavor = FLAVOR_TEXTS[class_name]

            for edition, feature_map in EDITIONS:
                existing = (
                    db.query(CharacterClass)
                    .filter_by(name=class_name, edition=edition, owner_type=OwnerType.system)
                    .first()
                )
                if existing:
                    skipped += 1
                    continue

                cls = CharacterClass(
                    name=class_name,
                    edition=edition,
                    flavor_text=flavor,
                    hit_die=prof["hit_die"],
                    primary_ability=prof["primary_ability"],
                    spellcasting_ability=prof["spellcasting_ability"],
                    saving_throws=prof["saving_throws"],
                    armor_proficiencies=prof["armor_proficiencies"],
                    weapon_proficiencies=prof["weapon_proficiencies"],
                    tool_proficiencies=prof["tool_proficiencies"],
                    skill_count=prof["skill_count"],
                    skills_available=prof["skills_available"],
                    owner_type=OwnerType.system,
                    owner_id=None,
                )
                db.add(cls)
                db.flush()  # get cls.id before adding features

                for (level, fname, fdesc) in feature_map.get(class_name, []):
                    db.add(ClassFeature(
                        class_id=cls.id,
                        level=level,
                        feature_name=fname,
                        feature_description=fdesc,
                    ))

                created += 1

        db.commit()
        print(f"Done. Created {created} classes, skipped {skipped} already-existing.")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed()
