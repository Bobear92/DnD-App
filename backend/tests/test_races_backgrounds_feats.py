"""
Tests for Races, Backgrounds, and Feats — all three follow the identical pattern:
  - Admin-only create/update/delete (system content)
  - Any authenticated user can list/get
  - With ?campaign_id the list includes both system + campaign-scoped entries
"""
import pytest
from tests.conftest import make_user, make_admin, make_campaign

# ---------------------------------------------------------------------------
# Parametrize config: (url_prefix, minimal_create_payload)
# ---------------------------------------------------------------------------

RACE_PAYLOAD = {
    "name": "Test Race",
    "description": "A test race",
    "ability_score_increases": {"strength": 2},
    "size": "Medium",
    "speed": 30,
}

BACKGROUND_PAYLOAD = {
    "name": "Test Background",
    "description": "A test background",
    "skill_proficiencies": ["Acrobatics"],
    "tool_proficiencies": [],
    "languages": {},
    "equipment": [],
    "feature": {"name": "Test Feature", "description": "A feature"},
    "characteristics": {},
}

FEAT_PAYLOAD = {
    "name": "Test Feat",
    "description": "A test feat",
    "prerequisites": {},
    "benefits": {"bonus": "+1 to STR"},
    "repeatable": False,
    "source": "Test Source",
}

CASES = [
    pytest.param("/races", RACE_PAYLOAD, id="races"),
    pytest.param("/backgrounds", BACKGROUND_PAYLOAD, id="backgrounds"),
    pytest.param("/feats", FEAT_PAYLOAD, id="feats"),
]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("prefix,payload", CASES)
class TestAdminOnlyCRUD:
    def test_admin_can_create(self, client, prefix, payload):
        admin_h, _ = make_admin(client)
        resp = client.post(prefix, json=payload, headers=admin_h)
        assert resp.status_code == 201, resp.text
        assert resp.json()["name"] == payload["name"]

    def test_non_admin_cannot_create(self, client, prefix, payload):
        h, _ = make_user(client, 1)
        resp = client.post(prefix, json=payload, headers=h)
        assert resp.status_code == 403

    def test_admin_can_update(self, client, prefix, payload):
        admin_h, _ = make_admin(client)
        entry_id = client.post(prefix, json=payload, headers=admin_h).json()["id"]

        resp = client.put(f"{prefix}/{entry_id}", json={"name": "Renamed"}, headers=admin_h)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"

    def test_non_admin_cannot_update(self, client, prefix, payload):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        entry_id = client.post(prefix, json=payload, headers=admin_h).json()["id"]

        resp = client.put(f"{prefix}/{entry_id}", json={"name": "Hacked"}, headers=h)
        assert resp.status_code == 403

    def test_admin_can_delete(self, client, prefix, payload):
        admin_h, _ = make_admin(client)
        entry_id = client.post(prefix, json=payload, headers=admin_h).json()["id"]

        resp = client.delete(f"{prefix}/{entry_id}", headers=admin_h)
        assert resp.status_code == 200

    def test_non_admin_cannot_delete(self, client, prefix, payload):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        entry_id = client.post(prefix, json=payload, headers=admin_h).json()["id"]

        resp = client.delete(f"{prefix}/{entry_id}", headers=h)
        assert resp.status_code == 403


@pytest.mark.parametrize("prefix,payload", CASES)
class TestReadAccess:
    def test_any_authenticated_user_can_list(self, client, prefix, payload):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        client.post(prefix, json=payload, headers=admin_h)

        resp = client.get(prefix, headers=h)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_any_authenticated_user_can_get_by_id(self, client, prefix, payload):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        entry_id = client.post(prefix, json=payload, headers=admin_h).json()["id"]

        resp = client.get(f"{prefix}/{entry_id}", headers=h)
        assert resp.status_code == 200

    def test_get_nonexistent_returns_404(self, client, prefix, payload):
        h, _ = make_user(client, 1)
        resp = client.get(f"{prefix}/99999", headers=h)
        assert resp.status_code == 404

    def test_list_without_campaign_id_returns_system_only(self, client, prefix, payload):
        admin_h, _ = make_admin(client)
        client.post(prefix, json=payload, headers=admin_h)

        resp = client.get(prefix, headers=admin_h)
        assert all(e["owner_type"] == "system" for e in resp.json())


# ---------------------------------------------------------------------------
# Feats — edition column + ?edition filter (feats-only behaviour)
# ---------------------------------------------------------------------------

class TestFeatEdition:
    def _create(self, client, admin_h, name, edition):
        payload = {**FEAT_PAYLOAD, "name": name, "edition": edition}
        resp = client.post("/feats", json=payload, headers=admin_h)
        assert resp.status_code == 201, resp.text
        return resp.json()

    def test_edition_defaults_to_5e(self, client):
        admin_h, _ = make_admin(client)
        # FEAT_PAYLOAD has no edition key → server default
        resp = client.post("/feats", json=FEAT_PAYLOAD, headers=admin_h)
        assert resp.status_code == 201
        assert resp.json()["edition"] == "5e"

    def test_create_with_edition_round_trips_in_detail(self, client):
        admin_h, _ = make_admin(client)
        feat = self._create(client, admin_h, "Edition Feat", "5.5e")
        resp = client.get(f"/feats/{feat['id']}", headers=admin_h)
        assert resp.json()["edition"] == "5.5e"

    def test_edition_in_list_response(self, client):
        admin_h, _ = make_admin(client)
        self._create(client, admin_h, "Listed Feat", "5.5e")
        resp = client.get("/feats", headers=admin_h)
        assert resp.json()[0]["edition"] == "5.5e"

    def test_edition_filter_returns_only_matching(self, client):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        self._create(client, admin_h, "Old Feat", "5e")
        self._create(client, admin_h, "New Feat", "5.5e")

        resp = client.get("/feats?edition=5.5e", headers=h)
        names = [f["name"] for f in resp.json()]
        assert names == ["New Feat"]

        resp = client.get("/feats?edition=5e", headers=h)
        names = [f["name"] for f in resp.json()]
        assert names == ["Old Feat"]

    def test_no_edition_filter_returns_all_editions(self, client):
        admin_h, _ = make_admin(client)
        self._create(client, admin_h, "Old Feat", "5e")
        self._create(client, admin_h, "New Feat", "5.5e")
        resp = client.get("/feats", headers=admin_h)
        assert len(resp.json()) == 2

    def test_update_edition(self, client):
        admin_h, _ = make_admin(client)
        feat = self._create(client, admin_h, "Mutable Feat", "5e")
        resp = client.put(f"/feats/{feat['id']}", json={"edition": "5.5e"}, headers=admin_h)
        assert resp.status_code == 200
        assert resp.json()["edition"] == "5.5e"


class TestFeatEffects:
    EFFECTS = [
        {"kind": "stat_mod", "stat": "initiative", "amount": 5},
        {"kind": "ability_choice", "abilities": ["strength", "constitution"], "amount": 1},
    ]

    def _create(self, client, admin_h, effects=None):
        payload = {**FEAT_PAYLOAD, "name": "Effecty Feat"}
        if effects is not None:
            payload["effects"] = effects
        resp = client.post("/feats", json=payload, headers=admin_h)
        assert resp.status_code == 201, resp.text
        return resp.json()

    def test_effects_default_to_null(self, client):
        admin_h, _ = make_admin(client)
        feat = self._create(client, admin_h)
        assert feat["effects"] is None

    def test_effects_round_trip_in_detail(self, client):
        admin_h, _ = make_admin(client)
        feat = self._create(client, admin_h, self.EFFECTS)
        resp = client.get(f"/feats/{feat['id']}", headers=admin_h)
        assert resp.json()["effects"] == self.EFFECTS

    def test_effects_in_list_response(self, client):
        admin_h, _ = make_admin(client)
        self._create(client, admin_h, self.EFFECTS)
        resp = client.get("/feats", headers=admin_h)
        assert resp.json()[0]["effects"] == self.EFFECTS

    def test_effects_survive_update(self, client):
        admin_h, _ = make_admin(client)
        feat = self._create(client, admin_h)
        new_effects = [{"kind": "attack_mod", "target": "unarmed", "dice": "1d4"}]
        resp = client.put(f"/feats/{feat['id']}", json={"effects": new_effects}, headers=admin_h)
        assert resp.status_code == 200
        assert resp.json()["effects"] == new_effects
