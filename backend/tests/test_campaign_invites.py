"""
Post-deploy T2 slice 2 — authorization rules.

  - TestInviteFlow / TestInviteAuthorization: a GM invites, and the user joins ONLY by accepting (consent step).
    Until then the invitee is not a member anywhere; nobody else can accept or decline for them; the old direct
    "add player" route is gone.
  - TestAdminIsNotGm: is_admin no longer grants GM powers over characters in a campaign the admin only plays in.
  - TestCampaignClassWrites: a campaign-owned class (and its features) is writable by that campaign's GM only.
"""
from shared.enums import OwnerType
from tests.conftest import _SessionLocal, make_user, make_admin, make_campaign, invite_player

CAMPAIGNS = "/api/gm/campaigns"


def _invite(client, gm_h, cid, uid):
    return client.post(f"{CAMPAIGNS}/{cid}/invites", json={"user_id": uid}, headers=gm_h)


def _campaign_ids(client, h):
    return {c["id"] for c in client.get(CAMPAIGNS, headers=h).json()}


class TestInviteFlow:
    def test_invitee_is_not_a_member_until_they_accept(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite = _invite(client, h_gm, cid, uid_p)
        assert invite.status_code == 201, invite.text

        assert cid not in _campaign_ids(client, h_p)
        assert client.get(f"{CAMPAIGNS}/{cid}", headers=h_p).status_code == 403
        assert client.get(f"{CAMPAIGNS}/{cid}/locations", headers=h_p).status_code == 403

        accept = client.post(f"{CAMPAIGNS}/invites/{invite.json()['id']}/accept", headers=h_p)
        assert accept.status_code == 200, accept.text
        assert accept.json()["id"] == cid
        assert cid in _campaign_ids(client, h_p)
        members = client.get(f"{CAMPAIGNS}/{cid}", headers=h_p).json()["members"]
        assert any(m["user_id"] == uid_p and m["role"] == "player" for m in members)
        # The invite is used up.
        assert client.get(f"{CAMPAIGNS}/invites/mine", headers=h_p).json() == []

    def test_invitee_sees_their_invite_with_campaign_and_inviter(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm, name="Dragon Heist")
        _invite(client, h_gm, cid, uid_p)
        mine = client.get(f"{CAMPAIGNS}/invites/mine", headers=h_p).json()
        assert len(mine) == 1
        assert mine[0]["campaign"]["name"] == "Dragon Heist"
        assert mine[0]["inviter"]["username"] == "user1"
        assert "@" not in str(mine)  # no emails anywhere in an invite

    def test_decline_removes_the_invite_and_grants_nothing(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        iid = _invite(client, h_gm, cid, uid_p).json()["id"]
        assert client.post(f"{CAMPAIGNS}/invites/{iid}/decline", headers=h_p).status_code == 204
        assert client.get(f"{CAMPAIGNS}/invites/mine", headers=h_p).json() == []
        assert cid not in _campaign_ids(client, h_p)
        assert client.get(f"{CAMPAIGNS}/{cid}/invites", headers=h_gm).json() == []

    def test_gm_lists_and_cancels_pending_invites(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        iid = _invite(client, h_gm, cid, uid_p).json()["id"]
        pending = client.get(f"{CAMPAIGNS}/{cid}/invites", headers=h_gm).json()
        assert [i["user"]["username"] for i in pending] == ["user2"]
        assert client.delete(f"{CAMPAIGNS}/{cid}/invites/{iid}", headers=h_gm).status_code == 204
        assert client.post(f"{CAMPAIGNS}/invites/{iid}/accept", headers=h_p).status_code == 404
        assert cid not in _campaign_ids(client, h_p)

    def test_cannot_invite_twice_or_invite_a_member(self, client):
        h_gm, uid_gm = make_user(client, 1)
        _, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        assert _invite(client, h_gm, cid, uid_p).status_code == 201
        assert _invite(client, h_gm, cid, uid_p).status_code == 400
        assert _invite(client, h_gm, cid, uid_gm).status_code == 400  # already a member (the GM)

    def test_inviting_a_nonexistent_user_gives_404(self, client):
        h_gm, _ = make_user(client, 1)
        cid = make_campaign(client, h_gm)
        assert _invite(client, h_gm, cid, 99999).status_code == 404

    def test_deleting_the_campaign_removes_its_invites(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        _invite(client, h_gm, cid, uid_p)
        assert client.delete(f"{CAMPAIGNS}/{cid}", headers=h_gm).status_code == 204
        assert client.get(f"{CAMPAIGNS}/invites/mine", headers=h_p).json() == []

    def test_helper_still_produces_a_member(self, client):
        # conftest.invite_player now does invite + accept; every other test file relies on it.
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_p)
        assert cid in _campaign_ids(client, h_p)


class TestInviteAuthorization:
    def test_direct_add_player_route_is_gone(self, client):
        h_gm, _ = make_user(client, 1)
        _, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        resp = client.post(f"{CAMPAIGNS}/{cid}/players", json={"user_id": uid_p}, headers=h_gm)
        assert resp.status_code in (404, 405)

    def test_only_the_gm_can_invite_list_or_cancel(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        h_x, uid_x = make_user(client, 3)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_p)
        iid = _invite(client, h_gm, cid, uid_x).json()["id"]
        for h in (h_p, h_x):
            assert _invite(client, h, cid, uid_x).status_code == 403
            assert client.get(f"{CAMPAIGNS}/{cid}/invites", headers=h).status_code == 403
            assert client.delete(f"{CAMPAIGNS}/{cid}/invites/{iid}", headers=h).status_code == 403

    def test_nobody_else_can_accept_or_decline_your_invite(self, client):
        h_gm, _ = make_user(client, 1)
        _, uid_p = make_user(client, 2)
        h_x, _ = make_user(client, 3)
        cid = make_campaign(client, h_gm)
        iid = _invite(client, h_gm, cid, uid_p).json()["id"]
        for h in (h_x, h_gm):
            assert client.post(f"{CAMPAIGNS}/invites/{iid}/accept", headers=h).status_code == 404
            assert client.post(f"{CAMPAIGNS}/invites/{iid}/decline", headers=h).status_code == 404
        assert cid not in _campaign_ids(client, h_x)
        assert client.get(f"{CAMPAIGNS}/{cid}/invites", headers=h_gm).json()[0]["id"] == iid

    def test_a_gm_cannot_cancel_another_campaigns_invite(self, client):
        h_a, _ = make_user(client, 1)
        h_b, _ = make_user(client, 2)
        _, uid_p = make_user(client, 3)
        cid_a = make_campaign(client, h_a, name="A")
        cid_b = make_campaign(client, h_b, name="B")
        iid = _invite(client, h_a, cid_a, uid_p).json()["id"]
        assert client.delete(f"{CAMPAIGNS}/{cid_b}/invites/{iid}", headers=h_b).status_code == 404
        assert len(client.get(f"{CAMPAIGNS}/{cid_a}/invites", headers=h_a).json()) == 1


def _character(client, h, cid, name="Hero"):
    r = client.post("/api/characters", json={"name": name, "race": "Human", "char_class": "Fighter", "campaign_id": cid},
                    headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


class TestAdminIsNotGm:
    def _setup(self, client):
        h_gm, _ = make_user(client, 1)
        h_owner, uid_owner = make_user(client, 2)
        h_admin, uid_admin = make_admin(client)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_owner)
        invite_player(client, h_gm, cid, uid_admin)  # the admin is only a PLAYER here
        char_id = _character(client, h_owner, cid)
        client.put(f"/api/characters/{char_id}", json={"gm_notes": "secret"}, headers=h_gm)
        return h_gm, h_admin, cid, char_id

    def test_admin_player_cannot_see_hidden_characters_or_gm_notes(self, client):
        h_gm, h_admin, cid, char_id = self._setup(client)
        assert client.get(f"/api/characters/{char_id}", headers=h_admin).status_code == 403
        assert client.get(f"/api/characters/campaign/{cid}", headers=h_admin).json() == []
        client.patch(f"/api/characters/{char_id}/visibility", json={"is_visible": True}, headers=h_gm)
        visible = client.get(f"/api/characters/{char_id}", headers=h_admin).json()
        assert visible["gm_notes"] is None

    def test_admin_player_cannot_edit_delete_or_toggle_others_characters(self, client):
        h_gm, h_admin, cid, char_id = self._setup(client)
        client.patch(f"/api/characters/{char_id}/visibility", json={"is_visible": True}, headers=h_gm)
        assert client.put(f"/api/characters/{char_id}", json={"name": "Hijacked"}, headers=h_admin).status_code == 403
        assert client.patch(f"/api/characters/{char_id}/visibility", json={"is_visible": False},
                            headers=h_admin).status_code == 403
        assert client.delete(f"/api/characters/{char_id}", headers=h_admin).status_code == 403


def _campaign_class(cid):
    from players.classes.models import CharacterClass
    with _SessionLocal() as db:
        cls = CharacterClass(name="Homebrew Knight", edition="5e", flavor_text="x", hit_die=10, primary_ability="Strength", owner_type=OwnerType.campaign,
                             owner_id=cid, saving_throws=[], armor_proficiencies=[], weapon_proficiencies=[],
                             tool_proficiencies=[], skills_available=[], skill_count=2)
        db.add(cls)
        db.commit()
        return cls.id


class TestCampaignClassWrites:
    def test_strangers_and_players_cannot_modify_a_campaign_class(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        h_x, _ = make_user(client, 3)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_p)
        class_id = _campaign_class(cid)
        feat = client.post(f"/api/classes/{class_id}/features",
                           json={"level": 1, "feature_name": "Oath", "feature_description": "x"}, headers=h_gm)
        assert feat.status_code == 201, feat.text
        fid = feat.json()["id"]
        for h in (h_p, h_x):
            assert client.put(f"/api/classes/{class_id}", json={"hit_die": 12}, headers=h).status_code == 403
            assert client.post(f"/api/classes/{class_id}/features",
                               json={"level": 2, "feature_name": "X", "feature_description": "x"},
                               headers=h).status_code == 403
            assert client.put(f"/api/classes/features/{fid}", json={"feature_name": "Y"}, headers=h).status_code == 403
            assert client.delete(f"/api/classes/features/{fid}", headers=h).status_code == 403
            assert client.delete(f"/api/classes/{class_id}", headers=h).status_code == 403

    def test_the_campaigns_gm_can_modify_it(self, client):
        h_gm, _ = make_user(client, 1)
        cid = make_campaign(client, h_gm)
        class_id = _campaign_class(cid)
        assert client.put(f"/api/classes/{class_id}", json={"hit_die": 12}, headers=h_gm).status_code == 200
        assert client.delete(f"/api/classes/{class_id}", headers=h_gm).status_code == 200
