"""
Seed script: tags the Artificer spell list onto existing system spells.

The D&D 5e API (SRD-only) does not tag any spell with the Artificer class
(Artificer is a Tasha's Cauldron of Everything class outside the SRD), so after
seed_spells.py no spell has "Artificer" in its `classes` field. This left the
character sheet's "Prepare Spells" browser empty for Artificers at every level.

This script appends "Artificer" to the `classes` field of each system spell on
the Artificer spell list (levels 1-5; Artificer is a half-caster capping at 5th
level). Names use the SRD form (e.g. "Faithful Hound", "Arcane Hand"). Spells
not present in the SRD compendium are reported and skipped. Idempotent — running
again is a no-op for already-tagged spells.

Run: python seed_artificer_spells.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from shared.database import SessionLocal
from shared.encyclopedia.spells.models import Spell
from shared.enums import OwnerType

# Artificer spell list (TCoE), levels 1-5, using SRD spell names.
ARTIFICER_SPELLS = [
    # Level 1
    "Absorb Elements", "Alarm", "Catapult", "Cure Wounds", "Detect Magic",
    "Disguise Self", "Expeditious Retreat", "Faerie Fire", "False Life",
    "Feather Fall", "Grease", "Identify", "Jump", "Longstrider",
    "Purify Food and Drink", "Sanctuary", "Tasha's Caustic Brew",
    # Level 2
    "Aid", "Alter Self", "Arcane Lock", "Blur", "Continual Flame", "Darkvision",
    "Enhance Ability", "Enlarge/Reduce", "Heat Metal", "Invisibility",
    "Lesser Restoration", "Levitate", "Magic Mouth", "Magic Weapon",
    "Protection from Poison", "Pyrotechnics", "Rope Trick", "See Invisibility",
    "Skywrite", "Spider Climb", "Web",
    # Level 3
    "Blink", "Catnap", "Create Food and Water", "Dispel Magic",
    "Elemental Weapon", "Flame Arrows", "Fly", "Gaseous Form",
    "Glyph of Warding", "Haste", "Intellect Fortress", "Protection From Energy",
    "Revivify", "Sleet Storm", "Tiny Servant", "Water Breathing", "Water Walk",
    # Level 4
    "Arcane Eye", "Elemental Bane", "Fabricate", "Freedom of Movement",
    "Secret Chest", "Faithful Hound", "Private Sanctum", "Resilient Sphere",
    "Stone Shape", "Stoneskin", "Summon Construct", "Vitriolic Sphere",
    # Level 5
    "Animate Objects", "Arcane Hand", "Creation", "Greater Restoration",
    "Skill Empowerment", "Transmute Rock", "Wall of Stone",
]


def seed_artificer_spells():
    db = SessionLocal()
    tagged = 0
    already = 0
    missing = []
    try:
        for name in ARTIFICER_SPELLS:
            spell = db.query(Spell).filter(
                Spell.name == name,
                Spell.owner_type == OwnerType.system,
                Spell.owner_id.is_(None),
            ).first()
            if not spell:
                missing.append(name)
                continue
            names = [c.strip() for c in (spell.classes or "").split(",") if c.strip()]
            if any(c.lower() == "artificer" for c in names):
                already += 1
                continue
            names.append("Artificer")
            spell.classes = ", ".join(names)
            tagged += 1
        db.commit()
        print(f"Tagged {tagged} spells with Artificer ({already} already tagged).")
        if missing:
            print(f"\n{len(missing)} Artificer spells not in the SRD compendium (skipped):")
            for m in missing:
                print(f"  - {m}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_artificer_spells()
