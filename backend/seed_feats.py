"""
Seed script: populates the feats table with the 2014 PHB feats (edition "5e")
and the 2024 PHB feats (edition "5.5e").

The D&D 5e API only exposes a single SRD feat (Grappler), so this data is
hardcoded. Idempotent: skips feats that already exist by (name, edition,
owner_type=system). Safe to re-run.

Run: python seed_feats.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from shared.database import SessionLocal
from players.feats.models import Feat
from shared.enums import OwnerType


def _prereq(text):
    return {"text": text} if text else {}


# ── Structured mechanical effects (5e batch) ───────────────────────────────────────
# Keyed by feat name. See `.claude/commands/feat-effects.md` for the taxonomy + consumer
# status. Only kinds with a live consumer are authored as structured effects; clauses that
# need a not-yet-built consumer (resource pools, proficiency-CHOICE grants, speed) are kept
# as `note` so no chip is shown that does nothing (upgrade them when the consumer ships).
# Consumers live now: stat_mod (initiative, passive_perception), ability_score,
# ability_choice, action, attack_mod, note.
def _abil(ability, amount=1):
    return {"kind": "ability_score", "ability": ability, "amount": amount,
            "label": f"+{amount} {ability.capitalize()}"}

def _abil_choice(abilities, amount=1):
    label = f"+{amount} " + " or ".join(a.capitalize() for a in abilities)
    return {"kind": "ability_choice", "abilities": abilities, "amount": amount, "label": label}

def _note(text):
    return {"kind": "note", "text": text}

def _action(name, economy, trigger, description):
    return {"kind": "action", "name": name, "economy": economy, "trigger": trigger, "description": description}

def _spell_grant(source_kind, cantrips=0, leveled=None, fixed=None,
                 free_cast=None, ability="choice", label=None):
    """A feat that grants spells the player picks at acquisition (Magic Initiate, etc.).

    source_kind: 'class' (pick bard/cleric/druid/sorcerer/warlock/wizard) | 'group'
                 (pick Arcane/Divine/Primal — 2024) | 'school' (chosen spell filtered by
                 school, no class list) | 'fixed' (only always-granted spells, no choice).
    cantrips:    number of cantrips to choose from the chosen list.
    leveled:     [{"level": 1, "count": 1, "school": ["Divination","Enchantment"]}] leveled
                 spells to choose; `school` (optional) filters by school instead of a class list;
                 `ritual: True` (Ritual Caster) filters to ritual spells + marks a growable
                 ritual book (stored as `ritual_book:[names]`, cast as rituals only, no free cast).
    fixed:       [{"name": "Misty Step", "level": 2}] always-granted spells (no choice).
    free_cast:   'long_rest' = EVERY leveled granted spell (fixed level≥1 + chosen leveled) is
                 castable once per long rest for free (or with a slot); None = no free casts.
                 (Cantrips are at-will, never free casts.)
    ability:     'class' (use the chosen class's spellcasting ability) | 'choice' (player
                 picks INT/WIS/CHA) | 'none' (the feat's ASI already sets the ability).
    """
    return {
        "kind": "spell_grant",
        "source_kind": source_kind,
        "cantrips": cantrips,
        "leveled": leveled or [],
        "fixed": fixed or [],
        "free_cast": free_cast,
        "ability": ability,
        "label": label or "Spell grant",
    }

_ALL_ABILITIES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]

FEAT_EFFECTS_5E = {
    "Alert": [
        {"kind": "stat_mod", "stat": "initiative", "amount": 5, "label": "+5 initiative"},
        _note("Can't be surprised while conscious; hidden attackers don't gain advantage against you."),
    ],
    "Tavern Brawler": [
        _abil_choice(["strength", "constitution"]),
        {"kind": "proficiency", "prof_type": "weapon", "items": ["Improvised weapons"]},
        {"kind": "attack_mod", "target": "unarmed", "dice": "1d4", "label": "Unarmed strike deals 1d4"},
        _action("Grapple (Tavern Brawler)", "bonus",
                "After you hit with an unarmed strike or improvised weapon",
                "Use a bonus action to grapple the target (Athletics check vs. the target's Athletics/Acrobatics)."),
    ],
    "Actor": [
        _abil("charisma"),
        _note("Advantage on Deception and Performance checks to pass as someone else; mimic speech and sounds you've heard."),
    ],
    "Athlete": [
        _abil_choice(["strength", "dexterity"]),
        _note("Stand from prone with only 5 ft of movement; climbing costs no extra movement; running jump after moving 5 ft."),
    ],
    "Charger": [
        _note("After you Dash and move 10 ft straight toward a target, a melee attack/shove that turn gains +5 damage or pushes 10 ft."),
    ],
    "Crossbow Expert": [
        _action("Hand Crossbow (Bonus Attack)", "bonus",
                "After you make a one-handed attack",
                "Make an attack with a hand crossbow you're holding as a bonus action."),
        _note("Ignore the loading property of proficient crossbows; no disadvantage on ranged attacks within 5 ft of an enemy."),
    ],
    "Defensive Duelist": [
        _action("Defensive Parry", "reaction",
                "When hit by a melee attack while wielding a finesse weapon you're proficient with",
                "Add your proficiency bonus to your AC against that attack, possibly causing it to miss."),
    ],
    "Dual Wielder": [
        {"kind": "ac_mod", "amount": 1, "condition": "two_melee_weapons", "label": "+1 AC (dual-wielding)"},
        _note("Two-weapon fighting with non-light weapons; draw/stow two one-handed weapons at once."),
    ],
    "Dungeon Delver": [
        _note("Advantage to find secret doors and on saves vs traps; resistance to trap damage; search for traps at normal travel pace."),
    ],
    "Durable": [
        _abil("constitution"),
        _note("When you roll Hit Dice to regain HP, the minimum regained equals twice your CON modifier."),
    ],
    "Elemental Adept": [
        _note("Choose acid/cold/fire/lightning/thunder: your spells ignore resistance to it and treat 1s on its damage dice as 2s. Repeatable."),
    ],
    "Grappler": [
        _note("Advantage on attack rolls against a creature you're grappling; can use your action to pin a grappled creature."),
    ],
    "Great Weapon Master": [
        _action("Cleave (Bonus Attack)", "bonus",
                "When you score a critical hit or reduce a creature to 0 HP with a melee weapon",
                "Make one melee weapon attack as a bonus action."),
        _note("Before a melee attack with a heavy weapon you're proficient with, take -5 to the attack roll for +10 damage."),
    ],
    "Heavily Armored": [
        _abil("strength"),
        {"kind": "proficiency", "prof_type": "armor", "items": ["Heavy"]},
    ],
    "Heavy Armor Master": [
        _abil("strength"),
        _note("While wearing heavy armor, reduce nonmagical bludgeoning/piercing/slashing damage taken by 3."),
    ],
    "Inspiring Leader": [
        _note("Spend 10 minutes to give up to six creatures temporary hit points equal to your level + CHA modifier."),
    ],
    "Keen Mind": [
        _abil("intelligence"),
        _note("Always know which way is north and the hours to sunrise/sunset; recall anything seen or heard in the past month."),
    ],
    "Lightly Armored": [
        _abil_choice(["strength", "dexterity"]),
        {"kind": "proficiency", "prof_type": "armor", "items": ["Light"]},
    ],
    "Linguist": [
        _abil("intelligence"),
        {"kind": "proficiency", "prof_type": "language", "count": 3, "label": "3 languages"},
        _note("Create written ciphers others can't read without a hard INT check."),
    ],
    "Lucky": [
        {"kind": "resource", "key": "luck_points", "label": "Luck Points", "total": 3, "recharge": "long"},
        _note("Spend a luck point to roll an extra d20 on an attack, check, or save you make, or on an attack roll against you."),
    ],
    "Mage Slayer": [
        _action("Mage Slayer Strike", "reaction",
                "When a creature within 5 ft of you casts a spell",
                "Make a melee weapon attack against that creature."),
        _note("Impose disadvantage on concentration saves you cause; advantage on saves vs spells cast by creatures within 5 ft."),
    ],
    "Magic Initiate": [
        _spell_grant("class", cantrips=2, leveled=[{"level": 1, "count": 1}],
                     free_cast="long_rest", ability="class", label="Magic Initiate"),
        _note("The 1st-level spell is castable once per long rest for free (or with a spell slot). Repeatable for a different class."),
    ],
    "Martial Adept": [
        {"kind": "maneuver_grant", "count": 2, "die": "d6", "label": "2 maneuvers"},
        {"kind": "resource", "key": "martial_adept_superiority", "label": "Superiority Die (d6)", "total": 1, "recharge": "short"},
        _note("If you're already a Battle Master, you instead gain one additional superiority die and add these maneuvers to your known list."),
    ],
    "Medium Armor Master": [
        {"kind": "ac_mod", "condition": "medium_armor_dex_cap", "dex_cap": 3, "label": "+3 DEX cap (medium armor)"},
        _note("Medium armor doesn't impose disadvantage on Stealth."),
    ],
    "Mobile": [
        {"kind": "stat_mod", "stat": "speed", "amount": 10, "label": "+10 speed"},
        _note("Dashing ignores difficult terrain; a melee attack denies that creature's opportunity attacks against you for the turn."),
    ],
    "Moderately Armored": [
        _abil_choice(["strength", "dexterity"]),
        {"kind": "proficiency", "prof_type": "armor", "items": ["Medium", "Shields"]},
    ],
    "Mounted Combatant": [
        _note("Advantage on melee attacks vs unmounted creatures smaller than your mount; redirect attacks from mount to you; mount avoids damage on successful DEX saves."),
    ],
    "Observant": [
        _abil_choice(["intelligence", "wisdom"]),
        {"kind": "stat_mod", "stat": "passive_perception", "amount": 5, "label": "+5 passive Perception"},
        _note("Also +5 passive Investigation; can read lips."),
    ],
    "Polearm Master": [
        _action("Polearm Butt (Bonus Attack)", "bonus",
                "When you take the Attack action with a glaive, halberd, quarterstaff, or spear",
                "Make a bonus-action attack with the weapon's opposite end (1d4 bludgeoning)."),
        _note("Creatures provoke an opportunity attack when they enter your reach."),
    ],
    "Resilient": [
        _abil_choice(_ALL_ABILITIES),
        {"kind": "proficiency", "prof_type": "saving_throw", "from_ability_choice": True},
        _note("Gain saving-throw proficiency in the chosen ability. Repeatable for a different ability."),
    ],
    "Ritual Caster": [
        _spell_grant("class", leveled=[{"level": 1, "count": 2, "ritual": True}],
                     free_cast=None, ability="class", label="Ritual Caster"),
        _note("Cast these as rituals only (10 minutes longer, no spell slot). You can add more ritual spells you find to the book."),
    ],
    "Savage Attacker": [
        _note("Once per turn, reroll a melee weapon's damage dice and use either total."),
    ],
    "Sentinel": [
        _action("Sentinel Strike", "reaction",
                "When a creature within 5 ft attacks a target other than you",
                "Make a melee weapon attack against the attacking creature."),
        _note("Your opportunity-attack hits reduce the target's speed to 0; creatures provoke even when they Disengage."),
    ],
    "Sharpshooter": [
        _note("Long range imposes no disadvantage; ignore half and three-quarters cover; -5 to hit for +10 damage with a proficient ranged weapon."),
    ],
    "Shield Master": [
        _action("Shield Shove (Bonus)", "bonus",
                "When you take the Attack action",
                "Use a bonus action to shove a creature within 5 ft with your shield."),
        _note("Add your shield's AC to DEX saves vs single-target effects; take no damage on a successful DEX save."),
    ],
    "Skilled": [
        {"kind": "proficiency", "prof_type": "skill_or_tool", "count": 3, "label": "3 skills or tools"},
        _note("Repeatable for three more skills or tools."),
    ],
    "Skulker": [
        _note("Hide when lightly obscured; missing a ranged attack doesn't reveal you; dim light doesn't impose disadvantage on sight Perception."),
    ],
    "Spell Sniper": [
        _spell_grant("class", cantrips=1, ability="class", label="Spell Sniper"),
        _note("Double the range of attack-roll spells; spell attacks ignore half and three-quarters cover. Choose a cantrip that requires an attack roll."),
    ],
    "Tough": [
        _note("Your hit point maximum increases by 2 per level (applied automatically on the sheet)."),
    ],
    "War Caster": [
        _action("War Caster Spell (Reaction)", "reaction",
                "When a creature provokes an opportunity attack from you",
                "Cast a single-target spell with a casting time of 1 action at it instead of making a weapon attack."),
        _note("Advantage on concentration saves; perform somatic components while holding weapons or a shield."),
    ],
    "Weapon Master": [
        _abil_choice(["strength", "dexterity"]),
        {"kind": "proficiency", "prof_type": "weapon", "count": 4, "label": "4 weapons"},
    ],
}

# ── 2024 PHB feat effects (edition "5.5e") ─────────────────────────────────────────
# Authored per 2024 rules (NOT copied from 2014): Origin feats grant no ASI; most General
# feats are half-feats with a +1; Alert grants Initiative *Proficiency* (PB, not +5);
# Observant has no +5 passive Perception; Lucky's points scale with PB. PB-scaled values
# (Alert init, Lucky points) and conditional/fighting-style riders are honest `note`s until
# a PB-scaled stat_mod/resource consumer exists.
FEAT_EFFECTS_2024 = {
    # ── Origin feats (level 1, no ASI) ──
    "Alert": [
        {"kind": "stat_mod", "stat": "initiative", "amount": "pb", "label": "+PB initiative"},
        _note("After rolling initiative, you can swap your initiative with a willing ally's."),
    ],
    "Crafter": [_note("Proficiency with three Artisan's Tools; 20% discount on nonmagical purchases; craft faster on a long rest.")],
    "Healer": [
        _action("Healer's Kit (Use)", "bonus", "When you have a Healer's Kit",
                "Spend one use as a Bonus Action to let a creature regain Hit Dice worth of hit points."),
        _note("Proficiency with a Healer's Kit; reroll a 1 on any healing die."),
    ],
    "Lucky": [
        {"kind": "resource", "key": "luck_points", "total": "pb", "recharge": "long", "label": "Luck Points"},
        _note("Spend a Luck Point for Advantage on a d20 Test, or to impose Disadvantage on an attack roll against you."),
    ],
    "Magic Initiate": [
        _spell_grant("group", cantrips=2, leveled=[{"level": 1, "count": 1}],
                     free_cast="long_rest", ability="choice", label="Magic Initiate"),
        _note("Choose Arcane, Divine, or Primal and a spellcasting ability. The 1st-level spell is castable once per long rest for free (or with a slot). Repeatable."),
    ],
    "Musician": [_note("Proficiency with three Musical Instruments; after a rest, grant Heroic Inspiration to allies who hear you (up to your proficiency bonus).")],
    "Savage Attacker": [_note("Once per turn, roll a weapon's damage dice twice and use either roll.")],
    "Skilled": [
        {"kind": "proficiency", "prof_type": "skill_or_tool", "count": 3, "label": "3 skills or tools"},
        _note("Repeatable for three more skills or tools."),
    ],
    "Tavern Brawler": [
        {"kind": "proficiency", "prof_type": "weapon", "items": ["Improvised weapons"]},
        {"kind": "attack_mod", "target": "unarmed", "dice": "1d4", "label": "Unarmed strike deals 1d4"},
        _note("Reroll a 1 on the unarmed die; push a target 5 ft with an Unarmed Strike."),
    ],
    "Tough": [_note("Your hit point maximum increases by 2 per level (applied automatically on the sheet).")],

    # ── General feats (level 4+; half-feats) ──
    "Ability Score Improvement": [_note("Increase one ability score by 2, or two by 1 each (max 20). Repeatable. Use the Ability Score step at level-up.")],
    "Actor": [_abil("charisma"), _note("Advantage on Deception/Performance to impersonate; mimic speech and sounds you've heard.")],
    "Athlete": [_abil_choice(["strength", "dexterity"]), _note("Stand from prone with 5 ft; climb without extra cost; running jump after moving 5 ft.")],
    "Charger": [_abil_choice(["strength", "dexterity"]), _note("Once per turn after moving 10 ft straight toward a target, add bonus damage to a melee attack or shove it 10 ft as part of a Dash.")],
    "Chef": [_abil_choice(["constitution", "wisdom"]), _note("Cook's utensils proficiency; cook food on a short rest to heal allies; bake treats granting temporary hit points.")],
    "Crossbow Expert": [_abil("dexterity"), _note("Ignore the Loading property of crossbows; no disadvantage on ranged attacks within 5 ft; fire a hand crossbow as part of the Attack action's extra attack.")],
    "Crusher": [_abil_choice(["strength", "constitution"]), _note("Once per turn, move a creature 5 ft when you deal bludgeoning damage; a bludgeoning crit gives attackers advantage against it.")],
    "Defensive Duelist": [
        _abil("dexterity"),
        _action("Defensive Parry", "reaction", "When hit by a melee attack while wielding a Finesse weapon",
                "Add your proficiency bonus to your AC against that attack."),
    ],
    "Dual Wielder": [_abil_choice(["strength", "dexterity"]), {"kind": "ac_mod", "amount": 1, "condition": "two_melee_weapons", "label": "+1 AC (dual-wielding)"}, _note("Two-weapon fighting with non-Light weapons; draw/stow two weapons at once.")],
    "Durable": [_abil("constitution"), _note("Spend Hit Dice to heal during any rest; regain at least twice your CON modifier when you roll Hit Dice.")],
    "Elemental Adept": [_abil_choice(["intelligence", "wisdom", "charisma"]), _note("Choose a damage type: your spells ignore resistance to it and treat 1s on its damage dice as 2s. Repeatable.")],
    "Fey Touched": [
        _abil_choice(["intelligence", "wisdom", "charisma"]),
        _spell_grant("school", leveled=[{"level": 1, "count": 1, "school": ["Divination", "Enchantment"]}],
                     fixed=[{"name": "Misty Step", "level": 2}], free_cast="long_rest", ability="none", label="Fey Touched"),
        _note("Misty Step and the chosen spell are each castable once per long rest for free, or with a spell slot."),
    ],
    "Grappler": [_abil_choice(["strength", "dexterity"]), _note("Advantage on attacks vs creatures you're Grappling; move a grappled creature with you; a free Unarmed Strike to grapple after an attack.")],
    "Great Weapon Master": [
        _abil("strength"),
        _action("Cleave (Bonus Attack)", "bonus", "When you score a crit or drop a creature to 0 HP with a melee weapon",
                "Make one melee weapon attack as a bonus action."),
        _note("Add your proficiency bonus to a Heavy weapon's damage when you take the Attack action."),
    ],
    "Heavily Armored": [_abil_choice(["strength", "constitution"]), {"kind": "proficiency", "prof_type": "armor", "items": ["Heavy"]}],
    "Heavy Armor Master": [_abil_choice(["strength", "constitution"]), _note("While wearing Heavy armor, reduce bludgeoning/piercing/slashing damage taken by your proficiency bonus.")],
    "Inspiring Leader": [_abil_choice(["wisdom", "charisma"]), _note("As a Magic action, grant up to six creatures temporary hit points equal to your level + the chosen ability modifier.")],
    "Keen Mind": [
        _abil("intelligence"),
        {"kind": "proficiency", "prof_type": "skill_or_tool", "count": 1, "label": "1 skill or tool"},
        _note("Always know north and time to sunrise/sunset; perfectly recall the last month.")],
    "Lightly Armored": [_abil_choice(["strength", "dexterity"]), {"kind": "proficiency", "prof_type": "armor", "items": ["Light"]}],
    "Mage Slayer": [
        _abil_choice(["strength", "dexterity", "constitution"]),
        _action("Mage Slayer Strike", "reaction", "When a creature within 5 ft casts a spell",
                "Make a melee weapon attack against it."),
        _note("Impose disadvantage on concentration saves you cause.")],
    "Martial Weapon Training": [_abil_choice(["strength", "dexterity"]), {"kind": "proficiency", "prof_type": "weapon", "items": ["Martial weapons"]}],
    "Medium Armor Master": [_abil_choice(["strength", "dexterity"]), {"kind": "ac_mod", "condition": "medium_armor_dex_cap", "dex_cap": 3, "label": "+3 DEX cap (medium armor)"}, _note("Medium armor doesn't impose disadvantage on Stealth.")],
    "Mobile": [_abil_choice(["strength", "dexterity"]), {"kind": "stat_mod", "stat": "speed", "amount": 10, "label": "+10 speed"}, _note("Dashing ignores difficult terrain; a melee attack denies that creature's opportunity attacks against you this turn.")],
    "Moderately Armored": [_abil_choice(["strength", "dexterity"]), {"kind": "proficiency", "prof_type": "armor", "items": ["Medium", "Shields"]}],
    "Mounted Combatant": [_abil_choice(["strength", "dexterity", "wisdom"]), _note("Advantage vs creatures smaller than your mount; redirect attacks from mount to you; mount avoids damage on DEX saves.")],
    "Observant": [_abil_choice(["intelligence", "wisdom"]), _note("Read lips; proficiency in Insight or Investigation; take the Search action as a Bonus Action.")],
    "Piercer": [_abil_choice(["strength", "dexterity"]), _note("Once per turn, reroll one piercing damage die; a piercing crit rolls one extra damage die.")],
    "Poisoner": [_abil_choice(["dexterity", "intelligence"]), _note("Your poison damage ignores resistance; apply potent poison as a Bonus Action; poisoner's kit proficiency.")],
    "Polearm Master": [
        _abil_choice(["strength", "dexterity"]),
        _action("Polearm Butt (Bonus Attack)", "bonus", "When you Attack with a glaive, halberd, quarterstaff, or spear",
                "Make a bonus-action attack with the opposite end (1d4 bludgeoning)."),
        _note("Creatures provoke an opportunity attack when they enter your reach.")],
    "Resilient": [_abil_choice(_ALL_ABILITIES), {"kind": "proficiency", "prof_type": "saving_throw", "from_ability_choice": True}, _note("Gain saving-throw proficiency in the chosen ability. Repeatable.")],
    "Ritual Caster": [
        _abil_choice(["intelligence", "wisdom", "charisma"]),
        _spell_grant("class", leveled=[{"level": 1, "count": 2, "ritual": True}],
                     free_cast=None, ability="none", label="Ritual Caster"),
        _note("Cast these as rituals only (10 minutes longer, no spell slot). You can add more ritual spells you find to the book."),
    ],
    "Sentinel": [
        _abil_choice(["strength", "dexterity"]),
        _action("Sentinel Strike", "reaction", "When a creature within 5 ft attacks a target other than you",
                "Make a melee weapon attack against the attacker."),
        _note("Opportunity-attack hits reduce speed to 0; creatures provoke even when they Disengage.")],
    "Shadow Touched": [
        _abil_choice(["intelligence", "wisdom", "charisma"]),
        _spell_grant("school", leveled=[{"level": 1, "count": 1, "school": ["Illusion", "Necromancy"]}],
                     fixed=[{"name": "Invisibility", "level": 2}], free_cast="long_rest", ability="none", label="Shadow Touched"),
        _note("Invisibility and the chosen spell are each castable once per long rest for free, or with a spell slot."),
    ],
    "Sharpshooter": [_abil("dexterity"), _note("Long range imposes no disadvantage; ignore half and three-quarters cover; add your proficiency bonus to a ranged weapon's damage on the Attack action.")],
    "Shield Master": [
        _abil("strength"),
        _action("Shield Shove (Bonus)", "bonus", "When you wield a shield and take the Attack action",
                "Use a bonus action to shove a creature within 5 ft."),
        _note("Add your shield's AC to DEX saves vs single-target effects; take no damage on a successful DEX save.")],
    "Skill Expert": [
        _abil_choice(_ALL_ABILITIES),
        {"kind": "proficiency", "prof_type": "skill", "count": 1, "label": "1 skill"},
        {"kind": "expertise", "count": 1, "label": "1 skill for Expertise"}],
    "Skulker": [_abil("dexterity"), _note("Hide as a Bonus Action while lightly obscured; missing a ranged attack doesn't reveal you; Blindsight 10 ft in darkness.")],
    "Slasher": [_abil_choice(["strength", "dexterity"]), _note("Once per turn, reduce a creature's speed by 10 ft on slashing damage; a slashing crit gives it disadvantage on attacks.")],
    "Speedy": [_abil_choice(["strength", "dexterity"]), {"kind": "stat_mod", "stat": "speed", "amount": 10, "label": "+10 speed"}, _note("Dashing ignores difficult terrain; no opportunity attacks from creatures you've damaged this turn.")],
    "Spell Sniper": [
        _abil_choice(["intelligence", "wisdom", "charisma"]),
        # ability='none': the +1 above already sets the casting ability, so the picker doesn't re-ask.
        _spell_grant("group", cantrips=1, ability="none", label="Spell Sniper"),
        _note("Spell attacks ignore half and three-quarters cover. Choose a cantrip that requires an attack roll, cast with the ability you increased."),
    ],
    "Telekinetic": [
        _abil_choice(["intelligence", "wisdom", "charisma"]),
        _spell_grant("fixed", fixed=[{"name": "Mage Hand", "level": 0}], ability="none", label="Telekinetic"),
        _action("Telekinetic Shove", "bonus", "Telekinetic",
                "Shove one creature you can see within 30 ft 5 feet toward or away from you (Strength save vs your spell save DC)."),
        _note("You can cast Mage Hand without components, and its spectral hand is invisible."),
    ],
    "Telepathic": [
        _abil_choice(["intelligence", "wisdom", "charisma"]),
        _spell_grant("fixed", fixed=[{"name": "Detect Thoughts", "level": 2}],
                     free_cast="long_rest", ability="none", label="Telepathic"),
        _note("Speak telepathically to any creature you can see within 60 ft."),
    ],
    "War Caster": [
        _abil_choice(["intelligence", "wisdom", "charisma"]),
        _action("War Caster Spell (Reaction)", "reaction", "When a creature provokes an opportunity attack from you",
                "Cast a single-target spell at it instead of making a weapon attack."),
        _note("Advantage on concentration saves; perform somatic components while holding weapons or a shield.")],

    # ── Fighting Style feats (no ASI; mostly passive combat riders) ──
    "Archery": [_note("+2 bonus to attack rolls with ranged weapons.")],
    "Blind Fighting": [_note("Blindsight 10 ft — see anything not behind total cover even while blinded or in darkness.")],
    "Defense": [{"kind": "ac_mod", "amount": 1, "condition": "armor", "label": "+1 AC (in armor)"}],
    "Dueling": [_note("+2 bonus to damage rolls with a one-handed melee weapon when wielding no other weapon.")],
    "Great Weapon Fighting": [_note("Treat a 1 or 2 on a two-handed melee weapon's damage die as a 3.")],
    "Interception": [
        _action("Interception", "reaction", "When a creature you can see hits another within 5 ft of you",
                "Reduce the damage by 1d10 + your proficiency bonus.")],
    "Protection": [
        _action("Protection", "reaction", "When a creature you can see attacks a target other than you within 5 ft (you're wielding a shield)",
                "Impose disadvantage on the attack roll.")],
    "Thrown Weapon Fighting": [_note("Draw a thrown weapon as part of the attack; +2 to damage rolls with thrown weapons.")],
    "Two-Weapon Fighting": [_note("Add your ability modifier to the damage of the second attack when two-weapon fighting.")],
    "Unarmed Fighting": [
        {"kind": "attack_mod", "target": "unarmed", "dice": "1d6", "label": "Unarmed strike deals 1d6"},
        _note("1d8 with no weapon or shield; deal 1d4 to a creature you're grappling at the start of your turns.")],

    # ── Epic Boon feats (level 19+; ability scores can exceed 20 — left as notes) ──
    "Boon of Combat Prowess": [_note("Increase one ability score by 1 (max 30). When you miss a creature you can see, you can choose to hit instead (once per turn).")],
    "Boon of Dimensional Travel": [_note("Increase one ability score by 1 (max 30). After the Attack or Magic action, teleport up to 30 ft.")],
    "Boon of Energy Resistance": [_note("Increase one ability score by 1 (max 30). Resistance to two damage types; reaction to gain resistance to one instance.")],
    "Boon of Fate": [_note("Increase one ability score by 1 (max 30). Roll a Fate die (d10) to add/subtract on a nearby creature's d20 Test, once per rest.")],
    "Boon of Irresistible Offense": [_note("Increase Strength or Dexterity by 1 (max 30). Your B/P/S damage ignores resistance; a natural 20 adds extra damage equal to the score.")],
    "Boon of Recovery": [_note("Increase one ability score by 1 (max 30). React to roll half your Hit Dice and regain that many HP; drop to 1 instead of 0.")],
    "Boon of Skill": [_note("Increase one ability score by 1 (max 30). Proficiency in all skills; Expertise in two.")],
    "Boon of Spell Recall": [_note("Increase your spellcasting ability by 1 (max 30). Cast a 1st–4th-level spell without a slot once per turn.")],
    "Boon of the Night Spirit": [_note("Increase one ability score by 1 (max 30). In Dim Light/Darkness gain resistance to all but force/radiant/psychic; Hide as a Bonus Action; meld into shadow.")],
    "Boon of Truesight": [_note("Increase one ability score by 1 (max 30). Truesight 60 ft.")],
}


# ── 2014 PHB feats (edition "5e") ──────────────────────────────────────────────
# Each: (name, description, prerequisite_text, repeatable)
FEATS_5E = [
    ("Alert", "Always on the lookout for danger, you gain a +5 bonus to initiative, can't be surprised while conscious, and attackers that you can see don't gain advantage on attack rolls against you from being hidden.", None, False),
    ("Athlete", "You gain a +1 increase to Strength or Dexterity. When prone, standing up uses only 5 feet of movement. Climbing doesn't cost extra movement, and you can make a running long or high jump after moving only 5 feet on foot.", None, False),
    ("Actor", "You gain a +1 increase to Charisma, advantage on Deception and Performance checks when trying to pass yourself off as a different person, and you can mimic the speech of another person or the sounds of creatures you've heard.", None, False),
    ("Charger", "When you Dash and then make a melee attack or shove in the same turn after moving at least 10 feet straight toward the target, you gain a +5 bonus to the attack's damage (or push the target 10 feet).", None, False),
    ("Crossbow Expert", "You ignore the loading quality of crossbows you're proficient with, being within 5 feet of a hostile creature doesn't impose disadvantage on your ranged attacks, and you can make a hand-crossbow attack as a bonus action after a one-handed attack.", None, False),
    ("Defensive Duelist", "When you're wielding a finesse weapon you're proficient with and another creature hits you with a melee attack, you can use your reaction to add your proficiency bonus to your AC for that attack, potentially causing it to miss.", "Dexterity 13 or higher", False),
    ("Dual Wielder", "You gain a +1 bonus to AC while wielding a separate melee weapon in each hand, you can use two-weapon fighting even with non-light weapons, and you can draw or stow two one-handed weapons when you would normally only draw or stow one.", None, False),
    ("Dungeon Delver", "You gain advantage on Perception and Investigation checks to detect secret doors, advantage on saves against traps, resistance to trap damage, and you can search for traps at a normal pace while traveling.", None, False),
    ("Durable", "You gain a +1 increase to Constitution, and when you roll Hit Dice to regain hit points, the minimum number you regain equals twice your Constitution modifier (minimum of 2).", None, False),
    ("Elemental Adept", "Choose one damage type: acid, cold, fire, lightning, or thunder. Spells you cast ignore resistance to that damage type, and when you roll damage of that type you treat any 1 on a damage die as a 2. You can take this feat multiple times for a different damage type.", "The ability to cast at least one spell", True),
    ("Grappler", "You have advantage on attack rolls against a creature you're grappling, and you can use your action to try to pin a creature grappled by you, restraining both of you until the grapple ends.", "Strength 13 or higher", False),
    ("Great Weapon Master", "On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee attack as a bonus action. Before a melee attack with a heavy weapon you're proficient with, you can take a -5 penalty to the attack roll for +10 damage.", None, False),
    ("Heavily Armored", "You gain a +1 increase to Strength and proficiency with heavy armor.", "Proficiency with medium armor", False),
    ("Heavy Armor Master", "You gain a +1 increase to Strength, and while wearing heavy armor, bludgeoning, piercing, and slashing damage from nonmagical attacks is reduced by 3.", "Proficiency with heavy armor", False),
    ("Inspiring Leader", "You can spend 10 minutes inspiring your companions; choose up to six friendly creatures (including yourself) within 30 feet who can understand you. Each gains temporary hit points equal to your level plus your Charisma modifier.", "Charisma 13 or higher", False),
    ("Keen Mind", "You gain a +1 increase to Intelligence, always know which way is north, always know the number of hours left before sunrise or sunset, and can accurately recall anything you've seen or heard within the past month.", None, False),
    ("Lightly Armored", "You gain a +1 increase to Strength or Dexterity and proficiency with light armor.", None, False),
    ("Linguist", "You gain a +1 increase to Intelligence, learn three languages of your choice, and can create written ciphers that others can't decipher without a hard Intelligence check or magic.", None, False),
    ("Lucky", "You have 3 luck points. Whenever you make an attack roll, ability check, or saving throw, you can spend one luck point to roll an additional d20 and choose which to use. You can also use a luck point to roll a d20 when an attacker rolls against you. You regain expended luck points on a long rest.", None, False),
    ("Mage Slayer", "When a creature within 5 feet of you casts a spell, you can use your reaction to make a melee attack against it. You impose disadvantage on a creature's concentration save when you damage it, and you have advantage on saving throws against spells cast by creatures within 5 feet of you.", None, False),
    ("Magic Initiate", "Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You learn two cantrips and one 1st-level spell from that class's spell list, which you can cast once per long rest (or with a spell slot). You can take this feat multiple times for a different class.", None, True),
    ("Martial Adept", "You learn two maneuvers from the Battle Master archetype and gain one superiority die (a d6) to fuel them, which you regain on a short or long rest.", None, False),
    ("Medium Armor Master", "While wearing medium armor it doesn't impose disadvantage on Stealth checks, and you can add 3 (instead of 2) to your AC from Dexterity if your Dexterity is 16 or higher.", "Proficiency with medium armor", False),
    ("Mobile", "Your speed increases by 10 feet, difficult terrain doesn't cost extra movement when you Dash, and when you make a melee attack against a creature it can't make opportunity attacks against you for the rest of the turn.", None, False),
    ("Moderately Armored", "You gain a +1 increase to Strength or Dexterity and proficiency with medium armor and shields.", "Proficiency with light armor", False),
    ("Mounted Combatant", "While mounted you have advantage on melee attacks against unmounted creatures smaller than your mount, you can force an attack targeting your mount to target you instead, and your mount takes no damage on successful Dexterity saves (half on failure).", None, False),
    ("Observant", "You gain a +1 increase to Intelligence or Wisdom, can read lips, and gain a +5 bonus to passive Perception and passive Investigation.", None, False),
    ("Polearm Master", "When wielding a glaive, halberd, quarterstaff, or spear you can make a bonus-action attack with the weapon's opposite end (1d4 bludgeoning), and creatures provoke an opportunity attack when they enter your reach.", None, False),
    ("Resilient", "Choose one ability score to increase by 1. You also gain proficiency in saving throws using that ability. You can take this feat multiple times for a different ability.", None, True),
    ("Ritual Caster", "Choose a spellcasting class. You acquire a ritual book holding two 1st-level ritual spells from that class's list and can cast them as rituals. You can add more ritual spells you find to the book.", "Intelligence or Wisdom 13 or higher", False),
    ("Savage Attacker", "Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon's damage dice and use either total.", None, False),
    ("Sentinel", "When you hit a creature with an opportunity attack its speed becomes 0 for the turn, creatures provoke opportunity attacks even if they Disengage, and you can use your reaction to attack a creature within 5 feet that attacks a target other than you.", None, False),
    ("Sharpshooter", "Attacking at long range doesn't impose disadvantage, your ranged attacks ignore half and three-quarters cover, and before a ranged attack with a weapon you're proficient with you can take a -5 penalty to the attack roll for +10 damage.", None, False),
    ("Shield Master", "If you take the Attack action you can use a bonus action to shove with your shield, you can add your shield's AC bonus to Dexterity saves against effects targeting only you, and you can use your reaction to take no damage on a successful Dexterity save (instead of half).", None, False),
    ("Skilled", "You gain proficiency in any combination of three skills or tools of your choice. You can take this feat multiple times.", None, True),
    ("Skulker", "You can hide when lightly obscured, missing with a ranged attack doesn't reveal your position, and dim light doesn't impose disadvantage on your Perception checks relying on sight.", "Dexterity 13 or higher", False),
    ("Spell Sniper", "When you cast a spell that requires an attack roll its range is doubled, your ranged spell attacks ignore half and three-quarters cover, and you learn one attack cantrip from a spell list of your choice.", "The ability to cast at least one spell", False),
    ("Tavern Brawler", "You gain a +1 increase to Strength or Constitution, proficiency with improvised weapons, your unarmed strike deals 1d4 damage, and when you hit with an unarmed strike or improvised weapon you can use a bonus action to grapple the target.", None, False),
    ("Tough", "Your hit point maximum increases by an amount equal to twice your level, and increases by 2 each time you gain a level thereafter.", None, False),
    ("War Caster", "You have advantage on Constitution saves to maintain concentration, you can perform somatic components even with weapons or a shield in your hands, and you can cast a spell (targeting one creature) as an opportunity attack instead of a weapon attack.", "The ability to cast at least one spell", False),
    ("Weapon Master", "You gain a +1 increase to Strength or Dexterity and proficiency with four weapons of your choice.", None, False),
]

# ── 2024 PHB feats (edition "5.5e") ────────────────────────────────────────────
# Categories are noted in the description prefix.
FEATS_2024 = [
    # Origin feats (gained at 1st level from background)
    ("Alert", "Origin feat. You gain Initiative Proficiency (add your proficiency bonus to initiative) and Initiative Swap (you can swap your initiative with a willing ally's after rolling).", None, False),
    ("Crafter", "Origin feat. You gain tool proficiency with three Artisan's Tools, a 20% discount on nonmagical items you buy, and the ability to craft certain items faster during a long rest.", None, False),
    ("Healer", "Origin feat. You gain proficiency with a Healer's Kit; as an action you can spend one use to restore Hit Dice worth of hit points to a creature, and you can reroll a 1 on any healing die.", None, False),
    ("Lucky", "Origin feat. You have Luck Points equal to your proficiency bonus (regained on a long rest). You can spend a point for Advantage on a d20 Test, or to impose Disadvantage on an attack roll against you.", None, False),
    ("Magic Initiate", "Origin feat. Choose Arcane, Divine, or Primal. You learn two cantrips and a 1st-level spell (castable once per long rest for free, or with slots) from that list, using a chosen spellcasting ability. Repeatable for a different list.", None, True),
    ("Musician", "Origin feat. You gain proficiency with three Musical Instruments, and after a short or long rest you can play music to grant Heroic Inspiration to allies (up to your proficiency bonus) who hear you.", None, False),
    ("Savage Attacker", "Origin feat. Once per turn when you hit with a weapon, you can roll the weapon's damage dice twice and use either roll.", None, False),
    ("Skilled", "Origin feat. You gain proficiency in any combination of three skills or tools of your choice. Repeatable.", None, True),
    ("Tavern Brawler", "Origin feat. You gain Improvised Proficiency, your Unarmed Strike deals 1d4 damage, you can reroll a 1 on that die, you can push a target 5 feet with an Unarmed Strike, and you gain proficiency with improvised weapons.", None, False),
    ("Tough", "Origin feat. Your hit point maximum increases by twice your level, and by 2 each time you gain a level thereafter.", None, False),
    # General feats (gained at 4th level and beyond via Ability Score Improvement; require level 4+)
    ("Ability Score Improvement", "General feat. Increase one ability score by 2, or two ability scores by 1 each, to a maximum of 20. Repeatable.", "Level 4+", True),
    ("Actor", "General feat. Increase Charisma by 1 (max 20). You have advantage on Deception and Performance checks to impersonate someone, and can mimic speech or sounds you've heard.", "Level 4+, Charisma 13+", False),
    ("Athlete", "General feat. Increase Strength or Dexterity by 1 (max 20). Standing from prone costs only 5 feet, you can climb without extra cost, and can make a running jump after moving 5 feet.", "Level 4+, Strength or Dexterity 13+", False),
    ("Charger", "General feat. Increase Strength or Dexterity by 1. Once per turn after moving 10 feet straight toward a target you can add bonus damage to a melee attack, or shove it 10 feet, as part of the same Dash.", "Level 4+", False),
    ("Chef", "General feat. Increase Constitution or Wisdom by 1. You gain cook's utensils proficiency, can prepare food during a short rest to heal allies, and can bake treats that grant temporary hit points.", "Level 4+", False),
    ("Crossbow Expert", "General feat. Increase Dexterity by 1. You ignore the Loading property of crossbows, ignore the disadvantage from being within 5 feet of an enemy on ranged attacks, and can fire a hand crossbow as part of the Attack action's extra attack.", "Level 4+, Dexterity 13+", False),
    ("Crusher", "General feat. Increase Strength or Constitution by 1. Once per turn when you deal bludgeoning damage you can move the target 5 feet, and scoring a crit with bludgeoning gives attackers advantage against it until your next turn.", "Level 4+", False),
    ("Defensive Duelist", "General feat. Increase Dexterity by 1. When hit by a melee attack while wielding a Finesse weapon, you can use your reaction to add your proficiency bonus to your AC against that attack.", "Level 4+, Dexterity 13+", False),
    ("Dual Wielder", "General feat. Increase Strength or Dexterity by 1. You gain a +1 bonus to AC while wielding two melee weapons, can use non-Light weapons for two-weapon fighting, and draw or stow two weapons at once.", "Level 4+", False),
    ("Durable", "General feat. Increase Constitution by 1. You can spend Hit Dice to heal during any rest, and when you roll Hit Dice you regain a minimum equal to twice your Constitution modifier.", "Level 4+", False),
    ("Elemental Adept", "General feat. Increase Intelligence, Wisdom, or Charisma by 1. Choose acid, cold, fire, lightning, or thunder: your spells ignore resistance to it and treat damage-die 1s as 2s. Repeatable.", "Level 4+, spellcasting or pact magic", True),
    ("Fey Touched", "General feat. Increase Intelligence, Wisdom, or Charisma by 1. You learn Misty Step and one 1st-level divination or enchantment spell, castable once per long rest for free or with slots.", "Level 4+", False),
    ("Grappler", "General feat. Increase Strength or Dexterity by 1. You have advantage on attacks against creatures you're Grappling, can move a grappled creature with you without extra cost, and can use a free Unarmed Strike to grapple after an attack.", "Level 4+, Strength or Dexterity 13+", False),
    ("Great Weapon Master", "General feat. Increase Strength by 1. On a crit or reducing a creature to 0 HP with a melee weapon you can make a bonus-action attack, and you can add your proficiency bonus to a Heavy weapon's damage when you take the Attack action.", "Level 4+, Strength 13+", False),
    ("Heavily Armored", "General feat. Increase Strength or Constitution by 1, and gain training (proficiency) with Heavy armor.", "Level 4+, Medium armor training", False),
    ("Heavy Armor Master", "General feat. Increase Strength or Constitution by 1. While wearing Heavy armor, bludgeoning, piercing, and slashing damage you take is reduced by an amount equal to your proficiency bonus.", "Level 4+, Heavy armor training", False),
    ("Inspiring Leader", "General feat. Increase Wisdom or Charisma by 1. As a Magic action you can give up to six creatures temporary hit points equal to your level plus the chosen ability modifier.", "Level 4+", False),
    ("Keen Mind", "General feat. Increase Intelligence by 1. You always know which way is north and hours until sunrise/sunset, can perfectly recall the last month, and gain proficiency in a chosen skill or tool.", "Level 4+, Intelligence 13+", False),
    ("Lightly Armored", "General feat. Increase Strength or Dexterity by 1, and gain training (proficiency) with Light armor.", "Level 4+", False),
    ("Mage Slayer", "General feat. Increase Strength, Dexterity, or Constitution by 1. When you damage a concentrating creature it has disadvantage on the save, and you can use a reaction to attack a creature within 5 feet that casts a spell.", "Level 4+", False),
    ("Martial Weapon Training", "General feat. Increase Strength or Dexterity by 1, and gain proficiency with Martial weapons.", "Level 4+", False),
    ("Medium Armor Master", "General feat. Increase Strength or Dexterity by 1. Wearing Medium armor doesn't impose disadvantage on Stealth, and you can add 3 (instead of 2) of your Dexterity bonus to AC.", "Level 4+, Medium armor training", False),
    ("Mobile", "General feat. Increase Strength or Dexterity by 1. Your speed increases by 10 feet, Dashing ignores difficult terrain, and making a melee attack against a creature prevents its opportunity attacks against you that turn.", "Level 4+", False),
    ("Moderately Armored", "General feat. Increase Strength or Dexterity by 1, and gain training (proficiency) with Medium armor and Shields.", "Level 4+, Light armor training", False),
    ("Mounted Combatant", "General feat. Increase Strength, Dexterity, or Wisdom by 1. While mounted you have advantage against creatures smaller than your mount, can redirect attacks on your mount to yourself, and your mount avoids damage on Dexterity saves.", "Level 4+", False),
    ("Observant", "General feat. Increase Intelligence or Wisdom by 1. You can read lips, gain proficiency in Insight or Investigation, and can use a Search action as a bonus action.", "Level 4+, Intelligence or Wisdom 13+", False),
    ("Piercer", "General feat. Increase Strength or Dexterity by 1. Once per turn you can reroll one piercing damage die, and a crit with a piercing attack lets you roll one additional damage die.", "Level 4+", False),
    ("Poisoner", "General feat. Increase Dexterity or Intelligence by 1. Your poison damage ignores resistance, and you can apply potent poison to weapons/ammunition as a bonus action; you also learn to craft it with poisoner's kit proficiency.", "Level 4+", False),
    ("Polearm Master", "General feat. Increase Strength or Dexterity by 1. With a glaive, halberd, quarterstaff, or spear you can make a bonus-action butt-end attack (1d4), and creatures entering your reach provoke an opportunity attack.", "Level 4+", False),
    ("Resilient", "General feat. Increase one ability score by 1 and gain saving-throw proficiency with that ability. Repeatable for a different ability.", "Level 4+", True),
    ("Ritual Caster", "General feat. Increase Intelligence, Wisdom, or Charisma by 1. You gain a ritual book with two 1st-level ritual spells and can add more ritual spells you find.", "Level 4+", False),
    ("Sentinel", "General feat. Increase Strength or Dexterity by 1. A creature hit by your opportunity attack has speed 0 that turn, creatures provoke even when Disengaging, and you can react to attack a creature that attacks an ally near you.", "Level 4+", False),
    ("Shadow Touched", "General feat. Increase Intelligence, Wisdom, or Charisma by 1. You learn Invisibility and one 1st-level illusion or necromancy spell, castable once per long rest for free or with slots.", "Level 4+", False),
    ("Sharpshooter", "General feat. Increase Dexterity by 1. Long range doesn't impose disadvantage, your ranged weapon attacks ignore half and three-quarters cover, and you can add your proficiency bonus to a ranged weapon's damage when you take the Attack action.", "Level 4+, Dexterity 13+", False),
    ("Shield Master", "General feat. Increase Strength by 1. While wielding a shield you can shove as a bonus action, add the shield's AC to Dexterity saves against single-target effects, and avoid damage on a successful Dexterity save.", "Level 4+, Strength 13+", False),
    ("Skill Expert", "General feat. Increase one ability score by 1, gain proficiency in one skill, and gain Expertise in one skill you're proficient with.", "Level 4+", False),
    ("Skulker", "General feat. Increase Dexterity by 1. You can Hide as a bonus action while lightly obscured, missing a ranged attack doesn't reveal you, and you gain Blindsight 10 feet in darkness against creatures within range.", "Level 4+, Dexterity 13+", False),
    ("Slasher", "General feat. Increase Strength or Dexterity by 1. Once per turn dealing slashing damage reduces the target's speed by 10 feet, and a slashing crit gives the target disadvantage on attacks until your next turn.", "Level 4+", False),
    ("Speedy", "General feat. Increase Strength or Dexterity by 1. Your speed increases by 10 feet, Dashing ignores difficult terrain, and you don't provoke opportunity attacks from creatures you've damaged this turn.", "Level 4+", False),
    ("Spell Sniper", "General feat. Increase Intelligence, Wisdom, or Charisma by 1. Your spell attacks ignore half and three-quarters cover, and you learn one attack cantrip from a chosen spell list.", "Level 4+, spellcasting or pact magic", False),
    ("Telekinetic", "General feat. Increase Intelligence, Wisdom, or Charisma by 1. You learn Mage Hand (castable without components) and can shove a creature 5 feet as a bonus action with telekinesis.", "Level 4+", False),
    ("Telepathic", "General feat. Increase Intelligence, Wisdom, or Charisma by 1. You can speak telepathically to creatures within 60 feet and can cast Detect Thoughts once per long rest for free or with slots.", "Level 4+", False),
    ("War Caster", "General feat. Increase Intelligence, Wisdom, or Charisma by 1. You have advantage on concentration saves, can perform somatic components with weapons/shields in hand, and can cast a single-target spell as an opportunity attack.", "Level 4+, spellcasting or pact magic", False),
    # Fighting Style feats
    ("Archery", "Fighting Style feat. You gain a +2 bonus to attack rolls you make with ranged weapons.", "Level 4+ (or a Fighting Style feature)", False),
    ("Blind Fighting", "Fighting Style feat. You have Blindsight with a range of 10 feet, letting you see anything not behind total cover even if blinded or in darkness.", "Level 4+ (or a Fighting Style feature)", False),
    ("Defense", "Fighting Style feat. While you wear armor you gain a +1 bonus to Armor Class.", "Level 4+ (or a Fighting Style feature)", False),
    ("Dueling", "Fighting Style feat. When wielding a melee weapon in one hand and no other weapon, you gain a +2 bonus to damage rolls with that weapon.", "Level 4+ (or a Fighting Style feature)", False),
    ("Great Weapon Fighting", "Fighting Style feat. When you roll damage for a melee weapon wielded with two hands, you can treat a 1 or 2 on a damage die as a 3.", "Level 4+ (or a Fighting Style feature)", False),
    ("Interception", "Fighting Style feat. When a creature you can see hits another creature within 5 feet of you with an attack, you can use your reaction to reduce the damage by 1d10 plus your proficiency bonus.", "Level 4+ (or a Fighting Style feature)", False),
    ("Protection", "Fighting Style feat. When a creature you can see attacks a target other than you within 5 feet, you can use your reaction and a shield to impose disadvantage on the attack roll.", "Level 4+ (or a Fighting Style feature)", False),
    ("Thrown Weapon Fighting", "Fighting Style feat. You can draw a thrown weapon as part of the attack, and you gain a +2 bonus to damage rolls with thrown weapons.", "Level 4+ (or a Fighting Style feature)", False),
    ("Two-Weapon Fighting", "Fighting Style feat. When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.", "Level 4+ (or a Fighting Style feature)", False),
    ("Unarmed Fighting", "Fighting Style feat. Your Unarmed Strikes deal 1d6 (1d8 if you have no weapon or shield), and you can deal 1d4 damage to a creature you're grappling at the start of each of your turns.", "Level 4+ (or a Fighting Style feature)", False),
    # Epic Boon feats (level 19+)
    ("Boon of Combat Prowess", "Epic Boon feat. Increase one ability score by 1 (max 30). When you miss with an attack against a creature you can see, you can choose to hit instead, once on each of your turns.", "Level 19+", False),
    ("Boon of Dimensional Travel", "Epic Boon feat. Increase one ability score by 1 (max 30). Immediately after taking the Attack or Magic action you can teleport up to 30 feet to an unoccupied space you can see.", "Level 19+", False),
    ("Boon of Energy Resistance", "Epic Boon feat. Increase one ability score by 1 (max 30). You gain resistance to two damage types of your choice, and can use a reaction to gain resistance to one instance of one of those types.", "Level 19+", False),
    ("Boon of Fate", "Epic Boon feat. Increase one ability score by 1 (max 30). When a creature within 60 feet makes a d20 Test, you can roll a Fate die (d10) and add or subtract it, once per short or long rest.", "Level 19+", False),
    ("Boon of Irresistible Offense", "Epic Boon feat. Increase Strength or Dexterity by 1 (max 30). Your bludgeoning, piercing, and slashing damage ignores resistance, and a natural 20 on an attack adds extra damage equal to the ability score.", "Level 19+", False),
    ("Boon of Recovery", "Epic Boon feat. Increase one ability score by 1 (max 30). When you take damage you can use a reaction to roll half your Hit Dice and regain that many hit points; if reduced to 0 you can instead drop to 1.", "Level 19+", False),
    ("Boon of Skill", "Epic Boon feat. Increase one ability score by 1 (max 30). You gain proficiency in all skills and gain Expertise in two skills of your choice.", "Level 19+", False),
    ("Boon of Spell Recall", "Epic Boon feat. Increase your spellcasting ability by 1 (max 30). You can cast your 1st- through 4th-level spells without expending spell slots once per turn, but only one such spell per turn.", "Level 19+, spellcasting", False),
    ("Boon of the Night Spirit", "Epic Boon feat. Increase one ability score by 1 (max 30). While in Dim Light or Darkness you gain resistance to all damage except force, radiant, and psychic, can Hide as a bonus action, and meld into shadow.", "Level 19+", False),
    ("Boon of Truesight", "Epic Boon feat. Increase one ability score by 1 (max 30). You have Truesight with a range of 60 feet.", "Level 19+", False),
]


def _seed_list(db, feats, edition, source, effects_map=None):
    effects_map = effects_map or {}
    created, skipped, updated = 0, 0, 0
    for name, description, prereq_text, repeatable in feats:
        effects = effects_map.get(name)
        existing = (
            db.query(Feat)
            .filter(
                Feat.name == name,
                Feat.edition == edition,
                Feat.owner_type == OwnerType.system,
            )
            .first()
        )
        if existing:
            # Backfill structured effects onto an already-seeded feat (idempotent).
            if effects is not None and existing.effects != effects:
                existing.effects = effects
                updated += 1
            else:
                skipped += 1
            continue
        db.add(
            Feat(
                name=name,
                edition=edition,
                description=description,
                prerequisites=_prereq(prereq_text),
                benefits={},
                repeatable=repeatable,
                source=source,
                effects=effects,
                owner_type=OwnerType.system,
                owner_id=None,
            )
        )
        created += 1
    db.commit()
    print(f"  {edition}: created {created}, updated {updated} (effects), skipped {skipped}")


def seed_feats():
    db = SessionLocal()
    try:
        print("Seeding feats...")
        _seed_list(db, FEATS_5E, "5e", "PHB 2014", FEAT_EFFECTS_5E)
        _seed_list(db, FEATS_2024, "5.5e", "PHB 2024", FEAT_EFFECTS_2024)
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_feats()
