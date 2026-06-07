"""
One-off backfill: repair character inventory entries that were saved as stat-less
"plain entries" because the starting-equipment ref name didn't match the encyclopedia's
naming convention (e.g. ref "Light Crossbow" vs seeded "Crossbow, light"; "Leather" vs
"Leather Armor"). See startingEquipmentResolver.normalizeItemName for the matching rules
this mirrors.

For every inventory entry with source_id is None whose name resolves to an encyclopedia
item (by exact-lowercase or normalized name), rebuild the snapshot from that item while
preserving the tracking fields (uid, owned quantity, equipped, attuned, routing category).

Idempotent: entries that already have a source_id, or that don't match any item, are left
untouched. Run from backend/ with the venv active:  python backfill_inventory_snapshots.py
"""
import json
import re
import sys

from sqlalchemy import text

from shared.database import SessionLocal

# REST routing slug (as stored on inventory entries) -> encyclopedia table name.
CATEGORY_TABLE = {
    "weapons": "weapons",
    "armor": "armor",
    "adventuring-gear": "adventuring_gear",
    "potions": "potions",
    "magic-items": "magic_items",
    "food-drink": "food_drink",
}

# Mirror of inventoryData.buildEntry STRIP_KEYS.
STRIP_KEYS = {"id", "owner_type", "owner_id", "created_at", "updated_at"}


def normalize_item_name(s):
    """Mirror of startingEquipmentResolver.normalizeItemName."""
    n = (s or "").lower().strip()
    ci = n.find(", ")
    if ci != -1:
        n = f"{n[ci + 2:]} {n[:ci]}"
    n = re.sub(r"\s+armor$", "", n)
    return re.sub(r"\s+", " ", n).strip()


def build_index(db, table):
    """{lc(name): row, normalize(name): row} for one encyclopedia table; exact wins."""
    rows = db.execute(text(f"SELECT * FROM {table}")).mappings().all()
    index = {}
    for row in rows:
        d = dict(row)
        index[(d["name"] or "").lower()] = d
        norm = normalize_item_name(d["name"])
        index.setdefault(norm, d)
    return index


def lookup(index, name):
    return index.get((name or "").lower()) or index.get(normalize_item_name(name))


def rebuild_entry(entry, item):
    """Mirror of inventoryData.buildEntry, preserving the entry's tracking fields."""
    snapshot = {}
    for k, v in item.items():
        if k in STRIP_KEYS:
            continue
        if k == "category":
            snapshot["item_category"] = v
            continue
        if k == "quantity":
            snapshot["item_quantity"] = v
            continue
        snapshot[k] = v
    return {
        **snapshot,
        "uid": entry.get("uid"),
        "category": entry.get("category"),
        "source_id": item["id"],
        "quantity": entry.get("quantity", 1),
        "equipped": entry.get("equipped", False),
        "attuned": entry.get("attuned", False),
    }


def main():
    db = SessionLocal()
    indexes = {slug: build_index(db, table) for slug, table in CATEGORY_TABLE.items()}

    # Raw SQL read/write avoids loading the full ORM mapper graph (the Character FK to
    # users can't resolve when only some models are imported).
    chars = db.execute(text("SELECT id, name, character_data FROM characters")).mappings().all()
    total_fixed = 0
    for ch in chars:
        data = ch["character_data"] or {}
        inv = data.get("inventory")
        if not inv:
            continue
        changed = False
        new_inv = []
        for entry in inv:
            if entry.get("source_id") is None and entry.get("category") in indexes:
                item = lookup(indexes[entry["category"]], entry.get("name"))
                if item:
                    new_inv.append(rebuild_entry(entry, item))
                    changed = True
                    total_fixed += 1
                    print(f"  char {ch['id']} {ch['name']!r}: {entry.get('name')!r} -> {item['name']!r}")
                    continue
            new_inv.append(entry)
        if changed:
            data["inventory"] = new_inv
            db.execute(
                text("UPDATE characters SET character_data = CAST(:data AS jsonb) WHERE id = :id"),
                {"data": json.dumps(data), "id": ch["id"]},
            )

    if total_fixed:
        db.commit()
    db.close()
    print(f"Done. Repaired {total_fixed} inventory entr{'y' if total_fixed == 1 else 'ies'}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
