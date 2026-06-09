"""
Feat-effects coverage report.

Walks the seeded feats and prints, per edition, which ones have structured mechanical
`effects` (wired into the app) vs. which are still prose-only (a description card with no
mechanics yet). This is the "what still needs implementing" worklist for turning D&D rules
text into real mechanics — run it to prioritize which feats to mechanize next.

Run: python report_feat_effects.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from shared.database import SessionLocal
from players.feats.models import Feat
from shared.enums import OwnerType


def _is_mechanized(effects):
    """True when a feat has at least one structured (non-'note') effect."""
    return bool(effects) and any(e.get("kind") and e.get("kind") != "note" for e in effects)


def report():
    db = SessionLocal()
    try:
        feats = (
            db.query(Feat)
            .filter(Feat.owner_type == OwnerType.system)
            .order_by(Feat.edition, Feat.name)
            .all()
        )
        by_edition = {}
        for f in feats:
            by_edition.setdefault(f.edition, []).append(f)

        print("=== Feat effects coverage ===")
        for edition in sorted(by_edition):
            rows = by_edition[edition]
            mechanized = [f for f in rows if _is_mechanized(f.effects)]
            prose_only = [f for f in rows if not _is_mechanized(f.effects)]
            total = len(rows)
            pct = (len(mechanized) / total * 100) if total else 0
            print(f"\n{edition}: {len(mechanized)}/{total} mechanized ({pct:.0f}%)")
            if mechanized:
                print("  mechanized: " + ", ".join(f.name for f in mechanized))
            if prose_only:
                print(f"  prose-only ({len(prose_only)} to do): " + ", ".join(f.name for f in prose_only))
    finally:
        db.close()


if __name__ == "__main__":
    report()
