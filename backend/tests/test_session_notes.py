"""Tests for the session notes module."""
import pytest
from .conftest import make_user, make_campaign, invite_player


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_session(client, gm_headers, campaign_id, *, title="Session 1", session_number=1, visible=False, **kwargs):
    body = {"title": title, "session_number": session_number, "is_visible_to_players": visible}
    body.update(kwargs)
    resp = client.post(f"/api/gm/campaigns/{campaign_id}/sessions", json=body, headers=gm_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_npc(client, gm_headers, campaign_id, *, name="Aldric"):
    resp = client.post(
        "/api/gm/campaigns/npcs",
        json={"name": name, "race": "Human", "campaign_id": campaign_id},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_location(client, gm_headers, campaign_id, *, name="Stormgate"):
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/locations",
        json={"name": name},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_character(client, headers, campaign_id, *, name="Metsu"):
    resp = client.post(
        "/api/characters",
        json={
            "name": name, "race": "Human", "char_class": "Fighter",
            "level": 1, "campaign_id": campaign_id,
            "strength": 10, "dexterity": 10, "constitution": 10,
            "intelligence": 10, "wisdom": 10, "charisma": 10,
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_timeline_event(client, gm_headers, campaign_id, *, title="The Battle"):
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/timeline",
        json={"title": title, "is_visible_to_players": False},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ── CRUD ──────────────────────────────────────────────────────────────────────

class TestSessionCRUD:
    def test_gm_can_create_session(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid, title="Darkwyrm Keep", session_number=1)
        assert s["title"] == "Darkwyrm Keep"
        assert s["session_number"] == 1
        assert s["campaign_id"] == cid
        assert s["is_visible_to_players"] is False

    def test_player_cannot_create_session(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/sessions",
            json={"title": "Nope"},
            headers=player_h,
        )
        assert resp.status_code == 403

    def test_non_member_cannot_create_session(self, client):
        gm_h, _ = make_user(client, 1)
        other_h, _ = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/sessions",
            json={"title": "Nope"},
            headers=other_h,
        )
        assert resp.status_code == 403

    def test_gm_can_read_own_session(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions/{s['id']}", headers=gm_h)
        assert resp.status_code == 200
        assert resp.json()["id"] == s["id"]

    def test_player_cannot_see_hidden_session(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        s = make_session(client, gm_h, cid, visible=False)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions/{s['id']}", headers=player_h)
        assert resp.status_code == 403

    def test_player_can_see_visible_session(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        s = make_session(client, gm_h, cid, visible=True)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions/{s['id']}", headers=player_h)
        assert resp.status_code == 200

    def test_gm_can_update_session(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        resp = client.put(
            f"/api/gm/campaigns/{cid}/sessions/{s['id']}",
            json={"title": "Updated Title", "summary": "Short blurb"},
            headers=gm_h,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Updated Title"
        assert data["summary"] == "Short blurb"

    def test_player_cannot_update_session(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        s = make_session(client, gm_h, cid)
        resp = client.put(
            f"/api/gm/campaigns/{cid}/sessions/{s['id']}",
            json={"title": "Hacked"},
            headers=player_h,
        )
        assert resp.status_code == 403

    def test_gm_can_delete_session(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        resp = client.delete(f"/api/gm/campaigns/{cid}/sessions/{s['id']}", headers=gm_h)
        assert resp.status_code == 204
        resp2 = client.get(f"/api/gm/campaigns/{cid}/sessions/{s['id']}", headers=gm_h)
        assert resp2.status_code == 404

    def test_player_cannot_delete_session(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        s = make_session(client, gm_h, cid, visible=True)
        resp = client.delete(f"/api/gm/campaigns/{cid}/sessions/{s['id']}", headers=player_h)
        assert resp.status_code == 403


# ── List + visibility ─────────────────────────────────────────────────────────

class TestSessionList:
    def test_gm_sees_all_sessions(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_session(client, gm_h, cid, title="S1", session_number=1, visible=False)
        make_session(client, gm_h, cid, title="S2", session_number=2, visible=True)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions", headers=gm_h)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_player_sees_only_visible_sessions(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        make_session(client, gm_h, cid, title="Hidden", visible=False)
        make_session(client, gm_h, cid, title="Visible", session_number=2, visible=True)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions", headers=player_h)
        assert resp.status_code == 200
        titles = [s["title"] for s in resp.json()]
        assert "Visible" in titles
        assert "Hidden" not in titles

    def test_non_member_cannot_list_sessions(self, client):
        gm_h, _ = make_user(client, 1)
        other_h, _ = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions", headers=other_h)
        assert resp.status_code == 403

    def test_list_sorted_by_session_number(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_session(client, gm_h, cid, title="Third", session_number=3)
        make_session(client, gm_h, cid, title="First", session_number=1)
        make_session(client, gm_h, cid, title="Second", session_number=2)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions", headers=gm_h)
        titles = [s["title"] for s in resp.json()]
        assert titles == ["First", "Second", "Third"]


# ── Visibility toggle ─────────────────────────────────────────────────────────

class TestSessionVisibility:
    def test_gm_can_toggle_visibility(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid, visible=False)
        resp = client.patch(
            f"/api/gm/campaigns/{cid}/sessions/{s['id']}/visibility",
            json={"is_visible_to_players": True},
            headers=gm_h,
        )
        assert resp.status_code == 200
        assert resp.json()["is_visible_to_players"] is True

    def test_player_cannot_toggle_visibility(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        s = make_session(client, gm_h, cid, visible=True)
        resp = client.patch(
            f"/api/gm/campaigns/{cid}/sessions/{s['id']}/visibility",
            json={"is_visible_to_players": False},
            headers=player_h,
        )
        assert resp.status_code == 403


# ── GM notes stripping ────────────────────────────────────────────────────────

class TestSessionGMNotes:
    def test_gm_notes_present_for_gm(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid, gm_notes="Secret plans", visible=True)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions/{s['id']}", headers=gm_h)
        assert resp.json()["gm_notes"] == "Secret plans"

    def test_gm_notes_stripped_for_player(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        s = make_session(client, gm_h, cid, gm_notes="Secret plans", visible=True)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions/{s['id']}", headers=player_h)
        assert resp.json()["gm_notes"] is None

    def test_gm_notes_not_in_list_schema(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        make_session(client, gm_h, cid, gm_notes="Private", visible=True)
        # gm_notes is excluded from SessionNoteListItem — not present in list response for anyone
        items = client.get(f"/api/gm/campaigns/{cid}/sessions", headers=player_h).json()
        assert "gm_notes" not in items[0]
        items_gm = client.get(f"/api/gm/campaigns/{cid}/sessions", headers=gm_h).json()
        assert "gm_notes" not in items_gm[0]


# ── Fields + optional fields ──────────────────────────────────────────────────

class TestSessionFields:
    def test_all_optional_fields_round_trip(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(
            client, gm_h, cid,
            title="Orc Princeling",
            session_number=18,
            real_world_date="2024-01-21",
            time_of_day="evening",
            summary="Short blurb",
            content="# Chapter prose\n\nLong narrative here.",
            music_url="https://example.com/music.mp3",
        )
        assert s["title"] == "Orc Princeling"
        assert s["session_number"] == 18
        assert s["real_world_date"] == "2024-01-21"
        assert s["time_of_day"] == "evening"
        assert s["summary"] == "Short blurb"
        assert s["content"] == "# Chapter prose\n\nLong narrative here."
        assert s["music_url"] == "https://example.com/music.mp3"

    def test_session_number_nullable(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid, title="Unnumbered", session_number=None)
        assert s["session_number"] is None


# ── List field round-trip ─────────────────────────────────────────────────────

class TestSessionListFieldRoundTrip:
    def _list(self, client, campaign_id, headers):
        return client.get(f"/api/gm/campaigns/{campaign_id}/sessions", headers=headers).json()

    def test_summary_in_list_after_create(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_session(client, gm_h, cid, summary="Short blurb")
        items = self._list(client, cid, gm_h)
        assert items[0]["summary"] == "Short blurb"

    def test_time_of_day_in_list_after_create(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_session(client, gm_h, cid, time_of_day="morning")
        items = self._list(client, cid, gm_h)
        assert items[0]["time_of_day"] == "morning"

    def test_real_world_date_in_list_after_update(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        client.put(
            f"/api/gm/campaigns/{cid}/sessions/{s['id']}",
            json={"real_world_date": "2024-01-21"},
            headers=gm_h,
        )
        items = self._list(client, cid, gm_h)
        assert items[0]["real_world_date"] == "2024-01-21"


# ── Filter by linked content ──────────────────────────────────────────────────

class TestSessionFilters:
    def test_filter_by_npc_id(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s1 = make_session(client, gm_h, cid, title="With NPC", session_number=1)
        make_session(client, gm_h, cid, title="Without NPC", session_number=2)
        npc = make_npc(client, gm_h, cid)
        client.post(f"/api/gm/campaigns/{cid}/sessions/{s1['id']}/npcs",
                    json={"npc_id": npc["id"]}, headers=gm_h)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions?npc_id={npc['id']}", headers=gm_h)
        titles = [s["title"] for s in resp.json()]
        assert titles == ["With NPC"]

    def test_filter_by_location_id(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s1 = make_session(client, gm_h, cid, title="At Location", session_number=1)
        make_session(client, gm_h, cid, title="Not At Location", session_number=2)
        loc = make_location(client, gm_h, cid)
        client.post(f"/api/gm/campaigns/{cid}/sessions/{s1['id']}/locations",
                    json={"location_id": loc["id"]}, headers=gm_h)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions?location_id={loc['id']}", headers=gm_h)
        titles = [s["title"] for s in resp.json()]
        assert titles == ["At Location"]

    def test_filter_by_event_id(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s1 = make_session(client, gm_h, cid, title="With Event", session_number=1)
        make_session(client, gm_h, cid, title="Without Event", session_number=2)
        event = make_timeline_event(client, gm_h, cid)
        client.post(f"/api/gm/campaigns/{cid}/sessions/{s1['id']}/timeline-events",
                    json={"event_id": event["id"]}, headers=gm_h)
        resp = client.get(f"/api/gm/campaigns/{cid}/sessions?event_id={event['id']}", headers=gm_h)
        titles = [s["title"] for s in resp.json()]
        assert titles == ["With Event"]


# ── NPC links ─────────────────────────────────────────────────────────────────

class TestSessionNPCLinks:
    def test_gm_can_add_and_list_npc(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        npc = make_npc(client, gm_h, cid)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs",
            json={"npc_id": npc["id"], "description": "Protagonist"},
            headers=gm_h,
        )
        assert resp.status_code == 201
        assert resp.json()["npc_name"] == "Aldric"
        links = client.get(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs", headers=gm_h).json()
        assert len(links) == 1

    def test_duplicate_npc_link_rejected(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        npc = make_npc(client, gm_h, cid)
        client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs",
                    json={"npc_id": npc["id"]}, headers=gm_h)
        resp = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs",
                           json={"npc_id": npc["id"]}, headers=gm_h)
        assert resp.status_code == 409

    def test_gm_can_remove_npc_link(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        npc = make_npc(client, gm_h, cid)
        link = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs",
                           json={"npc_id": npc["id"]}, headers=gm_h).json()
        resp = client.delete(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs/{link['id']}", headers=gm_h)
        assert resp.status_code == 204

    def test_player_cannot_add_npc_link(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        s = make_session(client, gm_h, cid, visible=True)
        npc = make_npc(client, gm_h, cid)
        resp = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs",
                           json={"npc_id": npc["id"]}, headers=player_h)
        assert resp.status_code == 403

    def test_player_sees_only_visible_npc_in_links(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        s = make_session(client, gm_h, cid, visible=True)
        npc_vis = make_npc(client, gm_h, cid, name="Visible NPC")
        npc_hid = make_npc(client, gm_h, cid, name="Hidden NPC")
        # Make npc_vis visible
        client.patch(f"/api/gm/campaigns/npcs/{npc_vis['id']}/visibility", headers=gm_h)
        client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs",
                    json={"npc_id": npc_vis["id"]}, headers=gm_h)
        client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs",
                    json={"npc_id": npc_hid["id"]}, headers=gm_h)
        links = client.get(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/npcs", headers=player_h).json()
        names = [l["npc_name"] for l in links]
        assert "Visible NPC" in names
        assert "Hidden NPC" not in names


# ── Location links ────────────────────────────────────────────────────────────

class TestSessionLocationLinks:
    def test_gm_can_add_and_list_location(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        loc = make_location(client, gm_h, cid)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/sessions/{s['id']}/locations",
            json={"location_id": loc["id"], "description": "Main setting"},
            headers=gm_h,
        )
        assert resp.status_code == 201
        assert resp.json()["location_name"] == "Stormgate"

    def test_gm_can_remove_location_link(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        loc = make_location(client, gm_h, cid)
        link = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/locations",
                           json={"location_id": loc["id"]}, headers=gm_h).json()
        resp = client.delete(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/locations/{link['id']}", headers=gm_h)
        assert resp.status_code == 204

    def test_duplicate_location_link_rejected(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        loc = make_location(client, gm_h, cid)
        client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/locations",
                    json={"location_id": loc["id"]}, headers=gm_h)
        resp = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/locations",
                           json={"location_id": loc["id"]}, headers=gm_h)
        assert resp.status_code == 409


# ── Timeline event links ──────────────────────────────────────────────────────

class TestSessionEventLinks:
    def test_gm_can_add_and_list_event(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        event = make_timeline_event(client, gm_h, cid)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/sessions/{s['id']}/timeline-events",
            json={"event_id": event["id"]},
            headers=gm_h,
        )
        assert resp.status_code == 201
        assert resp.json()["event_title"] == "The Battle"

    def test_gm_can_remove_event_link(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        event = make_timeline_event(client, gm_h, cid)
        link = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/timeline-events",
                           json={"event_id": event["id"]}, headers=gm_h).json()
        resp = client.delete(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/timeline-events/{link['id']}", headers=gm_h)
        assert resp.status_code == 204

    def test_duplicate_event_link_rejected(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        s = make_session(client, gm_h, cid)
        event = make_timeline_event(client, gm_h, cid)
        client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/timeline-events",
                    json={"event_id": event["id"]}, headers=gm_h)
        resp = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/timeline-events",
                           json={"event_id": event["id"]}, headers=gm_h)
        assert resp.status_code == 409


# ── Character links ───────────────────────────────────────────────────────────

class TestSessionCharacterLinks:
    def test_gm_can_add_and_list_character(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        char = make_character(client, player_h, cid)
        s = make_session(client, gm_h, cid)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/sessions/{s['id']}/characters",
            json={"character_id": char["id"]},
            headers=gm_h,
        )
        assert resp.status_code == 201
        assert resp.json()["character_name"] == "Metsu"

    def test_gm_can_remove_character_link(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        char = make_character(client, player_h, cid)
        s = make_session(client, gm_h, cid)
        link = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/characters",
                           json={"character_id": char["id"]}, headers=gm_h).json()
        resp = client.delete(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/characters/{link['id']}", headers=gm_h)
        assert resp.status_code == 204

    def test_duplicate_character_link_rejected(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        char = make_character(client, player_h, cid)
        s = make_session(client, gm_h, cid)
        client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/characters",
                    json={"character_id": char["id"]}, headers=gm_h)
        resp = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/characters",
                           json={"character_id": char["id"]}, headers=gm_h)
        assert resp.status_code == 409

    def test_player_cannot_add_character_link(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        char = make_character(client, player_h, cid)
        s = make_session(client, gm_h, cid, visible=True)
        resp = client.post(f"/api/gm/campaigns/{cid}/sessions/{s['id']}/characters",
                           json={"character_id": char["id"]}, headers=player_h)
        assert resp.status_code == 403
