"""
Tests for all Encyclopedia endpoints (Bestiary + Spells + 6 Item types).

All 8 endpoints share the same access-control pattern:
  - System content: admin can create/update/delete; anyone authenticated can read
  - Campaign content: campaign GM can create/update/delete; campaign members can read
  - Listing with ?campaign_id merges campaign entries over system entries (same name wins)

Each parametrize case supplies the URL prefix and a minimal valid payload.
"""
import pytest
from tests.conftest import make_user, make_admin, make_campaign, invite_player

# ---------------------------------------------------------------------------
# Parametrize data
# ---------------------------------------------------------------------------

def _sys(payload):
    """Attach system ownership fields."""
    return {**payload, "owner_type": "system", "owner_id": None}


def _camp(payload, campaign_id):
    """Attach campaign ownership fields."""
    return {**payload, "owner_type": "campaign", "owner_id": campaign_id}


CREATURE = {
    "name": "Test Creature", "size": "Medium", "type": "humanoid",
    "challenge_rating": "1", "armor_class": 12, "hit_points": "11 (2d8+2)",
    "speed": "30 ft.", "strength": 10, "dexterity": 10, "constitution": 12,
    "intelligence": 10, "wisdom": 10, "charisma": 10,
}
SPELL = {
    "name": "Test Spell", "level": 1, "school": "Evocation",
    "casting_time": "1 action", "range": "60 feet", "components": "V, S",
    "duration": "Instantaneous", "description": "A test spell.", "classes": "Wizard",
}
WEAPON = {
    "name": "Test Sword", "weapon_category": "Martial", "weapon_type": "Melee",
    "damage": "1d8", "damage_type": "slashing", "cost": "15 gp", "weight": "3 lb",
}
ARMOR = {
    "name": "Test Armor", "armor_type": "Light", "armor_class": 11,
    "cost": "10 gp", "weight": "8 lb",
}
GEAR = {
    "name": "Test Gear", "category": "General", "cost": "1 sp", "weight": "1 lb",
}
POTION = {
    "name": "Test Potion", "rarity": "Common", "effect": "Heals 2d4+2 hp",
    "cost": "50 gp", "weight": "0.5 lb",
}
MAGIC_ITEM = {
    "name": "Test Magic Item", "item_type": "Wondrous Item", "rarity": "Uncommon",
    "effect": "A magical effect.",
}
FOOD_DRINK = {
    "name": "Test Food", "item_type": "Food", "category": "Common",
    "cost": "1 cp", "weight": "0.5 lb",
}

CASES = [
    pytest.param("/api/encyclopedia/bestiary", CREATURE, id="bestiary"),
    pytest.param("/api/encyclopedia/spells", SPELL, id="spells"),
    pytest.param("/api/encyclopedia/items/weapons", WEAPON, id="weapons"),
    pytest.param("/api/encyclopedia/items/armor", ARMOR, id="armor"),
    pytest.param("/api/encyclopedia/items/adventuring-gear", GEAR, id="adventuring_gear"),
    pytest.param("/api/encyclopedia/items/potions", POTION, id="potions"),
    pytest.param("/api/encyclopedia/items/magic-items", MAGIC_ITEM, id="magic_items"),
    pytest.param("/api/encyclopedia/items/food-drink", FOOD_DRINK, id="food_drink"),
]


# ---------------------------------------------------------------------------
# System content access control
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("prefix,base_payload", CASES)
class TestSystemContent:
    def test_admin_can_create_system_entry(self, client, prefix, base_payload):
        admin_h, _ = make_admin(client)
        resp = client.post(prefix, json=_sys(base_payload), headers=admin_h)
        assert resp.status_code == 201, resp.text
        assert resp.json()["owner_type"] == "system"

    def test_non_admin_cannot_create_system_entry(self, client, prefix, base_payload):
        h, _ = make_user(client, 1)
        resp = client.post(prefix, json=_sys(base_payload), headers=h)
        assert resp.status_code == 403

    def test_any_authenticated_user_can_list(self, client, prefix, base_payload):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        client.post(prefix, json=_sys(base_payload), headers=admin_h)

        resp = client.get(prefix, headers=h)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_any_authenticated_user_can_get_by_id(self, client, prefix, base_payload):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        entry_id = client.post(prefix, json=_sys(base_payload), headers=admin_h).json()["id"]

        resp = client.get(f"{prefix}/{entry_id}", headers=h)
        assert resp.status_code == 200

    def test_admin_can_update_system_entry(self, client, prefix, base_payload):
        admin_h, _ = make_admin(client)
        entry_id = client.post(prefix, json=_sys(base_payload), headers=admin_h).json()["id"]

        resp = client.put(f"{prefix}/{entry_id}", json={"name": "Renamed"}, headers=admin_h)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"

    def test_non_admin_cannot_update_system_entry(self, client, prefix, base_payload):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        entry_id = client.post(prefix, json=_sys(base_payload), headers=admin_h).json()["id"]

        resp = client.put(f"{prefix}/{entry_id}", json={"name": "Hacked"}, headers=h)
        assert resp.status_code == 403

    def test_admin_can_delete_system_entry(self, client, prefix, base_payload):
        admin_h, _ = make_admin(client)
        entry_id = client.post(prefix, json=_sys(base_payload), headers=admin_h).json()["id"]

        resp = client.delete(f"{prefix}/{entry_id}", headers=admin_h)
        assert resp.status_code == 200

    def test_non_admin_cannot_delete_system_entry(self, client, prefix, base_payload):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        entry_id = client.post(prefix, json=_sys(base_payload), headers=admin_h).json()["id"]

        resp = client.delete(f"{prefix}/{entry_id}", headers=h)
        assert resp.status_code == 403

    def test_duplicate_system_name_rejected(self, client, prefix, base_payload):
        admin_h, _ = make_admin(client)
        client.post(prefix, json=_sys(base_payload), headers=admin_h)
        resp = client.post(prefix, json=_sys(base_payload), headers=admin_h)
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Campaign content access control
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("prefix,base_payload", CASES)
class TestCampaignContent:
    def test_gm_can_create_campaign_entry(self, client, prefix, base_payload):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)

        resp = client.post(prefix, json=_camp(base_payload, campaign_id), headers=h_gm)
        assert resp.status_code == 201, resp.text
        assert resp.json()["owner_type"] == "campaign"
        assert resp.json()["owner_id"] == campaign_id

    def test_non_gm_cannot_create_campaign_entry(self, client, prefix, base_payload):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)

        resp = client.post(prefix, json=_camp(base_payload, campaign_id), headers=h_player)
        assert resp.status_code == 403

    def test_gm_can_update_campaign_entry(self, client, prefix, base_payload):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)
        entry_id = client.post(prefix, json=_camp(base_payload, campaign_id), headers=h_gm).json()["id"]

        resp = client.put(f"{prefix}/{entry_id}", json={"name": "Renamed"}, headers=h_gm)
        assert resp.status_code == 200

    def test_gm_can_delete_campaign_entry(self, client, prefix, base_payload):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)
        entry_id = client.post(prefix, json=_camp(base_payload, campaign_id), headers=h_gm).json()["id"]

        resp = client.delete(f"{prefix}/{entry_id}", headers=h_gm)
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Campaign override / merge pattern
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("prefix,base_payload", CASES)
class TestCampaignOverride:
    def test_campaign_entry_overrides_system_entry_by_name(self, client, prefix, base_payload):
        """When queried with ?campaign_id, campaign entries hide system entries of the same name."""
        admin_h, _ = make_admin(client)
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)

        # Create system entry
        client.post(prefix, json=_sys(base_payload), headers=admin_h)
        # Create campaign entry with the same name
        client.post(prefix, json=_camp(base_payload, campaign_id), headers=h_gm)

        resp = client.get(f"{prefix}?campaign_id={campaign_id}", headers=h_gm)
        assert resp.status_code == 200
        entries = resp.json()
        matching = [e for e in entries if e["name"] == base_payload["name"]]
        # Only one entry should be visible — the campaign override
        assert len(matching) == 1
        assert matching[0]["owner_type"] == "campaign"

    def test_without_campaign_id_returns_system_only(self, client, prefix, base_payload):
        admin_h, _ = make_admin(client)
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)

        client.post(prefix, json=_sys(base_payload), headers=admin_h)
        client.post(prefix, json=_camp({**base_payload, "name": "Campaign Only"}, campaign_id), headers=h_gm)

        resp = client.get(prefix, headers=h_gm)
        names = [e["name"] for e in resp.json()]
        assert base_payload["name"] in names
        assert "Campaign Only" not in names


# ---------------------------------------------------------------------------
# Spell-specific field tests (ritual, concentration, higher_level)
# ---------------------------------------------------------------------------

class TestSpellFields:
    """Verifies the extended spell schema fields are stored and returned correctly."""

    PREFIX = "/api/encyclopedia/spells"

    def _create_spell(self, client, headers, **overrides):
        payload = _sys({
            "name": "Field Test Spell", "level": 1, "school": "Evocation",
            "casting_time": "1 action", "range": "60 feet", "components": "V, S",
            "duration": "Instantaneous", "description": "A test.", "classes": "Wizard",
            **overrides,
        })
        resp = client.post(self.PREFIX, json=payload, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()

    def test_ritual_defaults_to_false(self, client):
        admin_h, _ = make_admin(client)
        data = self._create_spell(client, admin_h)
        assert data["ritual"] is False

    def test_concentration_defaults_to_false(self, client):
        admin_h, _ = make_admin(client)
        data = self._create_spell(client, admin_h)
        assert data["concentration"] is False

    def test_higher_level_defaults_to_null(self, client):
        admin_h, _ = make_admin(client)
        data = self._create_spell(client, admin_h)
        assert data["higher_level"] is None

    def test_ritual_true_round_trips(self, client):
        admin_h, _ = make_admin(client)
        data = self._create_spell(client, admin_h, ritual=True)
        assert data["ritual"] is True

    def test_concentration_true_round_trips(self, client):
        admin_h, _ = make_admin(client)
        data = self._create_spell(client, admin_h, concentration=True)
        assert data["concentration"] is True

    def test_higher_level_text_round_trips(self, client):
        admin_h, _ = make_admin(client)
        text = "Deals an extra 1d6 per slot level above 1st."
        data = self._create_spell(client, admin_h, higher_level=text)
        assert data["higher_level"] == text

    def test_fields_survive_update(self, client):
        admin_h, _ = make_admin(client)
        spell_id = self._create_spell(client, admin_h)["id"]
        resp = client.put(
            f"{self.PREFIX}/{spell_id}",
            json={"ritual": True, "concentration": True, "higher_level": "Updated text."},
            headers=admin_h,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ritual"] is True
        assert data["concentration"] is True
        assert data["higher_level"] == "Updated text."

    def test_fields_present_in_list_response(self, client):
        admin_h, _ = make_admin(client)
        self._create_spell(client, admin_h, ritual=True, higher_level="Extra damage.")
        items = client.get(self.PREFIX, headers=admin_h).json()
        assert len(items) == 1
        spell = items[0]
        assert "ritual" in spell
        assert "concentration" in spell
        assert "higher_level" in spell
        assert spell["ritual"] is True
        assert spell["higher_level"] == "Extra damage."


class TestSpellEdition:
    """A spell whose 2024 text differs is stored as its own row (name + edition + owner
    scope). A 2024 campaign reads 5.5e text where it exists and falls back to the 5e row
    otherwise, so switching a campaign to 2024 never empties the compendium."""

    PREFIX = "/api/encyclopedia/spells"

    def _create(self, client, headers, name="Blade Ward", **overrides):
        payload = _sys({
            "name": name, "level": 0, "school": "Abjuration",
            "casting_time": "1 action", "range": "Self", "components": "V, S",
            "duration": "1 round", "description": "2014 text.", "classes": "Wizard",
            **overrides,
        })
        resp = client.post(self.PREFIX, json=payload, headers=headers)
        assert resp.status_code == 201, resp.text
        return resp.json()

    def _names(self, client, headers, **params):
        resp = client.get(self.PREFIX, headers=headers, params=params)
        assert resp.status_code == 200
        return resp.json()

    def test_edition_defaults_to_5e(self, client):
        admin_h, _ = make_admin(client)
        assert self._create(client, admin_h)["edition"] == "5e"

    def test_edition_round_trips_in_detail_and_list(self, client):
        admin_h, _ = make_admin(client)
        spell_id = self._create(client, admin_h, edition="5.5e")["id"]
        detail = client.get(f"{self.PREFIX}/{spell_id}", headers=admin_h).json()
        assert detail["edition"] == "5.5e"
        listed = self._names(client, admin_h)
        assert listed[0]["edition"] == "5.5e"

    def test_same_name_can_exist_in_both_editions(self, client):
        admin_h, _ = make_admin(client)
        self._create(client, admin_h, edition="5e")
        self._create(client, admin_h, edition="5.5e", duration="Concentration, up to 1 minute")
        # No edition filter: both rows are their own entry.
        assert len(self._names(client, admin_h)) == 2

    def test_duplicate_name_in_same_edition_rejected(self, client):
        admin_h, _ = make_admin(client)
        self._create(client, admin_h, edition="5e")
        payload = _sys({
            "name": "Blade Ward", "edition": "5e", "level": 0, "school": "Abjuration",
            "casting_time": "1 action", "range": "Self", "components": "V, S",
            "duration": "1 round", "description": "dupe", "classes": "Wizard",
        })
        resp = client.post(self.PREFIX, json=payload, headers=admin_h)
        assert resp.status_code == 400

    def test_edition_filter_returns_that_editions_text(self, client):
        admin_h, _ = make_admin(client)
        self._create(client, admin_h, edition="5e", description="2014 text.")
        self._create(client, admin_h, edition="5.5e", description="2024 text.")

        spells_5e = self._names(client, admin_h, edition="5e")
        assert [s["description"] for s in spells_5e] == ["2014 text."]

        spells_2024 = self._names(client, admin_h, edition="5.5e")
        assert [s["description"] for s in spells_2024] == ["2024 text."]

    def test_5e_query_never_returns_a_5_5e_only_spell(self, client):
        admin_h, _ = make_admin(client)
        self._create(client, admin_h, name="True Strike", edition="5.5e")
        assert self._names(client, admin_h, edition="5e") == []

    def test_2024_falls_back_to_5e_text_when_no_5_5e_row(self, client):
        """The whole point of the fallback: a spell with no authored 2024 text is still
        visible to a 2024 campaign, reading its 5e row."""
        admin_h, _ = make_admin(client)
        self._create(client, admin_h, name="Fireball", edition="5e", description="2014 text.")

        spells = self._names(client, admin_h, edition="5.5e")
        assert len(spells) == 1
        assert spells[0]["name"] == "Fireball"
        assert spells[0]["edition"] == "5e"
        assert spells[0]["description"] == "2014 text."

    def test_2024_row_shadows_the_5e_fallback(self, client):
        admin_h, _ = make_admin(client)
        self._create(client, admin_h, edition="5e", description="2014 text.")
        self._create(client, admin_h, edition="5.5e", description="2024 text.")

        spells = self._names(client, admin_h, edition="5.5e")
        assert len(spells) == 1, "the 5.5e row must shadow the 5e one, not duplicate it"
        assert spells[0]["description"] == "2024 text."

    def test_campaign_override_shadows_system_within_an_edition(self, client):
        admin_h, _ = make_admin(client)
        gm_h, _ = make_user(client, 2)
        campaign_id = make_campaign(client, gm_h)
        self._create(client, admin_h, edition="5.5e", description="system 2024 text.")

        payload = _camp({
            "name": "Blade Ward", "edition": "5.5e", "level": 0, "school": "Abjuration",
            "casting_time": "1 action", "range": "Self", "components": "V, S",
            "duration": "1 round", "description": "GM override.", "classes": "Wizard",
        }, campaign_id)
        assert client.post(self.PREFIX, json=payload, headers=gm_h).status_code == 201

        spells = self._names(client, gm_h, campaign_id=campaign_id, edition="5.5e")
        assert len(spells) == 1
        assert spells[0]["description"] == "GM override."

    def test_campaign_override_beats_a_5e_fallback_row(self, client):
        """A GM's 2024 override must win over the system 5e row it replaces — not sit
        alongside it as a duplicate."""
        admin_h, _ = make_admin(client)
        gm_h, _ = make_user(client, 2)
        campaign_id = make_campaign(client, gm_h)
        self._create(client, admin_h, name="Fireball", edition="5e", description="system 2014 text.")

        payload = _camp({
            "name": "Fireball", "edition": "5.5e", "level": 3, "school": "Evocation",
            "casting_time": "1 action", "range": "150 feet", "components": "V, S, M",
            "duration": "Instantaneous", "description": "GM 2024 override.", "classes": "Wizard",
        }, campaign_id)
        assert client.post(self.PREFIX, json=payload, headers=gm_h).status_code == 201

        spells = self._names(client, gm_h, campaign_id=campaign_id, edition="5.5e")
        assert len(spells) == 1
        assert spells[0]["description"] == "GM 2024 override."
