from tests.conftest import make_user, make_admin, make_campaign, invite_player

LOOT_ITEMS = {"currency": {"gp": 10}, "items": [{"name": "Healing Potion", "quantity": 1}]}


def system_payload(name="System Table"):
    return {"name": name, "owner_type": "system", "owner_id": None, "loot_items": LOOT_ITEMS}


def campaign_payload(campaign_id, name="Campaign Table"):
    return {"name": name, "owner_type": "campaign", "owner_id": campaign_id, "loot_items": LOOT_ITEMS}


def make_system_table(client, admin_headers, name="System Table"):
    resp = client.post("/api/gm/tools/loot-tables", json=system_payload(name), headers=admin_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def make_campaign_table(client, gm_headers, campaign_id, name="Campaign Table"):
    resp = client.post("/api/gm/tools/loot-tables", json=campaign_payload(campaign_id, name), headers=gm_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


class TestCreateLootTable:
    def test_admin_can_create_system_table(self, client):
        admin_h, _ = make_admin(client)
        resp = client.post("/api/gm/tools/loot-tables", json=system_payload(), headers=admin_h)
        assert resp.status_code == 201
        assert resp.json()["owner_type"] == "system"

    def test_non_admin_cannot_create_system_table(self, client):
        h, _ = make_user(client, 1)
        resp = client.post("/api/gm/tools/loot-tables", json=system_payload(), headers=h)
        assert resp.status_code == 403

    def test_gm_can_create_campaign_table(self, client):
        h, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h)
        resp = client.post(
            "/api/gm/tools/loot-tables",
            json=campaign_payload(campaign_id),
            headers=h,
        )
        assert resp.status_code == 201
        assert resp.json()["owner_type"] == "campaign"

    def test_non_gm_cannot_create_campaign_table(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)

        resp = client.post(
            "/api/gm/tools/loot-tables",
            json=campaign_payload(campaign_id),
            headers=h_player,
        )
        assert resp.status_code == 403

    def test_campaign_table_requires_owner_id(self, client):
        h, _ = make_user(client, 1)
        payload = {"name": "Bad Table", "owner_type": "campaign", "owner_id": None, "loot_items": LOOT_ITEMS}
        resp = client.post("/api/gm/tools/loot-tables", json=payload, headers=h)
        assert resp.status_code == 400


class TestListLootTables:
    def test_authenticated_user_can_list(self, client):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        make_system_table(client, admin_h, "Table A")
        make_system_table(client, admin_h, "Table B")

        resp = client.get("/api/gm/tools/loot-tables", headers=h)
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    def test_user_sees_system_and_own_campaign_tables(self, client):
        admin_h, _ = make_admin(client)
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)

        make_system_table(client, admin_h)
        make_campaign_table(client, h_gm, campaign_id)

        # GM sees both system and their campaign table
        resp_gm = client.get("/api/gm/tools/loot-tables", headers=h_gm).json()
        assert len(resp_gm) == 2

        # Other user only sees system table
        resp_other = client.get("/api/gm/tools/loot-tables", headers=h_other).json()
        assert len(resp_other) == 1
        assert resp_other[0]["owner_type"] == "system"


class TestGetLootTable:
    def test_any_member_can_get_system_table(self, client):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        table_id = make_system_table(client, admin_h)

        resp = client.get(f"/api/gm/tools/loot-tables/{table_id}", headers=h)
        assert resp.status_code == 200

    def test_campaign_member_can_get_campaign_table(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        table_id = make_campaign_table(client, h_gm, campaign_id)

        resp = client.get(f"/api/gm/tools/loot-tables/{table_id}", headers=h_player)
        assert resp.status_code == 200

    def test_non_member_cannot_get_campaign_table(self, client):
        h_gm, _ = make_user(client, 1)
        h_other, _ = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        table_id = make_campaign_table(client, h_gm, campaign_id)

        resp = client.get(f"/api/gm/tools/loot-tables/{table_id}", headers=h_other)
        assert resp.status_code == 403


class TestUpdateLootTable:
    def test_admin_can_update_system_table(self, client):
        admin_h, _ = make_admin(client)
        table_id = make_system_table(client, admin_h)

        resp = client.put(f"/api/gm/tools/loot-tables/{table_id}", json={"name": "Renamed"}, headers=admin_h)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"

    def test_non_admin_cannot_update_system_table(self, client):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        table_id = make_system_table(client, admin_h)

        resp = client.put(f"/api/gm/tools/loot-tables/{table_id}", json={"name": "Hacked"}, headers=h)
        assert resp.status_code == 403

    def test_gm_can_update_campaign_table(self, client):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)
        table_id = make_campaign_table(client, h_gm, campaign_id)

        resp = client.put(f"/api/gm/tools/loot-tables/{table_id}", json={"name": "Renamed"}, headers=h_gm)
        assert resp.status_code == 200

    def test_non_gm_cannot_update_campaign_table(self, client):
        h_gm, _ = make_user(client, 1)
        h_player, uid_player = make_user(client, 2)
        campaign_id = make_campaign(client, h_gm)
        invite_player(client, h_gm, campaign_id, uid_player)
        table_id = make_campaign_table(client, h_gm, campaign_id)

        resp = client.put(f"/api/gm/tools/loot-tables/{table_id}", json={"name": "Hacked"}, headers=h_player)
        assert resp.status_code == 403


class TestDeleteLootTable:
    def test_admin_can_delete_system_table(self, client):
        admin_h, _ = make_admin(client)
        table_id = make_system_table(client, admin_h)

        resp = client.delete(f"/api/gm/tools/loot-tables/{table_id}", headers=admin_h)
        assert resp.status_code == 200

    def test_gm_can_delete_campaign_table(self, client):
        h_gm, _ = make_user(client, 1)
        campaign_id = make_campaign(client, h_gm)
        table_id = make_campaign_table(client, h_gm, campaign_id)

        resp = client.delete(f"/api/gm/tools/loot-tables/{table_id}", headers=h_gm)
        assert resp.status_code == 200

    def test_non_admin_cannot_delete_system_table(self, client):
        admin_h, _ = make_admin(client)
        h, _ = make_user(client, 1)
        table_id = make_system_table(client, admin_h)

        resp = client.delete(f"/api/gm/tools/loot-tables/{table_id}", headers=h)
        assert resp.status_code == 403
