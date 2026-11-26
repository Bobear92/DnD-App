"""move potion magic items into potions

Revision ID: ebff797e3878
Revises: a01182d8bd3b
Create Date: 2026-11-25

Items deep dive T1 (Robert: potion-type items belong under Potions). The 5e API files potions,
oils and philters under magic items, so production had them under Magic Items while Potions held
only the 6 curated rows. seed_items.py now seeds them into Potions; this migration moves what is
already stored.
"""
import json
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = 'ebff797e3878'
down_revision: Union[str, Sequence[str], None] = 'a01182d8bd3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Keys that exist only on a magic-item snapshot (inventoryData.buildEntry copies every column).
MAGIC_ONLY_KEYS = ("item_type", "attunement_required")


def _norm(name):
    return str(name or "").strip().lower()


def move_potions(conn) -> dict:
    """
    1. Every SYSTEM magic_items row with item_type 'Potion' gets a SYSTEM potions row of the same
       name (an existing one — e.g. a curated Potion of Healing — is kept as is).
    2. Every character inventory entry that is a snapshot of one of those magic items is re-pointed
       at the potions row: category 'potions', its source_id, magic-only keys dropped, not attuned.
       uid, quantity and the rest of the snapshot are kept — never remove-and-re-add.
       An entry matches by source_id, or by name when its source row is gone / it has none.
    3. The system potion rows are deleted from magic_items. Campaign (homebrew) rows are untouched.

    Idempotent: once the magic rows are gone there is nothing left to match, so a re-run is a no-op.
    """
    magic = conn.execute(sa.text(
        "SELECT id, name, rarity, effect, description FROM magic_items "
        "WHERE owner_type = 'system' AND lower(item_type) = 'potion' ORDER BY id"
    )).fetchall()
    if not magic:
        return {"potions_created": 0, "entries_moved": 0, "magic_rows_deleted": 0}

    potions = {}
    for row in conn.execute(sa.text(
        "SELECT id, name, duration FROM potions WHERE owner_type = 'system'"
    )):
        potions.setdefault(_norm(row.name), row)

    created = 0
    for m in magic:
        if _norm(m.name) in potions:
            continue
        new = conn.execute(sa.text(
            "INSERT INTO potions (name, rarity, effect, duration, cost, weight, description, owner_type, owner_id) "
            "VALUES (:name, :rarity, :effect, NULL, '—', '0.5 lb.', :description, 'system', NULL) "
            "RETURNING id, name, duration"
        ), {"name": m.name, "rarity": m.rarity or "Unknown", "effect": m.effect or m.name,
            "description": m.description}).fetchone()
        potions[_norm(m.name)] = new
        created += 1

    magic_ids = {m.id for m in magic}
    magic_names = {_norm(m.name) for m in magic}
    other_magic_ids = {r.id for r in conn.execute(sa.text(
        "SELECT id FROM magic_items WHERE NOT (owner_type = 'system' AND lower(item_type) = 'potion')"
    ))}

    moved = 0
    rows = conn.execute(sa.text(
        "SELECT id, character_data FROM characters WHERE character_data IS NOT NULL"
    )).fetchall()
    for row in rows:
        data = row.character_data
        if not isinstance(data, dict) or not isinstance(data.get("inventory"), list):
            continue
        changed = False
        for entry in data["inventory"]:
            if not isinstance(entry, dict) or entry.get("category") != "magic-items":
                continue
            sid = entry.get("source_id")
            if sid in magic_ids:
                pass
            elif sid in other_magic_ids or _norm(entry.get("name")) not in magic_names:
                continue  # a real (non-potion or homebrew) magic item — leave it
            target = potions.get(_norm(entry.get("name")))
            if target is None:
                continue
            for key in MAGIC_ONLY_KEYS:
                entry.pop(key, None)
            entry["category"] = "potions"
            entry["source_id"] = target.id
            entry["attuned"] = False
            entry.setdefault("duration", target.duration)
            changed = True
            moved += 1
        if changed:
            conn.execute(sa.text("UPDATE characters SET character_data = :d WHERE id = :i"),
                         {"d": json.dumps(data), "i": row.id})

    deleted = conn.execute(sa.text(
        "DELETE FROM magic_items WHERE owner_type = 'system' AND lower(item_type) = 'potion'"
    )).rowcount
    return {"potions_created": created, "entries_moved": moved, "magic_rows_deleted": deleted}


def upgrade() -> None:
    move_potions(op.get_bind())


def downgrade() -> None:
    """
    Deliberately a no-op. The previous release reads potions from the Potions table just as well
    (it lists whatever rows exist), so rolling back needs nothing undone; re-creating the deleted
    magic-item rows would only re-introduce the duplicates this migration removed.
    """
