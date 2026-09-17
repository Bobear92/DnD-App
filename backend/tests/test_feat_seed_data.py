"""Guards on the authored feat data in seed_feats.py, plus the character-snapshot refresh.

The authoring guards read pure data (no DB). They exist because QA kept finding feats whose rules
text grants something the structured `effects` never authored, one feat at a time:

  * "you can use your reaction …"                        → an `action` effect with economy 'reaction'
  * "if you take the Attack action … bonus action …"     → an `action` effect with economy 'bonus' and
    the Attack-action wording in its trigger, which the frontend routes to an Action + Bonus combo

If a guard fails, author the missing effect in FEAT_EFFECTS_5E / FEAT_EFFECTS_2024 (see the
/feat-effects skill) — or, if the prose is wrong, correct the prose to the rulebook.
"""
import re

import pytest

import seed_feats
from seed_feats import (
    FEATS_5E, FEATS_2024, FEAT_EFFECTS_5E, FEAT_EFFECTS_2024, sync_character_feat_snapshots,
)
from players.feats.models import Feat
from players.characters.models import Character
from shared.enums import OwnerType
from tests.conftest import _SessionLocal, make_user, make_campaign

REACTION_TEXT = re.compile(
    r"\b(use|take|spend) (your|a|its) reaction\b|\bas a reaction\b|\breaction to\b", re.I,
)
ATTACK_ACTION_BONUS_TEXT = re.compile(r"attack action[^.]*bonus action", re.I)
ATTACK_ACTION_TRIGGER = re.compile(r"\battack action\b|\byou attack with\b|^attack with\b", re.I)

EDITIONS = [("5e", FEATS_5E, FEAT_EFFECTS_5E), ("5.5e", FEATS_2024, FEAT_EFFECTS_2024)]


def _actions(effects, economy):
    return [e for e in effects if e.get("kind") == "action" and e.get("economy") == economy]


@pytest.mark.parametrize("edition,feats,effects_map", EDITIONS, ids=[e[0] for e in EDITIONS])
def test_every_feat_that_grants_a_reaction_authors_one(edition, feats, effects_map):
    missing = [
        name for name, description, *_ in feats
        if REACTION_TEXT.search(description) and not _actions(effects_map.get(name, []), "reaction")
    ]
    assert missing == [], f"{edition} feats grant a reaction with no reaction action effect: {missing}"


@pytest.mark.parametrize("edition,feats,effects_map", EDITIONS, ids=[e[0] for e in EDITIONS])
def test_every_attack_action_bonus_is_authored_as_a_combo_trigger(edition, feats, effects_map):
    missing = [
        name for name, description, *_ in feats
        if ATTACK_ACTION_BONUS_TEXT.search(description)
        and not any(ATTACK_ACTION_TRIGGER.search(a.get("trigger", ""))
                    for a in _actions(effects_map.get(name, []), "bonus"))
    ]
    assert missing == [], f"{edition} feats with an Attack-action bonus action not authored: {missing}"


def test_guards_detect_their_phrasing():
    # Self-tests, so a regex change can't silently turn the guards off.
    assert REACTION_TEXT.search("you can use your reaction to take no damage")
    assert ATTACK_ACTION_BONUS_TEXT.search("If you take the Attack action you can use a bonus action to shove")
    assert not REACTION_TEXT.search("you gain a +1 bonus to AC")


def test_shield_master_authors_its_reaction_in_both_editions():
    for effects_map in (FEAT_EFFECTS_5E, FEAT_EFFECTS_2024):
        names = [a["name"] for a in _actions(effects_map["Shield Master"], "reaction")]
        assert names == ["Interpose Shield"]


class TestSyncCharacterFeatSnapshots:
    def _setup(self, client, snapshot_effects):
        headers, _ = make_user(client, 1)
        campaign_id = make_campaign(client, headers)
        db = _SessionLocal()
        feat = Feat(
            name="Shield Master", edition="5e", description="x", prerequisites={}, benefits={},
            repeatable=False, source="PHB 2014", owner_type=OwnerType.system, owner_id=None,
            effects=[{"kind": "action", "name": "Interpose Shield", "economy": "reaction"}],
        )
        db.add(feat)
        db.commit()
        feat_id = feat.id
        db.close()
        resp = client.post("/api/characters", headers=headers, json={
            "name": "Aldric", "race": "Human", "char_class": "Fighter", "level": 4,
            "campaign_id": campaign_id,
            "character_data": {"feats": [{
                "id": feat_id, "name": "Shield Master", "level": 4,
                "effects": snapshot_effects, "choices": {"ability": "strength"},
            }], "other": "kept"},
        })
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def _feat(self, character_id):
        db = _SessionLocal()
        try:
            data = db.get(Character, character_id).character_data
            return data, data["feats"][0]
        finally:
            db.close()

    def test_refreshes_a_stale_snapshot_and_keeps_the_players_choices(self, client):
        cid = self._setup(client, [{"kind": "note", "text": "old"}])
        db = _SessionLocal()
        assert sync_character_feat_snapshots(db) == 1
        db.close()
        data, feat = self._feat(cid)
        assert feat["effects"] == [{"kind": "action", "name": "Interpose Shield", "economy": "reaction"}]
        assert feat["choices"] == {"ability": "strength"}
        assert data["other"] == "kept"

    def test_is_a_no_op_when_the_snapshot_is_current(self, client):
        self._setup(client, [{"kind": "action", "name": "Interpose Shield", "economy": "reaction"}])
        db = _SessionLocal()
        assert sync_character_feat_snapshots(db) == 0
        db.close()
