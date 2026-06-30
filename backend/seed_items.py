"""
Seed script: populates the encyclopedia item tables (weapons, armor, adventuring
gear, magic items) from the D&D 5e API, plus a curated set of potions and food/drink
(the SRD API does not cleanly expose those).

Run: python seed_items.py

Uses httpx (already in requirements). Skips entries that already exist (by name +
owner_type=system). Safe to re-run.
"""
import sys
import os
import time
sys.path.insert(0, os.path.dirname(__file__))

import httpx
from shared.database import SessionLocal
from shared.enums import OwnerType
from shared.encyclopedia.items.weapons.models import Weapon
from shared.encyclopedia.items.armor.models import Armor
from shared.encyclopedia.items.adventuring_gear.models import AdventuringGear
from shared.encyclopedia.items.magic_items.models import MagicItem
from shared.encyclopedia.items.potions.models import Potion
from shared.encyclopedia.items.food_drink.models import FoodDrink

API_BASE = "https://www.dnd5eapi.co"


def _cost(data: dict) -> str:
    c = data.get("cost") or {}
    q, u = c.get("quantity"), c.get("unit")
    return f"{q} {u}" if q is not None and u else "—"


def _weight(data: dict) -> str:
    w = data.get("weight")
    return f"{w} lb." if w else "—"


def _desc(data: dict) -> str:
    return "\n\n".join(data.get("desc", []) or [])


def _fetch(client: httpx.Client, path: str) -> dict | None:
    try:
        r = client.get(f"{API_BASE}{path}", timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  !! Failed to fetch {path}: {e}")
        return None


def _exists(db, model, name: str) -> bool:
    return db.query(model).filter(
        model.name == name,
        model.owner_type == OwnerType.system,
        model.owner_id.is_(None),
    ).first() is not None


def seed_equipment(db, client) -> tuple[int, int]:
    """Weapons, armor, and adventuring gear all come from /api/equipment."""
    created = skipped = 0
    listing = _fetch(client, "/api/equipment")
    if not listing:
        return 0, 0
    entries = listing.get("results", [])
    print(f"Found {len(entries)} equipment entries.")

    for entry in entries:
        data = _fetch(client, f"/api/equipment/{entry['index']}")
        time.sleep(0.03)
        if not data:
            skipped += 1
            continue

        cat = (data.get("equipment_category") or {}).get("index")
        name = data["name"]

        if cat == "weapon":
            if _exists(db, Weapon, name):
                skipped += 1
                continue
            damage = data.get("damage") or {}
            props = ", ".join(p["name"] for p in data.get("properties", []) or [])
            db.add(Weapon(
                name=name,
                weapon_category=data.get("weapon_category") or "—",
                weapon_type=data.get("weapon_range") or "—",
                damage=(damage.get("damage_dice") or "—"),
                damage_type=((damage.get("damage_type") or {}).get("name") or "—"),
                properties=props or None,
                cost=_cost(data),
                weight=_weight(data),
                description=_desc(data) or None,
                owner_type=OwnerType.system,
            ))
            created += 1

        elif cat == "armor":
            if _exists(db, Armor, name):
                skipped += 1
                continue
            ac = data.get("armor_class") or {}
            str_min = data.get("str_minimum") or 0
            db.add(Armor(
                name=name,
                armor_type=data.get("armor_category") or "—",
                armor_class=ac.get("base") or 10,
                cost=_cost(data),
                weight=_weight(data),
                strength_requirement=(str_min if str_min else None),
                stealth_disadvantage=bool(data.get("stealth_disadvantage")),
                description=_desc(data) or None,
                owner_type=OwnerType.system,
            ))
            created += 1

        elif cat == "adventuring-gear":
            if _exists(db, AdventuringGear, name):
                skipped += 1
                continue
            gear_cat = (data.get("gear_category") or {}).get("name") or "Adventuring Gear"
            db.add(AdventuringGear(
                name=name,
                category=gear_cat,
                cost=_cost(data),
                weight=_weight(data),
                quantity=None,
                description=_desc(data) or None,
                owner_type=OwnerType.system,
            ))
            created += 1
        else:
            skipped += 1

        if created and created % 25 == 0:
            db.commit()
            print(f"  Committed {created} equipment so far...")

    db.commit()
    return created, skipped


def seed_magic_items(db, client) -> tuple[int, int]:
    created = skipped = 0
    listing = _fetch(client, "/api/magic-items")
    if not listing:
        return 0, 0
    entries = listing.get("results", [])
    print(f"Found {len(entries)} magic items.")

    for entry in entries:
        name = entry["name"]
        if _exists(db, MagicItem, name):
            skipped += 1
            continue
        data = _fetch(client, f"/api/magic-items/{entry['index']}")
        time.sleep(0.03)
        if not data:
            skipped += 1
            continue
        effect = _desc(data)
        db.add(MagicItem(
            name=name,
            item_type=(data.get("equipment_category") or {}).get("name") or "Wondrous Item",
            rarity=(data.get("rarity") or {}).get("name") or "Unknown",
            attunement_required=("requires attunement" in effect.lower()),
            effect=effect or name,
            cost=None,
            weight=None,
            description=None,
            owner_type=OwnerType.system,
        ))
        created += 1
        if created % 25 == 0:
            db.commit()
            print(f"  Committed {created} magic items so far...")

    db.commit()
    return created, skipped


# Curated sets — the SRD API does not cleanly expose these.
# "Improvised Weapon" is not a real SRD equipment entry but a rules concept: any object
# wielded as a weapon deals 1d4 of an appropriate type (default bludgeoning). Seeding it as
# a system weapon lets a character equip one — relevant to Tavern Brawler, which grants
# proficiency with improvised weapons and pairs an improvised-weapon hit with a bonus grapple.
WEAPONS_CURATED = [
    {
        "name": "Improvised Weapon",
        "weapon_category": "Improvised",
        "weapon_type": "Melee",
        "damage": "1d4",
        "damage_type": "Bludgeoning",
        "properties": "Thrown (range 20/60)",
        "cost": "—",
        "weight": "—",
        "description": (
            "Any object you grab and use to attack — a chair leg, a tankard, a frying pan. "
            "An improvised weapon deals 1d4 damage of a type appropriate to the object "
            "(bludgeoning by default). If it resembles a real weapon, the GM may have it use "
            "that weapon's statistics instead. You're normally not proficient with improvised "
            "weapons (the Tavern Brawler feat grants that proficiency)."
        ),
    },
]

POTIONS = [
    {"name": "Potion of Healing", "rarity": "Common", "effect": "You regain 2d4 + 2 hit points when you drink this potion.", "duration": "Instantaneous", "cost": "50 gp", "weight": "0.5 lb."},
    {"name": "Potion of Greater Healing", "rarity": "Uncommon", "effect": "You regain 4d4 + 4 hit points when you drink this potion.", "duration": "Instantaneous", "cost": "150 gp", "weight": "0.5 lb."},
    {"name": "Potion of Superior Healing", "rarity": "Rare", "effect": "You regain 8d4 + 8 hit points when you drink this potion.", "duration": "Instantaneous", "cost": "450 gp", "weight": "0.5 lb."},
    {"name": "Potion of Supreme Healing", "rarity": "Very Rare", "effect": "You regain 10d4 + 20 hit points when you drink this potion.", "duration": "Instantaneous", "cost": "1,350 gp", "weight": "0.5 lb."},
    {"name": "Potion of Climbing", "rarity": "Common", "effect": "You gain a climbing speed equal to your walking speed. You can climb difficult surfaces, including upside down on ceilings, without making an ability check. You also gain advantage on Strength (Athletics) checks made to climb.", "duration": "1 hour", "cost": "75 gp", "weight": "0.5 lb."},
    {"name": "Potion of Water Breathing", "rarity": "Uncommon", "effect": "You can breathe underwater for 1 hour.", "duration": "1 hour", "cost": "180 gp", "weight": "0.5 lb."},
]

FOOD_DRINK = [
    {"name": "Ale (Mug)", "item_type": "Drink", "category": "Tavern", "cost": "4 cp", "weight": "—"},
    {"name": "Ale (Gallon)", "item_type": "Drink", "category": "Tavern", "cost": "2 sp", "weight": "8 lb."},
    {"name": "Wine, Common (Pitcher)", "item_type": "Drink", "category": "Tavern", "cost": "2 sp", "weight": "—"},
    {"name": "Wine, Fine (Bottle)", "item_type": "Drink", "category": "Tavern", "cost": "10 gp", "weight": "—"},
    {"name": "Bread (Loaf)", "item_type": "Food", "category": "Provisions", "cost": "2 cp", "weight": "—"},
    {"name": "Cheese (Hunk)", "item_type": "Food", "category": "Provisions", "cost": "1 sp", "weight": "—"},
    {"name": "Meat (Chunk)", "item_type": "Food", "category": "Provisions", "cost": "3 sp", "weight": "—"},
    {"name": "Rations (1 day)", "item_type": "Food", "category": "Provisions", "cost": "5 sp", "weight": "2 lb.", "effect": "Dry foodstuffs suitable for extended travel."},
]


def seed_curated(db) -> tuple[int, int]:
    created = skipped = 0
    for w in WEAPONS_CURATED:
        if _exists(db, Weapon, w["name"]):
            skipped += 1
            continue
        db.add(Weapon(**w, owner_type=OwnerType.system))
        created += 1
    for p in POTIONS:
        if _exists(db, Potion, p["name"]):
            skipped += 1
            continue
        db.add(Potion(**p, owner_type=OwnerType.system))
        created += 1
    for f in FOOD_DRINK:
        if _exists(db, FoodDrink, f["name"]):
            skipped += 1
            continue
        db.add(FoodDrink(**f, owner_type=OwnerType.system))
        created += 1
    db.commit()
    return created, skipped


def main():
    db = SessionLocal()
    try:
        with httpx.Client(timeout=15, follow_redirects=True) as client:
            print("Seeding equipment (weapons, armor, adventuring gear)...")
            ec, es = seed_equipment(db, client)
            print(f"  Equipment: {ec} created, {es} skipped.\n")

            print("Seeding magic items...")
            mc, ms = seed_magic_items(db, client)
            print(f"  Magic items: {mc} created, {ms} skipped.\n")

        print("Seeding curated weapons + potions + food/drink...")
        cc, cs = seed_curated(db)
        print(f"  Curated: {cc} created, {cs} skipped.\n")

        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
