"""Tests for the calendar (seasons/months/eras) and timeline event modules."""
import pytest
from .conftest import make_user, make_campaign, invite_player


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_calendar(client, gm_headers, campaign_id, *, name="Yaara Calendar", days=30):
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/calendar",
        json={"name": name, "days_per_month": days},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_season(client, gm_headers, campaign_id, *, name="Spring", order_index=1):
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/calendar/seasons",
        json={"name": name, "order_index": order_index},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_weekday(client, gm_headers, campaign_id, *, name="Monday", order_index=1):
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/calendar/weekdays",
        json={"name": name, "order_index": order_index},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_month(client, gm_headers, campaign_id, *, name="Yondalla's Fete", order_index=1, season_id=None, description=None):
    body = {"name": name, "order_index": order_index}
    if season_id:
        body["season_id"] = season_id
    if description:
        body["description"] = description
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/calendar/months",
        json=body,
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_primary_era(client, gm_headers, campaign_id, *, name="Orc Federation Calendar", abbr="OFC", is_current=True):
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/calendar/eras",
        json={"name": name, "abbreviation": abbr, "direction": "ascending", "is_current": is_current},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_secondary_era(client, gm_headers, campaign_id, anchor_era_id, *, name, abbr, direction, anchor_era_year, anchor_this_year=None, era_oldest_year=None):
    body = {
        "name": name,
        "abbreviation": abbr,
        "direction": direction,
        "anchor_era_id": anchor_era_id,
        "anchor_era_year": anchor_era_year,
    }
    if anchor_this_year is not None:
        body["anchor_this_year"] = anchor_this_year
    if era_oldest_year is not None:
        body["era_oldest_year"] = era_oldest_year
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/calendar/eras",
        json=body,
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_event(client, gm_headers, campaign_id, *, title="The Fall of Belthil", era_id=None, year=None, month_order=None, day=None, visible=False):
    body = {"title": title, "is_visible_to_players": visible}
    if era_id:
        body["era_id"] = era_id
        body["year"] = year
    if month_order:
        body["month_order"] = month_order
    if day:
        body["day"] = day
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/timeline",
        json=body,
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ── Calendar CRUD ─────────────────────────────────────────────────────────────

class TestCalendarCRUD:
    def test_gm_can_create_calendar(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        cal = make_calendar(client, gm_h, cid)
        assert cal["name"] == "Yaara Calendar"
        assert cal["days_per_month"] == 30
        assert cal["campaign_id"] == cid

    def test_player_cannot_create_calendar(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/calendar",
            json={"name": "Nope"},
            headers=player_h,
        )
        assert resp.status_code == 403

    def test_non_member_cannot_get_calendar(self, client):
        gm_h, _ = make_user(client, 1)
        other_h, _ = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        resp = client.get(f"/api/gm/campaigns/{cid}/calendar", headers=other_h)
        assert resp.status_code == 403

    def test_duplicate_calendar_rejected(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        resp = client.post(f"/api/gm/campaigns/{cid}/calendar", json={"name": "Second"}, headers=gm_h)
        assert resp.status_code == 409

    def test_gm_can_update_calendar(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        resp = client.put(
            f"/api/gm/campaigns/{cid}/calendar",
            json={"days_per_month": 28},
            headers=gm_h,
        )
        assert resp.status_code == 200
        assert resp.json()["days_per_month"] == 28

    def test_get_calendar_includes_seasons_months_eras_weekdays(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        # create_calendar seeds 4 seasons + 12 months automatically; add extras
        make_season(client, gm_h, cid, name="Monsoon", order_index=5)
        make_month(client, gm_h, cid, name="Yondalla's Fete", order_index=13)
        make_primary_era(client, gm_h, cid)
        make_weekday(client, gm_h, cid, name="Sunday", order_index=1)
        resp = client.get(f"/api/gm/campaigns/{cid}/calendar", headers=gm_h)
        assert resp.status_code == 200
        data = resp.json()
        # seeded 4 + manually added 1
        assert any(s["name"] == "Monsoon" for s in data["seasons"])
        # seeded 12 + manually added 1
        assert any(m["name"] == "Yondalla's Fete" for m in data["months"])
        assert len(data["eras"]) == 1
        assert len(data["weekdays"]) == 1


# ── Seasons ───────────────────────────────────────────────────────────────────

class TestSeasons:
    def test_create_and_update_season(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        season = make_season(client, gm_h, cid, name="Spring", order_index=1)
        assert season["name"] == "Spring"
        resp = client.put(
            f"/api/gm/campaigns/{cid}/calendar/seasons/{season['id']}",
            json={"name": "Springtime"},
            headers=gm_h,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Springtime"

    def test_delete_season(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        season = make_season(client, gm_h, cid)
        resp = client.delete(
            f"/api/gm/campaigns/{cid}/calendar/seasons/{season['id']}",
            headers=gm_h,
        )
        assert resp.status_code == 204


# ── Months ────────────────────────────────────────────────────────────────────

class TestMonths:
    def test_create_month_with_season(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        season = make_season(client, gm_h, cid, name="Spring", order_index=1)
        month = make_month(client, gm_h, cid, name="Yondalla's Fete", order_index=1, season_id=season["id"], description="New year's festival")
        assert month["season_id"] == season["id"]
        assert month["description"] == "New year's festival"

    def test_update_month(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        month = make_month(client, gm_h, cid)
        resp = client.put(
            f"/api/gm/campaigns/{cid}/calendar/months/{month['id']}",
            json={"name": "Renamed Month"},
            headers=gm_h,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed Month"

    def test_delete_month(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        month = make_month(client, gm_h, cid)
        resp = client.delete(
            f"/api/gm/campaigns/{cid}/calendar/months/{month['id']}",
            headers=gm_h,
        )
        assert resp.status_code == 204


# ── Month optional name ───────────────────────────────────────────────────────

class TestMonthOptionalName:
    def test_create_month_without_name(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/calendar/months",
            json={"order_index": 1},
            headers=gm_h,
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["name"] is None

    def test_create_month_with_name(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        month = make_month(client, gm_h, cid, name="Harvestide", order_index=1)
        assert month["name"] == "Harvestide"

    def test_update_month_name_to_null(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        month = make_month(client, gm_h, cid, name="Harvestide", order_index=1)
        resp = client.put(
            f"/api/gm/campaigns/{cid}/calendar/months/{month['id']}",
            json={"name": None},
            headers=gm_h,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] is None

    def test_get_calendar_includes_unnamed_months(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        # create_calendar seeds 12 named-null months; add one more explicitly unnamed
        resp = client.post(
            f"/api/gm/campaigns/{cid}/calendar/months",
            json={"order_index": 13},
            headers=gm_h,
        )
        assert resp.json()["name"] is None
        cal = client.get(f"/api/gm/campaigns/{cid}/calendar", headers=gm_h).json()
        # at least the seeded months plus the one we added are all unnamed (name=None)
        assert any(m["name"] is None for m in cal["months"])


# ── Weekdays ──────────────────────────────────────────────────────────────────

class TestWeekdays:
    def test_gm_can_create_weekday(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        day = make_weekday(client, gm_h, cid, name="Sunday", order_index=1)
        assert day["name"] == "Sunday"
        assert day["order_index"] == 1

    def test_player_cannot_create_weekday(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        make_calendar(client, gm_h, cid)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/calendar/weekdays",
            json={"name": "Nope", "order_index": 1},
            headers=player_h,
        )
        assert resp.status_code == 403

    def test_non_member_cannot_create_weekday(self, client):
        gm_h, _ = make_user(client, 1)
        other_h, _ = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/calendar/weekdays",
            json={"name": "Nope", "order_index": 1},
            headers=other_h,
        )
        assert resp.status_code == 403

    def test_update_weekday(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        day = make_weekday(client, gm_h, cid, name="Moonday", order_index=1)
        resp = client.put(
            f"/api/gm/campaigns/{cid}/calendar/weekdays/{day['id']}",
            json={"name": "Lunday"},
            headers=gm_h,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Lunday"

    def test_delete_weekday(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        day = make_weekday(client, gm_h, cid)
        resp = client.delete(
            f"/api/gm/campaigns/{cid}/calendar/weekdays/{day['id']}",
            headers=gm_h,
        )
        assert resp.status_code == 204

    def test_weekdays_appear_in_calendar_response(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        make_weekday(client, gm_h, cid, name="Sunday", order_index=1)
        make_weekday(client, gm_h, cid, name="Moonday", order_index=2)
        cal = client.get(f"/api/gm/campaigns/{cid}/calendar", headers=gm_h).json()
        assert len(cal["weekdays"]) == 2
        assert cal["weekdays"][0]["name"] == "Sunday"
        assert cal["weekdays"][1]["name"] == "Moonday"

    def test_use_weeks_and_days_per_week_on_calendar(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        cal = make_calendar(client, gm_h, cid)
        assert cal["use_weeks"] is False
        assert cal["days_per_week"] is None
        resp = client.put(
            f"/api/gm/campaigns/{cid}/calendar",
            json={"use_weeks": True, "days_per_week": 7},
            headers=gm_h,
        )
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["use_weeks"] is True
        assert updated["days_per_week"] == 7


# ── Eras & epoch math ─────────────────────────────────────────────────────────

class TestEras:
    def test_first_era_is_primary_and_ascending_only(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/calendar/eras",
            json={"name": "Bad Era", "abbreviation": "BE", "direction": "descending"},
            headers=gm_h,
        )
        assert resp.status_code == 422

    def test_primary_era_epoch_offset_is_zero(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        era = make_primary_era(client, gm_h, cid, abbr="OFC")
        assert era["is_primary"] is True
        assert era["epoch_offset"] == 0

    def test_ascending_secondary_era_epoch_offset(self, client):
        """ABF ascending where OFC 1 = ABF 6261 → epoch_offset = 6261 - 1 = 6260... wait.
        OFC is primary (ascending, epoch=0): absolute = OFC_year.
        ABF ascending anchor 'OFC 1 = ABF 6261':
          epoch = ref_absolute(1) - anchor_this_year = 1 - 6261 = -6260
          absolute = ABF_year + (-6260) = ABF_year - 6260
          ABF 6261 → absolute 6261 - 6260 = 1 = OFC 1 ✓
        """
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid, abbr="OFC")
        abf = make_secondary_era(
            client, gm_h, cid, ofc["id"],
            name="After Belthil's Fall", abbr="ABF",
            direction="ascending",
            anchor_era_year=1, anchor_this_year=6261,
        )
        assert abf["epoch_offset"] == -6260
        assert abf["era_start_absolute"] == 1 + (-6260)  # era year 1 in absolute = -6259

    def test_descending_transition_anchor_epoch_offset(self, client):
        """BBF descending, transition anchor: year 1 is the year immediately before ABF year 1.
        ABF epoch = -6260 (from above).
        ABF year 1 absolute = 1 + (-6260) = -6259.
        Transition anchor at ABF 1: epoch_offset = ref_absolute(ABF 1) = -6259.
        BBF year 1 = -6259 - 1 = -6260 (one year before ABF year 1 ✓).
        """
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid, abbr="OFC")
        abf = make_secondary_era(
            client, gm_h, cid, ofc["id"],
            name="After Belthil's Fall", abbr="ABF",
            direction="ascending",
            anchor_era_year=1, anchor_this_year=6261,
        )
        bbf = make_secondary_era(
            client, gm_h, cid, abf["id"],
            name="Before Belthil's Fall", abbr="BBF",
            direction="descending",
            anchor_era_year=1,  # year 1 of BBF is just before ABF year 1
            anchor_this_year=None,  # transition anchor
            era_oldest_year=30000,
        )
        abf_epoch = abf["epoch_offset"]  # -6260
        abf_year1_absolute = 1 + abf_epoch  # -6259
        assert bbf["epoch_offset"] == abf_year1_absolute  # -6259
        # BBF year 1 absolute = epoch_offset - 1 = -6259 - 1 = -6260 (one year before ABF 1 ✓)
        assert bbf["era_end_absolute"] == abf_year1_absolute - 1  # = -6260

    def test_descending_same_year_anchor(self, client):
        """POF descending, same-year anchor: ABF 1261 = POF 5000.
        ABF epoch = -6260. ref_absolute(ABF 1261) = 1261 + (-6260) = -4999.
        epoch_offset = -4999 + 5000 = 1.
        POF 5000 = 1 - 5000 = -4999 (= ABF 1261 ✓).
        """
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid, abbr="OFC")
        abf = make_secondary_era(
            client, gm_h, cid, ofc["id"],
            name="After Belthil's Fall", abbr="ABF",
            direction="ascending",
            anchor_era_year=1, anchor_this_year=6261,
        )
        pof = make_secondary_era(
            client, gm_h, cid, abf["id"],
            name="Pre Orc Federation", abbr="POF",
            direction="descending",
            anchor_era_year=1261, anchor_this_year=5000,
        )
        abf_epoch = abf["epoch_offset"]  # -6260
        ref_abs = 1261 + abf_epoch  # -4999
        assert pof["epoch_offset"] == ref_abs + 5000  # 1

    def test_is_current_cleared_on_new_current_era(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid, abbr="OFC", is_current=True)
        assert ofc["is_current"] is True
        # Second era marked current should clear OFC's is_current
        abf = make_secondary_era(
            client, gm_h, cid, ofc["id"],
            name="ABF", abbr="ABF", direction="ascending",
            anchor_era_year=1, anchor_this_year=6261,
        )
        resp = client.put(
            f"/api/gm/campaigns/{cid}/calendar/eras/{abf['id']}",
            json={"is_current": True},
            headers=gm_h,
        )
        assert resp.status_code == 200
        assert resp.json()["is_current"] is True
        cal = client.get(f"/api/gm/campaigns/{cid}/calendar", headers=gm_h).json()
        current_eras = [e for e in cal["eras"] if e["is_current"]]
        assert len(current_eras) == 1

    def test_cannot_delete_primary_era_with_dependents(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid, abbr="OFC")
        make_secondary_era(
            client, gm_h, cid, ofc["id"],
            name="ABF", abbr="ABF", direction="ascending",
            anchor_era_year=1, anchor_this_year=6261,
        )
        resp = client.delete(f"/api/gm/campaigns/{cid}/calendar/eras/{ofc['id']}", headers=gm_h)
        assert resp.status_code == 409

    def test_era_player_visibility_toggle(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        era = make_primary_era(client, gm_h, cid)
        assert era["is_visible_to_players"] is False
        resp = client.patch(
            f"/api/gm/campaigns/{cid}/calendar/eras/{era['id']}/visibility",
            json={"is_visible_to_players": True},
            headers=gm_h,
        )
        assert resp.status_code == 200
        assert resp.json()["is_visible_to_players"] is True


# ── Timeline events ───────────────────────────────────────────────────────────

class TestTimelineEvents:
    def test_gm_can_create_event(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid)
        event = make_event(client, gm_h, cid, title="Founding of OFC", era_id=ofc["id"], year=1)
        assert event["title"] == "Founding of OFC"
        assert event["year"] == 1
        assert event["absolute_year"] == 1  # OFC primary epoch=0, so absolute=1

    def test_player_cannot_create_event(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/timeline",
            json={"title": "Nope"},
            headers=player_h,
        )
        assert resp.status_code == 403

    def test_non_member_cannot_list_events(self, client):
        gm_h, _ = make_user(client, 1)
        other_h, _ = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        resp = client.get(f"/api/gm/campaigns/{cid}/timeline", headers=other_h)
        assert resp.status_code == 403

    def test_player_sees_only_visible_events(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid)
        make_event(client, gm_h, cid, title="Hidden", era_id=ofc["id"], year=1, visible=False)
        make_event(client, gm_h, cid, title="Visible", era_id=ofc["id"], year=2, visible=True)
        gm_events = client.get(f"/api/gm/campaigns/{cid}/timeline", headers=gm_h).json()
        player_events = client.get(f"/api/gm/campaigns/{cid}/timeline", headers=player_h).json()
        assert len(gm_events) == 2
        assert len(player_events) == 1
        assert player_events[0]["title"] == "Visible"

    def test_events_sorted_by_absolute_year(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid)
        make_event(client, gm_h, cid, title="Later", era_id=ofc["id"], year=3739)
        make_event(client, gm_h, cid, title="Earlier", era_id=ofc["id"], year=1)
        events = client.get(f"/api/gm/campaigns/{cid}/timeline", headers=gm_h).json()
        assert events[0]["title"] == "Earlier"
        assert events[1]["title"] == "Later"

    def test_era_dates_computed_for_multiple_eras(self, client):
        """An event at OFC 1 should display both OFC and ABF dates."""
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid, abbr="OFC", is_current=True)
        # Make both eras visible to players so they both appear
        client.patch(f"/api/gm/campaigns/{cid}/calendar/eras/{ofc['id']}/visibility", json={"is_visible_to_players": True}, headers=gm_h)
        abf = make_secondary_era(
            client, gm_h, cid, ofc["id"],
            name="After Belthil's Fall", abbr="ABF",
            direction="ascending",
            anchor_era_year=1, anchor_this_year=6261,
        )
        client.patch(f"/api/gm/campaigns/{cid}/calendar/eras/{abf['id']}/visibility", json={"is_visible_to_players": True}, headers=gm_h)
        # Event at OFC 1 = ABF 6261
        event = make_event(client, gm_h, cid, title="Orc Federation Founded", era_id=ofc["id"], year=1)
        era_dates = event["era_dates"]
        abbrevs = {d["abbreviation"]: d["year"] for d in era_dates}
        assert "OFC" in abbrevs
        assert abbrevs["OFC"] == 1
        assert "ABF" in abbrevs
        assert abbrevs["ABF"] == 6261

    def test_hidden_era_excluded_from_player_view(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid, abbr="OFC")
        # OFC is NOT visible to players; event IS visible
        client.patch(f"/api/gm/campaigns/{cid}/calendar/eras/{ofc['id']}/visibility", json={"is_visible_to_players": False}, headers=gm_h)
        event = make_event(client, gm_h, cid, title="Visible Event", era_id=ofc["id"], year=100, visible=True)
        player_events = client.get(f"/api/gm/campaigns/{cid}/timeline", headers=player_h).json()
        assert len(player_events) == 1
        assert player_events[0]["era_dates"] == []  # era hidden → no date shown to player

    def test_event_visibility_toggle(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        event = make_event(client, gm_h, cid, title="Secret")
        resp = client.patch(
            f"/api/gm/campaigns/{cid}/timeline/{event['id']}/visibility",
            json={"is_visible_to_players": True},
            headers=gm_h,
        )
        assert resp.status_code == 200
        assert resp.json()["is_visible_to_players"] is True

    def test_update_event(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        ofc = make_primary_era(client, gm_h, cid)
        event = make_event(client, gm_h, cid, title="Old Title", era_id=ofc["id"], year=1)
        resp = client.put(
            f"/api/gm/campaigns/{cid}/timeline/{event['id']}",
            json={"title": "New Title", "year": 500},
            headers=gm_h,
        )
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["title"] == "New Title"
        assert updated["year"] == 500
        assert updated["absolute_year"] == 500  # OFC epoch=0

    def test_description_persists_through_list_endpoint(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        # Create event with description
        resp = client.post(
            f"/api/gm/campaigns/{cid}/timeline",
            json={"title": "Battle of Ironhold", "description": "A great battle was fought here."},
            headers=gm_h,
        )
        assert resp.status_code == 201
        assert resp.json()["description"] == "A great battle was fought here."
        # List endpoint must also return description (regression: EventListItem was missing it)
        events = client.get(f"/api/gm/campaigns/{cid}/timeline", headers=gm_h).json()
        assert events[0]["description"] == "A great battle was fought here."
        # Update description via PUT and verify list returns the new value
        client.put(
            f"/api/gm/campaigns/{cid}/timeline/{events[0]['id']}",
            json={"title": "Battle of Ironhold", "description": "Updated description."},
            headers=gm_h,
        )
        events = client.get(f"/api/gm/campaigns/{cid}/timeline", headers=gm_h).json()
        assert events[0]["description"] == "Updated description."

    def test_delete_event(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        event = make_event(client, gm_h, cid)
        resp = client.delete(f"/api/gm/campaigns/{cid}/timeline/{event['id']}", headers=gm_h)
        assert resp.status_code == 204

    def test_gm_can_set_and_read_gm_notes(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/timeline",
            json={"title": "Secret", "gm_notes": "The villain escaped north."},
            headers=gm_h,
        )
        assert resp.status_code == 201
        assert resp.json()["gm_notes"] == "The villain escaped north."

    def test_gm_notes_stripped_for_player(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/timeline",
            json={"title": "Public Event", "gm_notes": "Secret info.", "is_visible_to_players": True},
            headers=gm_h,
        )
        event_id = resp.json()["id"]
        # GM list sees gm_notes
        gm_events = client.get(f"/api/gm/campaigns/{cid}/timeline", headers=gm_h).json()
        assert gm_events[0]["gm_notes"] == "Secret info."
        # Player list gets gm_notes stripped
        player_events = client.get(f"/api/gm/campaigns/{cid}/timeline", headers=player_h).json()
        assert player_events[0]["gm_notes"] is None
        # Player detail also stripped
        player_detail = client.get(f"/api/gm/campaigns/{cid}/timeline/{event_id}", headers=player_h).json()
        assert player_detail["gm_notes"] is None


# ── List/detail schema round-trip ─────────────────────────────────────────────
# Guard against fields being present in EventResponse (detail) but silently
# dropped from EventListItem (list). Pattern: write a value via POST or PUT,
# read it back through the list endpoint, assert it matches.

class TestEventListFieldRoundTrip:
    """Every writable field must survive a POST→list and PUT→list round-trip.

    Root bug: EventListItem was missing 'description', so the list endpoint
    silently stripped it even though the DB stored it correctly.  Adding a
    field to EventResponse but forgetting EventListItem would repeat the bug.
    """

    def _setup(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        make_calendar(client, gm_h, cid)
        era = make_primary_era(client, gm_h, cid, abbr="AK")
        return gm_h, cid, era

    def _list(self, client, cid, headers):
        return client.get(f"/api/gm/campaigns/{cid}/timeline", headers=headers).json()

    def test_title_in_list(self, client):
        gm_h, cid, era = self._setup(client)
        client.post(f"/api/gm/campaigns/{cid}/timeline",
                    json={"title": "Round Trip Title"}, headers=gm_h)
        assert self._list(client, cid, gm_h)[0]["title"] == "Round Trip Title"

    def test_description_in_list_after_create(self, client):
        gm_h, cid, era = self._setup(client)
        client.post(f"/api/gm/campaigns/{cid}/timeline",
                    json={"title": "T", "description": "Created desc"}, headers=gm_h)
        assert self._list(client, cid, gm_h)[0]["description"] == "Created desc"

    def test_description_in_list_after_update(self, client):
        gm_h, cid, era = self._setup(client)
        resp = client.post(f"/api/gm/campaigns/{cid}/timeline",
                           json={"title": "T"}, headers=gm_h)
        eid = resp.json()["id"]
        client.put(f"/api/gm/campaigns/{cid}/timeline/{eid}",
                   json={"title": "T", "description": "Updated desc"}, headers=gm_h)
        assert self._list(client, cid, gm_h)[0]["description"] == "Updated desc"

    def test_era_and_year_in_list(self, client):
        gm_h, cid, era = self._setup(client)
        client.post(f"/api/gm/campaigns/{cid}/timeline",
                    json={"title": "T", "era_id": era["id"], "year": 42}, headers=gm_h)
        item = self._list(client, cid, gm_h)[0]
        assert item["era_id"] == era["id"]
        assert item["year"] == 42
        assert item["absolute_year"] == 42

    def test_visibility_in_list(self, client):
        gm_h, cid, era = self._setup(client)
        client.post(f"/api/gm/campaigns/{cid}/timeline",
                    json={"title": "T", "is_visible_to_players": True}, headers=gm_h)
        assert self._list(client, cid, gm_h)[0]["is_visible_to_players"] is True

    def test_era_dates_in_list(self, client):
        gm_h, cid, era = self._setup(client)
        client.post(f"/api/gm/campaigns/{cid}/timeline",
                    json={"title": "T", "era_id": era["id"], "year": 100}, headers=gm_h)
        item = self._list(client, cid, gm_h)[0]
        assert len(item["era_dates"]) == 1
        assert item["era_dates"][0]["year"] == 100
        assert item["era_dates"][0]["abbreviation"] == "AK"

    def test_gm_notes_in_list_after_create(self, client):
        gm_h, cid, era = self._setup(client)
        client.post(f"/api/gm/campaigns/{cid}/timeline",
                    json={"title": "T", "gm_notes": "Note on create"}, headers=gm_h)
        assert self._list(client, cid, gm_h)[0]["gm_notes"] == "Note on create"

    def test_gm_notes_in_list_after_update(self, client):
        gm_h, cid, era = self._setup(client)
        resp = client.post(f"/api/gm/campaigns/{cid}/timeline",
                           json={"title": "T"}, headers=gm_h)
        eid = resp.json()["id"]
        client.put(f"/api/gm/campaigns/{cid}/timeline/{eid}",
                   json={"title": "T", "gm_notes": "Note on update"}, headers=gm_h)
        assert self._list(client, cid, gm_h)[0]["gm_notes"] == "Note on update"


# ── NPC and Location links ────────────────────────────────────────────────────

class TestEventLinks:
    def _setup(self, client):
        gm_h, _ = make_user(client, 1)
        cid = make_campaign(client, gm_h)
        event = make_event(client, gm_h, cid, title="Battle")
        return gm_h, cid, event

    def test_gm_can_link_npc_to_event(self, client):
        gm_h, cid, event = self._setup(client)
        # Create an NPC first
        npc_resp = client.post(
            f"/api/gm/campaigns/npcs",
            json={"campaign_id": cid, "name": "Feanor", "race": "Elf"},
            headers=gm_h,
        )
        assert npc_resp.status_code == 201, npc_resp.text
        npc_id = npc_resp.json()["id"]
        resp = client.post(
            f"/api/gm/campaigns/{cid}/timeline/{event['id']}/npcs",
            json={"npc_id": npc_id, "description": "Was present"},
            headers=gm_h,
        )
        assert resp.status_code == 201
        assert resp.json()["npc_name"] == "Feanor"

    def test_duplicate_npc_link_rejected(self, client):
        gm_h, cid, event = self._setup(client)
        npc_resp = client.post(
            "/api/gm/campaigns/npcs",
            json={"campaign_id": cid, "name": "Feanor", "race": "Elf"},
            headers=gm_h,
        )
        npc_id = npc_resp.json()["id"]
        client.post(f"/api/gm/campaigns/{cid}/timeline/{event['id']}/npcs", json={"npc_id": npc_id}, headers=gm_h)
        resp = client.post(f"/api/gm/campaigns/{cid}/timeline/{event['id']}/npcs", json={"npc_id": npc_id}, headers=gm_h)
        assert resp.status_code == 409

    def test_player_cannot_add_npc_link(self, client):
        gm_h, _ = make_user(client, 1)
        player_h, player_id = make_user(client, 2)
        cid = make_campaign(client, gm_h)
        invite_player(client, gm_h, cid, player_id)
        event = make_event(client, gm_h, cid, title="Battle", visible=True)
        resp = client.post(
            f"/api/gm/campaigns/{cid}/timeline/{event['id']}/npcs",
            json={"npc_id": 999},
            headers=player_h,
        )
        assert resp.status_code == 403

    def test_gm_can_link_location_to_event(self, client):
        gm_h, cid, event = self._setup(client)
        loc_resp = client.post(
            f"/api/gm/campaigns/{cid}/locations",
            json={"name": "Olissipo"},
            headers=gm_h,
        )
        assert loc_resp.status_code == 201
        loc_id = loc_resp.json()["id"]
        resp = client.post(
            f"/api/gm/campaigns/{cid}/timeline/{event['id']}/locations",
            json={"location_id": loc_id, "description": "Where it happened"},
            headers=gm_h,
        )
        assert resp.status_code == 201
        assert resp.json()["location_name"] == "Olissipo"

    def test_remove_location_link(self, client):
        gm_h, cid, event = self._setup(client)
        loc_resp = client.post(
            f"/api/gm/campaigns/{cid}/locations",
            json={"name": "Olissipo"},
            headers=gm_h,
        )
        loc_id = loc_resp.json()["id"]
        link = client.post(
            f"/api/gm/campaigns/{cid}/timeline/{event['id']}/locations",
            json={"location_id": loc_id},
            headers=gm_h,
        ).json()
        resp = client.delete(
            f"/api/gm/campaigns/{cid}/timeline/{event['id']}/locations/{link['id']}",
            headers=gm_h,
        )
        assert resp.status_code == 204
