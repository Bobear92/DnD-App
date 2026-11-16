"""Seed PHB spells the D&D 5e API doesn't expose.

The API behind seed_spells.py is SRD-only, and the SRD omits two PHB cantrips —
Blade Ward and Friends — so they were missing from the compendium entirely and any
character who knew one saw an empty spell-detail dialog.

This is the same curated-in-script approach seed_items.py uses for potions and
food/drink. Where a spell's 2024 text genuinely differs from its 2014 text, both
editions are seeded as separate rows (the spells table is keyed on name + edition +
owner scope). A spell with no 5.5e row here falls back to its 5e text for 2024
campaigns — see get_all_spells in shared/encyclopedia/spells/service.py.

UPSERTS (deploy ticket T5b): a spell already seeded with the same name + edition is brought in
line with this file, so a text fix here reaches existing databases. Only system rows are touched
(shared/seeding.py). Safe to re-run.
"""
from collections import Counter

from shared.database import SessionLocal
from shared.encyclopedia.spells.models import Spell
from shared.seeding import upsert_system_row, summary

CASTER_CANTRIP_CLASSES = "Bard, Sorcerer, Warlock, Wizard"

PHB_SPELLS = [
    {
        "name": "Blade Ward",
        "edition": "5e",
        "level": 0,
        "school": "Abjuration",
        "casting_time": "1 action",
        "range": "Self",
        "components": "V, S",
        "duration": "1 round",
        "description": (
            "You extend your hand and trace a sigil of warding in the air. Until the end "
            "of your next turn, you have resistance against bludgeoning, piercing, and "
            "slashing damage dealt by weapon attacks."
        ),
        "concentration": False,
        "classes": CASTER_CANTRIP_CLASSES,
    },
    {
        "name": "Blade Ward",
        "edition": "5.5e",
        "level": 0,
        "school": "Abjuration",
        "casting_time": "Action",
        "range": "Self",
        "components": "V, S",
        "duration": "Concentration, up to 1 minute",
        "description": (
            "Whenever a creature makes an attack roll against you before the spell ends, "
            "the attacker subtracts 1d4 from the attack roll."
        ),
        "concentration": True,
        "classes": CASTER_CANTRIP_CLASSES,
    },
    {
        "name": "Friends",
        "edition": "5e",
        "level": 0,
        "school": "Enchantment",
        "casting_time": "1 action",
        "range": "Self",
        "components": "S, M (a small amount of makeup applied to the face as this spell is cast)",
        "duration": "Concentration, up to 1 minute",
        "description": (
            "For the duration, you have advantage on all Charisma checks directed at one "
            "creature of your choice that isn't hostile toward you. When the spell ends, "
            "the creature realizes that you used magic to influence its mood and becomes "
            "hostile toward you. A creature prone to violence might attack you. Another "
            "creature might seek retribution in other ways (at the DM's discretion), "
            "depending on the nature of your interaction with it."
        ),
        "concentration": True,
        "classes": CASTER_CANTRIP_CLASSES,
    },
]


def seed_phb_spells():
    db = SessionLocal()
    counts = Counter()
    try:
        for data in PHB_SPELLS:
            match = {"name": data["name"], "edition": data["edition"]}
            values = {k: v for k, v in data.items() if k not in match}
            values.setdefault("higher_level", None)
            values.setdefault("ritual", False)
            _, status = upsert_system_row(db, Spell, match, values)
            counts[status] += 1
            print(f"  {status:9} {data['name']} ({data['edition']})")

        db.commit()
        print(f"\nDone. PHB spells: {summary(counts)}.")
        return counts
    finally:
        db.close()


if __name__ == "__main__":
    seed_phb_spells()
