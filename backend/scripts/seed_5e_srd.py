#!/usr/bin/env python
"""
Seed the database with official D&D 5e SRD data from the D&D 5e API.

Usage (run from the backend/ directory):
    python scripts/seed_5e_srd.py
    python scripts/seed_5e_srd.py --clear      # wipe existing system records first
    python scripts/seed_5e_srd.py --no-cache   # re-fetch everything (ignore local cache)

API source: https://www.dnd5eapi.co  (SRD content only)

First run fetches ~800+ items from the API and caches each response under
scripts/cache/ so subsequent runs are instant.  The cache is gitignored.
"""

import sys
import json
import time
import argparse
from pathlib import Path

# Ensure UTF-8 output on Windows terminals that default to cp1252
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Allow importing our backend packages from wherever this script is called
sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx
from shared.database import SessionLocal
from shared.enums import OwnerType
from shared.encyclopedia.spells.models import Spell
from shared.encyclopedia.bestiary.models import Creature
from shared.encyclopedia.items.weapons.models import Weapon
from shared.encyclopedia.items.armor.models import Armor
from shared.encyclopedia.items.adventuring_gear.models import AdventuringGear
from shared.encyclopedia.items.potions.models import Potion
from shared.encyclopedia.items.magic_items.models import MagicItem
from players.races.models import Race


API_BASE = "https://www.dnd5eapi.co"
CACHE_DIR = Path(__file__).parent / "cache"

# Challenge rating fractions
_CR_FRACTIONS = {0.125: "1/8", 0.25: "1/4", 0.5: "1/2"}


# ─── HTTP + caching ───────────────────────────────────────────────────────────

def _cache_path(url_path: str) -> Path:
    safe = url_path.lstrip("/").replace("/", "__")
    return CACHE_DIR / f"{safe}.json"


def fetch(url_path: str, client: httpx.Client) -> dict:
    """GET a path from the API, caching the response to disk."""
    cache = _cache_path(url_path)
    if cache.exists():
        return json.loads(cache.read_text())

    url = f"{API_BASE}{url_path}"
    print(f"    GET {url}")
    resp = client.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    cache.write_text(json.dumps(data, indent=2))
    time.sleep(0.05)  # polite throttle
    return data


def fetch_list(list_path: str, client: httpx.Client) -> list[dict]:
    """Fetch a list endpoint, then fetch and return the full detail object for every entry."""
    data = fetch(list_path, client)
    # /equipment-categories/{cat} returns {"equipment": [...]} instead of {"results": [...]}
    refs = data.get("results") or data.get("equipment") or []
    items = []
    for ref in refs:
        detail_path = ref.get("url", "").replace(API_BASE, "") or f"{list_path}/{ref['index']}"
        items.append(fetch(detail_path, client))
    return items


# ─── Formatting helpers ───────────────────────────────────────────────────────

def _cr(cr: float) -> str:
    return _CR_FRACTIONS.get(cr, str(int(cr)))


def _cost(cost: dict | None) -> str:
    if not cost:
        return "—"
    return f"{cost['quantity']} {cost['unit']}"


def _weight(w) -> str:
    if w is None:
        return "—"
    return f"{w} lb."


def _desc(parts) -> str | None:
    if not parts:
        return None
    if isinstance(parts, list):
        return "\n\n".join(parts) or None
    return parts or None


# ─── Spells ───────────────────────────────────────────────────────────────────

def seed_spells(db, client: httpx.Client) -> int:
    print("  Spells...")
    count = 0
    for s in fetch_list("/api/spells", client):
        if db.query(Spell).filter_by(name=s["name"], owner_type=OwnerType.system).first():
            continue

        components = ", ".join(s.get("components", []))
        if s.get("material"):
            components += f" ({s['material']})"

        db.add(Spell(
            name=s["name"],
            level=s["level"],
            school=s.get("school", {}).get("name", ""),
            casting_time=s.get("casting_time", ""),
            range=s.get("range", ""),
            components=components[:200],
            duration=s.get("duration", ""),
            description="\n\n".join(s.get("desc", [])),
            classes=", ".join(c["name"] for c in s.get("classes", [])),
            owner_type=OwnerType.system,
            owner_id=None,
        ))
        count += 1
    db.commit()
    return count


# ─── Creatures ────────────────────────────────────────────────────────────────

def seed_creatures(db, client: httpx.Client) -> int:
    print("  Creatures...")
    count = 0
    for m in fetch_list("/api/monsters", client):
        if db.query(Creature).filter_by(name=m["name"], owner_type=OwnerType.system).first():
            continue

        ac_entries = m.get("armor_class") or []
        ac_value = ac_entries[0]["value"] if ac_entries else 10

        speed_dict = m.get("speed") or {}
        speed_str = ", ".join(f"{k} {v}" for k, v in speed_dict.items() if v)

        hp = m.get("hit_points", 0)
        hd = m.get("hit_dice", "")
        hp_str = f"{hp} ({hd})" if hd else str(hp)

        db.add(Creature(
            name=m["name"],
            size=m.get("size", ""),
            type=m.get("type", ""),
            alignment=m.get("alignment", ""),
            challenge_rating=_cr(m.get("challenge_rating", 0)),
            armor_class=ac_value,
            hit_points=hp_str,
            speed=speed_str,
            strength=m.get("strength", 10),
            dexterity=m.get("dexterity", 10),
            constitution=m.get("constitution", 10),
            intelligence=m.get("intelligence", 10),
            wisdom=m.get("wisdom", 10),
            charisma=m.get("charisma", 10),
            description=_desc(m.get("desc")),
            owner_type=OwnerType.system,
            owner_id=None,
        ))
        count += 1
    db.commit()
    return count


# ─── Weapons ──────────────────────────────────────────────────────────────────

def seed_weapons(db, client: httpx.Client) -> int:
    print("  Weapons...")
    count = 0
    for w in fetch_list("/api/equipment-categories/weapon", client):
        if db.query(Weapon).filter_by(name=w["name"], owner_type=OwnerType.system).first():
            continue

        dmg = w.get("damage") or {}
        two_h = w.get("two_handed_damage") or {}
        damage_dice = dmg.get("damage_dice") or two_h.get("damage_dice") or "—"
        damage_type = (
            (dmg.get("damage_type") or {}).get("name")
            or (two_h.get("damage_type") or {}).get("name")
            or "—"
        )
        props = [p["name"] for p in w.get("properties") or []]

        db.add(Weapon(
            name=w["name"],
            weapon_category=w.get("weapon_category", ""),
            weapon_type=w.get("weapon_range", "Melee"),
            damage=damage_dice,
            damage_type=damage_type,
            properties=json.dumps(props) if props else None,
            cost=_cost(w.get("cost")),
            weight=_weight(w.get("weight")),
            description=_desc(w.get("desc")),
            owner_type=OwnerType.system,
            owner_id=None,
        ))
        count += 1
    db.commit()
    return count


# ─── Armor ────────────────────────────────────────────────────────────────────

def seed_armor(db, client: httpx.Client) -> int:
    print("  Armor...")
    count = 0
    for a in fetch_list("/api/equipment-categories/armor", client):
        if db.query(Armor).filter_by(name=a["name"], owner_type=OwnerType.system).first():
            continue

        ac_data = a.get("armor_class") or {}
        str_min = a.get("str_minimum") or 0

        db.add(Armor(
            name=a["name"],
            armor_type=a.get("armor_category", ""),
            armor_class=ac_data.get("base", 10),
            cost=_cost(a.get("cost")),
            weight=_weight(a.get("weight")),
            strength_requirement=str_min if str_min > 0 else None,
            stealth_disadvantage=a.get("stealth_disadvantage", False),
            description=_desc(a.get("desc")),
            owner_type=OwnerType.system,
            owner_id=None,
        ))
        count += 1
    db.commit()
    return count


# ─── Adventuring Gear ─────────────────────────────────────────────────────────

def seed_adventuring_gear(db, client: httpx.Client) -> int:
    print("  Adventuring gear...")
    count = 0
    for g in fetch_list("/api/equipment-categories/adventuring-gear", client):
        if db.query(AdventuringGear).filter_by(name=g["name"], owner_type=OwnerType.system).first():
            continue

        # gear_category is the sub-category (e.g. "Standard Gear", "Ammunition")
        cat = (
            (g.get("gear_category") or g.get("equipment_category") or {}).get("name")
            or "Adventuring Gear"
        )

        db.add(AdventuringGear(
            name=g["name"],
            category=cat,
            cost=_cost(g.get("cost")),
            weight=_weight(g.get("weight")),
            quantity=None,
            description=_desc(g.get("desc")),
            owner_type=OwnerType.system,
            owner_id=None,
        ))
        count += 1
    db.commit()
    return count


# ─── Magic Items & Potions ────────────────────────────────────────────────────

def seed_magic_items_and_potions(db, client: httpx.Client) -> tuple[int, int]:
    print("  Magic items & potions...")
    magic_count = 0
    potion_count = 0

    for item in fetch_list("/api/magic-items", client):
        cat_index = (item.get("equipment_category") or {}).get("index", "")
        rarity = (item.get("rarity") or {}).get("name", "Unknown")
        effect = _desc(item.get("desc")) or ""

        if cat_index == "potion":
            if db.query(Potion).filter_by(name=item["name"], owner_type=OwnerType.system).first():
                continue
            db.add(Potion(
                name=item["name"],
                rarity=rarity,
                effect=effect,
                duration="Instantaneous",
                cost="Varies",
                weight="0.5 lb.",
                description=None,
                owner_type=OwnerType.system,
                owner_id=None,
            ))
            potion_count += 1
        else:
            if db.query(MagicItem).filter_by(name=item["name"], owner_type=OwnerType.system).first():
                continue
            item_type = (item.get("equipment_category") or {}).get("name", "Wondrous Item")
            attunement = bool((item.get("requires_attunement") or "").strip())

            db.add(MagicItem(
                name=item["name"],
                item_type=item_type,
                rarity=rarity,
                attunement_required=attunement,
                effect=effect,
                cost=None,
                weight=None,
                description=None,
                owner_type=OwnerType.system,
                owner_id=None,
            ))
            magic_count += 1

    db.commit()
    return magic_count, potion_count


# ─── Races ────────────────────────────────────────────────────────────────────

def _race_description(r: dict) -> str:
    parts = [p for p in [r.get("age"), r.get("alignment"), r.get("size_description"), r.get("language_desc")] if p]
    return "\n\n".join(parts) or r["name"]


def seed_races(db, client: httpx.Client) -> int:
    print("  Races...")
    count = 0

    for ref in fetch("/api/races", client).get("results", []):
        r = fetch(ref["url"].replace(API_BASE, ""), client)

        if db.query(Race).filter_by(name=r["name"], owner_type=OwnerType.system).first():
            continue

        # {"str": 2, "con": 1} — use lowercase abbreviation as the key
        ability_bonuses = {
            b["ability_score"]["name"].lower(): b["bonus"]
            for b in r.get("ability_bonuses", [])
        }

        # Fetch each trait for its description
        trait_objects = []
        for trait_ref in r.get("traits", []):
            td = fetch(trait_ref["url"].replace(API_BASE, ""), client)
            trait_objects.append({
                "name": td["name"],
                "description": "\n\n".join(td.get("desc", [])),
            })

        db.add(Race(
            name=r["name"],
            description=_race_description(r),
            ability_score_increases=ability_bonuses,
            size=r.get("size", "Medium"),
            speed=r.get("speed", 30),
            traits=trait_objects,
            languages=[lang["name"] for lang in r.get("languages", [])],
            owner_type=OwnerType.system,
            owner_id=None,
        ))
        count += 1

    db.commit()
    return count


# ─── Clear helpers ────────────────────────────────────────────────────────────

_SYSTEM_MODELS = [Spell, Creature, Weapon, Armor, AdventuringGear, Potion, MagicItem, Race]


def clear_system_records(db) -> None:
    print("  Clearing existing system records...")
    for model in _SYSTEM_MODELS:
        n = db.query(model).filter_by(owner_type=OwnerType.system).delete()
        print(f"    {model.__tablename__}: {n} deleted")
    db.commit()


# ─── Entry point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Seed D&D 5e SRD data from the official API")
    parser.add_argument("--clear", action="store_true", help="Delete existing system records before seeding")
    parser.add_argument("--no-cache", action="store_true", help="Ignore cached API responses")
    args = parser.parse_args()

    CACHE_DIR.mkdir(exist_ok=True)

    if args.no_cache:
        for f in CACHE_DIR.glob("*.json"):
            f.unlink()
        print("Cache cleared.\n")

    db = SessionLocal()
    try:
        if args.clear:
            clear_system_records(db)
            print()

        print("Seeding from https://www.dnd5eapi.co ...")
        print("(First run fetches live; subsequent runs use local cache)\n")

        with httpx.Client(follow_redirects=True) as client:
            spells          = seed_spells(db, client)
            creatures       = seed_creatures(db, client)
            weapons         = seed_weapons(db, client)
            armor           = seed_armor(db, client)
            gear            = seed_adventuring_gear(db, client)
            magic, potions  = seed_magic_items_and_potions(db, client)
            races           = seed_races(db, client)

        print("\n✅ Done!")
        rows = [
            ("Spells",           spells),
            ("Creatures",        creatures),
            ("Weapons",          weapons),
            ("Armor",            armor),
            ("Adventuring Gear", gear),
            ("Magic Items",      magic),
            ("Potions",          potions),
            ("Races",            races),
        ]
        for label, n in rows:
            status = f"{n} added" if n else "already seeded (skipped)"
            print(f"  {label:<20} {status}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
