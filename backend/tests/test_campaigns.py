from tests.conftest import register, auth_headers

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(client, n=1):
    """Register user N and return their auth headers + user id."""
    email = f"user{n}@example.com"
    username = f"user{n}"
    register(client, email=email, username=username)
    headers = auth_headers(client, email=email)
    resp = client.get("/api/auth/me", headers=headers)
    return headers, resp.json()["id"]


def create_campaign(client, headers, name="Test Campaign", description="A test campaign"):
    return client.post("/api/gm/campaigns", json={"name": name, "description": description}, headers=headers)


# ---------------------------------------------------------------------------
# Creating campaigns
# ---------------------------------------------------------------------------

class TestCreateCampaign:
    def test_any_authenticated_user_can_create(self, client):
        headers, _ = make_user(client, 1)
        resp = create_campaign(client, headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Test Campaign"

    def test_creator_becomes_gm(self, client):
        headers, user_id = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        detail = client.get(f"/api/gm/campaigns/{campaign_id}", headers=headers).json()
        gm_member = next(m for m in detail["members"] if m["user"]["id"] == user_id)
        assert gm_member["role"] == "gm"

    def test_unauthenticated_cannot_create(self, client):
        resp = create_campaign(client, {})
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Listing campaigns
# ---------------------------------------------------------------------------

class TestListCampaigns:
    def test_list_includes_created_by(self, client):
        """created_by must be in the list response so the frontend can compute userRole."""
        headers, user_id = make_user(client, 1)
        create_campaign(client, headers)
        resp = client.get("/api/gm/campaigns", headers=headers).json()
        assert "created_by" in resp[0]
        assert resp[0]["created_by"] == user_id

    def test_user_sees_only_their_campaigns(self, client):
        h1, _ = make_user(client, 1)
        h2, _ = make_user(client, 2)
        create_campaign(client, h1, name="Campaign A")
        create_campaign(client, h2, name="Campaign B")

        resp1 = client.get("/api/gm/campaigns", headers=h1).json()
        resp2 = client.get("/api/gm/campaigns", headers=h2).json()

        assert len(resp1) == 1 and resp1[0]["name"] == "Campaign A"
        assert len(resp2) == 1 and resp2[0]["name"] == "Campaign B"

    def test_player_sees_campaign_they_were_invited_to(self, client):
        h1, _ = make_user(client, 1)
        h2, uid2 = make_user(client, 2)
        campaign_id = create_campaign(client, h1).json()["id"]
        client.post(f"/api/gm/campaigns/{campaign_id}/players", json={"user_id": uid2}, headers=h1)

        resp = client.get("/api/gm/campaigns", headers=h2).json()
        assert any(c["id"] == campaign_id for c in resp)

    def test_player_does_not_see_uninvited_campaigns(self, client):
        h1, _ = make_user(client, 1)
        h2, _ = make_user(client, 2)
        create_campaign(client, h1)

        resp = client.get("/api/gm/campaigns", headers=h2).json()
        assert resp == []


# ---------------------------------------------------------------------------
# Getting a specific campaign
# ---------------------------------------------------------------------------

class TestGetCampaign:
    def test_gm_can_get_own_campaign(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        resp = client.get(f"/api/gm/campaigns/{campaign_id}", headers=headers)
        assert resp.status_code == 200

    def test_non_member_gets_403(self, client):
        h1, _ = make_user(client, 1)
        h2, _ = make_user(client, 2)
        campaign_id = create_campaign(client, h1).json()["id"]
        resp = client.get(f"/api/gm/campaigns/{campaign_id}", headers=h2)
        assert resp.status_code == 403

    def test_missing_campaign_gets_404(self, client):
        headers, _ = make_user(client, 1)
        resp = client.get("/api/gm/campaigns/99999", headers=headers)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Updating campaigns
# ---------------------------------------------------------------------------

class TestUpdateCampaign:
    def test_gm_can_update(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        resp = client.put(
            f"/api/gm/campaigns/{campaign_id}",
            json={"name": "Renamed"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"

    def test_non_gm_cannot_update(self, client):
        h1, _ = make_user(client, 1)
        h2, uid2 = make_user(client, 2)
        campaign_id = create_campaign(client, h1).json()["id"]
        # Invite player so they can see the campaign but not edit it
        client.post(f"/api/gm/campaigns/{campaign_id}/players", json={"user_id": uid2}, headers=h1)
        resp = client.put(
            f"/api/gm/campaigns/{campaign_id}",
            json={"name": "Hacked"},
            headers=h2,
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Currency type setting
# ---------------------------------------------------------------------------

class TestCampaignCurrency:
    def test_currency_type_defaults_to_standard(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        detail = client.get(f"/api/gm/campaigns/{campaign_id}", headers=headers).json()
        assert detail["currency_type"] == "standard"

    def test_gm_can_set_currency_type(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        resp = client.put(
            f"/api/gm/campaigns/{campaign_id}",
            json={"currency_type": "full"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["currency_type"] == "full"

    def test_currency_type_in_list(self, client):
        """currency_type must be in the list response so the frontend context picks it up."""
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        client.put(f"/api/gm/campaigns/{campaign_id}", json={"currency_type": "full"}, headers=headers)
        resp = client.get("/api/gm/campaigns", headers=headers).json()
        assert resp[0]["currency_type"] == "full"


class TestCampaignStartingEquipment:
    def test_defaults_to_equipment(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        detail = client.get(f"/api/gm/campaigns/{campaign_id}", headers=headers).json()
        assert detail["starting_equipment"] == "equipment"

    def test_gm_can_set_mode(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        for mode in ("equipment_or_gold", "none", "equipment"):
            resp = client.put(f"/api/gm/campaigns/{campaign_id}", json={"starting_equipment": mode}, headers=headers)
            assert resp.status_code == 200
            assert resp.json()["starting_equipment"] == mode

    def test_in_list(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        client.put(f"/api/gm/campaigns/{campaign_id}", json={"starting_equipment": "none"}, headers=headers)
        resp = client.get("/api/gm/campaigns", headers=headers).json()
        assert resp[0]["starting_equipment"] == "none"


class TestCampaignAsiFeatMode:
    def test_defaults_to_asi_or_feat(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        detail = client.get(f"/api/gm/campaigns/{campaign_id}", headers=headers).json()
        assert detail["asi_feat_mode"] == "asi_or_feat"

    def test_gm_can_set_mode(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        for mode in ("asi_only", "asi_and_feat", "asi_or_feat"):
            resp = client.put(f"/api/gm/campaigns/{campaign_id}", json={"asi_feat_mode": mode}, headers=headers)
            assert resp.status_code == 200
            assert resp.json()["asi_feat_mode"] == mode

    def test_in_list(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        client.put(f"/api/gm/campaigns/{campaign_id}", json={"asi_feat_mode": "asi_only"}, headers=headers)
        resp = client.get("/api/gm/campaigns", headers=headers).json()
        assert resp[0]["asi_feat_mode"] == "asi_only"


# ---------------------------------------------------------------------------
# Deleting campaigns
# ---------------------------------------------------------------------------

class TestDeleteCampaign:
    def test_gm_can_delete(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        resp = client.delete(f"/api/gm/campaigns/{campaign_id}", headers=headers)
        assert resp.status_code == 204

        # Confirm it's gone
        get_resp = client.get(f"/api/gm/campaigns/{campaign_id}", headers=headers)
        assert get_resp.status_code == 404

    def test_non_gm_cannot_delete(self, client):
        h1, _ = make_user(client, 1)
        h2, _ = make_user(client, 2)
        campaign_id = create_campaign(client, h1).json()["id"]
        resp = client.delete(f"/api/gm/campaigns/{campaign_id}", headers=h2)
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Player management
# ---------------------------------------------------------------------------

class TestPlayerManagement:
    def test_gm_can_add_player(self, client):
        h1, _ = make_user(client, 1)
        h2, uid2 = make_user(client, 2)
        campaign_id = create_campaign(client, h1).json()["id"]
        resp = client.post(
            f"/api/gm/campaigns/{campaign_id}/players",
            json={"user_id": uid2},
            headers=h1,
        )
        assert resp.status_code == 201

    def test_non_gm_cannot_add_player(self, client):
        h1, _ = make_user(client, 1)
        h2, uid2 = make_user(client, 2)
        h3, uid3 = make_user(client, 3)
        campaign_id = create_campaign(client, h1).json()["id"]
        client.post(f"/api/gm/campaigns/{campaign_id}/players", json={"user_id": uid2}, headers=h1)
        # Player 2 tries to add player 3
        resp = client.post(
            f"/api/gm/campaigns/{campaign_id}/players",
            json={"user_id": uid3},
            headers=h2,
        )
        assert resp.status_code == 403

    def test_cannot_add_same_player_twice(self, client):
        h1, _ = make_user(client, 1)
        h2, uid2 = make_user(client, 2)
        campaign_id = create_campaign(client, h1).json()["id"]
        client.post(f"/api/gm/campaigns/{campaign_id}/players", json={"user_id": uid2}, headers=h1)
        resp = client.post(
            f"/api/gm/campaigns/{campaign_id}/players",
            json={"user_id": uid2},
            headers=h1,
        )
        assert resp.status_code == 400

    def test_gm_can_remove_player(self, client):
        h1, _ = make_user(client, 1)
        h2, uid2 = make_user(client, 2)
        campaign_id = create_campaign(client, h1).json()["id"]
        client.post(f"/api/gm/campaigns/{campaign_id}/players", json={"user_id": uid2}, headers=h1)

        resp = client.delete(f"/api/gm/campaigns/{campaign_id}/players/{uid2}", headers=h1)
        assert resp.status_code == 204

        # Player no longer sees the campaign
        campaigns = client.get("/api/gm/campaigns", headers=h2).json()
        assert not any(c["id"] == campaign_id for c in campaigns)

    def test_adding_nonexistent_user_gives_404(self, client):
        headers, _ = make_user(client, 1)
        campaign_id = create_campaign(client, headers).json()["id"]
        resp = client.post(
            f"/api/gm/campaigns/{campaign_id}/players",
            json={"user_id": 99999},
            headers=headers,
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# User search (for GM invite flow)
# ---------------------------------------------------------------------------

class TestUserSearch:
    def test_search_by_username(self, client):
        h1, _ = make_user(client, 1)
        make_user(client, 2)  # username: user2
        resp = client.get("/api/auth/users/search?q=user2", headers=h1)
        assert resp.status_code == 200
        data = resp.json()
        assert any(u["username"] == "user2" for u in data)

    def test_search_by_email(self, client):
        h1, _ = make_user(client, 1)
        make_user(client, 2)  # email: user2@example.com
        resp = client.get("/api/auth/users/search?q=user2@example.com", headers=h1)
        assert resp.status_code == 200
        assert any(u["email"] == "user2@example.com" for u in resp.json())

    def test_search_excludes_self(self, client):
        h1, uid1 = make_user(client, 1)
        resp = client.get("/api/auth/users/search?q=user1", headers=h1)
        assert resp.status_code == 200
        assert not any(u["id"] == uid1 for u in resp.json())

    def test_search_requires_min_2_chars(self, client):
        h1, _ = make_user(client, 1)
        resp = client.get("/api/auth/users/search?q=u", headers=h1)
        assert resp.status_code == 422

    def test_search_requires_auth(self, client):
        resp = client.get("/api/auth/users/search?q=user")
        assert resp.status_code == 401

    def test_search_returns_partial_match(self, client):
        h1, _ = make_user(client, 1)
        make_user(client, 2)
        make_user(client, 3)
        resp = client.get("/api/auth/users/search?q=user", headers=h1)
        assert resp.status_code == 200
        # Should match user2 and user3 (user1 excluded as self)
        usernames = {u["username"] for u in resp.json()}
        assert "user2" in usernames
        assert "user3" in usernames

    def test_search_response_shape(self, client):
        h1, _ = make_user(client, 1)
        make_user(client, 2)
        resp = client.get("/api/auth/users/search?q=user2", headers=h1)
        u = resp.json()[0]
        assert "id" in u
        assert "username" in u
        assert "email" in u
