from tests.conftest import make_user, make_campaign, invite_player

CHAR_PAYLOAD = {
    "name": "Aldric",
    "race": "Human",
    "char_class": "Fighter",
    "level": 1,
}


def make_character(client, headers, campaign_id, *, name="Aldric"):
    resp = client.post(
        "/api/characters",
        json={**CHAR_PAYLOAD, "name": name, "campaign_id": campaign_id},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


class TestCreateCharacter:
    def test_campaign_member_can_create_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)

        resp = client.post(
            "/api/characters",
            json={**CHAR_PAYLOAD, "campaign_id": campaign_id},
            headers=h_player,
        )
        assert resp.status_code == 201
        assert resp.json()["is_visible_to_players"] is False

    def test_gm_can_also_create_character(self, client):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)

        resp = client.post(
            "/api/characters",
            json={**CHAR_PAYLOAD, "campaign_id": campaign_id},
            headers=h_gm,
        )
        assert resp.status_code == 201

    def test_non_member_cannot_create_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)

        resp = client.post(
            "/api/characters",
            json={**CHAR_PAYLOAD, "campaign_id": campaign_id},
            headers=h_other,
        )
        assert resp.status_code == 403


class TestListCharacters:
    def test_gm_sees_all_characters(self, client):
        h_gm, uid_gm = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)

        make_character(client, h_player, campaign_id, name="PlayerChar")
        make_character(client, h_gm, campaign_id, name="GMChar")

        resp = client.get(f"/api/characters/campaign/{campaign_id}", headers=h_gm)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_player_sees_own_and_visible_characters(self, client):
        h_gm, _ = make_user(client, 1)
        h_p1, uid_p1 = make_user(client, 2)
        h_p2, uid_p2 = make_user(client, 3)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_p1)
        invite_player(client, h_gm, campaign_id, uid_p2)

        char_p1 = make_character(client, h_p1, campaign_id, name="P1Char")
        char_p2 = make_character(client, h_p2, campaign_id, name="P2HiddenChar")
        char_p2_vis = make_character(client, h_p2, campaign_id, name="P2VisibleChar")

        # GM makes char_p2_vis visible
        client.patch(
            f"/api/characters/{char_p2_vis}/visibility",
            json={"is_visible": True},
            headers=h_gm,
        )

        resp = client.get(f"/api/characters/campaign/{campaign_id}", headers=h_p1)
        names = [c["name"] for c in resp.json()]
        assert "P1Char" in names
        assert "P2VisibleChar" in names
        assert "P2HiddenChar" not in names

    def test_non_member_cannot_list_characters(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)

        resp = client.get(f"/api/characters/campaign/{campaign_id}", headers=h_other)
        assert resp.status_code == 403


class TestGetCharacter:
    def test_owner_can_get_own_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)

        resp = client.get(f"/api/characters/{char_id}", headers=h_player)
        assert resp.status_code == 200

    def test_gm_can_get_any_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)

        resp = client.get(f"/api/characters/{char_id}", headers=h_gm)
        assert resp.status_code == 200

    def test_player_cannot_get_hidden_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_p1, uid_p1 = make_user(client, 2)
        h_p2, uid_p2 = make_user(client, 3)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_p1)
        invite_player(client, h_gm, campaign_id, uid_p2)
        char_id = make_character(client, h_p2, campaign_id)  # hidden by default

        resp = client.get(f"/api/characters/{char_id}", headers=h_p1)
        assert resp.status_code == 403


class TestUpdateCharacter:
    def test_owner_can_update_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)

        resp = client.put(f"/api/characters/{char_id}", json={"level": 5}, headers=h_player)
        assert resp.status_code == 200
        assert resp.json()["level"] == 5

    def test_non_owner_cannot_update_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_p1, uid_p1 = make_user(client, 2)
        h_p2, uid_p2 = make_user(client, 3)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_p1)
        invite_player(client, h_gm, campaign_id, uid_p2)
        char_id = make_character(client, h_p1, campaign_id)

        resp = client.put(f"/api/characters/{char_id}", json={"level": 20}, headers=h_p2)
        assert resp.status_code == 403

    def test_gm_can_update_player_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)

        resp = client.put(f"/api/characters/{char_id}", json={"level": 20}, headers=h_gm)
        assert resp.status_code == 200
        assert resp.json()["level"] == 20


class TestDeleteCharacter:
    def test_owner_can_delete_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)

        resp = client.delete(f"/api/characters/{char_id}", headers=h_player)
        assert resp.status_code == 204

    def test_non_owner_cannot_delete_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_p1, uid_p1 = make_user(client, 2)
        h_p2, uid_p2 = make_user(client, 3)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_p1)
        invite_player(client, h_gm, campaign_id, uid_p2)
        char_id = make_character(client, h_p1, campaign_id)

        resp = client.delete(f"/api/characters/{char_id}", headers=h_p2)
        assert resp.status_code == 403


class TestCharacterVisibility:
    def test_gm_can_toggle_visibility(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)

        resp = client.patch(
            f"/api/characters/{char_id}/visibility",
            json={"is_visible": True},
            headers=h_gm,
        )
        assert resp.status_code == 200

        resp = client.get(f"/api/characters/{char_id}", headers=h_player)
        assert resp.json()["is_visible_to_players"] is True

    def test_player_cannot_toggle_visibility(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)

        resp = client.patch(
            f"/api/characters/{char_id}/visibility",
            json={"is_visible": True},
            headers=h_player,
        )
        assert resp.status_code == 403


# ── List schema round-trip ────────────────────────────────────────────────────

class TestCharacterListFieldRoundTrip:
    """Every field in CharacterListItem must survive a POST→list and PUT→list round-trip.

    Root bug pattern: a field present in CharacterResponse but absent from
    CharacterListItem would be silently stripped by the list endpoint even though
    the DB stores it correctly.  These tests catch that class of regression.
    """

    LIST_URL = "/api/characters/campaign/{campaign_id}"
    CHAR_URL = "/api/characters"

    def _setup(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        return h_gm, h_player, campaign_id

    def _list(self, client, campaign_id, headers):
        return client.get(self.LIST_URL.format(campaign_id=campaign_id), headers=headers).json()

    def _create(self, client, headers, campaign_id, **overrides):
        payload = {**CHAR_PAYLOAD, "campaign_id": campaign_id, **overrides}
        resp = client.post(self.CHAR_URL, json=payload, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_name_in_list(self, client):
        h_gm, h_player, cid = self._setup(client)
        self._create(client, h_player, cid, name="Balin")
        items = self._list(client, cid, h_gm)
        assert any(c["name"] == "Balin" for c in items)

    def test_race_in_list(self, client):
        h_gm, h_player, cid = self._setup(client)
        char_id = self._create(client, h_player, cid, race="Dwarf")
        item = next(c for c in self._list(client, cid, h_gm) if c["id"] == char_id)
        assert item["race"] == "Dwarf"

    def test_char_class_in_list(self, client):
        h_gm, h_player, cid = self._setup(client)
        char_id = self._create(client, h_player, cid, char_class="Ranger")
        item = next(c for c in self._list(client, cid, h_gm) if c["id"] == char_id)
        assert item["char_class"] == "Ranger"

    def test_level_in_list(self, client):
        h_gm, h_player, cid = self._setup(client)
        char_id = self._create(client, h_player, cid, level=5)
        item = next(c for c in self._list(client, cid, h_gm) if c["id"] == char_id)
        assert item["level"] == 5

    def test_level_in_list_after_update(self, client):
        h_gm, h_player, cid = self._setup(client)
        char_id = self._create(client, h_player, cid, level=1)
        client.put(f"{self.CHAR_URL}/{char_id}", json={"level": 7}, headers=h_player)
        item = next(c for c in self._list(client, cid, h_gm) if c["id"] == char_id)
        assert item["level"] == 7

    def test_ability_scores_in_list(self, client):
        h_gm, h_player, cid = self._setup(client)
        char_id = self._create(
            client, h_player, cid,
            strength=16, dexterity=14, constitution=15,
            intelligence=10, wisdom=12, charisma=8,
        )
        item = next(c for c in self._list(client, cid, h_gm) if c["id"] == char_id)
        assert item["strength"] == 16
        assert item["dexterity"] == 14
        assert item["constitution"] == 15
        assert item["intelligence"] == 10
        assert item["wisdom"] == 12
        assert item["charisma"] == 8

    def test_visibility_in_list(self, client):
        h_gm, h_player, cid = self._setup(client)
        char_id = self._create(client, h_player, cid)
        client.patch(f"{self.CHAR_URL}/{char_id}/visibility", json={"is_visible": True}, headers=h_gm)
        item = next(c for c in self._list(client, cid, h_gm) if c["id"] == char_id)
        assert item["is_visible_to_players"] is True

    def test_character_data_in_list(self, client):
        h_gm, h_player, cid = self._setup(client)
        payload = {**CHAR_PAYLOAD, "campaign_id": cid, "character_data": {"current_hp": 42, "max_hp": 42}}
        resp = client.post(self.CHAR_URL, json=payload, headers=h_player)
        assert resp.status_code == 201
        char_id = resp.json()["id"]
        item = next(c for c in self._list(client, cid, h_gm) if c["id"] == char_id)
        assert item["character_data"]["current_hp"] == 42


# ── GM Notes ──────────────────────────────────────────────────────────────────

class TestGmNotes:
    def _setup(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)
        return h_gm, h_player, campaign_id, char_id

    def test_gm_can_set_gm_notes(self, client):
        h_gm, _, _, char_id = self._setup(client)
        resp = client.put(f"/api/characters/{char_id}", json={"gm_notes": "Secret info"}, headers=h_gm)
        assert resp.status_code == 200
        assert resp.json()["gm_notes"] == "Secret info"

    def test_gm_notes_returned_to_gm(self, client):
        h_gm, _, _, char_id = self._setup(client)
        client.put(f"/api/characters/{char_id}", json={"gm_notes": "Secret"}, headers=h_gm)
        resp = client.get(f"/api/characters/{char_id}", headers=h_gm)
        assert resp.json()["gm_notes"] == "Secret"

    def test_gm_notes_stripped_from_owner(self, client):
        h_gm, h_player, _, char_id = self._setup(client)
        client.put(f"/api/characters/{char_id}", json={"gm_notes": "Secret"}, headers=h_gm)
        resp = client.get(f"/api/characters/{char_id}", headers=h_player)
        assert resp.status_code == 200
        assert resp.json()["gm_notes"] is None

    def test_player_cannot_set_gm_notes(self, client):
        h_gm, h_player, _, char_id = self._setup(client)
        client.put(f"/api/characters/{char_id}", json={"gm_notes": "Sneaky"}, headers=h_player)
        # Even if the request succeeds (player owns the character), gm_notes must not be set
        resp = client.get(f"/api/characters/{char_id}", headers=h_gm)
        assert resp.json()["gm_notes"] is None


# ── GM Delete ─────────────────────────────────────────────────────────────────

class TestGmDelete:
    def test_gm_can_delete_player_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)

        resp = client.delete(f"/api/characters/{char_id}", headers=h_gm)
        assert resp.status_code == 204

        resp = client.get(f"/api/characters/{char_id}", headers=h_gm)
        assert resp.status_code == 404

    def test_other_player_cannot_delete_character(self, client):
        h_gm, _ = make_user(client, 1)
        h_p1, uid_p1 = make_user(client, 2)
        h_p2, uid_p2 = make_user(client, 3)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_p1)
        invite_player(client, h_gm, campaign_id, uid_p2)
        char_id = make_character(client, h_p1, campaign_id)

        resp = client.delete(f"/api/characters/{char_id}", headers=h_p2)
        assert resp.status_code == 403


# ── Campaign Edition ──────────────────────────────────────────────────────────

class TestCampaignEdition:
    def test_campaign_defaults_to_5e(self, client):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)
        resp = client.get(f"/api/gm/campaigns/{campaign_id}", headers=h_gm)
        assert resp.status_code == 200
        assert resp.json()["edition"] == "5e"

    def test_create_campaign_with_edition(self, client):
        h_gm, _ = make_user(client, 1)
        resp = client.post(
            "/api/gm/campaigns",
            json={"name": "5.5e Campaign", "edition": "5.5e"},
            headers=h_gm,
        )
        assert resp.status_code == 201
        assert resp.json()["edition"] == "5.5e"

    def test_update_campaign_edition(self, client):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)
        resp = client.put(
            f"/api/gm/campaigns/{campaign_id}",
            json={"edition": "5.5e"},
            headers=h_gm,
        )
        assert resp.status_code == 200
        assert resp.json()["edition"] == "5.5e"

    def test_edition_in_list(self, client):
        h_gm, _ = make_user(client, 1)
        make_campaign(client, h_gm)
        resp = client.get("/api/gm/campaigns", headers=h_gm)
        assert resp.status_code == 200
        campaigns = resp.json()
        assert all("edition" in c for c in campaigns)


# ── Rest ──────────────────────────────────────────────────────────────────────

class TestApplyRest:
    def _setup(self, client):
        h_gm, uid_gm = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        return h_gm, h_player, campaign_id

    def _create_char(self, client, headers, campaign_id, *, cls="Fighter", level=5, character_data=None):
        payload = {
            "name": "TestChar",
            "race": "Human",
            "char_class": cls,
            "level": level,
            "campaign_id": campaign_id,
        }
        if character_data:
            payload["character_data"] = character_data
        resp = client.post("/api/characters", json=payload, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_gm_can_apply_short_rest(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(client, h_gm, campaign_id)

        resp = client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["rest_type"] == "short"
        assert len(body["applied_to"]) == 1
        assert body["applied_to"][0]["character_id"] == char_id

    def test_gm_can_apply_long_rest(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id,
            character_data={"hp_max": 50, "current_hp": 10},
        )

        resp = client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        assert resp.status_code == 200

        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert updated["character_data"]["current_hp"] == 50

    def test_player_cannot_apply_rest(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        char_id = self._create_char(client, h_gm, campaign_id)

        resp = client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_player,
        )
        assert resp.status_code == 403

    def test_non_member_cannot_apply_rest(self, client):
        h_gm, _, campaign_id = self._setup(client)
        h_other, _ = make_user(client, 3)
        char_id = self._create_char(client, h_gm, campaign_id)

        resp = client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_other,
        )
        assert resp.status_code == 403

    def test_only_campaign_characters_are_affected(self, client):
        h_gm, _, campaign_id = self._setup(client)
        h_gm2, _ = make_user(client, 3)
        campaign_id2 = make_campaign(client, h_gm2)

        # char in other campaign
        other_char_id = self._create_char(client, h_gm2, campaign_id2, character_data={"hp_max": 40, "current_hp": 5})

        # ask GM of campaign_id to apply long rest to the other campaign's character
        resp = client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [other_char_id]},
            headers=h_gm,
        )
        assert resp.status_code == 200
        # character was filtered out — applied_to should be empty
        assert resp.json()["applied_to"] == []

        # HP should not have changed
        updated = client.get(f"/api/characters/{other_char_id}", headers=h_gm2).json()
        assert updated["character_data"]["current_hp"] == 5

    def test_short_rest_resets_warlock_pact_slots(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id,
            cls="Warlock",
            character_data={"pact_slots_used": 2},
        )

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )

        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert updated["character_data"]["pact_slots_used"] == 0

    def test_short_rest_resets_battle_master_superiority_dice(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=3,
            character_data={"subclass": "Battle Master", "superiority_dice_used": 2},
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert updated["character_data"]["superiority_dice_used"] == 0

    def test_long_rest_resets_battle_master_superiority_dice(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=3,
            character_data={"subclass": "Battle Master", "superiority_dice_used": 2, "hp_max": 28},
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert updated["character_data"]["superiority_dice_used"] == 0

    def test_long_rest_resets_eldritch_knight_spell_slots(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=7,
            character_data={
                "subclass": "Eldritch Knight",
                "hp_max": 58,
                "spell_slots": {"1": {"total": 4, "used": 3}, "2": {"total": 2, "used": 1}},
            },
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert cd["spell_slots"] == {
            "1": {"total": 4, "used": 0},
            "2": {"total": 2, "used": 0},
        }

    def test_short_rest_does_not_reset_eldritch_knight_spell_slots(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=3,
            character_data={
                "subclass": "Eldritch Knight",
                "spell_slots": {"1": {"total": 2, "used": 2}},
            },
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert cd["spell_slots"] == {"1": {"total": 2, "used": 2}}

    def test_non_eldritch_knight_fighter_has_no_spell_slot_reset(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=7,
            character_data={"subclass": "Champion", "hp_max": 58},
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert "spell_slots" not in cd

    def test_non_battle_master_fighter_has_no_superiority_dice_reset(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=3,
            character_data={"subclass": "Champion"},
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert "superiority_dice_used" not in updated["character_data"]

    def test_short_rest_resets_arcane_archer_shot_uses(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=3,
            character_data={"subclass": "Arcane Archer", "arcane_shot_used": 2},
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert updated["character_data"]["arcane_shot_used"] == 0

    def test_long_rest_resets_arcane_archer_shot_uses(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=3,
            character_data={"subclass": "Arcane Archer", "arcane_shot_used": 2, "hp_max": 28},
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert updated["character_data"]["arcane_shot_used"] == 0

    def test_non_arcane_archer_fighter_has_no_arcane_shot_reset(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=3,
            character_data={"subclass": "Battle Master"},
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert "arcane_shot_used" not in updated["character_data"]

    def test_long_rest_resets_feat_resource_pool(self, client):
        # Lucky's luck_points (long-rest) resets; Martial Adept's superiority die (short-rest) also resets on a long rest.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=4,
            character_data={
                "hp_max": 28,
                "luck_points_used": 3,
                "martial_adept_superiority_used": 1,
                "feats": [
                    {"id": 1, "name": "Lucky", "effects": [{"kind": "resource", "key": "luck_points", "total": 3, "recharge": "long"}]},
                    {"id": 2, "name": "Martial Adept", "effects": [{"kind": "resource", "key": "martial_adept_superiority", "total": 1, "recharge": "short"}]},
                ],
            },
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert cd["luck_points_used"] == 0
        assert cd["martial_adept_superiority_used"] == 0

    def test_short_rest_resets_only_short_recharge_feat_resource(self, client):
        # On a short rest, Martial Adept's superiority die (short) resets but Lucky's points (long) do NOT.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=4,
            character_data={
                "luck_points_used": 3,
                "martial_adept_superiority_used": 1,
                "feats": [
                    {"id": 1, "name": "Lucky", "effects": [{"kind": "resource", "key": "luck_points", "total": 3, "recharge": "long"}]},
                    {"id": 2, "name": "Martial Adept", "effects": [{"kind": "resource", "key": "martial_adept_superiority", "total": 1, "recharge": "short"}]},
                ],
            },
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert cd["martial_adept_superiority_used"] == 0
        assert cd["luck_points_used"] == 3  # long-rest resource untouched by a short rest

    def test_long_rest_resets_feat_spell_free_cast(self, client):
        # Magic Initiate's 1/long-rest free cast (feat_freecast_<spell>_used) resets on a long rest.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=4,
            character_data={
                "hp_max": 28,
                "feat_freecast_mage_armor_used": 1,
                "feats": [
                    {"id": 1, "name": "Magic Initiate", "choices": {"spell_grant": {
                        "source": "Wizard", "ability": "intelligence",
                        "cantrips": ["Fire Bolt", "Light"],
                        "leveled": [{"name": "Mage Armor", "level": 1}], "free_casts": ["Mage Armor"]}}},
                ],
            },
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert cd["feat_freecast_mage_armor_used"] == 0

    def test_short_rest_leaves_feat_spell_free_cast_untouched(self, client):
        # The free cast recharges on a long rest only, so a short rest leaves it used.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id, cls="Fighter", level=4,
            character_data={
                "feat_freecast_mage_armor_used": 1,
                "feats": [
                    {"id": 1, "name": "Magic Initiate", "choices": {"spell_grant": {
                        "leveled": [{"name": "Mage Armor", "level": 1}], "free_casts": ["Mage Armor"]}}},
                ],
            },
        )
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert cd["feat_freecast_mage_armor_used"] == 1

    def test_long_rest_restores_hp_and_spell_slots(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id,
            cls="Wizard",
            character_data={
                "hp_max": 30,
                "current_hp": 1,
                "spell_slots": {
                    "1": {"total": 4, "used": 3},
                    "2": {"total": 2, "used": 2},
                },
            },
        )

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )

        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        cd = updated["character_data"]
        assert cd["current_hp"] == 30
        assert cd["spell_slots"]["1"]["used"] == 0
        assert cd["spell_slots"]["2"]["used"] == 0
        assert cd["spell_slots"]["1"]["total"] == 4
        assert cd["spell_slots"]["2"]["total"] == 2

    def test_long_rest_recovers_hit_dice(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id,
            level=10,
            character_data={"hit_dice_used": 8},
        )

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )

        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        # Level 10 → recover 10//2 = 5 hit dice; 8 used - 5 = 3 remaining
        assert updated["character_data"]["hit_dice_used"] == 3

    def test_long_rest_recovers_half_rounded_down_at_odd_level(self, client):
        # RAW: half your total rounded down (min 1) — level 9 recovers 4, not 5 (ceil).
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id,
            level=9,
            character_data={"hit_dice_used": 8},
        )

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )

        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        # Level 9 → recover 9//2 = 4 hit dice; 8 used - 4 = 4 remaining
        assert updated["character_data"]["hit_dice_used"] == 4

    def test_response_includes_changes_list(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id,
            cls="Barbarian",
        )

        resp = client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        assert resp.status_code == 200
        result = resp.json()["applied_to"][0]
        assert "name" in result
        assert isinstance(result["changes"], list)
        assert any("Rages" in c for c in result["changes"])

    # ── Racial rest resources ──────────────────────────────────────────────

    def test_short_rest_resets_dragonborn_breath_weapon(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id,
            cls="Sorcerer",
            character_data={"race_traits": ["Breath Weapon"], "breath_weapon_used": 1},
        )

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )

        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert updated["character_data"]["breath_weapon_used"] == 0

    def test_relentless_endurance_resets_on_long_rest_only(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id,
            cls="Barbarian",
            character_data={"race_traits": ["Relentless Endurance"], "relentless_endurance_used": 1},
        )

        # Short rest does NOT recover a long-rest racial feature
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert updated["character_data"]["relentless_endurance_used"] == 1

        # Long rest does
        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        updated = client.get(f"/api/characters/{char_id}", headers=h_gm).json()
        assert updated["character_data"]["relentless_endurance_used"] == 0

    def test_drow_darkness_gated_by_level(self, client):
        h_gm, _, campaign_id = self._setup(client)
        # Level 3 Drow: faerie fire (min level 3) recovers, darkness (min level 5) does not
        char_id = self._create_char(
            client, h_gm, campaign_id,
            cls="Wizard", level=3,
            character_data={
                "race_traits": ["Drow Magic"],
                "drow_faerie_fire_used": 1,
                "drow_darkness_used": 1,
            },
        )

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert cd["drow_faerie_fire_used"] == 0
        # Darkness is not yet available at level 3, so it is left untouched
        assert cd["drow_darkness_used"] == 1

    def test_long_rest_clears_portent_for_divination_wizard(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._create_char(
            client, h_gm, campaign_id,
            cls="Wizard", level=5,
            character_data={
                "subclass": "School of Divination",
                "portent_rolls": [{"value": 17, "used": False}, {"value": 4, "used": True}],
            },
        )

        resp = client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert cd["portent_rolls"] == []
        assert any("Portent" in c for c in resp.json()["applied_to"][0]["changes"])

    def test_short_rest_does_not_clear_portent(self, client):
        h_gm, _, campaign_id = self._setup(client)
        rolls = [{"value": 17, "used": False}]
        char_id = self._create_char(
            client, h_gm, campaign_id,
            cls="Wizard", level=5,
            character_data={"subclass": "School of Divination", "portent_rolls": rolls},
        )

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]},
            headers=h_gm,
        )
        cd = client.get(f"/api/characters/{char_id}", headers=h_gm).json()["character_data"]
        assert cd["portent_rolls"] == rolls


class TestCharacterMusic:
    def _tiny_mp3(self):
        import io
        return io.BytesIO(b"ID3\x03\x00\x00\x00fake-mp3-bytes")

    def test_owner_can_upload_music(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        char_id = make_character(client, h_player, campaign_id)

        resp = client.post(
            f"/api/characters/{char_id}/music",
            files={"file": ("theme.mp3", self._tiny_mp3(), "audio/mpeg")},
            headers=h_player,
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["theme_music_url"].startswith("uploads/music/characters/")

    def test_gm_can_upload_music(self, client):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)
        char_id = make_character(client, h_gm, campaign_id)

        resp = client.post(
            f"/api/characters/{char_id}/music",
            files={"file": ("theme.mp3", self._tiny_mp3(), "audio/mpeg")},
            headers=h_gm,
        )
        assert resp.status_code == 200, resp.text

    def test_non_owner_player_cannot_upload_music(self, client):
        h_gm, _ = make_user(client, 1)
        h_owner, uid_owner = make_user(client, 2)
        h_other, uid_other = make_user(client, 3)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_owner)
        invite_player(client, h_gm, campaign_id, uid_other)
        char_id = make_character(client, h_owner, campaign_id)

        resp = client.post(
            f"/api/characters/{char_id}/music",
            files={"file": ("theme.mp3", self._tiny_mp3(), "audio/mpeg")},
            headers=h_other,
        )
        assert resp.status_code == 403

    def test_rejects_disallowed_extension(self, client):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)
        char_id = make_character(client, h_gm, campaign_id)

        resp = client.post(
            f"/api/characters/{char_id}/music",
            files={"file": ("theme.exe", self._tiny_mp3(), "application/octet-stream")},
            headers=h_gm,
        )
        assert resp.status_code == 400

    def test_delete_music_clears_url(self, client):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)
        char_id = make_character(client, h_gm, campaign_id)
        client.post(
            f"/api/characters/{char_id}/music",
            files={"file": ("theme.mp3", self._tiny_mp3(), "audio/mpeg")},
            headers=h_gm,
        )

        resp = client.delete(f"/api/characters/{char_id}/music", headers=h_gm)
        assert resp.status_code == 200, resp.text
        assert resp.json()["theme_music_url"] is None


class TestInitiativeRest:
    """rest_type 'initiative' — the GM's encounter flow, applying features that recharge
    when you roll initiative. Ever-Ready Shot (Arcane Archer L15) is the only row so far."""

    def _setup(self, client):
        h_gm, uid_gm = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        return h_gm, h_player, campaign_id

    def _archer(self, client, headers, campaign_id, *, level=15, used=2, subclass="Arcane Archer"):
        payload = {
            "name": "Archer",
            "race": "Elf",
            "char_class": "Fighter",
            "level": level,
            "campaign_id": campaign_id,
            "character_data": {"subclass": subclass, "arcane_shot_used": used},
        }
        resp = client.post("/api/characters", json=payload, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def _roll(self, client, campaign_id, char_ids, headers):
        return client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "initiative", "character_ids": char_ids},
            headers=headers,
        )

    def _data(self, client, char_id, headers):
        return client.get(f"/api/characters/{char_id}", headers=headers).json()["character_data"]

    # ── Authorization (same contract as short/long rest) ──────────────────────

    def test_gm_can_apply(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._archer(client, h_gm, campaign_id)
        resp = self._roll(client, campaign_id, [char_id], h_gm)
        assert resp.status_code == 200, resp.text
        assert resp.json()["rest_type"] == "initiative"

    def test_player_cannot_apply(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        char_id = self._archer(client, h_gm, campaign_id)
        assert self._roll(client, campaign_id, [char_id], h_player).status_code == 403

    def test_non_member_cannot_apply(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._archer(client, h_gm, campaign_id)
        h_outsider, _ = make_user(client, 3)
        assert self._roll(client, campaign_id, [char_id], h_outsider).status_code == 403

    def test_ignores_characters_from_another_campaign(self, client):
        h_gm, _, campaign_id = self._setup(client)
        other_campaign = make_campaign(client, h_gm)
        mine = self._archer(client, h_gm, campaign_id)
        theirs = self._archer(client, h_gm, other_campaign)

        body = self._roll(client, campaign_id, [mine, theirs], h_gm).json()
        assert [item["character_id"] for item in body["applied_to"]] == [mine]

    def test_unknown_rest_type_is_rejected(self, client):
        # Previously an unrecognised type silently patched nothing and reported success.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._archer(client, h_gm, campaign_id)
        resp = client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "elevenses", "character_ids": [char_id]},
            headers=h_gm,
        )
        assert resp.status_code == 422

    # ── Ever-Ready Shot ──────────────────────────────────────────────────────

    def test_regains_one_use_when_pool_is_empty(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._archer(client, h_gm, campaign_id, used=2)

        body = self._roll(client, campaign_id, [char_id], h_gm).json()
        assert self._data(client, char_id, h_gm)["arcane_shot_used"] == 1
        assert any("Ever-Ready Shot" in c for c in body["applied_to"][0]["changes"])

    def test_does_nothing_when_a_use_remains(self, client):
        # RAW: "when you roll initiative and have NO uses of Arcane Shot remaining".
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._archer(client, h_gm, campaign_id, used=1)

        body = self._roll(client, campaign_id, [char_id], h_gm).json()
        assert self._data(client, char_id, h_gm)["arcane_shot_used"] == 1
        assert body["applied_to"][0]["changes"] == ["Nothing regained on initiative"]

    def test_does_not_exceed_the_pool(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._archer(client, h_gm, campaign_id, used=0)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["arcane_shot_used"] == 0

    def test_level_gated_below_15(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._archer(client, h_gm, campaign_id, level=14, used=2)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["arcane_shot_used"] == 2

    def test_other_subclass_untouched(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._archer(client, h_gm, campaign_id, subclass="Champion", used=2)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["arcane_shot_used"] == 2

    def test_other_class_untouched(self, client):
        h_gm, _, campaign_id = self._setup(client)
        payload = {
            "name": "Wiz", "race": "Human", "char_class": "Wizard", "level": 20,
            "campaign_id": campaign_id,
            "character_data": {"arcane_shot_used": 2},
        }
        char_id = client.post("/api/characters", json=payload, headers=h_gm).json()["id"]

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["arcane_shot_used"] == 2

    # ── It is not a rest ─────────────────────────────────────────────────────

    def test_does_not_recover_short_rest_resources(self, client):
        # Rolling initiative must not hand back Second Wind / Action Surge.
        h_gm, _, campaign_id = self._setup(client)
        payload = {
            "name": "Fighter", "race": "Human", "char_class": "Fighter", "level": 15,
            "campaign_id": campaign_id,
            "character_data": {
                "subclass": "Arcane Archer", "arcane_shot_used": 2,
                "second_wind_used": 1, "action_surge_used": 1,
            },
        }
        char_id = client.post("/api/characters", json=payload, headers=h_gm).json()["id"]

        self._roll(client, campaign_id, [char_id], h_gm)
        cd = self._data(client, char_id, h_gm)
        assert cd["arcane_shot_used"] == 1
        assert cd["second_wind_used"] == 1
        assert cd["action_surge_used"] == 1

    def test_does_not_touch_hp_or_spell_slots(self, client):
        h_gm, _, campaign_id = self._setup(client)
        payload = {
            "name": "Archer", "race": "Elf", "char_class": "Fighter", "level": 15,
            "campaign_id": campaign_id,
            "character_data": {
                "subclass": "Arcane Archer", "arcane_shot_used": 2,
                "hp_max": 100, "current_hp": 12,
                "spell_slots": {"1": {"total": 4, "used": 4}},
            },
        }
        char_id = client.post("/api/characters", json=payload, headers=h_gm).json()["id"]

        self._roll(client, campaign_id, [char_id], h_gm)
        cd = self._data(client, char_id, h_gm)
        assert cd["current_hp"] == 12
        assert cd["spell_slots"]["1"]["used"] == 4

    # ── Battle Master Relentless (both editions) ─────────────────────────────

    def _battle_master(self, client, headers, campaign_id, *, level=15, used=6, feats=None):
        cd = {"subclass": "Battle Master", "superiority_dice_used": used}
        if feats:
            cd["feats"] = feats
        resp = client.post("/api/characters", json={
            "name": "Bram", "race": "Human", "char_class": "Fighter", "level": level,
            "campaign_id": campaign_id, "character_data": cd,
        }, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_relentless_regains_a_die_when_empty(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._battle_master(client, h_gm, campaign_id, used=6)

        body = self._roll(client, campaign_id, [char_id], h_gm).json()
        assert self._data(client, char_id, h_gm)["superiority_dice_used"] == 5
        assert any("Relentless" in c and "1 die" in c for c in body["applied_to"][0]["changes"])

    def test_relentless_does_nothing_with_a_die_left(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._battle_master(client, h_gm, campaign_id, used=5)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["superiority_dice_used"] == 5

    def test_relentless_works_in_2024(self, client):
        # The row has edition=None, so both editions get it.
        h_gm, _, campaign_id = self._setup(client)
        client.put(f"/api/gm/campaigns/{campaign_id}", json={"edition": "5.5e"}, headers=h_gm)
        char_id = self._battle_master(client, h_gm, campaign_id, used=6)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["superiority_dice_used"] == 5

    def test_relentless_accounts_for_the_martial_adept_die(self, client):
        # A Martial Adept feat adds a 7th die, so 6 spent is NOT empty. A flat pool size of 6
        # would wrongly hand a die back here.
        h_gm, _, campaign_id = self._setup(client)
        feats = [{"name": "Martial Adept", "effects": [{"kind": "maneuver_grant", "count": 2, "die": "d6"}]}]
        char_id = self._battle_master(client, h_gm, campaign_id, used=6, feats=feats)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["superiority_dice_used"] == 6

    def test_relentless_fires_when_the_larger_pool_is_empty(self, client):
        h_gm, _, campaign_id = self._setup(client)
        feats = [{"name": "Martial Adept", "effects": [{"kind": "maneuver_grant", "count": 2, "die": "d6"}]}]
        char_id = self._battle_master(client, h_gm, campaign_id, used=7, feats=feats)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["superiority_dice_used"] == 6

    def test_relentless_level_gated(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._battle_master(client, h_gm, campaign_id, level=14, used=6)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["superiority_dice_used"] == 6

    # ── Bard Superior Inspiration ────────────────────────────────────────────

    def _bard(self, client, headers, campaign_id, *, level=20, charisma=18, used=4):
        resp = client.post("/api/characters", json={
            "name": "Lyra", "race": "Half-Elf", "char_class": "Bard", "level": level,
            "charisma": charisma, "campaign_id": campaign_id,
            "character_data": {"bardic_inspiration_used": used},
        }, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_superior_inspiration_regains_a_use_when_empty(self, client):
        # CHA 18 gives +4, so four uses, all spent.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._bard(client, h_gm, campaign_id, charisma=18, used=4)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["bardic_inspiration_used"] == 3

    def test_superior_inspiration_pool_follows_charisma(self, client):
        # The pool is the CHA modifier, so 4 spent is empty at CHA 18 but not at CHA 20.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._bard(client, h_gm, campaign_id, charisma=20, used=4)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["bardic_inspiration_used"] == 4

    def test_superior_inspiration_minimum_pool_of_one(self, client):
        # A dump-stat Bard still has one use, so one spent is empty.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._bard(client, h_gm, campaign_id, charisma=8, used=1)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["bardic_inspiration_used"] == 0

    def test_superior_inspiration_level_gated(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._bard(client, h_gm, campaign_id, level=19, charisma=18, used=4)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["bardic_inspiration_used"] == 4

    # ── Monk Perfect Self ────────────────────────────────────────────────────

    def _monk(self, client, headers, campaign_id, *, level=20, used=20):
        resp = client.post("/api/characters", json={
            "name": "Sung", "race": "Human", "char_class": "Monk", "level": level,
            "campaign_id": campaign_id, "character_data": {"ki_used": used},
        }, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_perfect_self_regains_four_ki(self, client):
        # The row that proves `amount` had to be a number: this one gives back FOUR.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._monk(client, h_gm, campaign_id, used=20)

        body = self._roll(client, campaign_id, [char_id], h_gm).json()
        assert self._data(client, char_id, h_gm)["ki_used"] == 16
        assert any("4 points" in c and "Perfect Self" in c for c in body["applied_to"][0]["changes"])

    def test_perfect_self_does_nothing_with_ki_left(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._monk(client, h_gm, campaign_id, used=19)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["ki_used"] == 19

    def test_perfect_self_level_gated(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._monk(client, h_gm, campaign_id, level=19, used=19)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["ki_used"] == 19

    # ── The whole party at once ──────────────────────────────────────────────

    def test_applies_to_every_character_in_one_call(self, client):
        h_gm, _, campaign_id = self._setup(client)
        archer = self._archer(client, h_gm, campaign_id, used=2)
        bm = self._battle_master(client, h_gm, campaign_id, used=6)
        monk = self._monk(client, h_gm, campaign_id, used=20)

        body = self._roll(client, campaign_id, [archer, bm, monk], h_gm).json()
        assert len(body["applied_to"]) == 3
        assert self._data(client, archer, h_gm)["arcane_shot_used"] == 1
        assert self._data(client, bm, h_gm)["superiority_dice_used"] == 5
        assert self._data(client, monk, h_gm)["ki_used"] == 16

    # ── Monk 2024 Perfect Focus (the `floor` shape) ──────────────────────────

    def _focus_monk(self, client, headers, campaign_id, *, level=15, used=13):
        resp = client.post("/api/characters", json={
            "name": "Kenji", "race": "Human", "char_class": "Monk", "level": level,
            "campaign_id": campaign_id, "character_data": {"ki_used": used},
        }, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def _make_2024(self, client, campaign_id, headers):
        client.put(f"/api/gm/campaigns/{campaign_id}", json={"edition": "5.5e"}, headers=headers)

    def test_perfect_focus_tops_up_to_proficiency_bonus(self, client):
        # L15 monk: 15 focus points, PB 5. 13 spent leaves 2, which is under PB, so the pool is
        # topped up to exactly 5 remaining (used becomes 10).
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._focus_monk(client, h_gm, campaign_id, used=13)

        body = self._roll(client, campaign_id, [char_id], h_gm).json()
        assert self._data(client, char_id, h_gm)["ki_used"] == 10
        assert any("Perfect Focus" in c for c in body["applied_to"][0]["changes"])

    def test_perfect_focus_does_nothing_at_or_above_proficiency_bonus(self, client):
        # 10 spent leaves exactly 5 = PB, so there is nothing to top up.
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._focus_monk(client, h_gm, campaign_id, used=10)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["ki_used"] == 10

    def test_perfect_focus_never_reduces_a_fuller_pool(self, client):
        # The floor must not work downwards: 2 spent leaves 13, far above PB — untouched.
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._focus_monk(client, h_gm, campaign_id, used=2)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["ki_used"] == 2

    def test_perfect_focus_fills_an_empty_pool_to_proficiency_bonus(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._focus_monk(client, h_gm, campaign_id, used=15)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["ki_used"] == 10

    def test_perfect_focus_is_2024_only(self, client):
        # A 5e L15 monk has no Perfect Focus (and Perfect Self is 20th), so nothing happens.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._focus_monk(client, h_gm, campaign_id, used=13)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["ki_used"] == 13

    def test_perfect_focus_level_gated(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._focus_monk(client, h_gm, campaign_id, level=14, used=13)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["ki_used"] == 13

    # ── Samurai Fighting Spirit + Tireless Spirit ────────────────────────────

    def _samurai(self, client, headers, campaign_id, *, level=10, used=3):
        resp = client.post("/api/characters", json={
            "name": "Rin", "race": "Human", "char_class": "Fighter", "level": level,
            "campaign_id": campaign_id,
            "character_data": {"subclass": "Samurai", "fighting_spirit_used": used},
        }, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_fighting_spirit_resets_on_a_long_rest(self, client):
        # The pool itself had to be built before Tireless Spirit had anything to refill.
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._samurai(client, h_gm, campaign_id, used=3)

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]}, headers=h_gm,
        )
        assert self._data(client, char_id, h_gm)["fighting_spirit_used"] == 0

    def test_fighting_spirit_survives_a_short_rest(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._samurai(client, h_gm, campaign_id, used=3)

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "short", "character_ids": [char_id]}, headers=h_gm,
        )
        assert self._data(client, char_id, h_gm)["fighting_spirit_used"] == 3

    def test_fighting_spirit_untouched_for_another_subclass(self, client):
        h_gm, _, campaign_id = self._setup(client)
        resp = client.post("/api/characters", json={
            "name": "Champ", "race": "Human", "char_class": "Fighter", "level": 10,
            "campaign_id": campaign_id,
            "character_data": {"subclass": "Champion", "fighting_spirit_used": 3},
        }, headers=h_gm)
        char_id = resp.json()["id"]

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]}, headers=h_gm,
        )
        assert self._data(client, char_id, h_gm)["fighting_spirit_used"] == 3

    def test_tireless_spirit_regains_a_use_when_empty(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._samurai(client, h_gm, campaign_id, used=3)

        body = self._roll(client, campaign_id, [char_id], h_gm).json()
        assert self._data(client, char_id, h_gm)["fighting_spirit_used"] == 2
        assert any("Tireless Spirit" in c for c in body["applied_to"][0]["changes"])

    def test_tireless_spirit_does_nothing_with_a_use_left(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._samurai(client, h_gm, campaign_id, used=2)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["fighting_spirit_used"] == 2

    def test_tireless_spirit_level_gated(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._samurai(client, h_gm, campaign_id, level=9, used=3)

        self._roll(client, campaign_id, [char_id], h_gm)
        assert self._data(client, char_id, h_gm)["fighting_spirit_used"] == 3

    # ── Monk 2024 Uncanny Metabolism (the `opt_in` shape) ────────────────────

    def _opt_monk(self, client, headers, campaign_id, *, level=8, used=5, charge_spent=False):
        cd = {"ki_used": used}
        if charge_spent:
            cd["uncanny_metabolism_used"] = 1
        resp = client.post("/api/characters", json={
            "name": "Mei", "race": "Human", "char_class": "Monk", "level": level,
            "campaign_id": campaign_id, "character_data": cd,
        }, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def _roll_opting_in(self, client, campaign_id, char_ids, headers, opt_ins):
        return client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "initiative", "character_ids": char_ids, "opt_ins": opt_ins},
            headers=headers,
        )

    def _options(self, client, campaign_id, char_ids, headers):
        ids = ",".join(str(i) for i in char_ids)
        return client.get(
            f"/api/characters/campaign/{campaign_id}/initiative-options?character_ids={ids}",
            headers=headers,
        )

    def test_opt_in_does_nothing_without_the_players_choice(self, client):
        # The whole point of the opt_in shape: it costs a limited charge, so it must not fire on
        # its own just because the Monk rolled initiative.
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=8, used=5)

        self._roll(client, campaign_id, [char_id], h_gm)
        cd = self._data(client, char_id, h_gm)
        assert cd["ki_used"] == 5
        assert not cd.get("uncanny_metabolism_used")

    def test_opt_in_regains_proficiency_bonus_when_chosen(self, client):
        # L8 monk: PB 3, so 5 spent becomes 2 spent.
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=8, used=5)

        body = self._roll_opting_in(
            client, campaign_id, [char_id], h_gm,
            {str(char_id): ["Uncanny Metabolism"]},
        ).json()
        cd = self._data(client, char_id, h_gm)
        assert cd["ki_used"] == 2
        assert cd["uncanny_metabolism_used"] == 1
        assert any("Uncanny Metabolism" in c for c in body["applied_to"][0]["changes"])

    def test_opt_in_never_overfills(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=8, used=2)

        self._roll_opting_in(client, campaign_id, [char_id], h_gm, {str(char_id): ["Uncanny Metabolism"]})
        assert self._data(client, char_id, h_gm)["ki_used"] == 0

    def test_opt_in_refuses_when_its_charge_is_spent(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=8, used=5, charge_spent=True)

        self._roll_opting_in(client, campaign_id, [char_id], h_gm, {str(char_id): ["Uncanny Metabolism"]})
        assert self._data(client, char_id, h_gm)["ki_used"] == 5

    def test_opt_in_does_not_burn_the_charge_on_a_full_pool(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=8, used=0)

        self._roll_opting_in(client, campaign_id, [char_id], h_gm, {str(char_id): ["Uncanny Metabolism"]})
        cd = self._data(client, char_id, h_gm)
        assert cd["ki_used"] == 0
        assert not cd.get("uncanny_metabolism_used")

    def test_opt_in_charge_returns_on_a_long_rest(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=8, used=5, charge_spent=True)

        client.post(
            f"/api/characters/campaign/{campaign_id}/rest",
            json={"rest_type": "long", "character_ids": [char_id]}, headers=h_gm,
        )
        assert self._data(client, char_id, h_gm)["uncanny_metabolism_used"] == 0

    def test_opt_in_only_applies_to_the_character_who_chose(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        chose = self._opt_monk(client, h_gm, campaign_id, level=8, used=5)
        did_not = self._opt_monk(client, h_gm, campaign_id, level=8, used=5)

        self._roll_opting_in(client, campaign_id, [chose, did_not], h_gm, {str(chose): ["Uncanny Metabolism"]})
        assert self._data(client, chose, h_gm)["ki_used"] == 2
        assert self._data(client, did_not, h_gm)["ki_used"] == 5

    def test_opt_in_is_2024_only(self, client):
        h_gm, _, campaign_id = self._setup(client)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=8, used=5)

        self._roll_opting_in(client, campaign_id, [char_id], h_gm, {str(char_id): ["Uncanny Metabolism"]})
        assert self._data(client, char_id, h_gm)["ki_used"] == 5

    # ── The initiative-options endpoint ──────────────────────────────────────

    def test_options_lists_an_available_opt_in(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=8, used=5)

        body = self._options(client, campaign_id, [char_id], h_gm).json()
        assert len(body) == 1
        assert body[0]["character_id"] == char_id
        assert body[0]["options"][0]["feature"] == "Uncanny Metabolism"
        assert body[0]["options"][0]["available"] is True
        assert body[0]["options"][0]["description"]

    def test_options_marks_a_spent_charge_unavailable(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=8, used=5, charge_spent=True)

        body = self._options(client, campaign_id, [char_id], h_gm).json()
        assert body[0]["options"][0]["available"] is False

    def test_options_omits_characters_with_no_choice(self, client):
        # An Arcane Archer's Ever-Ready Shot is automatic, so there is nothing to offer.
        h_gm, _, campaign_id = self._setup(client)
        archer = self._archer(client, h_gm, campaign_id)

        assert self._options(client, campaign_id, [archer], h_gm).json() == []

    def test_options_level_gated(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id, level=1, used=1)

        assert self._options(client, campaign_id, [char_id], h_gm).json() == []

    def test_options_player_cannot_read(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        char_id = self._opt_monk(client, h_gm, campaign_id)

        assert self._options(client, campaign_id, [char_id], h_player).status_code == 403

    def test_options_ignores_characters_from_another_campaign(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._make_2024(client, campaign_id, h_gm)
        other = make_campaign(client, h_gm)
        self._make_2024(client, other, h_gm)
        foreign = self._opt_monk(client, h_gm, other)

        assert self._options(client, campaign_id, [foreign], h_gm).json() == []

    def test_options_handles_an_empty_id_list(self, client):
        h_gm, _, campaign_id = self._setup(client)
        assert self._options(client, campaign_id, [], h_gm).json() == []
