"""Shared upsert for the seed scripts — deploy ticket T5b.

The seed files are the SOURCE OF TRUTH for system (base-compendium) rows: re-running a seed must
bring an existing row in line with the file, not skip it. Otherwise a corrected spell description
or item weight never reaches a database that was seeded before the fix — production included.

Only ``owner_type=system, owner_id=NULL`` rows are ever matched, so a GM's campaign override or
homebrew with the same name is never touched. An admin's API edit to a SYSTEM row IS overwritten
on the next seed run: change the seed file instead.
"""
from __future__ import annotations

import time
from collections import Counter
from typing import Any, Callable, Optional

from shared.enums import OwnerType

CREATED, UPDATED, UNCHANGED, NOT_OWNED = "created", "updated", "unchanged", "not_owned"
FAILED = "failed"  # a record the seed could not download — never folded into "skipped"

FETCH_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 2.0  # doubled after each failed attempt; tests set it to 0


class SeedFetchError(RuntimeError):
    """A download a seed needs failed even after retries."""


def fetch_json(client, url: str, *, timeout: float = 20):
    """GET ``url`` and return its JSON, retrying transient failures; raise SeedFetchError if all fail.

    The network seeds used to catch every error, print it and carry on, so a timed-out list call
    left production with 15 of ~530 items while the script printed "Done" and exited 0
    (first-deploy T8). Nothing a seed downloads may fail silently: a caller either aborts or
    counts the record as FAILED, and ``exit_if_failed`` turns any failure into a non-zero exit.
    """
    delay = RETRY_DELAY_SECONDS
    last = None
    for attempt in range(1, FETCH_ATTEMPTS + 1):
        try:
            r = client.get(url, timeout=timeout)
            r.raise_for_status()
            return r.json()
        except Exception as exc:  # timeouts, connection errors, HTTP errors, bad JSON
            last = exc
            if attempt < FETCH_ATTEMPTS:
                print(f"  .. retrying {url} ({attempt}/{FETCH_ATTEMPTS - 1}) after: {exc}")
                time.sleep(delay)
                delay *= 2
    raise SeedFetchError(f"could not fetch {url} after {FETCH_ATTEMPTS} attempts: {last}")


def exit_if_failed(failures: list[str], label: str) -> None:
    """End the script with a non-zero exit naming every record that failed to download."""
    if failures:
        shown = ", ".join(failures[:20]) + (" …" if len(failures) > 20 else "")
        raise SystemExit(f"{label}: {len(failures)} record(s) FAILED to download — {shown}. "
                         "Everything else was saved; re-run the script (it is safe to re-run).")


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
    order = (CREATED, UPDATED, UNCHANGED, NOT_OWNED, "skipped", FAILED)
    parts = [f"{counts[k]} {k.replace('_', ' ')}" for k in order if counts.get(k)]
    return ", ".join(parts) or "nothing to do"
