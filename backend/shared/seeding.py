"""Shared upsert for the seed scripts — deploy ticket T5b.

The seed files are the SOURCE OF TRUTH for system (base-compendium) rows: re-running a seed must
bring an existing row in line with the file, not skip it. Otherwise a corrected spell description
or item weight never reaches a database that was seeded before the fix — production included.

Only ``owner_type=system, owner_id=NULL`` rows are ever matched, so a GM's campaign override or
homebrew with the same name is never touched. An admin's API edit to a SYSTEM row IS overwritten
on the next seed run: change the seed file instead.
"""
from __future__ import annotations

from collections import Counter
from typing import Any, Callable, Optional

from shared.enums import OwnerType

CREATED, UPDATED, UNCHANGED, NOT_OWNED = "created", "updated", "unchanged", "not_owned"


def upsert_system_row(
    db,
    model,
    match: dict[str, Any],
    values: dict[str, Any],
    *,
    owns: Optional[Callable[[Any], bool]] = None,
):
    """Create or update the system row identified by ``match`` so its columns equal ``values``.

    ``owns(row)`` — when given and it returns False for an existing row, the row belongs to another
    seed (two seeds can produce the same name) and is left alone.

    Returns ``(row, status)`` with status one of created / updated / unchanged / not_owned.
    The caller commits.
    """
    row = (
        db.query(model)
        .filter_by(**match, owner_type=OwnerType.system)
        .filter(model.owner_id.is_(None))
        .first()
    )
    if row is None:
        row = model(**match, **values, owner_type=OwnerType.system, owner_id=None)
        db.add(row)
        return row, CREATED
    if owns is not None and not owns(row):
        return row, NOT_OWNED
    changed = False
    for column, value in values.items():
        if getattr(row, column) != value:
            setattr(row, column, value)
            changed = True
    return row, (UPDATED if changed else UNCHANGED)


def summary(counts: Counter) -> str:
    """'3 created, 2 updated, 40 unchanged' — zero buckets omitted."""
    order = (CREATED, UPDATED, UNCHANGED, NOT_OWNED, "skipped")
    parts = [f"{counts[k]} {k.replace('_', ' ')}" for k in order if counts.get(k)]
    return ", ".join(parts) or "nothing to do"
