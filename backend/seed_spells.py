"""
Seed script: fetches all 5e spells from the D&D 5e API and populates the spells table.

Run: python seed_spells.py

UPSERTS (deploy ticket T5b): a spell already in the database is brought in line with the API —
description, level, school, range, components and the rest — so a corrected text reaches an
already-seeded database. Only system rows are touched (shared/seeding.py); campaign overrides are
never matched. The Artificer tag (seed_artificer_spells.py's list) is applied here too, so a re-run
doesn't strip it. Safe to re-run.
"""
import sys
import os
import time
from collections import Counter
sys.path.insert(0, os.path.dirname(__file__))

import httpx
from shared.database import SessionLocal
from shared.encyclopedia.spells.models import Spell
from shared.seeding import FAILED, SeedFetchError, exit_if_failed, fetch_json, upsert_system_row, summary
from seed_artificer_spells import ARTIFICER_SPELLS

API_BASE = "https://www.dnd5eapi.co"
_ARTIFICER = set(ARTIFICER_SPELLS)


def _fmt_components(spell_data: dict) -> str:
    parts = spell_data.get("components", [])
    material = spell_data.get("material", "")
    joined = ", ".join(parts)
    if "M" in parts and material:
        joined += f" ({material})"
    return joined or "None"


def spell_values(data: dict) -> dict:
    """The columns a system spell gets from its API record (everything but name/edition)."""
    classes = [c["name"] for c in data.get("classes", [])]
    if data["name"] in _ARTIFICER and "Artificer" not in classes:
        classes.append("Artificer")  # the SRD never tags Artificer; see seed_artificer_spells.py
    higher_level_parts = data.get("higher_level", [])
    return {
        "level": data["level"],
        "school": data["school"]["name"],
        "casting_time": data.get("casting_time", ""),
        "range": data.get("range", ""),
        "components": _fmt_components(data),
        "duration": data.get("duration", ""),
        "description": "\n\n".join(data.get("desc", [])),
        "higher_level": "\n\n".join(higher_level_parts) if higher_level_parts else None,
        "ritual": data.get("ritual", False),
        "concentration": data.get("concentration", False),
        "classes": ", ".join(classes) or "Unknown",
    }


def seed_spells(client=None, delay=0.05):
    db = SessionLocal()
    own_client = client is None
    client = client or httpx.Client(timeout=15, follow_redirects=True)
    try:
        print("Fetching spell list from D&D 5e API...")
        # A failed list download raises SeedFetchError: there is nothing to seed from.
        spell_list = fetch_json(client, f"{API_BASE}/api/spells").get("results", [])
        print(f"Found {len(spell_list)} spells.")

        counts = Counter()
        failures = []
        for i, entry in enumerate(spell_list, start=1):
            try:
                data = fetch_json(client, f"{API_BASE}/api/spells/{entry['index']}")
            except SeedFetchError as exc:
                print(f"  !! {exc}")
                counts[FAILED] += 1
                failures.append(entry["index"])
                continue
            _, status = upsert_system_row(db, Spell, {"name": data["name"], "edition": "5e"}, spell_values(data))
            counts[status] += 1
            if i % 25 == 0:
                db.commit()
                print(f"  ...{i} spells processed")
            time.sleep(delay)  # be polite to the API

        db.commit()
        print(f"\nSpells: {summary(counts)}.")
        exit_if_failed(failures, "seed_spells.py")
        print("Done.")
        return counts
    finally:
        if own_client:
            client.close()
        db.close()


if __name__ == "__main__":
    seed_spells()
