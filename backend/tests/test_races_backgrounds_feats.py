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
