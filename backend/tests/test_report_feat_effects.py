"""The clause-level feat coverage report + guards on how notes are tagged.

The report used to count a feat as done once ANY clause was wired, which is how Grappler passed on
its +1 ability score while its headline clause sat as display-only text. These tests pin the
clause-level rules and the ratchet (pure functions, no DB).
"""
import pytest

from report_feat_effects import (
    note_status, pending_clauses, feat_status, counts_from, regressions,
)
from seed_feats import FEAT_EFFECTS_5E, FEAT_EFFECTS_2024, _note

STRUCT = {"kind": "stat_mod", "stat": "initiative", "amount": 5}
PENDING = {"kind": "note", "text": "Can't be surprised."}
SURFACED = {"kind": "note", "text": "Advantage vs grappled.", "surfaced": "Grapple Attack card"}
UNMODELABLE = {"kind": "note", "text": "Read lips.", "unmodelable": "no computed number"}


class TestNoteStatus:
    def test_the_three_statuses(self):
        assert note_status(PENDING) == "pending"
        assert note_status(SURFACED) == "surfaced"
        assert note_status(UNMODELABLE) == "unmodelable"

    def test_a_structured_effect_has_no_note_status(self):
        assert note_status(STRUCT) is None

    def test_the_helper_builds_each_status(self):
        assert note_status(_note("x")) == "pending"
        assert note_status(_note("x", surfaced="somewhere")) == "surfaced"
        assert note_status(_note("x", unmodelable="no model")) == "unmodelable"


class TestFeatStatus:
    # The Grappler case: one structured effect used to make the whole feat "mechanized".
    def test_one_wired_effect_no_longer_hides_a_pending_clause(self):
        assert feat_status([STRUCT, PENDING]) == "partial"
        assert pending_clauses([STRUCT, PENDING]) == ["Can't be surprised."]

    def test_complete_when_every_note_is_surfaced_or_signed_off(self):
        assert feat_status([STRUCT, SURFACED, UNMODELABLE]) == "complete"

    def test_a_feat_of_only_surfaced_notes_is_complete(self):
        # e.g. 2014 Charger: the card is built frontend-side; the note just restates it.
        assert feat_status([SURFACED]) == "complete"

    def test_only_pending_notes_is_prose(self):
        assert feat_status([PENDING]) == "prose"

    def test_no_effects_is_prose(self):
        assert feat_status([]) == "prose"
        assert feat_status(None) == "prose"


class TestCountsAndRatchet:
    FEATS = [
        ("5e", "A", [STRUCT]),
        ("5e", "B", [STRUCT, PENDING]),
        ("5.5e", "C", [PENDING, PENDING]),
    ]

    def test_counts(self):
        c = counts_from(self.FEATS)
        assert c["editions"]["5e"] == {"complete": 1, "pending_clauses": 1, "total": 2}
        assert c["editions"]["5.5e"] == {"complete": 0, "pending_clauses": 2, "total": 1}
        assert c["overall"] == {"complete": 1, "pending_clauses": 3, "total": 3}

    def test_no_regression_against_itself(self):
        c = counts_from(self.FEATS)
        assert regressions(c, c) == []

    # The half the old gate lacked: a new text-only note on an already-wired feat.
    def test_adding_a_pending_note_fails_the_gate(self):
        base = counts_from(self.FEATS)
        worse = counts_from(self.FEATS[:1] + [("5e", "B", [STRUCT, PENDING, PENDING])] + self.FEATS[2:])
        failures = regressions(worse, base)
        assert any("pending clauses" in f for f in failures)

    def test_losing_a_complete_feat_fails_the_gate(self):
        base = counts_from(self.FEATS)
        worse = counts_from([("5e", "A", [PENDING])] + self.FEATS[1:])
        assert any("complete feats" in f for f in regressions(worse, base))

    def test_building_a_clause_is_an_improvement_not_a_failure(self):
        base = counts_from(self.FEATS)
        better = counts_from(self.FEATS[:1] + [("5e", "B", [STRUCT, SURFACED])] + self.FEATS[2:])
        assert regressions(better, base) == []


ALL_NOTES = [
    (ed, name, e)
    for ed, table in (("5e", FEAT_EFFECTS_5E), ("5.5e", FEAT_EFFECTS_2024))
    for name, effects in table.items()
    for e in effects
    if e.get("kind") == "note"
]


@pytest.mark.parametrize("ed,name,note", ALL_NOTES, ids=[f"{ed}-{n}" for ed, n, _ in ALL_NOTES])
class TestAuthoredNotes:
    def test_a_note_has_at_most_one_status_tag(self, ed, name, note):
        assert not (note.get("surfaced") and note.get("unmodelable")), (
            f"{ed} {name}: a clause is either built on the sheet or signed off as unmodelable, not both"
        )

    def test_a_status_tag_says_something(self, ed, name, note):
        for tag in ("surfaced", "unmodelable"):
            if tag in note:
                assert isinstance(note[tag], str) and note[tag].strip(), (
                    f"{ed} {name}: `{tag}` must name where it is / the missing model"
                )
