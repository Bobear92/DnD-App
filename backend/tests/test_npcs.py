from tests.conftest import make_user, make_campaign, invite_player

NPC_PAYLOAD = {
    "name": "Gareth the Blacksmith",
    "race": "Human",
    "occupation": "Blacksmith",
    "alignment": "Neutral Good",
    "is_visible_to_players": False,
}


def make_npc(client, gm_headers, campaign_id, *, visible=False, name="Gareth the Blacksmith"):
    payload = {**NPC_PAYLOAD, "campaign_id": campaign_id, "name": name, "is_visible_to_players": visible}
    resp = client.post("/api/gm/campaigns/npcs", json=payload, headers=gm_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


class TestCreateNPC:
    def test_gm_can_create_npc(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        resp = client.post(
            "/api/gm/campaigns/npcs",
            json={**NPC_PAYLOAD, "campaign_id": campaign_id},
            headers=h,
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "Gareth the Blacksmith"
        assert resp.json()["is_visible_to_players"] is False

    def test_player_cannot_create_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)

        resp = client.post(
            "/api/gm/campaigns/npcs",
            json={**NPC_PAYLOAD, "campaign_id": campaign_id},
            headers=h_player,
        )
        assert resp.status_code == 403

    def test_non_member_cannot_create_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)

        resp = client.post(
            "/api/gm/campaigns/npcs",
            json={**NPC_PAYLOAD, "campaign_id": campaign_id},
            headers=h_other,
        )
        assert resp.status_code == 403


class TestListNPCs:
    def test_gm_sees_all_npcs(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        make_npc(client, h, campaign_id, visible=False, name="Hidden NPC")
        make_npc(client, h, campaign_id, visible=True, name="Visible NPC")

        resp = client.get(f"/api/gm/campaigns/npcs/campaign/{campaign_id}", headers=h)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_player_sees_only_visible_npcs(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)

        make_npc(client, h_gm, campaign_id, visible=False, name="Hidden NPC")
        make_npc(client, h_gm, campaign_id, visible=True, name="Visible NPC")

        resp = client.get(f"/api/gm/campaigns/npcs/campaign/{campaign_id}", headers=h_player)
        assert resp.status_code == 200
        names = [n["name"] for n in resp.json()]
        assert "Visible NPC" in names
        assert "Hidden NPC" not in names

    def test_non_member_cannot_list_npcs(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        make_npc(client, h_gm, campaign_id)

        resp = client.get(f"/api/gm/campaigns/npcs/campaign/{campaign_id}", headers=h_other)
        assert resp.status_code == 403


class TestGetNPC:
    def test_gm_can_get_hidden_npc(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_id = make_npc(client, h, campaign_id, visible=False)

        resp = client.get(f"/api/gm/campaigns/npcs/{npc_id}", headers=h)
        assert resp.status_code == 200

    def test_player_cannot_get_hidden_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id, visible=False)

        resp = client.get(f"/api/gm/campaigns/npcs/{npc_id}", headers=h_player)
        assert resp.status_code == 403

    def test_player_can_get_visible_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id, visible=True)

        resp = client.get(f"/api/gm/campaigns/npcs/{npc_id}", headers=h_player)
        assert resp.status_code == 200


class TestUpdateNPC:
    def test_gm_can_update_npc(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_id = make_npc(client, h, campaign_id)

        resp = client.put(f"/api/gm/campaigns/npcs/{npc_id}", json={"name": "Renamed"}, headers=h)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"

    def test_player_cannot_update_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id, visible=True)

        resp = client.put(f"/api/gm/campaigns/npcs/{npc_id}", json={"name": "Hacked"}, headers=h_player)
        assert resp.status_code == 403


class TestDeleteNPC:
    def test_gm_can_delete_npc(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_id = make_npc(client, h, campaign_id)

        resp = client.delete(f"/api/gm/campaigns/npcs/{npc_id}", headers=h)
        assert resp.status_code == 200

    def test_player_cannot_delete_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id, visible=True)

        resp = client.delete(f"/api/gm/campaigns/npcs/{npc_id}", headers=h_player)
        assert resp.status_code == 403


class TestNPCVisibility:
    def test_gm_can_toggle_visibility(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_id = make_npc(client, h, campaign_id, visible=False)

        resp = client.patch(f"/api/gm/campaigns/npcs/{npc_id}/visibility", headers=h)
        assert resp.status_code == 200
        assert resp.json()["is_visible_to_players"] is True

        resp = client.patch(f"/api/gm/campaigns/npcs/{npc_id}/visibility", headers=h)
        assert resp.json()["is_visible_to_players"] is False

    def test_player_cannot_toggle_visibility(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id, visible=True)

        resp = client.patch(f"/api/gm/campaigns/npcs/{npc_id}/visibility", headers=h_player)
        assert resp.status_code == 403
