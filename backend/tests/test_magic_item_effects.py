"""
Items deep dive T2 — structured effects on magic items (magic_items.effects).

  - TestEffectsRoundTrip: effects written by an admin come back from the list AND detail endpoints (the list uses the
    same response model today; the test pins it), and default to null.
  - TestSeedAuthorsWeaponBonus: seed_items writes the weapon_bonus effect for "Weapon, +1/+2/+3" and null for an item
    with no authored effects.
"""
import seed_items
from shared.encyclopedia.items.magic_items.models import MagicItem
from tests.conftest import _SessionLocal, make_admin
from tests.test_seeding import FakeApi

URL = "/api/encyclopedia/items/magic-items"
BASE = {"name": "Weapon, +1", "item_type": "Weapon", "rarity": "Uncommon", "effect": "You have a +1 bonus."}
EFFECTS = [{"kind": "weapon_bonus", "amount": 1}]


class TestEffectsRoundTrip:
    def test_effects_survive_list_and_detail(self, client):
        h, _ = make_admin(client)
        r = client.post(URL, json={**BASE, "effects": EFFECTS}, headers=h)
        assert r.status_code == 201, r.text
        item_id = r.json()["id"]
        assert client.get(f"{URL}/{item_id}", headers=h).json()["effects"] == EFFECTS
        listed = next(i for i in client.get(URL, headers=h).json() if i["id"] == item_id)
        assert listed["effects"] == EFFECTS

    def test_effects_default_to_null_and_can_be_updated(self, client):
        h, _ = make_admin(client)
        item_id = client.post(URL, json=BASE, headers=h).json()["id"]
        assert client.get(f"{URL}/{item_id}", headers=h).json()["effects"] is None
        client.put(f"{URL}/{item_id}", json={"effects": EFFECTS}, headers=h)
        listed = next(i for i in client.get(URL, headers=h).json() if i["id"] == item_id)
        assert listed["effects"] == EFFECTS


class TestSeedAuthorsWeaponBonus:
    def test_plus_n_weapons_get_their_bonus(self, client):
        names = ["Weapon, +1", "Weapon, +2", "Weapon, +3", "Bag of Holding"]
        routes = {"/api/magic-items": {"results": [{"index": f"i{n}", "name": name} for n, name in enumerate(names)]}}
        for n, name in enumerate(names):
            routes[f"/api/magic-items/i{n}"] = {"name": name, "equipment_category": {"name": "Weapon"},
                                               "rarity": {"name": "Rare"}, "desc": ["text"]}
        db = _SessionLocal()
        try:
            seed_items.seed_magic_items(db, FakeApi(routes), delay=0)
            effects = {m.name: m.effects for m in db.query(MagicItem).all()}
        finally:
            db.close()
        assert effects["Weapon, +1"] == [{"kind": "weapon_bonus", "amount": 1}]
        assert effects["Weapon, +3"] == [{"kind": "weapon_bonus", "amount": 3}]
        assert effects["Bag of Holding"] is None
