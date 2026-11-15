"""The rest-resource table, the long-rest HP restore, and the dry-run preview.

`_compute_rest_patch` used to be ~250 lines of per-class `if` branches, mirrored by hand in the
frontend's rest dialog. It is now a row table (`_REST_RESOURCES`), and the dialog shows a DRY RUN of
it. These tests cover what the consolidation changed or newly guarantees; the per-subclass "which
pool comes back on which rest" cases live in test_characters.py::TestApplyRest and still pass
unchanged, which is the evidence the table reproduces the old branches.
"""
import json
import os
from pathlib import Path
from types import SimpleNamespace

import pytest

from players.characters.service import (
    _REST_RESOURCES,
    _RACIAL_REST_RESOURCES,
    _effective_max_hp,
    rest_resources_contract,
)
from tests.conftest import invite_player, make_campaign, make_user

FIXTURES = Path(__file__).parent / "fixtures"
CONTRACT_PATH = FIXTURES / "rest_resources_contract.json"
MAX_HP_CASES = json.loads((FIXTURES / "max_hp_cases.json").read_text(encoding="utf-8"))["cases"]


def _setup(client, edition=None):
    h_gm, _ = make_user(client, 1)
    h_player, player_id = make_user(client, 2)
    campaign_id = make_campaign(client, h_gm)
    invite_player(client, h_gm, campaign_id, player_id)
    if edition:
        client.put(f"/api/gm/campaigns/{campaign_id}", json={"edition": edition}, headers=h_gm)
    return h_gm, h_player, campaign_id


def _create(client, headers, campaign_id, *, cls="Fighter", level=5, data=None, **scores):
    payload = {
        "name": "TestChar", "race": "Human", "char_class": cls, "level": level,
        "campaign_id": campaign_id, **scores,
    }
    if data is not None:
        payload["character_data"] = data
    resp = client.post("/api/characters", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _rest(client, headers, campaign_id, rest_type, char_ids, **extra):
    resp = client.post(
        f"/api/characters/campaign/{campaign_id}/rest",
        json={"rest_type": rest_type, "character_ids": char_ids, **extra},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def _data(client, headers, char_id):
    return client.get(f"/api/characters/{char_id}", headers=headers).json()["character_data"]


def _changes(body):
    return body["applied_to"][0]["changes"]


# ── Maximum HP (shared fixture — the frontend runs the same cases) ─────────────

class TestEffectiveMaxHp:
    @pytest.mark.parametrize("case", MAX_HP_CASES, ids=[c["name"] for c in MAX_HP_CASES])
    def test_matches_shared_fixture(self, case):
        char = SimpleNamespace(
            char_class=case["char_class"], level=case["level"], constitution=case["constitution"],
        )
        assert _effective_max_hp(char, case["character_data"]) == case["expected"]

    def test_a_missing_constitution_score_counts_as_ten(self):
        char = SimpleNamespace(char_class="Fighter", level=3, constitution=None)
        assert _effective_max_hp(char, {"hp_rolls": 20}) == 20

    def test_a_feat_stored_as_a_bare_name_still_counts(self):
        char = SimpleNamespace(char_class="Fighter", level=2, constitution=10)
        assert _effective_max_hp(char, {"hp_rolls": 12, "feats": ["Tough"]}) == 16

    def test_a_boolean_is_not_a_hit_point_total(self):
        # bool is an int subclass in Python; `hp_rolls: true` must not read as 1 hit point.
        char = SimpleNamespace(char_class="Fighter", level=2, constitution=10)
        assert _effective_max_hp(char, {"hp_rolls": True}) is None


# ── Long rest restores HP ─────────────────────────────────────────────────────

class TestLongRestRestoresHp:
    def test_restores_a_character_that_stores_only_hp_rolls(self, client):
        """The bug: creation and level-up write `hp_rolls`, never `hp_max`, and the long rest
        read `hp_max` — so every character made since the hp_rolls model kept their wounds."""
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=5, constitution=16,
                          data={"hp_rolls": 34, "current_hp": 3})

        body = _rest(client, h_gm, cid, "long", [char_id])

        assert _data(client, h_gm, char_id)["current_hp"] == 49  # 34 + 5 levels × CON +3
        assert "HP restored to 49" in _changes(body)

    def test_restore_includes_the_tough_feat(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=4, constitution=14,
                          data={"hp_rolls": 28, "current_hp": 1, "feats": [{"id": 1, "name": "Tough"}]})

        _rest(client, h_gm, cid, "long", [char_id])

        assert _data(client, h_gm, char_id)["current_hp"] == 44  # 28 + 4×2 CON + 4×2 Tough

    def test_restore_includes_dwarven_toughness(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=3, constitution=14,
                          data={"hp_rolls": 22, "current_hp": 5, "race_traits": ["Dwarven Toughness"]})

        _rest(client, h_gm, cid, "long", [char_id])

        assert _data(client, h_gm, char_id)["current_hp"] == 31

    def test_restore_includes_draconic_resilience(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, cls="Sorcerer", level=6, constitution=14,
                          data={"hp_rolls": 26, "current_hp": 2, "subclass": "Draconic Bloodline"})

        _rest(client, h_gm, cid, "long", [char_id])

        assert _data(client, h_gm, char_id)["current_hp"] == 44

    def test_a_legacy_hp_max_character_is_still_restored(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=5, constitution=16,
                          data={"hp_max": 50, "current_hp": 10})

        _rest(client, h_gm, cid, "long", [char_id])

        assert _data(client, h_gm, char_id)["current_hp"] == 50

    def test_a_sheet_with_no_stored_hp_is_left_alone(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, data={"current_hp": 7})

        body = _rest(client, h_gm, cid, "long", [char_id])

        assert _data(client, h_gm, char_id)["current_hp"] == 7
        assert not any(c.startswith("HP restored") for c in _changes(body))

    def test_a_short_rest_never_touches_hp(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, data={"hp_rolls": 34, "current_hp": 3, "temp_hp": 4})

        _rest(client, h_gm, cid, "short", [char_id])

        cd = _data(client, h_gm, char_id)
        assert cd["current_hp"] == 3
        assert cd["temp_hp"] == 4

    def test_a_long_rest_clears_temporary_hit_points(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, data={"hp_rolls": 34, "current_hp": 3, "temp_hp": 9})

        _rest(client, h_gm, cid, "long", [char_id])

        assert _data(client, h_gm, char_id)["temp_hp"] == 0


# ── Dry run ───────────────────────────────────────────────────────────────────

class TestRestDryRun:
    SPENT = {
        "hp_rolls": 34, "current_hp": 3, "temp_hp": 5, "hit_dice_used": 3,
        "second_wind_used": 1, "action_surge_used": 1, "indomitable_used": 1,
    }

    def test_long_dry_run_reports_changes_and_saves_nothing(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=9, data=dict(self.SPENT))

        body = _rest(client, h_gm, cid, "long", [char_id], dry_run=True)

        changes = _changes(body)
        assert "HP restored to 34" in changes
        assert "Indomitable recovered" in changes
        assert _data(client, h_gm, char_id) == self.SPENT

    def test_short_dry_run_saves_nothing(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=9, data=dict(self.SPENT))

        body = _rest(client, h_gm, cid, "short", [char_id], dry_run=True)

        assert "Second Wind recovered" in _changes(body)
        assert _data(client, h_gm, char_id) == self.SPENT

    def test_initiative_dry_run_saves_nothing(self, client):
        h_gm, _, cid = _setup(client)
        spent = {"subclass": "Arcane Archer", "arcane_shot_used": 2}
        char_id = _create(client, h_gm, cid, level=15, data=dict(spent))

        body = _rest(client, h_gm, cid, "initiative", [char_id], dry_run=True)

        assert any("Ever-Ready Shot" in c for c in _changes(body))
        assert _data(client, h_gm, char_id) == spent

    def test_dry_run_reports_exactly_what_the_real_rest_then_reports(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=9, data=dict(self.SPENT))

        preview = _rest(client, h_gm, cid, "long", [char_id], dry_run=True)
        real = _rest(client, h_gm, cid, "long", [char_id])

        assert preview == real

    def test_dry_run_defaults_to_off(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, data={"second_wind_used": 1})

        _rest(client, h_gm, cid, "short", [char_id])

        assert _data(client, h_gm, char_id)["second_wind_used"] == 0

    def test_player_cannot_dry_run(self, client):
        h_gm, h_player, cid = _setup(client)
        char_id = _create(client, h_gm, cid)
        resp = client.post(
            f"/api/characters/campaign/{cid}/rest",
            json={"rest_type": "long", "character_ids": [char_id], "dry_run": True},
            headers=h_player,
        )
        assert resp.status_code == 403

    def test_non_member_cannot_dry_run(self, client):
        h_gm, _, cid = _setup(client)
        h_outsider, _ = make_user(client, 3)
        char_id = _create(client, h_gm, cid)
        resp = client.post(
            f"/api/characters/campaign/{cid}/rest",
            json={"rest_type": "long", "character_ids": [char_id], "dry_run": True},
            headers=h_outsider,
        )
        assert resp.status_code == 403

    def test_dry_run_lists_every_selected_character(self, client):
        h_gm, _, cid = _setup(client)
        a = _create(client, h_gm, cid, cls="Fighter")
        b = _create(client, h_gm, cid, cls="Barbarian", data={"rages_used": 2})

        body = _rest(client, h_gm, cid, "long", [a, b], dry_run=True)

        by_id = {item["character_id"]: item["changes"] for item in body["applied_to"]}
        assert "Second Wind recovered" in by_id[a]
        assert "Rages recovered" in by_id[b]
        assert _data(client, h_gm, b)["rages_used"] == 2


# ── Core Fighter pools are level-gated ────────────────────────────────────────

class TestFighterCoreLevelGates:
    """The old branch promised "Action Surge, Second Wind & Indomitable recovered" to a level-1
    Fighter. Each is now its own row gated on the level the feature is gained."""

    def test_level_one_gets_second_wind_only(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=1)

        changes = _changes(_rest(client, h_gm, cid, "long", [char_id]))

        assert "Second Wind recovered" in changes
        assert "Action Surge recovered" not in changes
        assert "Indomitable recovered" not in changes

    def test_level_two_adds_action_surge(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=2)

        changes = _changes(_rest(client, h_gm, cid, "short", [char_id]))

        assert "Action Surge recovered" in changes
        assert "Indomitable recovered" not in changes

    def test_indomitable_arrives_at_ninth_and_only_on_a_long_rest(self, client):
        h_gm, _, cid = _setup(client)
        eighth = _create(client, h_gm, cid, level=8)
        ninth = _create(client, h_gm, cid, level=9, data={"indomitable_used": 1})

        assert "Indomitable recovered" not in _changes(_rest(client, h_gm, cid, "long", [eighth]))
        assert "Indomitable recovered" not in _changes(_rest(client, h_gm, cid, "short", [ninth]))
        assert _data(client, h_gm, ninth)["indomitable_used"] == 1

        assert "Indomitable recovered" in _changes(_rest(client, h_gm, cid, "long", [ninth]))
        assert _data(client, h_gm, ninth)["indomitable_used"] == 0

    def test_a_long_rest_also_recovers_the_short_rest_pools(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, level=5,
                          data={"second_wind_used": 1, "action_surge_used": 1})

        _rest(client, h_gm, cid, "long", [char_id])

        cd = _data(client, h_gm, char_id)
        assert cd["second_wind_used"] == 0
        assert cd["action_surge_used"] == 0


# ── Every other class, through the table ──────────────────────────────────────

# (class, edition, level, rest_type, spent character_data, expected data after, expected message)
CLASS_CASES = [
    ("Barbarian", "5e", 5, "long", {"rages_used": 2}, {"rages_used": 0}, "Rages recovered"),
    ("Bard", "5e", 3, "long", {"bardic_inspiration_used": 2}, {"bardic_inspiration_used": 0}, "Bardic Inspiration recovered"),
    ("Bard", "5e", 5, "short", {"bardic_inspiration_used": 2}, {"bardic_inspiration_used": 0}, "Bardic Inspiration recovered"),
    ("Bard", "5.5e", 1, "short", {"bardic_inspiration_used": 2}, {"bardic_inspiration_used": 0}, "Bardic Inspiration recovered"),
    ("Cleric", "5e", 3, "long", {"channel_divinity_used": 1, "prepared_locked": True},
     {"channel_divinity_used": 0, "prepared_locked": False}, "Channel Divinity recovered"),
    ("Cleric", "5.5e", 3, "short", {"channel_divinity_used": 1}, {"channel_divinity_used": 0}, "Channel Divinity recovered"),
    ("Paladin", "5.5e", 3, "short", {"channel_divinity_used": 1}, {"channel_divinity_used": 0}, "Channel Divinity recovered"),
    ("Paladin", "5e", 3, "long", {"lay_on_hands_used": 9, "divine_sense_used": 2, "prepared_locked": True},
     {"lay_on_hands_used": 0, "divine_sense_used": 0, "prepared_locked": False}, "Lay on Hands & Divine Sense recovered"),
    ("Druid", "5e", 3, "long", {"wild_shape_used": 2, "prepared_locked": True},
     {"wild_shape_used": 0, "prepared_locked": False}, "Wild Shape recovered"),
    ("Monk", "5e", 3, "short", {"ki_used": 3}, {"ki_used": 0}, "Ki points recovered"),
    ("Monk", "5.5e", 3, "short", {"ki_used": 3}, {"ki_used": 0}, "Focus points recovered"),
    ("Monk", "5.5e", 3, "long", {"uncanny_metabolism_used": 1}, {"uncanny_metabolism_used": 0}, "Uncanny Metabolism recovered"),
    ("Ranger", "5e", 3, "long", {"prepared_locked": True}, {"prepared_locked": False}, "Spell preparation unlocked"),
    ("Sorcerer", "5e", 3, "long", {"sorcery_points_used": 3}, {"sorcery_points_used": 0}, "Sorcery points recovered"),
    ("Sorcerer", "5.5e", 3, "long", {"innate_sorcery_used": True}, {"innate_sorcery_used": False}, "Innate Sorcery refreshed"),
    ("Warlock", "5e", 3, "short", {"pact_slots_used": 2}, {"pact_slots_used": 0}, "Pact magic slots recovered"),
    ("Warlock", "5.5e", 3, "long", {"magical_cunning_used": True}, {"magical_cunning_used": False}, "Magical Cunning refreshed"),
    ("Wizard", "5e", 3, "short", {"arcane_recovery_used": True}, {"arcane_recovery_used": False}, "Arcane Recovery refreshed"),
    ("Wizard", "5.5e", 3, "long", {"memorize_spell_used": True, "prepared_locked": True},
     {"memorize_spell_used": False, "prepared_locked": False}, "Memorize Spell refreshed"),
    ("Artificer", "5e", 3, "long", {"flash_of_genius_used": 2, "prepared_locked": True},
     {"flash_of_genius_used": 0, "prepared_locked": False}, "Flash of Genius recovered"),
]


class TestClassRowsRecover:
    @pytest.mark.parametrize(
        "cls,edition,level,rest_type,spent,expected,message", CLASS_CASES,
        ids=[f"{c[0]}-{c[1]}-L{c[2]}-{c[3]}-{c[6]}" for c in CLASS_CASES],
    )
    def test_row_resets_and_reports(self, client, cls, edition, level, rest_type, spent, expected, message):
        h_gm, _, cid = _setup(client, edition=edition)
        char_id = _create(client, h_gm, cid, cls=cls, level=level, data=dict(spent))

        changes = _changes(_rest(client, h_gm, cid, rest_type, [char_id]))

        cd = _data(client, h_gm, char_id)
        for key, value in expected.items():
            assert cd[key] == value, key
        assert message in changes


# (class, edition, level, rest_type, spent data, message that must NOT appear)
CLASS_NEGATIVE_CASES = [
    # A 5e Bard gets Inspiration back on a short rest only from 5th (Font of Inspiration).
    ("Bard", "5e", 4, "short", {"bardic_inspiration_used": 2}, "Bardic Inspiration recovered"),
    # Channel Divinity is a short-rest resource in 2024 only.
    ("Cleric", "5e", 3, "short", {"channel_divinity_used": 1}, "Channel Divinity recovered"),
    ("Paladin", "5e", 3, "short", {"channel_divinity_used": 1}, "Channel Divinity recovered"),
    # Long-rest-only pools survive a short rest.
    ("Barbarian", "5e", 5, "short", {"rages_used": 2}, "Rages recovered"),
    ("Sorcerer", "5e", 3, "short", {"sorcery_points_used": 3}, "Sorcery points recovered"),
    ("Druid", "5e", 3, "short", {"wild_shape_used": 2}, "Wild Shape recovered"),
    # Edition-only features.
    ("Sorcerer", "5e", 3, "long", {"innate_sorcery_used": True}, "Innate Sorcery refreshed"),
    ("Warlock", "5e", 3, "long", {"magical_cunning_used": True}, "Magical Cunning refreshed"),
    ("Wizard", "5e", 3, "long", {"memorize_spell_used": True}, "Memorize Spell refreshed"),
    # A short rest never unlocks spell preparation.
    ("Wizard", "5e", 3, "short", {"prepared_locked": True}, "Spell preparation unlocked"),
    # A class that does not prepare spells is never told its preparation unlocked.
    ("Sorcerer", "5e", 3, "long", {}, "Spell preparation unlocked"),
    ("Fighter", "5e", 3, "long", {}, "Spell preparation unlocked"),
]


class TestClassRowsStayPut:
    @pytest.mark.parametrize(
        "cls,edition,level,rest_type,spent,message", CLASS_NEGATIVE_CASES,
        ids=[f"{c[0]}-{c[1]}-L{c[2]}-{c[3]}-no-{c[5]}" for c in CLASS_NEGATIVE_CASES],
    )
    def test_row_does_not_fire(self, client, cls, edition, level, rest_type, spent, message):
        h_gm, _, cid = _setup(client, edition=edition)
        char_id = _create(client, h_gm, cid, cls=cls, level=level, data=dict(spent) or None)

        changes = _changes(_rest(client, h_gm, cid, rest_type, [char_id]))

        assert message not in changes
        cd = _data(client, h_gm, char_id) or {}
        for key, value in spent.items():
            assert cd[key] == value, f"{key} should be untouched"


class TestRowMechanics:
    @pytest.mark.parametrize("edition,right,wrong", [
        ("5e", "Ki points recovered", "Focus points recovered"),
        ("5.5e", "Focus points recovered", "Ki points recovered"),
    ])
    def test_monk_pool_is_named_for_its_edition(self, client, edition, right, wrong):
        # One counter, two names: 2014 calls it Ki and 2024 calls it Focus.
        h_gm, _, cid = _setup(client, edition=edition)
        char_id = _create(client, h_gm, cid, cls="Monk", level=3, data={"ki_used": 3})

        changes = _changes(_rest(client, h_gm, cid, "short", [char_id]))

        assert right in changes
        assert wrong not in changes
        assert _data(client, h_gm, char_id)["ki_used"] == 0

    def test_a_resource_with_two_rows_is_reported_once(self, client):
        # A 5e Bard at 5th matches the long row AND the short (Font of Inspiration) row.
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, cls="Bard", level=5, data={"bardic_inspiration_used": 2})

        changes = _changes(_rest(client, h_gm, cid, "long", [char_id]))

        assert changes.count("Bardic Inspiration recovered") == 1

    def test_only_if_spent_row_is_silent_when_nothing_was_spent(self, client):
        h_gm, _, cid = _setup(client, edition="5.5e")
        char_id = _create(client, h_gm, cid, cls="Monk", level=3)

        changes = _changes(_rest(client, h_gm, cid, "long", [char_id]))

        assert "Uncanny Metabolism recovered" not in changes

    def test_portent_is_cleared_for_both_edition_subclass_names(self, client):
        h_gm, _, cid = _setup(client)
        for subclass in ("School of Divination", "Diviner"):
            char_id = _create(client, h_gm, cid, cls="Wizard", level=3,
                              data={"subclass": subclass, "portent_rolls": [4, 17]})
            changes = _changes(_rest(client, h_gm, cid, "long", [char_id]))
            assert _data(client, h_gm, char_id)["portent_rolls"] == []
            assert "Portent dice cleared — roll anew" in changes

    def test_portent_is_not_mentioned_before_any_dice_are_rolled(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, cls="Wizard", level=3,
                          data={"subclass": "School of Divination"})

        changes = _changes(_rest(client, h_gm, cid, "long", [char_id]))

        assert "Portent dice cleared — roll anew" not in changes

    def test_another_wizard_subclass_keeps_no_portent_key(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, cls="Wizard", level=3, data={"subclass": "School of Evocation"})

        _rest(client, h_gm, cid, "long", [char_id])

        assert "portent_rolls" not in _data(client, h_gm, char_id)

    def test_cleared_portent_lists_are_not_shared_between_characters(self, client):
        # The row's reset value is a list; handing the SAME list to two characters would let a
        # roll stored for one appear on the other.
        h_gm, _, cid = _setup(client)
        a = _create(client, h_gm, cid, cls="Wizard", level=3, data={"subclass": "Diviner", "portent_rolls": [3]})
        b = _create(client, h_gm, cid, cls="Wizard", level=3, data={"subclass": "Diviner", "portent_rolls": [9]})

        _rest(client, h_gm, cid, "long", [a, b])
        client.put(f"/api/characters/{a}", json={"character_data": {**_data(client, h_gm, a), "portent_rolls": [12]}}, headers=h_gm)

        assert _data(client, h_gm, b)["portent_rolls"] == []

    def test_a_subclass_pool_never_reaches_another_class(self, client):
        # A Wizard whose data carries a Fighter subclass name must not be handed Fighter pools.
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, cls="Wizard", level=10,
                          data={"subclass": "Echo Knight", "shadow_martyr_used": 1})

        changes = _changes(_rest(client, h_gm, cid, "long", [char_id]))

        assert "Shadow Martyr recovered" not in changes
        assert _data(client, h_gm, char_id)["shadow_martyr_used"] == 1

    def test_short_rest_with_nothing_to_recover_says_so(self, client):
        h_gm, _, cid = _setup(client)
        char_id = _create(client, h_gm, cid, cls="Rogue", level=3)

        assert _changes(_rest(client, h_gm, cid, "short", [char_id])) == ["No short rest resources to recover"]


# ── Table shape + the frontend contract ───────────────────────────────────────

class TestRestTable:
    def test_every_row_is_well_formed(self):
        for row in _REST_RESOURCES:
            assert row["message"], row
            assert row["keys"], row
            assert all(isinstance(k, str) and k for k in row["keys"]), row
            assert row["recharge"] in ("short", "long"), row
            assert row["edition"] in (None, "5e", "5.5e"), row
            assert 1 <= row["min_level"] <= 20, row
            assert row["char_class"] is not None or row["subclass"] is not None, (
                f"{row['message']}: a row matching every class AND every subclass would reset "
                "its key for the whole party"
            )

    def test_no_two_rows_reset_the_same_key_for_the_same_audience(self):
        seen = set()
        for row in _REST_RESOURCES:
            for key in row["keys"]:
                ident = (key, row["recharge"], str(row["char_class"]), str(row["subclass"]), row["edition"])
                assert ident not in seen, f"duplicate row for {ident}"
                seen.add(ident)

    def test_racial_rows_are_well_formed(self):
        for trait, key, recharge, min_level in _RACIAL_REST_RESOURCES:
            assert trait and key
            assert recharge in ("short", "long")
            assert 1 <= min_level <= 20

    def test_committed_contract_matches_the_table(self):
        """The frontend checks its class-config rest rows against this committed file. If the
        table changed, regenerate it:  UPDATE_REST_CONTRACT=1 pytest tests/test_rest_resources.py
        and commit the result — then `npm test` tells you whether the frontend still agrees."""
        current = rest_resources_contract()
        if os.environ.get("UPDATE_REST_CONTRACT"):
            CONTRACT_PATH.write_text(json.dumps(current, indent=2) + "\n", encoding="utf-8")
        committed = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
        assert committed == current, (
            "rest_resources_contract.json is stale — run "
            "UPDATE_REST_CONTRACT=1 pytest tests/test_rest_resources.py and commit it"
        )
