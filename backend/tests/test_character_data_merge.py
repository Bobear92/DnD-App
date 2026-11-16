"""character_data is MERGED on save, never replaced — deploy ticket T5a.

The sheet sends the whole character_data blob on every save. Under replace semantics, a frontend bug
that dropped a key (inventory, feats, spell_slots…) would erase it from every character the next
time its player saved: silent, gradual data loss after a deploy. Now a key missing from the request
is kept, and deleting a key takes an explicit `character_data_remove` list.
"""
from tests.conftest import invite_player, make_campaign, make_user
from tests.test_characters import make_character

STORED = {
    "inventory": [{"uid": "a1", "name": "Longsword", "equipped": True}],
    "feats": [{"id": 3, "name": "Alert"}],
    "spell_slots": {"1": {"total": 2, "used": 0}},
    "current_hp": 12,
    "subclass": "Champion",
}


def _setup(client):
    h_gm, _ = make_user(client, 1)
    h_player, uid_player = make_user(client, 2)
    cid = make_campaign(client, h_gm)
    invite_player(client, h_gm, cid, uid_player)
    char_id = make_character(client, h_player, cid)
    r = client.put(f"/api/characters/{char_id}", json={"character_data": STORED}, headers=h_player)
    assert r.status_code == 200
    return h_gm, h_player, char_id


def _cd(client, char_id, headers):
    return client.get(f"/api/characters/{char_id}", headers=headers).json()["character_data"]


class TestMergeOnSave:
    def test_a_save_missing_keys_keeps_them(self, client):
        """The bug this ticket exists for: a blob without `inventory`/`feats` must not erase them."""
        _, h, char_id = _setup(client)
        r = client.put(f"/api/characters/{char_id}", json={"character_data": {"current_hp": 7}}, headers=h)
        assert r.status_code == 200
        cd = r.json()["character_data"]
        assert cd["current_hp"] == 7
        assert cd["inventory"] == STORED["inventory"]
        assert cd["feats"] == STORED["feats"]
        assert cd == _cd(client, char_id, h)  # persisted, not just echoed

    def test_sent_keys_overwrite_and_new_keys_are_added(self, client):
        _, h, char_id = _setup(client)
        cd = client.put(f"/api/characters/{char_id}",
                        json={"character_data": {"subclass": "Battle Master", "maneuvers": ["Parry"]}},
                        headers=h).json()["character_data"]
        assert cd["subclass"] == "Battle Master" and cd["maneuvers"] == ["Parry"]
        assert cd["spell_slots"] == STORED["spell_slots"]

    def test_the_merge_is_shallow_nested_values_are_replaced_whole(self, client):
        # Removing one item from the inventory works by sending the shorter list.
        _, h, char_id = _setup(client)
        cd = client.put(f"/api/characters/{char_id}", json={"character_data": {"inventory": []}},
                        headers=h).json()["character_data"]
        assert cd["inventory"] == []

    def test_null_is_stored_as_null_not_a_delete(self, client):
        _, h, char_id = _setup(client)
        cd = client.put(f"/api/characters/{char_id}", json={"character_data": {"subclass": None}},
                        headers=h).json()["character_data"]
        assert "subclass" in cd and cd["subclass"] is None

    def test_the_full_blob_round_trip_the_sheet_does_still_works(self, client):
        _, h, char_id = _setup(client)
        full = {**_cd(client, char_id, h), "current_hp": 3}
        cd = client.put(f"/api/characters/{char_id}", json={"character_data": full}, headers=h).json()["character_data"]
        assert cd == full

    def test_an_update_without_character_data_leaves_it_untouched(self, client):
        _, h, char_id = _setup(client)
        client.put(f"/api/characters/{char_id}", json={"level": 4}, headers=h)
        assert _cd(client, char_id, h) == STORED

    def test_gm_saves_merge_too(self, client):
        h_gm, h, char_id = _setup(client)
        client.put(f"/api/characters/{char_id}", json={"character_data": {"current_hp": 1}}, headers=h_gm)
        assert _cd(client, char_id, h)["inventory"] == STORED["inventory"]


class TestExplicitRemove:
    def test_listed_keys_are_deleted(self, client):
        _, h, char_id = _setup(client)
        cd = client.put(f"/api/characters/{char_id}",
                        json={"character_data": {"current_hp": 9}, "character_data_remove": ["subclass"]},
                        headers=h).json()["character_data"]
        assert "subclass" not in cd and cd["current_hp"] == 9 and cd["feats"] == STORED["feats"]

    def test_remove_works_without_sending_character_data(self, client):
        _, h, char_id = _setup(client)
        client.put(f"/api/characters/{char_id}", json={"character_data_remove": ["spell_slots", "feats"]}, headers=h)
        cd = _cd(client, char_id, h)
        assert "spell_slots" not in cd and "feats" not in cd and cd["inventory"] == STORED["inventory"]

    def test_removing_a_key_that_is_not_there_is_harmless(self, client):
        _, h, char_id = _setup(client)
        r = client.put(f"/api/characters/{char_id}", json={"character_data_remove": ["never_existed"]}, headers=h)
        assert r.status_code == 200 and _cd(client, char_id, h) == STORED

    def test_remove_wins_over_a_value_sent_in_the_same_request(self, client):
        _, h, char_id = _setup(client)
        cd = client.put(f"/api/characters/{char_id}",
                        json={"character_data": {"subclass": "Samurai"}, "character_data_remove": ["subclass"]},
                        headers=h).json()["character_data"]
        assert "subclass" not in cd

    def test_remove_is_not_echoed_back_and_needs_permission(self, client):
        h_gm, h, char_id = _setup(client)
        h_other, uid_other = make_user(client, 3)
        r = client.put(f"/api/characters/{char_id}", json={"character_data_remove": ["feats"]}, headers=h_other)
        assert r.status_code == 403
        assert _cd(client, char_id, h) == STORED
        body = client.put(f"/api/characters/{char_id}", json={"level": 2}, headers=h).json()
        assert "character_data_remove" not in body

    def test_remove_must_be_a_list_of_strings(self, client):
        _, h, char_id = _setup(client)
        r = client.put(f"/api/characters/{char_id}", json={"character_data_remove": "feats"}, headers=h)
        assert r.status_code == 422
