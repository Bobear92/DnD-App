"""
Feat-effects coverage report — CLAUSE-level, not feat-level.

A feat is several rules under one name, and the old version of this report counted a feat as
"mechanized" once ANY clause was wired. That let Grappler pass on its +1 ability score while its
headline clause (advantage against the creature you're grappling) sat as display-only text — the
user found it in QA. So coverage is now measured per `note` clause:

  pending      a note with neither tag — NOT built. This is the worklist.
  surfaced     `surfaced: "<where>"` — built on the sheet by a frontend table/card; the note only
               restates it, and the value says where so the claim can be checked.
  unmodelable  `unmodelable: "<missing model>"` — the USER signed off that nothing can model it.

A feat is COMPLETE when it has effects and no pending clause, PARTIAL when some of it is wired but
a pending clause remains, and PROSE-ONLY when everything it has is a pending note.

Run: python report_feat_effects.py                  # the worklist: every pending clause, by edition
     python report_feat_effects.py --check          # CI/ship gate (see check())
     python report_feat_effects.py --write-baseline # ratchet after building more
"""
import sys
import os
import json
sys.path.insert(0, os.path.dirname(__file__))

BASELINE_PATH = os.path.join(os.path.dirname(__file__), "feat_coverage_baseline.json")


# ── Pure classification (no DB) — unit-tested in tests/test_report_feat_effects.py ──────────

def note_status(effect):
    """'surfaced' | 'unmodelable' | 'pending' for a note effect; None for a structured one."""
    if effect.get("kind") != "note":
        return None
    if effect.get("surfaced"):
        return "surfaced"
    if effect.get("unmodelable"):
        return "unmodelable"
    return "pending"


def pending_clauses(effects):
    """The note texts that are still NOT built."""
    return [e.get("text", "") for e in (effects or []) if note_status(e) == "pending"]


def feat_status(effects):
    """'complete' | 'partial' | 'prose'."""
    effects = effects or []
    pending = pending_clauses(effects)
    if effects and not pending:
        return "complete"
    done = [e for e in effects if note_status(e) != "pending"]
    return "partial" if done else "prose"


def counts_from(feats):
    """Totals per edition from `(edition, name, effects)` rows — the baseline/--check shape."""
    out = {"editions": {}, "overall": {"complete": 0, "pending_clauses": 0, "total": 0}}
    for edition, _name, effects in feats:
        ed = out["editions"].setdefault(edition, {"complete": 0, "pending_clauses": 0, "total": 0})
        ed["total"] += 1
        ed["pending_clauses"] += len(pending_clauses(effects))
        if feat_status(effects) == "complete":
            ed["complete"] += 1
    for ed in out["editions"].values():
        for k in ("complete", "pending_clauses", "total"):
            out["overall"][k] += ed[k]
    return out


def regressions(current, baseline):
    """Failures of the ratchet: complete feats must not DROP, pending clauses must not RISE.

    The second half is what the old feat-level gate lacked — adding a text-only note to a feat
    that already had one wired effect used to pass silently. Now it fails CI until built (or
    signed off as unmodelable by the user)."""
    failures = []
    scopes = [("overall", current["overall"], baseline["overall"])] + [
        (ed, current["editions"].get(ed, {"complete": 0, "pending_clauses": 0}), base)
        for ed, base in baseline["editions"].items()
    ]
    for label, cur, base in scopes:
        if cur["complete"] < base["complete"]:
            failures.append(f"{label}: complete feats {cur['complete']} < baseline {base['complete']}")
        if cur["pending_clauses"] > base["pending_clauses"]:
            failures.append(
                f"{label}: pending clauses {cur['pending_clauses']} > baseline {base['pending_clauses']}"
            )
    return failures


# ── DB-backed commands ──────────────────────────────────────────────────────────────────────

def _load():
    from shared.database import SessionLocal
    from players.feats.models import Feat
    from shared.enums import OwnerType
    db = SessionLocal()
    try:
        rows = (
            db.query(Feat)
            .filter(Feat.owner_type == OwnerType.system)
            .order_by(Feat.edition, Feat.name)
            .all()
        )
        return [(f.edition, f.name, f.effects or []) for f in rows]
    finally:
        db.close()


def check():
    current = counts_from(_load())
    with open(BASELINE_PATH) as fh:
        baseline = json.load(fh)
    failures = regressions(current, baseline)
    if failures:
        print("FEAT COVERAGE REGRESSION:")
        for f in failures:
            print("  -", f)
        print("A new text-only `note` must be built, tagged `surfaced=` (where it is on the sheet), "
              "or signed off by the user as `unmodelable=`.")
        sys.exit(1)
    o, b = current["overall"], baseline["overall"]
    msg = (f"Feat coverage OK: {o['complete']}/{o['total']} feats complete, "
           f"{o['pending_clauses']} clauses pending")
    if o["complete"] > b["complete"] or o["pending_clauses"] < b["pending_clauses"]:
        msg += " — improved; run `python report_feat_effects.py --write-baseline` to ratchet."
    print(msg)


def write_baseline():
    with open(BASELINE_PATH, "w") as fh:
        json.dump(counts_from(_load()), fh, indent=2)
        fh.write("\n")
    print("Wrote", BASELINE_PATH)


def report():
    feats = _load()
    by_edition = {}
    for row in feats:
        by_edition.setdefault(row[0], []).append(row)
    print("=== Feat coverage (clause-level) ===")
    for edition in sorted(by_edition):
        rows = by_edition[edition]
        complete = [n for _e, n, eff in rows if feat_status(eff) == "complete"]
        todo = [(n, eff) for _e, n, eff in rows if feat_status(eff) != "complete"]
        n_pending = sum(len(pending_clauses(eff)) for _n, eff in todo)
        print(f"\n{edition}: {len(complete)}/{len(rows)} feats complete, {n_pending} clauses pending")
        for name, eff in todo:
            tag = "prose-only" if feat_status(eff) == "prose" else "partial"
            for text in pending_clauses(eff):
                print(f"  - {name} [{tag}]: {text}")
        signed = [(n, e) for _e, n, eff in rows for e in eff if note_status(e) == "unmodelable"]
        if signed:
            print(f"  signed off as unmodelable ({len(signed)}):")
            for name, e in signed:
                print(f"    · {name}: {e.get('text')} — {e['unmodelable']}")


if __name__ == "__main__":
    if "--check" in sys.argv:
        check()
    elif "--write-baseline" in sys.argv:
        write_baseline()
    else:
        report()
