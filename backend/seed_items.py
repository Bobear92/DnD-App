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


def _weapon_range(data: dict) -> tuple[int | None, int | None]:
    """
    The distance band a weapon attacks at, as (normal, long).

    A RANGED weapon carries it in `range`. A thrown MELEE weapon carries its melee reach in
    `range` (always 5) and the useful band in `throw_range` — so reading `range` for everything
    would file every dagger and longsword as a 5-ft "ranged" weapon. A melee weapon with no
    throw gets (None, None): its 5 ft is reach, not a band, and Reach weapons make that 10.
    """
    if (data.get("weapon_range") or "").lower() == "ranged":
        band = data.get("range") or {}
    else:
        band = data.get("throw_range") or {}
    normal, long = band.get("normal"), band.get("long")
    if normal is None:
        return None, None
    return normal, long


def _srd_index(name: str) -> str:
    """
    A weapon name as the SRD API indexes it. The DB stores display names ("Crossbow, light")
    while the API uses "crossbow-light" — punctuation is DROPPED, not dashed, so a naive
    space-to-dash swap yields "crossbow,-light" and 404s every crossbow.
    """
    slug = name.lower()
    for ch in (",", "'", "(", ")", "."):
        slug = slug.replace(ch, "")
    return "-".join(slug.split())


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
            range_normal, range_long = _weapon_range(data)
            db.add(Weapon(
                name=name,
                weapon_category=data.get("weapon_category") or "—",
                weapon_type=data.get("weapon_range") or "—",
                damage=(damage.get("damage_dice") or "—"),
                damage_type=((damage.get("damage_type") or {}).get("name") or "—"),
                properties=props or None,
                range_normal=range_normal,
                range_long=range_long,
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
        "range_normal": 20,
        "range_long": 60,
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


def backfill_weapon_ranges(db, client) -> tuple[int, int]:
    """
    Fill `range_normal`/`range_long` on system weapons that predate those columns.

    The create path SKIPS an existing weapon, so a plain re-run would leave every weapon seeded
    before this column with a NULL band forever. Same shape as seed_feats.py backfilling
    `effects` onto already-seeded feats.

    Only ever writes a band it actually found onto a row that is missing one — it never nulls an
    existing value, so a GM's hand-edited range survives a re-seed.
    """
    filled = checked = 0
    # A curated weapon is not in the SRD API at all, so its band comes from WEAPONS_CURATED —
    # which the create path skipped for any row that already existed.
    curated = {
        w["name"]: (w.get("range_normal"), w.get("range_long"))
        for w in WEAPONS_CURATED if w.get("range_normal") is not None
    }
    rows = db.query(Weapon).filter(
        Weapon.owner_type == OwnerType.system,
        Weapon.range_normal.is_(None),
    ).all()
    for w in rows:
        checked += 1
        if w.name in curated:
            w.range_normal, w.range_long = curated[w.name]
            filled += 1
            continue
        data = _fetch(client, f"/api/2014/equipment/{_srd_index(w.name)}")
        if not data:
            continue
        normal, long = _weapon_range(data)
        if normal is None:
            continue
        w.range_normal, w.range_long = normal, long
        filled += 1
        time.sleep(0.05)
    db.commit()
    return filled, checked


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

            print("Backfilling weapon ranges...")
            bf, bc = backfill_weapon_ranges(db, client)
            print(f"  Weapon ranges: {bf} filled of {bc} missing one.\n")

        print("Seeding curated weapons + potions + food/drink...")
        cc, cs = seed_curated(db)
        print(f"  Curated: {cc} created, {cs} skipped.\n")

        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
