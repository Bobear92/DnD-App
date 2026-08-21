"""backfill weapon range into character inventory snapshots

Revision ID: 2acc0cc10b51
Revises: 94ae0568d367
Create Date: 2026-08-21 16:17:35.268342

"""
from typing import Sequence, Union

from alembic import op
import json

import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2acc0cc10b51'
down_revision: Union[str, Sequence[str], None] = '94ae0568d367'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Fill `range_normal`/`range_long` on the weapon entries already stored in every character's
    `character_data.inventory`.

    Those entries are SNAPSHOTS of an encyclopedia item taken when the weapon was added, so the
    columns added in 94ae0568d367 do not reach a weapon anyone already owns — every stored bow
    would show no range band forever. Telling players to remove and re-add the weapon is not a
    fix: that discards equipped state, hand assignment, and any bonded/Hex Warrior designation
    pointing at the entry's uid.

    Matches on `source_id` first (the encyclopedia row the snapshot came from) and falls back to
    the name, for entries whose source row was deleted or that predate source_id.

    Only ever WRITES onto an entry missing a band, and only from a weapon that has one — so a
    melee weapon stays bandless and a re-run changes nothing.
    """
    conn = op.get_bind()

    ranges_by_id = {}
    ranges_by_name = {}
    for row in conn.execute(sa.text(
        "SELECT id, name, range_normal, range_long FROM weapons WHERE range_normal IS NOT NULL"
    )):
        ranges_by_id[row.id] = (row.range_normal, row.range_long)
        ranges_by_name[(row.name or "").strip().lower()] = (row.range_normal, row.range_long)

    if not ranges_by_id:
        return

    rows = conn.execute(sa.text(
        "SELECT id, character_data FROM characters WHERE character_data IS NOT NULL"
    )).fetchall()

    for row in rows:
        data = row.character_data
        if not isinstance(data, dict):
            continue
        inventory = data.get("inventory")
        if not isinstance(inventory, list):
            continue

        changed = False
        for entry in inventory:
            if not isinstance(entry, dict) or entry.get("category") != "weapons":
                continue
            if entry.get("range_normal") is not None:
                continue
            band = ranges_by_id.get(entry.get("source_id"))
            if band is None:
                band = ranges_by_name.get(str(entry.get("name") or "").strip().lower())
            if band is None:
                continue
            entry["range_normal"], entry["range_long"] = band
            changed = True

        if changed:
            conn.execute(
                sa.text("UPDATE characters SET character_data = :d WHERE id = :i"),
                {"d": json.dumps(data), "i": row.id},
            )


def downgrade() -> None:
    """
    Strip the band back off the stored snapshots.

    Deliberately removes the keys entirely rather than setting them to null, so an entry looks
    exactly as it did before the upgrade ran.
    """
    conn = op.get_bind()
    rows = conn.execute(sa.text(
        "SELECT id, character_data FROM characters WHERE character_data IS NOT NULL"
    )).fetchall()

    for row in rows:
        data = row.character_data
        if not isinstance(data, dict):
            continue
        inventory = data.get("inventory")
        if not isinstance(inventory, list):
            continue

        changed = False
        for entry in inventory:
            if not isinstance(entry, dict) or entry.get("category") != "weapons":
                continue
            for key in ("range_normal", "range_long"):
                if key in entry:
                    entry.pop(key)
                    changed = True

        if changed:
            conn.execute(
                sa.text("UPDATE characters SET character_data = :d WHERE id = :i"),
                {"d": json.dumps(data), "i": row.id},
            )
