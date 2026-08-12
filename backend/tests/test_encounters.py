"""Encounters — the GM's combat/initiative tool (V1).

GM-only by design, reads included: there is no player surface and no is_visible_to_players flag,
so the coverage below asserts a player gets 403 on GET as well as on every mutation.
"""

from tests.conftest import make_user, make_campaign, invite_player


class EncounterBase:
    def _setup(self, client):
        h_gm, uid_gm = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        return h_gm, h_player, campaign_id

    def _character(self, client, headers, campaign_id, name="Aldric", cls="Fighter", level=5):
        resp = client.post("/api/characters", json={
            "name": name,
            "race": "Human",
            "char_class": cls,
            "level": level,
            "campaign_id": campaign_id,
        }, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def _create(self, client, campaign_id, headers, name="Goblin Ambush", character_ids=None):
        return client.post(
            f"/api/gm/campaigns/{campaign_id}/encounters",
            json={"name": name, "character_ids": character_ids or []},
            headers=headers,
        )


class TestCreateEncounter(EncounterBase):
    def test_gm_can_create(self, client):
        h_gm, _, campaign_id = self._setup(client)
        resp = self._create(client, campaign_id, h_gm)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["name"] == "Goblin Ambush"
        assert body["campaign_id"] == campaign_id
        assert body["combatants"] == []

    def test_gm_can_create_with_combatants(self, client):
        h_gm, _, campaign_id = self._setup(client)
        a = self._character(client, h_gm, campaign_id, name="Aldric")
        b = self._character(client, h_gm, campaign_id, name="Brix")

        body = self._create(client, campaign_id, h_gm, character_ids=[a, b]).json()
        assert {c["character_id"] for c in body["combatants"]} == {a, b}
        # Nobody has rolled yet.
        assert all(c["initiative"] is None for c in body["combatants"])

    def test_duplicate_character_ids_are_deduped(self, client):
        h_gm, _, campaign_id = self._setup(client)
        a = self._character(client, h_gm, campaign_id)

        body = self._create(client, campaign_id, h_gm, character_ids=[a, a]).json()
        assert len(body["combatants"]) == 1

    def test_player_cannot_create(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        assert self._create(client, campaign_id, h_player).status_code == 403

    def test_non_member_cannot_create(self, client):
        h_gm, _, campaign_id = self._setup(client)
        h_outsider, _ = make_user(client, 3)
        assert self._create(client, campaign_id, h_outsider).status_code == 403

    def test_cannot_add_a_character_from_another_campaign(self, client):
        h_gm, _, campaign_id = self._setup(client)
        other_campaign = make_campaign(client, h_gm)
        foreign = self._character(client, h_gm, other_campaign)

        assert self._create(client, campaign_id, h_gm, character_ids=[foreign]).status_code == 404


class TestListAndGetEncounter(EncounterBase):
    def test_gm_lists_encounters_with_counts(self, client):
        h_gm, _, campaign_id = self._setup(client)
        a = self._character(client, h_gm, campaign_id)
        self._create(client, campaign_id, h_gm, name="One", character_ids=[a])
        self._create(client, campaign_id, h_gm, name="Two")

        rows = client.get(f"/api/gm/campaigns/{campaign_id}/encounters", headers=h_gm).json()
        assert {r["name"] for r in rows} == {"One", "Two"}
        assert {r["name"]: r["combatant_count"] for r in rows} == {"One": 1, "Two": 0}

    def test_list_is_scoped_to_the_campaign(self, client):
        h_gm, _, campaign_id = self._setup(client)
        other_campaign = make_campaign(client, h_gm)
        self._create(client, campaign_id, h_gm, name="Mine")
        self._create(client, other_campaign, h_gm, name="Theirs")

        rows = client.get(f"/api/gm/campaigns/{campaign_id}/encounters", headers=h_gm).json()
        assert [r["name"] for r in rows] == ["Mine"]

    def test_player_cannot_list(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        assert client.get(f"/api/gm/campaigns/{campaign_id}/encounters", headers=h_player).status_code == 403

    def test_player_cannot_read_one(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        assert client.get(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_player
        ).status_code == 403

    def test_missing_encounter_404s(self, client):
        h_gm, _, campaign_id = self._setup(client)
        assert client.get(
            f"/api/gm/campaigns/{campaign_id}/encounters/99999", headers=h_gm
        ).status_code == 404

    def test_encounter_from_another_campaign_404s(self, client):
        h_gm, _, campaign_id = self._setup(client)
        other_campaign = make_campaign(client, h_gm)
        foreign = self._create(client, other_campaign, h_gm).json()["id"]

        assert client.get(
            f"/api/gm/campaigns/{campaign_id}/encounters/{foreign}", headers=h_gm
        ).status_code == 404


class TestUpdateAndDeleteEncounter(EncounterBase):
    def test_gm_can_rename(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]

        resp = client.put(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}",
            json={"name": "Round Two"}, headers=h_gm,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Round Two"

    def test_player_cannot_rename(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        assert client.put(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}",
            json={"name": "Hacked"}, headers=h_player,
        ).status_code == 403

    def test_gm_can_delete(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]

        assert client.delete(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_gm
        ).status_code == 204
        assert client.get(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_gm
        ).status_code == 404

    def test_player_cannot_delete(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        assert client.delete(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_player
        ).status_code == 403

    def test_deleting_an_encounter_removes_its_combatants(self, client):
        h_gm, _, campaign_id = self._setup(client)
        a = self._character(client, h_gm, campaign_id)
        enc_id = self._create(client, campaign_id, h_gm, character_ids=[a]).json()["id"]

        client.delete(f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_gm)
        # The character itself survives — only the link is gone.
        assert client.get(f"/api/characters/{a}", headers=h_gm).status_code == 200


class TestCombatants(EncounterBase):
    def _add(self, client, campaign_id, enc_id, character_id, headers, initiative=None):
        return client.post(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants",
            json={"character_id": character_id, "initiative": initiative},
            headers=headers,
        )

    def test_gm_can_add_a_combatant(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        char_id = self._character(client, h_gm, campaign_id, name="Aldric", cls="Fighter", level=5)

        resp = self._add(client, campaign_id, enc_id, char_id, h_gm)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        # Denormalised so the page needs no per-row fetch.
        assert body["character_name"] == "Aldric"
        assert body["char_class"] == "Fighter"
        assert body["level"] == 5
        assert body["initiative"] is None

    def test_player_cannot_add(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        char_id = self._character(client, h_gm, campaign_id)
        assert self._add(client, campaign_id, enc_id, char_id, h_player).status_code == 403

    def test_cannot_add_the_same_character_twice(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        char_id = self._character(client, h_gm, campaign_id)

        assert self._add(client, campaign_id, enc_id, char_id, h_gm).status_code == 201
        assert self._add(client, campaign_id, enc_id, char_id, h_gm).status_code == 400

    def test_cannot_add_a_character_from_another_campaign(self, client):
        h_gm, _, campaign_id = self._setup(client)
        other_campaign = make_campaign(client, h_gm)
        foreign = self._character(client, h_gm, other_campaign)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]

        assert self._add(client, campaign_id, enc_id, foreign, h_gm).status_code == 404

    def test_gm_can_set_initiative(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        char_id = self._character(client, h_gm, campaign_id)
        combatant_id = self._add(client, campaign_id, enc_id, char_id, h_gm).json()["id"]

        resp = client.put(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants/{combatant_id}",
            json={"initiative": 17}, headers=h_gm,
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["combatants"][0]["initiative"] == 17

    def test_initiative_can_be_cleared(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        char_id = self._character(client, h_gm, campaign_id)
        combatant_id = self._add(client, campaign_id, enc_id, char_id, h_gm, initiative=12).json()["id"]

        resp = client.put(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants/{combatant_id}",
            json={"initiative": None}, headers=h_gm,
        )
        assert resp.json()["combatants"][0]["initiative"] is None

    def test_player_cannot_set_initiative(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        char_id = self._character(client, h_gm, campaign_id)
        combatant_id = self._add(client, campaign_id, enc_id, char_id, h_gm).json()["id"]

        assert client.put(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants/{combatant_id}",
            json={"initiative": 20}, headers=h_player,
        ).status_code == 403

    def test_gm_can_remove_a_combatant(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        char_id = self._character(client, h_gm, campaign_id)
        combatant_id = self._add(client, campaign_id, enc_id, char_id, h_gm).json()["id"]

        assert client.delete(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants/{combatant_id}",
            headers=h_gm,
        ).status_code == 204
        body = client.get(f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_gm).json()
        assert body["combatants"] == []

    def test_player_cannot_remove(self, client):
        h_gm, h_player, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        char_id = self._character(client, h_gm, campaign_id)
        combatant_id = self._add(client, campaign_id, enc_id, char_id, h_gm).json()["id"]

        assert client.delete(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants/{combatant_id}",
            headers=h_player,
        ).status_code == 403


class TestInitiativeOrder(EncounterBase):
    """The sort lives in the service so every caller sees the same order."""

    def test_sorted_highest_first(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        names = {}
        for name, init in [("Low", 4), ("High", 21), ("Mid", 13)]:
            char_id = self._character(client, h_gm, campaign_id, name=name)
            names[name] = char_id
            client.post(
                f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants",
                json={"character_id": char_id, "initiative": init}, headers=h_gm,
            )

        body = client.get(f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_gm).json()
        assert [c["character_name"] for c in body["combatants"]] == ["High", "Mid", "Low"]

    def test_unrolled_combatants_sink_to_the_bottom(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        for name, init in [("NotYet", None), ("Rolled", 2)]:
            char_id = self._character(client, h_gm, campaign_id, name=name)
            client.post(
                f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants",
                json={"character_id": char_id, "initiative": init}, headers=h_gm,
            )

        body = client.get(f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_gm).json()
        # A 2 still beats "hasn't rolled" — an unrolled row is not a zero.
        assert [c["character_name"] for c in body["combatants"]] == ["Rolled", "NotYet"]

    def test_ties_break_by_name_so_the_order_is_stable(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        for name in ["Zara", "Aldric"]:
            char_id = self._character(client, h_gm, campaign_id, name=name)
            client.post(
                f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants",
                json={"character_id": char_id, "initiative": 15}, headers=h_gm,
            )

        body = client.get(f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_gm).json()
        assert [c["character_name"] for c in body["combatants"]] == ["Aldric", "Zara"]

    def test_negative_initiative_sorts_below_zero_but_above_unrolled(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        for name, init in [("Clumsy", -1), ("Average", 0), ("Absent", None)]:
            char_id = self._character(client, h_gm, campaign_id, name=name)
            client.post(
                f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants",
                json={"character_id": char_id, "initiative": init}, headers=h_gm,
            )

        body = client.get(f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}", headers=h_gm).json()
        assert [c["character_name"] for c in body["combatants"]] == ["Average", "Clumsy", "Absent"]


class TestEncounterListFieldRoundTrip(EncounterBase):
    """EncounterListItem is a separate schema from EncounterResponse, so every field it carries
    needs a list-endpoint round-trip (FastAPI silently strips what the ListItem lacks)."""

    def _list(self, client, campaign_id, headers):
        return client.get(f"/api/gm/campaigns/{campaign_id}/encounters", headers=headers).json()

    def test_name_in_list_after_create(self, client):
        h_gm, _, campaign_id = self._setup(client)
        self._create(client, campaign_id, h_gm, name="Ambush at Dusk")
        assert self._list(client, campaign_id, h_gm)[0]["name"] == "Ambush at Dusk"

    def test_name_in_list_after_update(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        client.put(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}",
            json={"name": "Renamed"}, headers=h_gm,
        )
        assert self._list(client, campaign_id, h_gm)[0]["name"] == "Renamed"

    def test_combatant_count_in_list_after_add(self, client):
        h_gm, _, campaign_id = self._setup(client)
        enc_id = self._create(client, campaign_id, h_gm).json()["id"]
        char_id = self._character(client, h_gm, campaign_id)
        client.post(
            f"/api/gm/campaigns/{campaign_id}/encounters/{enc_id}/combatants",
            json={"character_id": char_id}, headers=h_gm,
        )
        assert self._list(client, campaign_id, h_gm)[0]["combatant_count"] == 1
