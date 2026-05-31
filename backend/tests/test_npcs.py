from tests.conftest import make_user, make_campaign, invite_player

NPC_PAYLOAD = {
    "name": "Gareth the Blacksmith",
    "race": "Human",
    "occupation": "Blacksmith",
    "alignment": "Neutral Good",
    "is_visible_to_players": False,
}


def make_npc(client, gm_headers, campaign_id, *, visible=False, name="Gareth the Blacksmith", **kwargs):
    payload = {
        **NPC_PAYLOAD,
        "campaign_id": campaign_id,
        "name": name,
        "is_visible_to_players": visible,
        **kwargs,
    }
    resp = client.post("/api/gm/campaigns/npcs", json=payload, headers=gm_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# ── Create ─────────────────────────────────────────────────────────────────────

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

    def test_gm_can_create_npc_with_all_new_fields(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        payload = {
            **NPC_PAYLOAD,
            "campaign_id": campaign_id,
            "age": "mid-40s",
            "gender": "Male",
            "height": "6'2\"",
            "weight": "220 lbs",
            "appearance": "Broad shoulders, scarred hands",
            "voice": "Gruff baritone",
            "personality_traits": "Speaks little, means every word",
            "ideals": "Hard work",
            "bonds": "Owes a debt to the local militia",
            "flaws": "Stubborn to a fault",
            "languages": ["Common", "Dwarvish"],
            "status": "alive",
            "theme_music_url": "https://open.spotify.com/track/example",
            "gm_notes": "Secret: informant for the thieves guild",
        }
        resp = client.post("/api/gm/campaigns/npcs", json=payload, headers=h)
        assert resp.status_code == 201
        data = resp.json()
        assert data["age"] == "mid-40s"
        assert data["languages"] == ["Common", "Dwarvish"]
        assert data["status"] == "alive"
        assert data["gm_notes"] == "Secret: informant for the thieves guild"

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


# ── List ───────────────────────────────────────────────────────────────────────

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


# ── Get ────────────────────────────────────────────────────────────────────────

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


# ── gm_notes visibility ────────────────────────────────────────────────────────

class TestGMNotesVisibility:
    def test_gm_sees_gm_notes(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_id = make_npc(client, h, campaign_id, visible=True,
                          gm_notes="Secret: this NPC is the spy")
        resp = client.get(f"/api/gm/campaigns/npcs/{npc_id}", headers=h)
        assert resp.status_code == 200
        assert resp.json()["gm_notes"] == "Secret: this NPC is the spy"

    def test_player_does_not_see_gm_notes(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id, visible=True,
                          gm_notes="Secret: this NPC is the spy")

        resp = client.get(f"/api/gm/campaigns/npcs/{npc_id}", headers=h_player)
        assert resp.status_code == 200
        assert resp.json()["gm_notes"] is None

    def test_player_list_does_not_include_gm_notes(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        make_npc(client, h_gm, campaign_id, visible=True, gm_notes="Hidden info")

        resp = client.get(f"/api/gm/campaigns/npcs/campaign/{campaign_id}", headers=h_player)
        assert resp.status_code == 200
        for npc in resp.json():
            assert npc["gm_notes"] is None


# ── Update ─────────────────────────────────────────────────────────────────────

class TestUpdateNPC:
    def test_gm_can_update_npc(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_id = make_npc(client, h, campaign_id)
        resp = client.put(f"/api/gm/campaigns/npcs/{npc_id}", json={"name": "Renamed"}, headers=h)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"

    def test_gm_can_update_new_fields(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_id = make_npc(client, h, campaign_id)
        resp = client.put(
            f"/api/gm/campaigns/npcs/{npc_id}",
            json={"languages": ["Common", "Elvish"], "status": "dead", "voice": "Raspy"},
            headers=h,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["languages"] == ["Common", "Elvish"]
        assert data["status"] == "dead"
        assert data["voice"] == "Raspy"

    def test_player_cannot_update_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id, visible=True)
        resp = client.put(f"/api/gm/campaigns/npcs/{npc_id}", json={"name": "Hacked"}, headers=h_player)
        assert resp.status_code == 403


# ── Delete ─────────────────────────────────────────────────────────────────────

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


# ── Visibility toggle ──────────────────────────────────────────────────────────

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


# ── Last known location ────────────────────────────────────────────────────────

def make_location(client, gm_headers, campaign_id, name="The Forge"):
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/locations",
        json={"name": name, "is_visible_to_players": True},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


class TestLastKnownLocation:
    def test_npc_with_last_known_location_appears_in_location_npc_list(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        loc_id = make_location(client, h, campaign_id)
        npc_id = make_npc(client, h, campaign_id, visible=True,
                          last_known_location_id=loc_id,
                          last_seen_notes="Spotted at the forge last night")

        resp = client.get(
            f"/api/gm/campaigns/{campaign_id}/locations/{loc_id}/npcs",
            headers=h,
        )
        assert resp.status_code == 200
        npcs = resp.json()
        npc_ids = [n["npc_id"] for n in npcs]
        assert npc_id in npc_ids
        last_seen = next(n for n in npcs if n["npc_id"] == npc_id)
        assert last_seen["source"] == "last_seen"
        assert last_seen["description"] == "Spotted at the forge last night"

    def test_linked_npc_not_duplicated_when_also_last_seen(self, client):
        """NPC manually linked to a location AND set as last_seen should appear once."""
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        loc_id = make_location(client, h, campaign_id)
        npc_id = make_npc(client, h, campaign_id, visible=True,
                          last_known_location_id=loc_id)

        # Also manually link the NPC
        client.post(
            f"/api/gm/campaigns/{campaign_id}/locations/{loc_id}/npcs",
            json={"npc_id": npc_id, "description": "Works here"},
            headers=h,
        )

        resp = client.get(
            f"/api/gm/campaigns/{campaign_id}/locations/{loc_id}/npcs",
            headers=h,
        )
        assert resp.status_code == 200
        npc_entries = [n for n in resp.json() if n["npc_id"] == npc_id]
        assert len(npc_entries) == 1
        assert npc_entries[0]["source"] == "linked"

    def test_player_does_not_see_hidden_last_seen_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        loc_id = make_location(client, h_gm, campaign_id)
        make_npc(client, h_gm, campaign_id, visible=False,
                 last_known_location_id=loc_id)

        resp = client.get(
            f"/api/gm/campaigns/{campaign_id}/locations/{loc_id}/npcs",
            headers=h_player,
        )
        assert resp.status_code == 200
        assert resp.json() == []


# ── NPC Relationships ──────────────────────────────────────────────────────────

class TestNPCRelationships:
    def test_gm_can_add_relationship(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_a = make_npc(client, h, campaign_id, name="Aldric")
        npc_b = make_npc(client, h, campaign_id, name="Mira")

        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_a}/relationships",
            json={"npc_b_id": npc_b, "relationship_type": "ally", "description": "Childhood friends"},
            headers=h,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["npc_a_id"] == npc_a
        assert data["npc_b_id"] == npc_b
        assert data["relationship_type"] == "ally"
        assert data["npc_b_name"] == "Mira"

    def test_gm_can_list_relationships(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_a = make_npc(client, h, campaign_id, name="Aldric")
        npc_b = make_npc(client, h, campaign_id, name="Mira")
        client.post(
            f"/api/gm/campaigns/npcs/{npc_a}/relationships",
            json={"npc_b_id": npc_b, "relationship_type": "ally"},
            headers=h,
        )

        resp = client.get(f"/api/gm/campaigns/npcs/{npc_a}/relationships", headers=h)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_gm_can_delete_relationship(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_a = make_npc(client, h, campaign_id, name="Aldric")
        npc_b = make_npc(client, h, campaign_id, name="Mira")
        rel = client.post(
            f"/api/gm/campaigns/npcs/{npc_a}/relationships",
            json={"npc_b_id": npc_b, "relationship_type": "ally"},
            headers=h,
        ).json()

        resp = client.delete(f"/api/gm/campaigns/npcs/{npc_a}/relationships/{rel['id']}", headers=h)
        assert resp.status_code == 200

        resp = client.get(f"/api/gm/campaigns/npcs/{npc_a}/relationships", headers=h)
        assert resp.json() == []

    def test_cannot_add_relationship_to_self(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_a = make_npc(client, h, campaign_id)

        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_a}/relationships",
            json={"npc_b_id": npc_a, "relationship_type": "ally"},
            headers=h,
        )
        assert resp.status_code == 400

    def test_cannot_add_duplicate_relationship(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_a = make_npc(client, h, campaign_id, name="Aldric")
        npc_b = make_npc(client, h, campaign_id, name="Mira")
        client.post(
            f"/api/gm/campaigns/npcs/{npc_a}/relationships",
            json={"npc_b_id": npc_b, "relationship_type": "ally"},
            headers=h,
        )
        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_a}/relationships",
            json={"npc_b_id": npc_b, "relationship_type": "enemy"},
            headers=h,
        )
        assert resp.status_code == 409

    def test_player_can_view_relationships(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_a = make_npc(client, h_gm, campaign_id, name="Aldric", visible=True)
        npc_b = make_npc(client, h_gm, campaign_id, name="Mira", visible=True)
        client.post(
            f"/api/gm/campaigns/npcs/{npc_a}/relationships",
            json={"npc_b_id": npc_b, "relationship_type": "ally"},
            headers=h_gm,
        )

        resp = client.get(f"/api/gm/campaigns/npcs/{npc_a}/relationships", headers=h_player)
        assert resp.status_code == 200

    def test_player_cannot_add_relationship(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_a = make_npc(client, h_gm, campaign_id, name="Aldric", visible=True)
        npc_b = make_npc(client, h_gm, campaign_id, name="Mira", visible=True)

        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_a}/relationships",
            json={"npc_b_id": npc_b, "relationship_type": "ally"},
            headers=h_player,
        )
        assert resp.status_code == 403


# ── NPC–Player Relationships ───────────────────────────────────────────────────

class TestNPCPlayerRelationships:
    def test_gm_can_add_player_relationship(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id)

        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/player-relationships",
            json={"user_id": uid_player, "relationship_type": "friendly",
                  "description": "Saved the player's life"},
            headers=h_gm,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["user_id"] == uid_player
        assert data["relationship_type"] == "friendly"
        assert data["campaign_id"] == campaign_id

    def test_gm_can_list_player_relationships(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id)
        client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/player-relationships",
            json={"user_id": uid_player, "relationship_type": "hostile"},
            headers=h_gm,
        )

        resp = client.get(f"/api/gm/campaigns/npcs/{npc_id}/player-relationships", headers=h_gm)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_gm_can_delete_player_relationship(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id)
        rel = client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/player-relationships",
            json={"user_id": uid_player, "relationship_type": "friendly"},
            headers=h_gm,
        ).json()

        resp = client.delete(
            f"/api/gm/campaigns/npcs/{npc_id}/player-relationships/{rel['id']}",
            headers=h_gm,
        )
        assert resp.status_code == 200

    def test_cannot_add_non_member_as_player_relationship(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, uid_other = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        npc_id = make_npc(client, h_gm, campaign_id)

        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/player-relationships",
            json={"user_id": uid_other, "relationship_type": "friendly"},
            headers=h_gm,
        )
        assert resp.status_code == 400

    def test_cannot_add_duplicate_player_relationship(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id)
        client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/player-relationships",
            json={"user_id": uid_player, "relationship_type": "friendly"},
            headers=h_gm,
        )
        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/player-relationships",
            json={"user_id": uid_player, "relationship_type": "hostile"},
            headers=h_gm,
        )
        assert resp.status_code == 409

    def test_player_cannot_add_player_relationship(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id, visible=True)

        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/player-relationships",
            json={"user_id": uid_player, "relationship_type": "friendly"},
            headers=h_player,
        )
        assert resp.status_code == 403


class TestNPCMusic:
    def _tiny_mp3(self):
        import io
        return io.BytesIO(b"ID3\x03\x00\x00\x00fake-mp3-bytes")

    def test_gm_can_upload_music(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_id = make_npc(client, h, campaign_id)

        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/music",
            files={"file": ("theme.mp3", self._tiny_mp3(), "audio/mpeg")},
            headers=h,
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["theme_music_url"].startswith("uploads/music/npcs/")

    def test_player_cannot_upload_music(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        npc_id = make_npc(client, h_gm, campaign_id)

        resp = client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/music",
            files={"file": ("theme.mp3", self._tiny_mp3(), "audio/mpeg")},
            headers=h_player,
        )
        assert resp.status_code == 403

    def test_delete_music_clears_url(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        npc_id = make_npc(client, h, campaign_id)
        client.post(
            f"/api/gm/campaigns/npcs/{npc_id}/music",
            files={"file": ("theme.mp3", self._tiny_mp3(), "audio/mpeg")},
            headers=h,
        )

        resp = client.delete(f"/api/gm/campaigns/npcs/{npc_id}/music", headers=h)
        assert resp.status_code == 200, resp.text
        assert resp.json()["theme_music_url"] is None
