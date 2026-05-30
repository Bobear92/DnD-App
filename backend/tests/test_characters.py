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
        # Level 10 → recover ceil(10/2) = 5 hit dice; 8 used - 5 = 3 remaining
        assert updated["character_data"]["hit_dice_used"] == 3

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
