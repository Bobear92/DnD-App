"""
Regression tests for the deploy-T10 security review (fixes 2–5; fix 1, the session-content XSS, is a frontend
fix tested in RichTextEditor.test.jsx / sanitizeHtml.test.js / noUnsanitizedHtml.test.js).

Anyone can register and create a campaign — so "the GM of campaign B" below is any stranger with an account.

  - TestCrossCampaignLocationChildren: a GM of campaign B cannot reach campaign A's maps, pins, NPC links,
    relationships or links by putting A's ids under B's URL; a pin cannot link to (and so re-parent) another
    campaign's location.
  - TestMusicDeleteStaysInItsFolder: a music field pointed at another resource's upload never deletes it.
  - TestHiddenErasNotSentToPlayers: the calendar a player receives has no hidden eras and no id pointing at one.
  - TestHiddenNpcRelationships: a player cannot read a hidden NPC's relationships, or see a hidden NPC named as
    the other side of a visible NPC's relationship.
"""
import io

from shared.file_storage import get_storage
from tests.conftest import make_user, make_campaign, invite_player

LOC = lambda cid: f"/api/gm/campaigns/{cid}/locations"
NPCS = "/api/gm/campaigns/npcs"

TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
    b"\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)


def _stored(key):
    return (get_storage().root / key[len("uploads/"):]).exists()


def _location(client, h, cid, name="Loc", visible=True):
    r = client.post(LOC(cid), json={"name": name, "is_visible_to_players": visible}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _map(client, h, cid, lid):
    r = client.post(f"{LOC(cid)}/{lid}/maps", data={"name": "World"},
                    files={"file": ("map.png", io.BytesIO(TINY_PNG), "image/png")}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()


def _npc(client, h, cid, name="Gareth", visible=True):
    r = client.post(NPCS, json={"campaign_id": cid, "name": name, "race": "Human", "is_visible_to_players": visible}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _two_campaigns(client):
    """Victim GM owns campaign A (with a location + map + pin); attacker GM owns campaign B."""
    h_a, _ = make_user(client, 1)
    h_b, _ = make_user(client, 2)
    cid_a = make_campaign(client, h_a, name="Victim")
    cid_b = make_campaign(client, h_b, name="Attacker")
    lid_a = _location(client, h_a, cid_a, "Victim World")
    m = _map(client, h_a, cid_a, lid_a)
    pin = client.post(f"{LOC(cid_a)}/{lid_a}/maps/{m['id']}/pins",
                      json={"x_percent": 5, "y_percent": 5, "label": "Secret", "is_visible_to_players": False},
                      headers=h_a)
    assert pin.status_code == 201, pin.text
    return h_a, h_b, cid_a, cid_b, lid_a, m, pin.json()["id"]


class TestCrossCampaignLocationChildren:
    def test_cannot_delete_another_campaigns_map(self, client):
        h_a, h_b, cid_a, cid_b, lid_a, m, _ = _two_campaigns(client)
        r = client.delete(f"{LOC(cid_b)}/{lid_a}/maps/{m['id']}", headers=h_b)
        assert r.status_code == 404
        assert _stored(m["image_path"])
        maps = client.get(f"{LOC(cid_a)}/{lid_a}/maps", headers=h_a).json()
        assert [x["id"] for x in maps] == [m["id"]]

    def test_cannot_toggle_another_campaigns_map_visibility(self, client):
        h_a, h_b, cid_a, cid_b, lid_a, m, _ = _two_campaigns(client)
        r = client.patch(f"{LOC(cid_b)}/{lid_a}/maps/{m['id']}/visibility", headers=h_b)
        assert r.status_code == 404
        maps = client.get(f"{LOC(cid_a)}/{lid_a}/maps", headers=h_a).json()
        assert maps[0]["is_visible_to_players"] == m["is_visible_to_players"]

    def test_cannot_read_or_change_another_campaigns_pins(self, client):
        h_a, h_b, cid_a, cid_b, lid_a, m, pin_id = _two_campaigns(client)
        base = f"{LOC(cid_b)}/{lid_a}/maps/{m['id']}/pins"
        assert client.get(base, headers=h_b).status_code == 404
        assert client.post(base, json={"x_percent": 1, "y_percent": 1, "label": "x"}, headers=h_b).status_code == 404
        assert client.put(f"{base}/{pin_id}", json={"label": "pwned"}, headers=h_b).status_code == 404
        assert client.delete(f"{base}/{pin_id}", headers=h_b).status_code == 404
        pins = client.get(f"{LOC(cid_a)}/{lid_a}/maps/{m['id']}/pins", headers=h_a).json()
        assert [(p["id"], p["label"]) for p in pins] == [(pin_id, "Secret")]

    def test_cannot_remove_another_campaigns_npc_link_relationship_or_link(self, client):
        h_a, h_b, cid_a, cid_b, lid_a, _, _ = _two_campaigns(client)
        npc_a = _npc(client, h_a, cid_a)
        ln = client.post(f"{LOC(cid_a)}/{lid_a}/npcs", json={"npc_id": npc_a}, headers=h_a).json()
        lid_a2 = _location(client, h_a, cid_a, "Second")
        rel = client.post(f"{LOC(cid_a)}/{lid_a}/relationships",
                          json={"location_b_id": lid_a2, "label": "road", "direction": "same_level"}, headers=h_a)
        assert rel.status_code == 201, rel.text
        link = client.post(f"{LOC(cid_a)}/{lid_a}/links",
                           json={"content_type": "npc", "content_id": npc_a}, headers=h_a)
        assert link.status_code == 201, link.text

        assert client.delete(f"{LOC(cid_b)}/{lid_a}/npcs/{ln['id']}", headers=h_b).status_code == 404
        assert client.get(f"{LOC(cid_b)}/{lid_a}/relationships", headers=h_b).status_code == 404
        assert client.delete(f"{LOC(cid_b)}/{lid_a}/relationships/{rel.json()['id']}", headers=h_b).status_code == 404
        assert client.delete(f"{LOC(cid_b)}/{lid_a}/links/{link.json()['id']}", headers=h_b).status_code == 404

        assert len(client.get(f"{LOC(cid_a)}/{lid_a}/npcs", headers=h_a).json()) == 1
        assert len(client.get(f"{LOC(cid_a)}/{lid_a}/relationships", headers=h_a).json()) == 1
        assert len(client.get(f"{LOC(cid_a)}/{lid_a}/links", headers=h_a).json()) == 1

    def test_pin_cannot_link_to_another_campaigns_location(self, client):
        h_a, h_b, cid_a, cid_b, lid_a, _, _ = _two_campaigns(client)
        lid_b = _location(client, h_b, cid_b, "Attacker Map Loc")
        m_b = _map(client, h_b, cid_b, lid_b)
        orphan_a = _location(client, h_a, cid_a, "Orphan")  # no parent: _maybe_set_pin_parent would re-parent it
        base = f"{LOC(cid_b)}/{lid_b}/maps/{m_b['id']}/pins"
        r = client.post(base, json={"x_percent": 1, "y_percent": 1, "label": "x", "linked_location_id": orphan_a},
                        headers=h_b)
        assert r.status_code == 400
        ok = client.post(base, json={"x_percent": 1, "y_percent": 1, "label": "x"}, headers=h_b)
        r = client.put(f"{base}/{ok.json()['id']}", json={"linked_location_id": orphan_a}, headers=h_b)
        assert r.status_code == 400
        loc = client.get(f"{LOC(cid_a)}/{orphan_a}", headers=h_a).json()
        assert loc["parent_location_id"] is None

    def test_own_campaign_still_works(self, client):
        h_a, _, cid_a, _, lid_a, m, pin_id = _two_campaigns(client)
        lid_child = _location(client, h_a, cid_a, "Child")
        base = f"{LOC(cid_a)}/{lid_a}/maps/{m['id']}/pins"
        assert client.put(f"{base}/{pin_id}", json={"linked_location_id": lid_child}, headers=h_a).status_code == 200
        assert client.delete(f"{base}/{pin_id}", headers=h_a).status_code == 200
        assert client.delete(f"{LOC(cid_a)}/{lid_a}/maps/{m['id']}", headers=h_a).status_code == 200
        assert not _stored(m["image_path"])


class TestMusicDeleteStaysInItsFolder:
    def _setup(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_p)
        lid = _location(client, h_gm, cid)
        m = _map(client, h_gm, cid, lid)
        r = client.post("/api/characters", json={"name": "Thief", "race": "Human", "char_class": "Rogue",
                                                 "level": 1, "campaign_id": cid}, headers=h_p)
        assert r.status_code == 201, r.text
        return h_gm, h_p, cid, m, r.json()["id"]

    def test_player_cannot_delete_a_map_through_their_music_field(self, client):
        _, h_p, _, m, char_id = self._setup(client)
        r = client.put(f"/api/characters/{char_id}", json={"theme_music_url": m["image_path"]}, headers=h_p)
        assert r.status_code == 200, r.text
        assert client.delete(f"/api/characters/{char_id}/music", headers=h_p).status_code == 200
        assert _stored(m["image_path"])

    def test_uploading_music_over_a_foreign_path_does_not_delete_it(self, client):
        _, h_p, _, m, char_id = self._setup(client)
        client.put(f"/api/characters/{char_id}", json={"theme_music_url": m["image_path"]}, headers=h_p)
        r = client.post(f"/api/characters/{char_id}/music",
                        files={"file": ("t.mp3", io.BytesIO(b"ID3fake"), "audio/mpeg")}, headers=h_p)
        assert r.status_code == 200, r.text
        assert _stored(m["image_path"])

    def test_npc_and_session_music_fields_are_also_confined(self, client):
        h_gm, _, cid, m, _ = self._setup(client)
        npc = _npc(client, h_gm, cid)
        client.put(f"{NPCS}/{npc}", json={"theme_music_url": m["image_path"]}, headers=h_gm)
        assert client.delete(f"{NPCS}/{npc}/music", headers=h_gm).status_code == 200
        s = client.post(f"/api/gm/campaigns/{cid}/sessions", json={"title": "S1", "music_url": m["image_path"]},
                        headers=h_gm)
        assert s.status_code == 201, s.text
        assert client.delete(f"/api/gm/campaigns/{cid}/sessions/{s.json()['id']}/music",
                             headers=h_gm).status_code == 200
        assert _stored(m["image_path"])

    def test_own_music_is_still_deleted(self, client):
        _, h_p, _, _, char_id = self._setup(client)
        r = client.post(f"/api/characters/{char_id}/music",
                        files={"file": ("t.mp3", io.BytesIO(b"ID3fake"), "audio/mpeg")}, headers=h_p)
        key = r.json()["theme_music_url"]
        assert _stored(key)
        client.delete(f"/api/characters/{char_id}/music", headers=h_p)
        assert not _stored(key)


class TestHiddenErasNotSentToPlayers:
    def _setup(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_p)
        base = f"/api/gm/campaigns/{cid}/calendar"
        assert client.post(base, json={"name": "Cal"}, headers=h_gm).status_code == 201
        primary = client.post(f"{base}/eras", json={"name": "Age of Light", "abbreviation": "AL",
                                                    "direction": "ascending"}, headers=h_gm).json()
        secret = client.post(f"{base}/eras", json={"name": "The Hidden Age", "abbreviation": "HA",
                                                   "direction": "ascending", "anchor_era_id": primary["id"],
                                                   "anchor_era_year": 100, "anchor_this_year": 1}, headers=h_gm)
        assert secret.status_code == 201, secret.text
        secret = secret.json()
        client.patch(f"{base}/eras/{primary['id']}/visibility", json={"is_visible_to_players": True}, headers=h_gm)
        client.patch(f"{base}/eras/{secret['id']}/visibility", json={"is_visible_to_players": False}, headers=h_gm)
        return h_gm, h_p, base, primary, secret

    def test_player_does_not_receive_hidden_era(self, client):
        h_gm, h_p, base, primary, secret = self._setup(client)
        cal = client.get(base, headers=h_p).json()
        assert [e["id"] for e in cal["eras"]] == [primary["id"]]
        assert "The Hidden Age" not in str(cal)
        gm_cal = client.get(base, headers=h_gm).json()
        assert {e["id"] for e in gm_cal["eras"]} == {primary["id"], secret["id"]}

    def test_current_era_pointing_at_hidden_era_is_cleared_for_players_only(self, client):
        h_gm, h_p, base, _, secret = self._setup(client)
        assert client.put(base, json={"current_era_id": secret["id"], "current_year": 3},
                          headers=h_gm).status_code == 200
        assert client.get(base, headers=h_p).json()["current_era_id"] is None
        # The player's read must not have written the cleared value back to the database.
        assert client.get(base, headers=h_gm).json()["current_era_id"] == secret["id"]


class TestHiddenNpcRelationships:
    def _setup(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_p)
        shown = _npc(client, h_gm, cid, "Mayor", visible=True)
        hidden = _npc(client, h_gm, cid, "Secret Villain", visible=False)
        other = _npc(client, h_gm, cid, "Baker", visible=True)
        for a, b in ((shown, hidden), (shown, other), (hidden, other)):
            r = client.post(f"{NPCS}/{a}/relationships", json={"npc_b_id": b, "relationship_type": "ally"},
                            headers=h_gm)
            assert r.status_code == 201, r.text
        r = client.post(f"{NPCS}/{hidden}/player-relationships",
                        json={"user_id": uid_p, "relationship_type": "rival"}, headers=h_gm)
        assert r.status_code == 201, r.text
        return h_gm, h_p, shown, hidden, other

    def test_player_cannot_read_a_hidden_npcs_relationships(self, client):
        _, h_p, _, hidden, _ = self._setup(client)
        assert client.get(f"{NPCS}/{hidden}/relationships", headers=h_p).status_code == 403
        assert client.get(f"{NPCS}/{hidden}/player-relationships", headers=h_p).status_code == 403

    def test_hidden_npc_is_not_named_in_a_visible_npcs_relationships(self, client):
        h_gm, h_p, shown, hidden, other = self._setup(client)
        rels = client.get(f"{NPCS}/{shown}/relationships", headers=h_p).json()
        assert [r["npc_b_id"] for r in rels] == [other]
        assert "Secret Villain" not in str(rels)
        gm_rels = client.get(f"{NPCS}/{shown}/relationships", headers=h_gm).json()
        assert {r["npc_b_id"] for r in gm_rels} == {hidden, other}

    def test_gm_still_reads_hidden_npc_relationships(self, client):
        h_gm, _, _, hidden, _ = self._setup(client)
        assert client.get(f"{NPCS}/{hidden}/relationships", headers=h_gm).status_code == 200
        assert len(client.get(f"{NPCS}/{hidden}/player-relationships", headers=h_gm).json()) == 1
