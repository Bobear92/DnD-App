"""
Seed script: fetches all 5e spells from the D&D 5e API and populates the spells table.

Run: python seed_spells.py

Uses httpx (already in requirements). Skips spells that already exist (by name +
owner_type=system). Safe to re-run.
"""
import sys
import os
import time
sys.path.insert(0, os.path.dirname(__file__))

import httpx
from shared.database import SessionLocal
from shared.encyclopedia.spells.models import Spell
from shared.enums import OwnerType

API_BASE = "https://www.dnd5eapi.co"


def _fmt_components(spell_data: dict) -> str:
    parts = spell_data.get("components", [])
    material = spell_data.get("material", "")
    joined = ", ".join(parts)
    if "M" in parts and material:
        joined += f" ({material})"
    return joined or "None"


def _fetch_spell_detail(client: httpx.Client, index: str) -> dict | None:
    try:
        r = client.get(f"{API_BASE}/api/spells/{index}", timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  !! Failed to fetch {index}: {e}")
        return None


def seed_spells():
    db = SessionLocal()
    try:
        with httpx.Client(timeout=15, follow_redirects=True) as client:
            print("Fetching spell list from D&D 5e API...")
            r = client.get(f"{API_BASE}/api/spells")
            r.raise_for_status()
            spell_list = r.json().get("results", [])
            print(f"Found {len(spell_list)} spells.")

            created = 0
            skipped = 0

            for i, entry in enumerate(spell_list):
                index = entry["index"]
                name = entry["name"]

                existing = db.query(Spell).filter(
                    Spell.name == name,
                    Spell.edition == "5e",
                    Spell.owner_type == OwnerType.system,
                    Spell.owner_id.is_(None),
                ).first()

                data = _fetch_spell_detail(client, index)
                if not data:
                    skipped += 1
                    continue

                classes = ", ".join(c["name"] for c in data.get("classes", []))
                description = "\n\n".join(data.get("desc", []))
                higher_level_parts = data.get("higher_level", [])
                higher_level = "\n\n".join(higher_level_parts) if higher_level_parts else None

                if existing:
                    # Update fields that may be missing from earlier seed runs
                    existing.higher_level = higher_level
                    existing.ritual = data.get("ritual", False)
                    existing.concentration = data.get("concentration", False)
                    existing.components = _fmt_components(data)
                    skipped += 1
                else:
                    spell = Spell(
                        name=data["name"],
                        edition="5e",
                        level=data["level"],
                        school=data["school"]["name"],
                        casting_time=data.get("casting_time", ""),
                        range=data.get("range", ""),
                        components=_fmt_components(data),
                        duration=data.get("duration", ""),
                        description=description,
                        higher_level=higher_level,
                        ritual=data.get("ritual", False),
                        concentration=data.get("concentration", False),
                        classes=classes or "Unknown",
                        owner_type=OwnerType.system,
                        owner_id=None,
                    )
                    db.add(spell)
                    created += 1

                if created % 25 == 0:
                    db.commit()
                    print(f"  Committed {created} spells so far...")

                # Small delay to be polite to the API
                time.sleep(0.05)

            db.commit()
            print(f"\nDone. Created {created} new spells, updated {skipped} existing.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_spells()
