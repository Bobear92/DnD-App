"""
Seed the adventuring-gear items that class/background STARTING EQUIPMENT references
but the SRD item seed didn't cover: equipment packs, ammunition, spellcasting
focuses, tools/kits, clothes, and a few flavor items.

Names here must match the refs in the frontend startingEquipmentData.js so the
starting-equipment resolver maps them to real (statted) encyclopedia items instead
of plain entries.

Run: python seed_starting_items.py   (idempotent — skips existing by name + owner_type=system)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from shared.database import SessionLocal
from shared.enums import OwnerType
from shared.encyclopedia.items.adventuring_gear.models import AdventuringGear

# (name, category, cost, weight, quantity, description)
ITEMS = [
    # Equipment packs (contents summarized in description)
    ("Burglar's Pack", "Equipment Pack", "16 gp", "44.5 lb.", None, "A backpack, ball bearings, string, a bell, candles, a crowbar, hammer, pitons, a hooded lantern, oil, rations, a tinderbox, a waterskin, and 50 ft of hempen rope."),
    ("Diplomat's Pack", "Equipment Pack", "39 gp", "39 lb.", None, "A chest, cases for maps and scrolls, fine clothes, ink, an ink pen, a lamp, oil, paper, perfume, sealing wax, and soap."),
    ("Dungeoneer's Pack", "Equipment Pack", "12 gp", "61.5 lb.", None, "A backpack, a crowbar, a hammer, 10 pitons, 10 torches, a tinderbox, 10 days of rations, and a waterskin, plus 50 ft of hempen rope."),
    ("Entertainer's Pack", "Equipment Pack", "40 gp", "38 lb.", None, "A backpack, a bedroll, 2 costumes, 5 candles, 5 days of rations, a waterskin, and a disguise kit."),
    ("Explorer's Pack", "Equipment Pack", "10 gp", "59 lb.", None, "A backpack, a bedroll, a mess kit, a tinderbox, 10 torches, 10 days of rations, and a waterskin, plus 50 ft of hempen rope."),
    ("Priest's Pack", "Equipment Pack", "19 gp", "24 lb.", None, "A backpack, a blanket, 10 candles, a tinderbox, an alms box, 2 blocks of incense, a censer, vestments, 2 days of rations, and a waterskin."),
    ("Scholar's Pack", "Equipment Pack", "40 gp", "10 lb.", None, "A backpack, a book of lore, a bottle of ink, an ink pen, 10 sheets of parchment, a bag of sand, and a small knife."),
    # Ammunition
    ("Arrows", "Ammunition", "1 gp", "1 lb.", "20", "Ammunition for a bow."),
    ("Crossbow Bolts", "Ammunition", "1 gp", "1.5 lb.", "20", "Ammunition for a crossbow."),
    ("Sling Bullets", "Ammunition", "4 cp", "1.5 lb.", "20", "Ammunition for a sling."),
    ("Blowgun Needles", "Ammunition", "1 gp", "1 lb.", "50", "Ammunition for a blowgun."),
    # Spellcasting focuses
    ("Holy Symbol", "Spellcasting Focus", "5 gp", "1 lb.", None, "An amulet, emblem, or reliquary used as a divine spellcasting focus."),
    ("Druidic Focus", "Spellcasting Focus", "1 gp", "—", None, "A sprig of mistletoe, a yew wand, or a totem used as a druidic spellcasting focus."),
    ("Component Pouch", "Spellcasting Focus", "25 gp", "2 lb.", None, "A small watertight pouch holding the material components for spells."),
    ("Arcane Focus", "Spellcasting Focus", "10 gp", "1 lb.", None, "A crystal, orb, rod, staff, or wand used as an arcane spellcasting focus."),
    ("Spellbook", "Spellcasting Focus", "50 gp", "3 lb.", None, "A leather-bound book of 100 blank vellum pages for recording spells."),
    # Tools & kits
    ("Thieves' Tools", "Tools", "25 gp", "1 lb.", None, "A file, lock picks, a small mirror, narrow scissors, and pliers."),
    ("Disguise Kit", "Tools", "25 gp", "3 lb.", None, "Cosmetics, hair dye, props, and clothing for creating disguises."),
    ("Forgery Kit", "Tools", "15 gp", "5 lb.", None, "Papers, parchments, pens, inks, seals, and tools for forging documents."),
    ("Herbalism Kit", "Tools", "5 gp", "3 lb.", None, "Pouches, clippers, and vials for creating remedies and potions."),
    ("Artisan's Tools", "Tools", "—", "—", None, "Tools of a chosen trade (smith's, carpenter's, etc.)."),
    ("Gaming Set", "Tools", "—", "—", None, "A set of dice or playing cards used for games of chance."),
    ("Musical Instrument", "Tools", "—", "—", None, "A musical instrument of your choice."),
    ("Lute", "Tools", "35 gp", "2 lb.", None, "A stringed musical instrument."),
    ("Navigator's Tools", "Tools", "25 gp", "2 lb.", None, "Instruments for sea navigation: a sextant, compass, calipers, and charts."),
    # Clothes
    ("Common Clothes", "Clothes", "5 sp", "3 lb.", None, "An ordinary outfit."),
    ("Fine Clothes", "Clothes", "15 gp", "6 lb.", None, "A set of fine, fashionable clothing."),
    ("Traveler's Clothes", "Clothes", "2 gp", "4 lb.", None, "Sturdy boots, woolen clothes, and a cloak suited to travel."),
    ("Costume", "Clothes", "5 gp", "4 lb.", None, "A costume used in performance or disguise."),
    ("Vestments", "Clothes", "—", "—", None, "Religious vestments."),
    # Flavor / misc background items
    ("Prayer Book", "Gear", "—", "1 lb.", None, "A book of prayers and religious writings."),
    ("Incense", "Gear", "—", "—", "5", "Sticks of incense."),
    ("Scroll Case", "Gear", "1 gp", "1 lb.", None, "A cylindrical leather case for storing scrolls or maps."),
    ("Signet Ring", "Gear", "5 gp", "—", None, "A ring engraved with a personal or family seal."),
    ("Lucky Charm", "Gear", "—", "—", None, "A trinket carried for luck, such as a rabbit's foot."),
    ("Silk Rope", "Gear", "10 gp", "5 lb.", "50 ft.", "50 feet of silk rope (2 lb. lighter and stronger than hempen)."),
    ("Insignia of Rank", "Gear", "—", "—", None, "A military insignia denoting rank."),
    ("Map", "Gear", "—", "—", None, "A map of a place you know well."),
    ("Staff", "Gear", "5 sp", "4 lb.", None, "A sturdy walking staff."),
    ("Iron Pot", "Gear", "2 gp", "10 lb.", None, "A cast-iron cooking pot."),
    ("Shovel", "Gear", "2 gp", "5 lb.", None, "A digging shovel."),
    ("Hunting Trap", "Gear", "5 gp", "25 lb.", None, "A saw-toothed steel ring trap that snaps shut on a creature's leg."),
]


def main():
    db = SessionLocal()
    created = skipped = updated = 0
    try:
        for name, category, cost, weight, quantity, description in ITEMS:
            exists = db.query(AdventuringGear).filter(
                AdventuringGear.name == name,
                AdventuringGear.owner_type == OwnerType.system,
                AdventuringGear.owner_id.is_(None),
            ).first()
            if exists:
                # Backfill a missing description (e.g. packs seeded earlier without one)
                # so the creation Equipment step can show their contents.
                if description and not (exists.description or "").strip():
                    exists.description = description
                    updated += 1
                else:
                    skipped += 1
                continue
            db.add(AdventuringGear(
                name=name, category=category, cost=cost, weight=weight,
                quantity=quantity, description=description, owner_type=OwnerType.system,
            ))
            created += 1
        db.commit()
        print(f"Done. Created {created} starting-equipment items, updated {updated} descriptions, skipped {skipped} existing.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
