"""
Regression tests for the post-deploy T2 security follow-ups, slice 1 (data leaks). Each fails on the old code.

Anyone can register and create a campaign, so "a stranger" below is any account at all.

  - TestCompendiumHomebrewIsMembersOnly: every compendium module (12) refuses a non-member both the
    `?campaign_id` list merge and a campaign row's detail; members and system rows are unaffected.
  - TestNoEmailsLeak: user search matches and returns usernames only; campaign member payloads carry no email.
  - TestHiddenLocationChildren: a player cannot list a hidden location's maps, NPCs, relationships or links, a
    hidden map's pins, or see a hidden location as the other side of a visible one's relationship.
  - TestErasMustBeThisCampaigns: timeline events, sessions and character timeline events refuse another
    campaign's era id (with or without a year).
"""
import io

import pytest
from sqlalchemy import Boolean, Enum as SQLEnum, Float, Integer, JSON, Numeric
from sqlalchemy.dialects.postgresql import JSONB

from shared.enums import OwnerType
from tests.conftest import _SessionLocal, make_user, make_campaign, invite_player

from players.races.models import Race
from players.backgrounds.models import Background
from players.feats.models import Feat
from players.classes.models import CharacterClass
from shared.encyclopedia.bestiary.models import Creature
from shared.encyclopedia.spells.models import Spell
from shared.encyclopedia.items.weapons.models import Weapon
from shared.encyclopedia.items.armor.models import Armor
from shared.encyclopedia.items.adventuring_gear.models import AdventuringGear
from shared.encyclopedia.items.potions.models import Potion
from shared.encyclopedia.items.food_drink.models import FoodDrink
from shared.encyclopedia.items.magic_items.models import MagicItem

COMPENDIUM = [
    (Race, "/races"),
    (Background, "/backgrounds"),
    (Feat, "/feats"),
    (CharacterClass, "/api/classes"),
    (Creature, "/api/encyclopedia/bestiary"),
    (Spell, "/api/encyclopedia/spells"),
    (Weapon, "/api/encyclopedia/items/weapons"),
    (Armor, "/api/encyclopedia/items/armor"),
    (AdventuringGear, "/api/encyclopedia/items/adventuring-gear"),
    (Potion, "/api/encyclopedia/items/potions"),
    (FoodDrink, "/api/encyclopedia/items/food-drink"),
    (MagicItem, "/api/encyclopedia/items/magic-items"),
]


def _filler(col):
    """A valid placeholder for a required column, chosen from its type."""
    t = col.type
    if isinstance(t, SQLEnum):
        values = t.enum_class and list(t.enum_class) or t.enums
        v = values[0]
        return v
    if isinstance(t, Boolean):
        return False
    if isinstance(t, (Integer, Numeric, Float)):
        return 1
    if isinstance(t, (JSON, JSONB)):
        return []
    return "x"


# Required JSON columns whose response schema wants an object rather than a list.
_JSON_OBJECTS = {Race: {"languages"}, Background: {"feature"}, Feat: {"benefits"}}


def _insert(model, owner_type, owner_id, name):
    """Insert a row with only its required columns filled (races can't be campaign-created through the API)."""
    data = {"name": name, "owner_type": owner_type, "owner_id": owner_id}
    data.update({c: {} for c in _JSON_OBJECTS.get(model, ())})
    for col in model.__table__.columns:
        if col.name in data or col.primary_key or col.nullable or col.default is not None or col.server_default is not None:
            continue
        data[col.name] = _filler(col)
    with _SessionLocal() as db:
        row = model(**data)
        db.add(row)
        db.commit()
        return row.id


@pytest.mark.parametrize("model,base", COMPENDIUM, ids=[b for _, b in COMPENDIUM])
class TestCompendiumHomebrewIsMembersOnly:
    def _setup(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        h_stranger, _ = make_user(client, 3)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_player)
        return h_gm, h_player, h_stranger, cid

    def test_stranger_cannot_list_a_campaigns_homebrew(self, client, model, base):
        _, _, h_stranger, cid = self._setup(client)
        _insert(model, OwnerType.campaign, cid, "Secret Homebrew")
        resp = client.get(base, params={"campaign_id": cid}, headers=h_stranger)
        assert resp.status_code == 403

    def test_stranger_cannot_read_a_campaign_row_by_id(self, client, model, base):
        _, _, h_stranger, cid = self._setup(client)
        row_id = _insert(model, OwnerType.campaign, cid, "Secret Homebrew")
        assert client.get(f"{base}/{row_id}", headers=h_stranger).status_code == 403

    def test_members_still_read_homebrew(self, client, model, base):
        h_gm, h_player, _, cid = self._setup(client)
        row_id = _insert(model, OwnerType.campaign, cid, "Secret Homebrew")
        for h in (h_gm, h_player):
            assert client.get(base, params={"campaign_id": cid}, headers=h).status_code == 200
            assert client.get(f"{base}/{row_id}", headers=h).status_code == 200

    def test_anyone_still_reads_system_rows(self, client, model, base):
        _, _, h_stranger, _ = self._setup(client)
        row_id = _insert(model, OwnerType.system, None, "Public Entry")
        assert client.get(base, headers=h_stranger).status_code == 200
        assert client.get(f"{base}/{row_id}", headers=h_stranger).status_code == 200


class TestNoEmailsLeak:
    def test_campaign_members_carry_no_email(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_p)
        for h in (h_gm, h_p):
            members = client.get(f"/api/gm/campaigns/{cid}", headers=h).json()["members"]
            assert len(members) == 2
            assert all("email" not in m["user"] for m in members)
            assert "@" not in str(members)

    def test_search_cannot_harvest_emails(self, client):
        h1, _ = make_user(client, 1)
        for n in range(2, 5):
            make_user(client, n)
        # The old search matched email too, so "@e" listed everyone with their address.
        assert client.get("/api/auth/users/search?q=@e", headers=h1).json() == []
        results = client.get("/api/auth/users/search?q=user", headers=h1).json()
        assert len(results) == 3
        assert all(set(u) == {"id", "username"} for u in results)


LOC = lambda cid: f"/api/gm/campaigns/{cid}/locations"
TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
    b"\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)


def _location(client, h, cid, name, visible):
    r = client.post(LOC(cid), json={"name": name, "is_visible_to_players": visible}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _map(client, h, cid, lid):
    r = client.post(f"{LOC(cid)}/{lid}/maps", data={"name": "Map"},
                    files={"file": ("map.png", io.BytesIO(TINY_PNG), "image/png")}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


class TestHiddenLocationChildren:
    def _setup(self, client):
        h_gm, _ = make_user(client, 1)
        h_p, uid_p = make_user(client, 2)
        cid = make_campaign(client, h_gm)
        invite_player(client, h_gm, cid, uid_p)
        hidden = _location(client, h_gm, cid, "Secret Lair", visible=False)
        shown = _location(client, h_gm, cid, "Town", visible=True)
        return h_gm, h_p, cid, hidden, shown

    def test_player_cannot_list_a_hidden_locations_children(self, client):
        h_gm, h_p, cid, hidden, _ = self._setup(client)
        map_id = _map(client, h_gm, cid, hidden)
        for path in ("maps", "npcs", "relationships", "links", f"maps/{map_id}/pins"):
            resp = client.get(f"{LOC(cid)}/{hidden}/{path}", headers=h_p)
            assert resp.status_code == 403, path
            # The GM still can.
            assert client.get(f"{LOC(cid)}/{hidden}/{path}", headers=h_gm).status_code == 200, path

    def test_player_cannot_list_a_hidden_maps_pins(self, client):
        h_gm, h_p, cid, _, shown = self._setup(client)
        map_id = _map(client, h_gm, cid, shown)  # maps start hidden from players
        assert client.get(f"{LOC(cid)}/{shown}/maps/{map_id}/pins", headers=h_p).status_code == 403
        client.patch(f"{LOC(cid)}/{shown}/maps/{map_id}/visibility", headers=h_gm)
        assert client.get(f"{LOC(cid)}/{shown}/maps/{map_id}/pins", headers=h_p).status_code == 200

    def test_hidden_location_is_not_the_other_side_of_a_visible_relationship(self, client):
        h_gm, h_p, cid, hidden, shown = self._setup(client)
        other = _location(client, h_gm, cid, "Farm", visible=True)
        for b in (hidden, other):
            r = client.post(f"{LOC(cid)}/{shown}/relationships",
                            json={"location_b_id": b, "direction": "a_above_b"}, headers=h_gm)
            assert r.status_code == 201, r.text
        player_rels = client.get(f"{LOC(cid)}/{shown}/relationships", headers=h_p).json()
        assert [r["location_b_id"] for r in player_rels] == [other]
        gm_rels = client.get(f"{LOC(cid)}/{shown}/relationships", headers=h_gm).json()
        assert {r["location_b_id"] for r in gm_rels} == {hidden, other}


def _era(client, h, cid):
    base = f"/api/gm/campaigns/{cid}/calendar"
    assert client.post(base, json={"name": "Cal"}, headers=h).status_code == 201
    r = client.post(f"{base}/eras", json={"name": "Age", "abbreviation": "AG", "direction": "ascending"}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


class TestErasMustBeThisCampaigns:
    def _setup(self, client):
        h_a, _ = make_user(client, 1)
        h_b, _ = make_user(client, 2)
        cid_a = make_campaign(client, h_a, name="A")
        cid_b = make_campaign(client, h_b, name="B")
        return h_a, h_b, cid_a, cid_b, _era(client, h_a, cid_a), _era(client, h_b, cid_b)

    @pytest.mark.parametrize("year", [5, None])
    def test_timeline_event_refuses_another_campaigns_era(self, client, year):
        _, h_b, cid_a, cid_b, era_a, era_b = self._setup(client)
        url = f"/api/gm/campaigns/{cid_b}/timeline"
        bad = client.post(url, json={"title": "E", "era_id": era_a, "year": year}, headers=h_b)
        assert bad.status_code == 404
        bad_end = client.post(url, json={"title": "E", "end_era_id": era_a, "end_year": year}, headers=h_b)
        assert bad_end.status_code == 404
        ok = client.post(url, json={"title": "E", "era_id": era_b, "year": year}, headers=h_b)
        assert ok.status_code == 201, ok.text
        upd = client.put(f"{url}/{ok.json()['id']}", json={"era_id": era_a}, headers=h_b)
        assert upd.status_code == 404

    def test_session_refuses_another_campaigns_era(self, client):
        _, h_b, cid_a, cid_b, era_a, era_b = self._setup(client)
        url = f"/api/gm/campaigns/{cid_b}/sessions"
        assert client.post(url, json={"title": "S", "era_id": era_a, "year": 3}, headers=h_b).status_code == 404
        ok = client.post(url, json={"title": "S", "era_id": era_b, "year": 3}, headers=h_b)
        assert ok.status_code == 201, ok.text
        assert client.put(f"{url}/{ok.json()['id']}", json={"era_id": era_a}, headers=h_b).status_code == 404

    def test_character_timeline_event_refuses_another_campaigns_era(self, client):
        _, h_b, cid_a, cid_b, era_a, era_b = self._setup(client)
        char = client.post("/api/characters", json={"name": "Hero", "race": "Human", "char_class": "Fighter", "campaign_id": cid_b}, headers=h_b)
        assert char.status_code == 201, char.text
        url = f"/api/characters/{char.json()['id']}/timeline-events"
        assert client.post(url, json={"title": "Born", "era_id": era_a, "year": 1}, headers=h_b).status_code == 404
        assert client.post(url, json={"title": "Born", "era_id": era_b, "year": 1}, headers=h_b).status_code == 201
