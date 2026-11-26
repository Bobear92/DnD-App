"""
Seed script: populates the encyclopedia item tables (weapons, armor, adventuring
gear, magic items, potions) from the D&D 5e API, plus curated potions and food/drink.

The API files potions under magic items; they are seeded into the POTIONS table instead (items
deep dive T1 — Robert: potion-type items belong under Potions). The curated POTIONS rows below
have hand-written effect/duration text and win over the API record of the same name.

Run: python seed_items.py

UPSERTS (deploy ticket T5b): an item already seeded by name is brought in line with the API /
curated lists, so a fix reaches existing databases. Only system rows are touched
(shared/seeding.py). Character inventories hold SNAPSHOTS of items, so an updated row does not
change items characters already carry. Safe to re-run.
"""
import sys
import os
import time
from collections import Counter
sys.path.insert(0, os.path.dirname(__file__))

import httpx
from shared.database import SessionLocal
from shared.seeding import FAILED, SeedFetchError, exit_if_failed, fetch_json, upsert_system_row, summary
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


def _fetch(client: httpx.Client, path: str) -> dict:
    """Retries, then raises SeedFetchError — a failed download is never silent (shared/seeding.py)."""
    return fetch_json(client, f"{API_BASE}{path}")


def _fetch_record(client, path: str, counts: Counter, failures: list) -> dict | None:
    """One item's detail record, or None after counting it as FAILED (the run then exits non-zero)."""
    try:
        return _fetch(client, path)
    except SeedFetchError as exc:
        print(f"  !! {exc}")
        counts[FAILED] += 1
        failures.append(path)
        return None


def _equipment_row(data: dict):
    """(Model, values) for an /api/equipment record, or None for a category we don't store."""
    cat = (data.get("equipment_category") or {}).get("index")
    if cat == "weapon":
        damage = data.get("damage") or {}
        props = ", ".join(p["name"] for p in data.get("properties", []) or [])
        range_normal, range_long = _weapon_range(data)
        return Weapon, {
            "weapon_category": data.get("weapon_category") or "—",
            "weapon_type": data.get("weapon_range") or "—",
            "damage": damage.get("damage_dice") or "—",
            "damage_type": (damage.get("damage_type") or {}).get("name") or "—",
            "properties": props or None,
            "range_normal": range_normal,
            "range_long": range_long,
            "cost": _cost(data),
            "weight": _weight(data),
            "description": _desc(data) or None,
        }
    if cat == "armor":
        ac = data.get("armor_class") or {}
        str_min = data.get("str_minimum") or 0
        return Armor, {
            "armor_type": data.get("armor_category") or "—",
            "armor_class": ac.get("base") or 10,
            "cost": _cost(data),
            "weight": _weight(data),
            "strength_requirement": str_min if str_min else None,
            "stealth_disadvantage": bool(data.get("stealth_disadvantage")),
            "description": _desc(data) or None,
        }
    if cat == "adventuring-gear":
        return AdventuringGear, {
            "category": (data.get("gear_category") or {}).get("name") or "Adventuring Gear",
            "cost": _cost(data),
            "weight": _weight(data),
            "quantity": None,
            "description": _desc(data) or None,
        }
    return None


def seed_equipment(db, client, delay=0.03, failures=None) -> Counter:
    """Weapons, armor, and adventuring gear all come from /api/equipment.

    A failed LIST download raises (nothing to seed from); a failed item is counted as FAILED and
    named in ``failures``. "skipped" means deliberately ignored (not an item kind we store, or a
    repeated name) — never a download that failed.
    """
    counts = Counter()
    failures = [] if failures is None else failures
    listing = _fetch(client, "/api/equipment")
    entries = listing.get("results", [])
    print(f"Found {len(entries)} equipment entries.")

    seen = set()
    for i, entry in enumerate(entries, start=1):
        data = _fetch_record(client, f"/api/equipment/{entry['index']}", counts, failures)
        time.sleep(delay)
        if data is None:
            continue
        row = _equipment_row(data)
        if not row or (row[0], data["name"]) in seen:  # first record for a name wins (see magic items)
            counts["skipped"] += 1
            continue
        seen.add((row[0], data["name"]))
        model, values = row
        _, status = upsert_system_row(db, model, {"name": data["name"]}, values)
        counts[status] += 1
        if i % 25 == 0:
            db.commit()
            print(f"  ...{i} equipment entries processed")

    db.commit()
    return counts


def _is_potion(data: dict) -> bool:
    cat = data.get("equipment_category") or {}
    return (cat.get("index") or "").lower() == "potion" or (cat.get("name") or "").lower() == "potion"


def seed_magic_items(db, client, delay=0.03, failures=None) -> Counter:
    """
    Failure handling as in seed_equipment. A potion-category record is seeded into Potions, not
    Magic Items, and skipped entirely when a curated POTIONS row of that name exists.
    """
    counts = Counter()
    failures = [] if failures is None else failures
    listing = _fetch(client, "/api/magic-items")
    entries = listing.get("results", [])
    print(f"Found {len(entries)} magic items.")

    seen = set()
    for i, entry in enumerate(entries, start=1):
        name = entry["name"]
        # The API lists some names twice ("Potion of Healing": potion-of-healing and
        # potion-of-healing-common). Rows are keyed by name, so a second record would overwrite the
        # first on every run and the row would never settle. The first record wins.
        if name in seen:
            counts["skipped"] += 1
            continue
        seen.add(name)
        data = _fetch_record(client, f"/api/magic-items/{entry['index']}", counts, failures)
        time.sleep(delay)
        if data is None:
            continue
        effect = _desc(data)
        if _is_potion(data):
            if name in CURATED_POTION_NAMES:
                counts["skipped"] += 1
                continue
            _, status = upsert_system_row(db, Potion, {"name": name}, {
                "rarity": (data.get("rarity") or {}).get("name") or "Unknown",
                "effect": effect or name,
                "duration": None,
                "cost": "—",
                "weight": "0.5 lb.",
                "description": None,
            })
            counts[status] += 1
            continue
        _, status = upsert_system_row(db, MagicItem, {"name": name}, {
            "item_type": (data.get("equipment_category") or {}).get("name") or "Wondrous Item",
            "rarity": (data.get("rarity") or {}).get("name") or "Unknown",
            "attunement_required": "requires attunement" in effect.lower(),
            "effect": effect or name,
            "cost": None,
            "weight": None,
            "description": None,
            "effects": MAGIC_ITEM_EFFECTS.get(name),
        })
        counts[status] += 1
        if i % 25 == 0:
            db.commit()
            print(f"  ...{i} magic items processed")

    db.commit()
    return counts


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

CURATED_POTION_NAMES = {p["name"] for p in POTIONS}

# Structured effects for API magic items, by name (items deep dive). The API has the prose only; this is what the
# sheet computes from. A name not listed here seeds with effects=None (prose only).
MAGIC_ITEM_EFFECTS = {
    "Weapon, +1": [{"kind": "weapon_bonus", "amount": 1}],
    "Weapon, +2": [{"kind": "weapon_bonus", "amount": 2}],
    "Weapon, +3": [{"kind": "weapon_bonus", "amount": 3}],
}

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


# (backfill_weapon_ranges was removed: it existed only because the create path skipped existing
# weapons, leaving rows seeded before range_normal/range_long with a NULL band. The upsert now
# writes the band on every run.)


def seed_curated(db) -> Counter:
    counts = Counter()
    for model, rows in ((Weapon, WEAPONS_CURATED), (Potion, POTIONS), (FoodDrink, FOOD_DRINK)):
        for item in rows:
            values = {k: v for k, v in item.items() if k != "name"}
            _, status = upsert_system_row(db, model, {"name": item["name"]}, values)
            counts[status] += 1
    db.commit()
    return counts


def main(client=None):
    db = SessionLocal()
    own_client = client is None
    client = client or httpx.Client(timeout=15, follow_redirects=True)
    failures: list[str] = []
    try:
        print("Seeding equipment (weapons, armor, adventuring gear)...")
        print(f"  Equipment: {summary(seed_equipment(db, client, failures=failures))}.\n")

        print("Seeding magic items...")
        print(f"  Magic items: {summary(seed_magic_items(db, client, failures=failures))}.\n")

        print("Seeding curated weapons + potions + food/drink...")
        print(f"  Curated: {summary(seed_curated(db))}.\n")

        exit_if_failed(failures, "seed_items.py")
        print("Done.")
    finally:
        if own_client:
            client.close()
        db.close()


if __name__ == "__main__":
    main()
