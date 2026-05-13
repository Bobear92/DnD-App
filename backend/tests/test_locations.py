"""
Tests for the locations module:
  - Location CRUD + visibility
  - gm_notes stripped from player responses
  - New info fields (weather, terrain, history, etc.)
  - Maps + map visibility (file I/O mocked)
  - Pins + pin visibility
  - Location NPCs (add/remove/list, visibility filter, duplicate, wrong campaign)
  - NPC summary field surfaced in location NPC response
"""
import io
from unittest.mock import AsyncMock, patch

from tests.conftest import make_user, make_campaign, invite_player

BASE = lambda cid: f"/api/gm/campaigns/{cid}/locations"
NPC_BASE = "/api/gm/campaigns/npcs"


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_location(client, headers, campaign_id, *, name="Test Location", visible=False, **extra):
    payload = {
        "name": name,
        "is_visible_to_players": visible,
        **extra,
    }
    resp = client.post(BASE(campaign_id), json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def make_npc(client, headers, campaign_id, *, name="Gareth", visible=False, summary=None):
    payload = {
        "campaign_id": campaign_id,
        "name": name,
        "race": "Human",
        "is_visible_to_players": visible,
    }
    if summary is not None:
        payload["summary"] = summary
    resp = client.post(NPC_BASE, json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def add_npc_to_location(client, headers, campaign_id, location_id, npc_id, *, description=None):
    payload = {"npc_id": npc_id}
    if description:
        payload["description"] = description
    resp = client.post(f"{BASE(campaign_id)}/{location_id}/npcs", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# ── Location CRUD ─────────────────────────────────────────────────────────────

class TestCreateLocation:
    def test_gm_can_create(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        resp = client.post(BASE(cid), json={"name": "Ironforge", "is_visible_to_players": False}, headers=h)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Ironforge"
        assert data["is_visible_to_players"] is False

    def test_player_cannot_create(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        resp = client.post(BASE(cid), json={"name": "Stolen City"}, headers=h_player)
        assert resp.status_code == 403

    def test_non_member_cannot_create(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        resp = client.post(BASE(cid), json={"name": "Stolen City"}, headers=h_other)
        assert resp.status_code == 403


class TestListLocations:
    def test_gm_sees_all(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        make_location(client, h, cid, name="Hidden", visible=False)
        make_location(client, h, cid, name="Visible", visible=True)
        resp = client.get(BASE(cid), headers=h)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_player_sees_only_visible(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        make_location(client, h_gm, cid, name="Hidden", visible=False)
        make_location(client, h_gm, cid, name="Visible", visible=True)
        resp = client.get(BASE(cid), headers=h_player)
        assert resp.status_code == 200
        names = [l["name"] for l in resp.json()]
        assert "Visible" in names
        assert "Hidden" not in names

    def test_non_member_cannot_list(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        make_location(client, h_gm, cid)
        resp = client.get(BASE(cid), headers=h_other)
        assert resp.status_code == 403


class TestGetLocation:
    def test_gm_can_get_hidden(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid, visible=False)
        resp = client.get(f"{BASE(cid)}/{lid}", headers=h)
        assert resp.status_code == 200

    def test_player_cannot_get_hidden(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=False)
        resp = client.get(f"{BASE(cid)}/{lid}", headers=h_player)
        assert resp.status_code == 403

    def test_player_can_get_visible(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        resp = client.get(f"{BASE(cid)}/{lid}", headers=h_player)
        assert resp.status_code == 200

    def test_non_member_cannot_get(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        lid = make_location(client, h_gm, cid, visible=True)
        resp = client.get(f"{BASE(cid)}/{lid}", headers=h_other)
        assert resp.status_code == 403


class TestUpdateLocation:
    def test_gm_can_update(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        resp = client.put(f"{BASE(cid)}/{lid}", json={"name": "Renamed"}, headers=h)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"

    def test_player_cannot_update(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        resp = client.put(f"{BASE(cid)}/{lid}", json={"name": "Hacked"}, headers=h_player)
        assert resp.status_code == 403


class TestDeleteLocation:
    def test_gm_can_delete(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        resp = client.delete(f"{BASE(cid)}/{lid}", headers=h)
        assert resp.status_code == 200

    def test_player_cannot_delete(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        resp = client.delete(f"{BASE(cid)}/{lid}", headers=h_player)
        assert resp.status_code == 403


class TestLocationVisibilityToggle:
    def test_gm_can_toggle(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid, visible=False)
        resp = client.patch(f"{BASE(cid)}/{lid}/visibility", headers=h)
        assert resp.status_code == 200
        assert resp.json()["is_visible_to_players"] is True
        resp = client.patch(f"{BASE(cid)}/{lid}/visibility", headers=h)
        assert resp.json()["is_visible_to_players"] is False

    def test_player_cannot_toggle(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        resp = client.patch(f"{BASE(cid)}/{lid}/visibility", headers=h_player)
        assert resp.status_code == 403


# ── GM Notes privacy ──────────────────────────────────────────────────────────

class TestGmNotesPrivacy:
    def test_gm_sees_gm_notes(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid, visible=True, gm_notes="Secret tunnel behind the waterfall")
        resp = client.get(f"{BASE(cid)}/{lid}", headers=h)
        assert resp.status_code == 200
        assert resp.json()["gm_notes"] == "Secret tunnel behind the waterfall"

    def test_player_never_sees_gm_notes(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True, gm_notes="Secret tunnel behind the waterfall")
        resp = client.get(f"{BASE(cid)}/{lid}", headers=h_player)
        assert resp.status_code == 200
        assert resp.json()["gm_notes"] is None


# ── New info fields ───────────────────────────────────────────────────────────

class TestInfoFields:
    def test_create_with_all_new_fields(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        payload = {
            "name": "Ashenvale",
            "is_visible_to_players": True,
            "weather": "Constant drizzle",
            "plant_life": "Dense ancient oaks",
            "animal_life": "Giant spiders and wolves",
            "terrain": "Dense forest",
            "climate": "Temperate",
            "history": "Once a great elven city",
            "rumors": "They say the old king is buried here",
            "government": "Elder council",
            "religion": "Followers of Silvanus",
            "economy": "Timber and herbs",
            "threats": "Undead patrol the northern path",
            "available_services": "Herbalist, ranger guild",
            "points_of_interest": "The Moonwell, the Broken Tower",
        }
        resp = client.post(BASE(cid), json=payload, headers=h)
        assert resp.status_code == 201
        data = resp.json()
        assert data["weather"] == "Constant drizzle"
        assert data["history"] == "Once a great elven city"
        assert data["threats"] == "Undead patrol the northern path"
        assert data["economy"] == "Timber and herbs"

    def test_update_new_fields(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        resp = client.put(f"{BASE(cid)}/{lid}", json={"climate": "Arid", "rumors": "Gold in the hills"}, headers=h)
        assert resp.status_code == 200
        assert resp.json()["climate"] == "Arid"
        assert resp.json()["rumors"] == "Gold in the hills"

    def test_new_fields_visible_to_player(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True, history="Ancient lore", weather="Stormy")
        resp = client.get(f"{BASE(cid)}/{lid}", headers=h_player)
        assert resp.status_code == 200
        assert resp.json()["history"] == "Ancient lore"
        assert resp.json()["weather"] == "Stormy"


# ── Maps ──────────────────────────────────────────────────────────────────────

TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
    b"\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)


def _upload_map(client, headers, campaign_id, location_id, *, name="Floor Plan"):
    """Upload a minimal PNG map. Mocks save_map_image to avoid disk writes."""
    fake_path = f"uploads/maps/{campaign_id}/{location_id}/fake.png"
    mock_save = AsyncMock(return_value=fake_path)
    with patch("gm.campaigns.campaign_tools.locations.service.save_map_image", mock_save):
        resp = client.post(
            f"{BASE(campaign_id)}/{location_id}/maps",
            data={"name": name},
            files={"file": ("map.png", io.BytesIO(TINY_PNG), "image/png")},
            headers=headers,
        )
    return resp


class TestMaps:
    def test_gm_can_upload_map(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        resp = _upload_map(client, h, cid, lid)
        assert resp.status_code == 201
        assert resp.json()["name"] == "Floor Plan"

    def test_player_cannot_upload_map(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        resp = _upload_map(client, h_player, cid, lid)
        assert resp.status_code == 403

    def test_gm_sees_all_maps(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        _upload_map(client, h, cid, lid, name="Hidden Map")
        resp = client.get(f"{BASE(cid)}/{lid}/maps", headers=h)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_player_sees_only_visible_maps(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)

        upload_resp = _upload_map(client, h_gm, cid, lid, name="Hidden Map")
        map_id = upload_resp.json()["id"]

        # Map starts hidden — player sees none
        resp = client.get(f"{BASE(cid)}/{lid}/maps", headers=h_player)
        assert resp.json() == []

        # GM toggles it visible
        client.patch(f"{BASE(cid)}/{lid}/maps/{map_id}/visibility", headers=h_gm)
        resp = client.get(f"{BASE(cid)}/{lid}/maps", headers=h_player)
        assert len(resp.json()) == 1

    def test_gm_can_delete_map(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        upload_resp = _upload_map(client, h, cid, lid)
        map_id = upload_resp.json()["id"]
        with patch("gm.campaigns.campaign_tools.locations.service.delete_map_image"):
            resp = client.delete(f"{BASE(cid)}/{lid}/maps/{map_id}", headers=h)
        assert resp.status_code == 200


# ── Pins ──────────────────────────────────────────────────────────────────────

class TestPins:
    def _setup(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid, visible=True)
        upload_resp = _upload_map(client, h, cid, lid)
        mid = upload_resp.json()["id"]
        return h, cid, lid, mid

    def test_gm_can_create_pin(self, client):
        h, cid, lid, mid = self._setup(client)
        resp = client.post(
            f"{BASE(cid)}/{lid}/maps/{mid}/pins",
            json={"x_percent": 50.0, "y_percent": 25.0, "label": "Entrance", "is_visible_to_players": False},
            headers=h,
        )
        assert resp.status_code == 201
        assert resp.json()["label"] == "Entrance"

    def test_player_cannot_create_pin(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        upload_resp = _upload_map(client, h_gm, cid, lid)
        mid = upload_resp.json()["id"]
        client.patch(f"{BASE(cid)}/{lid}/maps/{mid}/visibility", headers=h_gm)
        resp = client.post(
            f"{BASE(cid)}/{lid}/maps/{mid}/pins",
            json={"x_percent": 10.0, "y_percent": 10.0, "label": "Hacked", "is_visible_to_players": True},
            headers=h_player,
        )
        assert resp.status_code == 403

    def test_player_sees_only_visible_pins(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        upload_resp = _upload_map(client, h_gm, cid, lid)
        mid = upload_resp.json()["id"]
        client.patch(f"{BASE(cid)}/{lid}/maps/{mid}/visibility", headers=h_gm)

        client.post(f"{BASE(cid)}/{lid}/maps/{mid}/pins", json={"x_percent": 10.0, "y_percent": 10.0, "label": "Hidden Pin", "is_visible_to_players": False}, headers=h_gm)
        client.post(f"{BASE(cid)}/{lid}/maps/{mid}/pins", json={"x_percent": 20.0, "y_percent": 20.0, "label": "Visible Pin", "is_visible_to_players": True}, headers=h_gm)

        resp = client.get(f"{BASE(cid)}/{lid}/maps/{mid}/pins", headers=h_player)
        labels = [p["label"] for p in resp.json()]
        assert "Visible Pin" in labels
        assert "Hidden Pin" not in labels

    def test_gm_can_update_and_delete_pin(self, client):
        h, cid, lid, mid = self._setup(client)
        pin_resp = client.post(
            f"{BASE(cid)}/{lid}/maps/{mid}/pins",
            json={"x_percent": 50.0, "y_percent": 50.0, "label": "Chest", "is_visible_to_players": False},
            headers=h,
        )
        pin_id = pin_resp.json()["id"]
        resp = client.put(f"{BASE(cid)}/{lid}/maps/{mid}/pins/{pin_id}", json={"label": "Treasure Chest"}, headers=h)
        assert resp.status_code == 200
        assert resp.json()["label"] == "Treasure Chest"
        resp = client.delete(f"{BASE(cid)}/{lid}/maps/{mid}/pins/{pin_id}", headers=h)
        assert resp.status_code == 200


# ── Location NPCs ─────────────────────────────────────────────────────────────

class TestLocationNpcs:
    def test_gm_can_add_npc(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        npc_id = make_npc(client, h, cid, name="Mira")
        resp = client.post(f"{BASE(cid)}/{lid}/npcs", json={"npc_id": npc_id}, headers=h)
        assert resp.status_code == 201
        data = resp.json()
        assert data["npc_id"] == npc_id
        assert data["name"] == "Mira"

    def test_gm_can_add_npc_with_role_description(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        npc_id = make_npc(client, h, cid)
        resp = client.post(
            f"{BASE(cid)}/{lid}/npcs",
            json={"npc_id": npc_id, "description": "Runs the local forge"},
            headers=h,
        )
        assert resp.status_code == 201
        assert resp.json()["description"] == "Runs the local forge"

    def test_npc_summary_appears_in_response(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        npc_id = make_npc(client, h, cid, summary="A gruff but fair dwarf blacksmith")
        resp = client.post(f"{BASE(cid)}/{lid}/npcs", json={"npc_id": npc_id}, headers=h)
        assert resp.status_code == 201
        assert resp.json()["summary"] == "A gruff but fair dwarf blacksmith"

    def test_player_cannot_add_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        npc_id = make_npc(client, h_gm, cid)
        resp = client.post(f"{BASE(cid)}/{lid}/npcs", json={"npc_id": npc_id}, headers=h_player)
        assert resp.status_code == 403

    def test_non_member_cannot_add_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        lid = make_location(client, h_gm, cid)
        npc_id = make_npc(client, h_gm, cid)
        resp = client.post(f"{BASE(cid)}/{lid}/npcs", json={"npc_id": npc_id}, headers=h_other)
        assert resp.status_code == 403

    def test_duplicate_npc_link_fails(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        npc_id = make_npc(client, h, cid)
        add_npc_to_location(client, h, cid, lid, npc_id)
        resp = client.post(f"{BASE(cid)}/{lid}/npcs", json={"npc_id": npc_id}, headers=h)
        assert resp.status_code == 409

    def test_npc_from_different_campaign_fails(self, client):
        h1, _ = make_user(client, 1)
        h2, _ = make_user(client, 2)
        cid1 = make_campaign(client, h1)
        cid2 = make_campaign(client, h2)
        lid = make_location(client, h1, cid1)
        foreign_npc_id = make_npc(client, h2, cid2, name="Foreign NPC")
        resp = client.post(f"{BASE(cid1)}/{lid}/npcs", json={"npc_id": foreign_npc_id}, headers=h1)
        assert resp.status_code == 404

    def test_gm_sees_all_npcs_including_hidden(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        npc_hidden = make_npc(client, h, cid, name="Hidden NPC", visible=False)
        npc_visible = make_npc(client, h, cid, name="Visible NPC", visible=True)
        add_npc_to_location(client, h, cid, lid, npc_hidden)
        add_npc_to_location(client, h, cid, lid, npc_visible)
        resp = client.get(f"{BASE(cid)}/{lid}/npcs", headers=h)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_player_sees_only_visible_npcs(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        npc_hidden = make_npc(client, h_gm, cid, name="Hidden NPC", visible=False)
        npc_visible = make_npc(client, h_gm, cid, name="Visible NPC", visible=True)
        add_npc_to_location(client, h_gm, cid, lid, npc_hidden)
        add_npc_to_location(client, h_gm, cid, lid, npc_visible)
        resp = client.get(f"{BASE(cid)}/{lid}/npcs", headers=h_player)
        assert resp.status_code == 200
        names = [n["name"] for n in resp.json()]
        assert "Visible NPC" in names
        assert "Hidden NPC" not in names

    def test_gm_can_remove_npc(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        npc_id = make_npc(client, h, cid)
        ln_id = add_npc_to_location(client, h, cid, lid, npc_id)
        resp = client.delete(f"{BASE(cid)}/{lid}/npcs/{ln_id}", headers=h)
        assert resp.status_code == 200
        resp = client.get(f"{BASE(cid)}/{lid}/npcs", headers=h)
        assert resp.json() == []

    def test_player_cannot_remove_npc(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        lid = make_location(client, h_gm, cid, visible=True)
        npc_id = make_npc(client, h_gm, cid, visible=True)
        ln_id = add_npc_to_location(client, h_gm, cid, lid, npc_id)
        resp = client.delete(f"{BASE(cid)}/{lid}/npcs/{ln_id}", headers=h_player)
        assert resp.status_code == 403

    def test_npc_removed_when_npc_deleted(self, client):
        """Deleting the NPC should cascade-remove the location link."""
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        npc_id = make_npc(client, h, cid)
        add_npc_to_location(client, h, cid, lid, npc_id)
        client.delete(f"{NPC_BASE}/{npc_id}", headers=h)
        resp = client.get(f"{BASE(cid)}/{lid}/npcs", headers=h)
        assert resp.json() == []


# ── Location Hierarchy ────────────────────────────────────────────────────────

class TestLocationHierarchyFields:
    """List response includes hierarchy fields; defaults are correct."""

    def test_list_returns_hierarchy_defaults(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        make_location(client, h, cid, name="The Keep", description="A dark fortress")
        resp = client.get(BASE(cid), headers=h)
        assert resp.status_code == 200
        loc = resp.json()[0]
        assert loc["is_top_level"] is False
        assert loc["is_unknown"] is False
        assert loc["parent_location_id"] is None
        assert loc["pin_child_ids"] == []

    def test_list_returns_description(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        make_location(client, h, cid, name="The Moor", description="A bleak wasteland")
        resp = client.get(BASE(cid), headers=h)
        assert resp.json()[0]["description"] == "A bleak wasteland"


class TestSetTopLevel:
    def test_gm_can_set_top_level(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid, name="World Map")
        resp = client.put(BASE(cid) + f"/{lid}", json={"is_top_level": True}, headers=h)
        assert resp.status_code == 200
        assert resp.json()["is_top_level"] is True
        assert resp.json()["parent_location_id"] is None
        assert resp.json()["is_unknown"] is False

    def test_setting_new_top_level_clears_old(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid1 = make_location(client, h, cid, name="Old Top")
        lid2 = make_location(client, h, cid, name="New Top")
        client.put(BASE(cid) + f"/{lid1}", json={"is_top_level": True}, headers=h)
        client.put(BASE(cid) + f"/{lid2}", json={"is_top_level": True}, headers=h)
        resp1 = client.get(BASE(cid) + f"/{lid1}", headers=h)
        resp2 = client.get(BASE(cid) + f"/{lid2}", headers=h)
        assert resp1.json()["is_top_level"] is False
        assert resp2.json()["is_top_level"] is True

    def test_top_level_clears_unknown_flag(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        client.put(BASE(cid) + f"/{lid}", json={"is_unknown": True}, headers=h)
        resp = client.put(BASE(cid) + f"/{lid}", json={"is_top_level": True}, headers=h)
        assert resp.json()["is_unknown"] is False
        assert resp.json()["is_top_level"] is True


class TestSetParent:
    def test_gm_can_set_parent(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        parent_id = make_location(client, h, cid, name="Continent")
        child_id = make_location(client, h, cid, name="City")
        resp = client.put(BASE(cid) + f"/{child_id}", json={"parent_location_id": parent_id}, headers=h)
        assert resp.status_code == 200
        assert resp.json()["parent_location_id"] == parent_id

    def test_setting_parent_clears_top_level(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        parent_id = make_location(client, h, cid, name="World")
        child_id = make_location(client, h, cid, name="Country")
        client.put(BASE(cid) + f"/{child_id}", json={"is_top_level": True}, headers=h)
        resp = client.put(BASE(cid) + f"/{child_id}", json={"parent_location_id": parent_id}, headers=h)
        assert resp.json()["is_top_level"] is False
        assert resp.json()["parent_location_id"] == parent_id

    def test_cannot_set_self_as_parent(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        resp = client.put(BASE(cid) + f"/{lid}", json={"parent_location_id": lid}, headers=h)
        assert resp.status_code == 400

    def test_cannot_set_parent_from_different_campaign(self, client):
        h1, _ = make_user(client, 1)
        h2, _ = make_user(client, 2)
        cid1 = make_campaign(client, h1)
        cid2 = make_campaign(client, h2)
        foreign_lid = make_location(client, h2, cid2, name="Foreign Location")
        child_lid = make_location(client, h1, cid1, name="My Location")
        resp = client.put(BASE(cid1) + f"/{child_lid}", json={"parent_location_id": foreign_lid}, headers=h1)
        assert resp.status_code == 400


class TestSetUnknown:
    def test_gm_can_mark_unknown(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        resp = client.put(BASE(cid) + f"/{lid}", json={"is_unknown": True}, headers=h)
        assert resp.status_code == 200
        assert resp.json()["is_unknown"] is True
        assert resp.json()["parent_location_id"] is None
        assert resp.json()["is_top_level"] is False

    def test_unknown_clears_parent(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        parent_id = make_location(client, h, cid, name="Parent")
        child_id = make_location(client, h, cid, name="Child")
        client.put(BASE(cid) + f"/{child_id}", json={"parent_location_id": parent_id}, headers=h)
        resp = client.put(BASE(cid) + f"/{child_id}", json={"is_unknown": True}, headers=h)
        assert resp.json()["parent_location_id"] is None
        assert resp.json()["is_unknown"] is True


class TestPinChildIds:
    def test_pin_child_ids_populated_from_pins(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        parent_lid = make_location(client, h, cid, name="Dungeon")
        child_lid = make_location(client, h, cid, name="Vault")
        upload_resp = _upload_map(client, h, cid, parent_lid)
        mid = upload_resp.json()["id"]
        client.post(
            f"{BASE(cid)}/{parent_lid}/maps/{mid}/pins",
            json={"x_percent": 50.0, "y_percent": 50.0, "linked_location_id": child_lid, "is_visible_to_players": False},
            headers=h,
        )
        resp = client.get(BASE(cid), headers=h)
        locs = {l["id"]: l for l in resp.json()}
        assert child_lid in locs[parent_lid]["pin_child_ids"]
        assert locs[child_lid]["pin_child_ids"] == []

    def test_pin_child_ids_empty_when_no_pins(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid)
        resp = client.get(BASE(cid), headers=h)
        assert resp.json()[0]["pin_child_ids"] == []

    def test_player_list_includes_pin_child_ids(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid)
        parent_lid = make_location(client, h_gm, cid, name="Tower", visible=True)
        child_lid = make_location(client, h_gm, cid, name="Roof", visible=True)
        upload_resp = _upload_map(client, h_gm, cid, parent_lid)
        mid = upload_resp.json()["id"]
        client.patch(f"{BASE(cid)}/{parent_lid}/maps/{mid}/visibility", headers=h_gm)
        client.post(
            f"{BASE(cid)}/{parent_lid}/maps/{mid}/pins",
            json={"x_percent": 50.0, "y_percent": 50.0, "linked_location_id": child_lid, "is_visible_to_players": True},
            headers=h_gm,
        )
        resp = client.get(BASE(cid), headers=h_player)
        locs = {l["id"]: l for l in resp.json()}
        assert child_lid in locs[parent_lid]["pin_child_ids"]


class TestPinParentPersistence:
    """Creating/updating a pin with linked_location_id sets that location's parent."""

    def test_create_pin_sets_parent_on_linked_location(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        parent_lid = make_location(client, h, cid, name="City")
        child_lid = make_location(client, h, cid, name="Tavern")
        upload_resp = _upload_map(client, h, cid, parent_lid)
        mid = upload_resp.json()["id"]
        client.post(
            f"{BASE(cid)}/{parent_lid}/maps/{mid}/pins",
            json={"x_percent": 10.0, "y_percent": 20.0, "linked_location_id": child_lid, "is_visible_to_players": False},
            headers=h,
        )
        resp = client.get(f"{BASE(cid)}/{child_lid}", headers=h)
        assert resp.json()["parent_location_id"] == parent_lid

    def test_create_pin_does_not_overwrite_existing_parent(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        original_parent_lid = make_location(client, h, cid, name="Province")
        other_parent_lid = make_location(client, h, cid, name="City")
        child_lid = make_location(client, h, cid, name="Tavern")
        # manually set parent to original_parent
        client.put(BASE(cid) + f"/{child_lid}", json={"parent_location_id": original_parent_lid}, headers=h)
        # pin from other_parent should not override
        upload_resp = _upload_map(client, h, cid, other_parent_lid)
        mid = upload_resp.json()["id"]
        client.post(
            f"{BASE(cid)}/{other_parent_lid}/maps/{mid}/pins",
            json={"x_percent": 10.0, "y_percent": 20.0, "linked_location_id": child_lid, "is_visible_to_players": False},
            headers=h,
        )
        resp = client.get(f"{BASE(cid)}/{child_lid}", headers=h)
        assert resp.json()["parent_location_id"] == original_parent_lid

    def test_create_pin_without_linked_location_leaves_no_parent(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        lid = make_location(client, h, cid, name="Room")
        upload_resp = _upload_map(client, h, cid, lid)
        mid = upload_resp.json()["id"]
        client.post(
            f"{BASE(cid)}/{lid}/maps/{mid}/pins",
            json={"x_percent": 10.0, "y_percent": 20.0, "is_visible_to_players": False},
            headers=h,
        )
        resp = client.get(f"{BASE(cid)}/{lid}", headers=h)
        assert resp.json()["parent_location_id"] is None

    def test_update_pin_sets_parent_when_link_added(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        parent_lid = make_location(client, h, cid, name="City")
        child_lid = make_location(client, h, cid, name="Market")
        upload_resp = _upload_map(client, h, cid, parent_lid)
        mid = upload_resp.json()["id"]
        # create pin without link
        pin_resp = client.post(
            f"{BASE(cid)}/{parent_lid}/maps/{mid}/pins",
            json={"x_percent": 10.0, "y_percent": 20.0, "is_visible_to_players": False},
            headers=h,
        )
        pin_id = pin_resp.json()["id"]
        # update to add link
        client.put(
            f"{BASE(cid)}/{parent_lid}/maps/{mid}/pins/{pin_id}",
            json={"linked_location_id": child_lid},
            headers=h,
        )
        resp = client.get(f"{BASE(cid)}/{child_lid}", headers=h)
        assert resp.json()["parent_location_id"] == parent_lid

    def test_top_level_location_parent_not_set_via_pin(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        top_lid = make_location(client, h, cid, name="World")
        client.put(BASE(cid) + f"/{top_lid}", json={"is_top_level": True}, headers=h)
        other_lid = make_location(client, h, cid, name="Country")
        upload_resp = _upload_map(client, h, cid, other_lid)
        mid = upload_resp.json()["id"]
        client.post(
            f"{BASE(cid)}/{other_lid}/maps/{mid}/pins",
            json={"x_percent": 10.0, "y_percent": 20.0, "linked_location_id": top_lid, "is_visible_to_players": False},
            headers=h,
        )
        resp = client.get(f"{BASE(cid)}/{top_lid}", headers=h)
        assert resp.json()["parent_location_id"] is None


# ── List schema round-trip ────────────────────────────────────────────────────

class TestLocationListFieldRoundTrip:
    """Every field in LocationListItem must survive a POST→list and PUT→list round-trip.

    Root bug pattern: a field present in LocationResponse but absent from
    LocationListItem would be silently stripped by the list endpoint even though
    the DB stores it correctly.  These tests catch that class of regression.
    """

    def _setup(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        return h, cid

    def _list(self, client, cid, headers):
        return client.get(BASE(cid), headers=headers).json()

    def test_name_in_list(self, client):
        h, cid = self._setup(client)
        make_location(client, h, cid, name="Silverpeak")
        assert self._list(client, cid, h)[0]["name"] == "Silverpeak"

    def test_description_in_list_after_create(self, client):
        h, cid = self._setup(client)
        lid = make_location(client, h, cid, description="A misty mountain pass")
        item = next(loc for loc in self._list(client, cid, h) if loc["id"] == lid)
        assert item["description"] == "A misty mountain pass"

    def test_description_in_list_after_update(self, client):
        h, cid = self._setup(client)
        lid = make_location(client, h, cid)
        client.put(BASE(cid) + f"/{lid}", json={"description": "Updated pass"}, headers=h)
        item = next(loc for loc in self._list(client, cid, h) if loc["id"] == lid)
        assert item["description"] == "Updated pass"

    def test_location_type_in_list(self, client):
        h, cid = self._setup(client)
        lid = make_location(client, h, cid, location_type="City")
        item = next(loc for loc in self._list(client, cid, h) if loc["id"] == lid)
        assert item["location_type"] == "City"

    def test_status_in_list(self, client):
        h, cid = self._setup(client)
        lid = make_location(client, h, cid, status="Ruined")
        item = next(loc for loc in self._list(client, cid, h) if loc["id"] == lid)
        assert item["status"] == "Ruined"

    def test_visibility_in_list(self, client):
        h, cid = self._setup(client)
        lid = make_location(client, h, cid, visible=True)
        item = next(loc for loc in self._list(client, cid, h) if loc["id"] == lid)
        assert item["is_visible_to_players"] is True

    def test_is_top_level_in_list(self, client):
        h, cid = self._setup(client)
        lid = make_location(client, h, cid)
        client.put(BASE(cid) + f"/{lid}", json={"is_top_level": True}, headers=h)
        item = next(loc for loc in self._list(client, cid, h) if loc["id"] == lid)
        assert item["is_top_level"] is True

    def test_is_unknown_in_list(self, client):
        h, cid = self._setup(client)
        lid = make_location(client, h, cid, is_unknown=True)
        item = next(loc for loc in self._list(client, cid, h) if loc["id"] == lid)
        assert item["is_unknown"] is True

    def test_parent_location_id_in_list(self, client):
        h, cid = self._setup(client)
        parent_lid = make_location(client, h, cid, name="Parent")
        child_lid = make_location(client, h, cid, name="Child", parent_location_id=parent_lid)
        item = next(loc for loc in self._list(client, cid, h) if loc["id"] == child_lid)
        assert item["parent_location_id"] == parent_lid
