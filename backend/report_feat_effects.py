"""
Feat-effects coverage report.

Walks the seeded feats and prints, per edition, which ones have structured mechanical
`effects` (wired into the app) vs. which are still prose-only (a description card with no
mechanics yet). This is the "what still needs implementing" worklist for turning D&D rules
text into real mechanics — run it to prioritize which feats to mechanize next.

Run: python report_feat_effects.py                 # human worklist (names per bucket)
     python report_feat_effects.py --check         # CI/ship gate: exit 1 if coverage regressed
     python report_feat_effects.py --write-baseline # ratchet the floor up after mechanizing more
"""
import sys
import os
import json
sys.path.insert(0, os.path.dirname(__file__))

from shared.database import SessionLocal
from players.feats.models import Feat
from shared.enums import OwnerType

BASELINE_PATH = os.path.join(os.path.dirname(__file__), "feat_coverage_baseline.json")


def _is_mechanized(effects):
    """True when a feat has at least one structured (non-'note') effect."""
    return bool(effects) and any(e.get("kind") and e.get("kind") != "note" for e in effects)


def _counts():
    """Machine-readable coverage totals — the shape the baseline file + --check use."""
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
        out = {"editions": {}, "overall": {"mechanized": 0, "total": 0}}
        for edition in sorted(by_edition):
            rows = by_edition[edition]
            mech = sum(1 for f in rows if _is_mechanized(f.effects))
            out["editions"][edition] = {"mechanized": mech, "total": len(rows)}
            out["overall"]["mechanized"] += mech
            out["overall"]["total"] += len(rows)
        return out
    finally:
        db.close()


def check():
    """Gate: fail (exit 1) if mechanized coverage dropped below the committed baseline."""
    current = _counts()
    with open(BASELINE_PATH) as fh:
        baseline = json.load(fh)
    failures = []
    if current["overall"]["mechanized"] < baseline["overall"]["mechanized"]:
        failures.append(
            f"overall mechanized {current['overall']['mechanized']} < baseline {baseline['overall']['mechanized']}"
        )
    for edition, base in baseline["editions"].items():
        cur = current["editions"].get(edition, {"mechanized": 0})
        if cur["mechanized"] < base["mechanized"]:
            failures.append(f"{edition} mechanized {cur['mechanized']} < baseline {base['mechanized']}")
    if failures:
        print("FEAT COVERAGE REGRESSION:")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    improved = current["overall"]["mechanized"] > baseline["overall"]["mechanized"]
    msg = f"Feat coverage OK: {current['overall']['mechanized']}/{current['overall']['total']} mechanized"
    if improved:
        msg += " — improved; run `python report_feat_effects.py --write-baseline` to ratchet up."
    print(msg)


def write_baseline():
    with open(BASELINE_PATH, "w") as fh:
        json.dump(_counts(), fh, indent=2)
        fh.write("\n")
    print("Wrote", BASELINE_PATH)


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
    if "--check" in sys.argv:
        check()
    elif "--write-baseline" in sys.argv:
        write_baseline()
    else:
        report()
