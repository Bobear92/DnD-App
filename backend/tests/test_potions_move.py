"""
Items deep dive T1 — potions live only under Potions.

  - TestSeedRoutesPotions: seed_items puts an API potion-category record into Potions (not Magic Items), and skips a
    name that has a curated POTIONS row (the curated text wins and the row settles on re-run).
  - TestMovePotionsMigration (ebff797e3878): system potion rows leave magic_items, each has a Potions row, an owned
    potion is re-pointed (uid/quantity kept, magic-only keys dropped), real magic items and campaign homebrew are
    untouched, and a re-run is a no-op.
"""
import importlib.util
from pathlib import Path

import seed_items
from shared.encyclopedia.items.magic_items.models import MagicItem
from shared.encyclopedia.items.potions.models import Potion
from shared.enums import OwnerType
from shared.seeding import CREATED, UNCHANGED
from tests.conftest import _SessionLocal, make_user, make_campaign
from tests.test_characters import make_character
from tests.test_seeding import FakeApi

_MIGRATION = Path(__file__).resolve().parents[1] / "migrations" / "versions" / \
    "ebff797e3878_move_potion_magic_items_into_potions.py"
_spec = importlib.util.spec_from_file_location("move_potions_migration", _MIGRATION)
migration = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(migration)


def _api(*records):
    routes = {"/api/magic-items": {"results": [{"index": r["index"], "name": r["name"]} for r in records]}}
    for r in records:
        routes[f"/api/magic-items/{r['index']}"] = {
            "name": r["name"], "equipment_category": {"index": r["cat"].lower(), "name": r["cat"]},
            "rarity": {"name": "Rare"}, "desc": [f"{r['name']} text."],
        }
    return FakeApi(routes)


class TestSeedRoutesPotions:
    def test_api_potion_goes_to_potions_and_a_real_magic_item_stays(self, client):
        api = _api({"index": "pof", "name": "Potion of Flying", "cat": "Potion"},
                   {"index": "bag", "name": "Bag of Holding", "cat": "Wondrous Items"})
        seed_items.seed_magic_items(db := _SessionLocal(), api, delay=0)
        try:
            assert db.query(MagicItem).filter_by(name="Potion of Flying").count() == 0
            assert db.query(MagicItem).filter_by(name="Bag of Holding").count() == 1
            flying = db.query(Potion).filter_by(name="Potion of Flying", owner_type=OwnerType.system).one()
            assert flying.effect == "Potion of Flying text." and flying.rarity == "Rare"
            assert seed_items.seed_magic_items(db, api, delay=0)[UNCHANGED] == 2  # settles
        finally:
            db.close()

    def test_a_curated_potion_is_not_overwritten_by_the_api(self, client):
        db = _SessionLocal()
        try:
            seed_items.seed_curated(db)
            counts = seed_items.seed_magic_items(db, _api({"index": "poh", "name": "Potion of Healing", "cat": "Potion"}),
                                                 delay=0)
            assert counts["skipped"] == 1 and counts[CREATED] == 0
            healing = db.query(Potion).filter_by(name="Potion of Healing").one()
            assert healing.effect.startswith("You regain 2d4 + 2")
            assert db.query(MagicItem).count() == 0
        finally:
            db.close()


class TestMovePotionsMigration:
    def _setup(self, client):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        char_id = make_character(client, h, cid)
        with _SessionLocal() as db:
            sys_flying = MagicItem(name="Potion of Flying", item_type="Potion", rarity="Very Rare",
                                   attunement_required=False, effect="You fly.", owner_type=OwnerType.system)
            sys_healing = MagicItem(name="Potion of Healing", item_type="Potion", rarity="Common",
                                    attunement_required=False, effect="API healing.", owner_type=OwnerType.system)
            bag = MagicItem(name="Bag of Holding", item_type="Wondrous Items", rarity="Uncommon",
                            attunement_required=False, effect="Big bag.", owner_type=OwnerType.system)
            homebrew = MagicItem(name="Potion of Flying", item_type="Potion", rarity="Rare",
                                 attunement_required=False, effect="Our flying.", owner_type=OwnerType.campaign,
                                 owner_id=cid)
            curated = Potion(name="Potion of Healing", rarity="Common", effect="Curated healing.",
                             duration="Instantaneous", cost="50 gp", weight="0.5 lb.", owner_type=OwnerType.system)
            db.add_all([sys_flying, sys_healing, bag, homebrew, curated])
            db.commit()
            ids = {"flying": sys_flying.id, "bag": bag.id, "homebrew": homebrew.id, "curated": curated.id}
        inventory = [
            {"uid": "u-fly", "category": "magic-items", "source_id": ids["flying"], "name": "Potion of Flying",
             "item_type": "Potion", "attunement_required": False, "quantity": 3, "equipped": False, "attuned": True},
            {"uid": "u-heal", "category": "magic-items", "source_id": None, "name": "Potion of Healing",
             "item_type": "Potion", "quantity": 2, "equipped": False, "attuned": False},
            {"uid": "u-bag", "category": "magic-items", "source_id": ids["bag"], "name": "Bag of Holding",
             "item_type": "Wondrous Items", "quantity": 1, "equipped": False, "attuned": False},
            {"uid": "u-brew", "category": "magic-items", "source_id": ids["homebrew"], "name": "Potion of Flying",
             "item_type": "Potion", "quantity": 1, "equipped": False, "attuned": False},
        ]
        r = client.put(f"/api/characters/{char_id}", json={"character_data": {"inventory": inventory}}, headers=h)
        assert r.status_code == 200, r.text
        return h, char_id, ids

    def _run(self):
        with _SessionLocal() as db:
            result = migration.move_potions(db.connection())
            db.commit()
        return result

    def test_moves_rows_and_owned_potions(self, client):
        h, char_id, ids = self._setup(client)
        result = self._run()
        assert result == {"potions_created": 1, "entries_moved": 2, "magic_rows_deleted": 2}

        with _SessionLocal() as db:
            system_magic = db.query(MagicItem).filter_by(owner_type=OwnerType.system).all()
            assert [m.name for m in system_magic] == ["Bag of Holding"]
            assert db.query(MagicItem).filter_by(owner_type=OwnerType.campaign).count() == 1  # homebrew kept
            flying = db.query(Potion).filter_by(name="Potion of Flying", owner_type=OwnerType.system).one()
            assert flying.effect == "You fly." and flying.rarity == "Very Rare"
            healing = db.query(Potion).filter_by(name="Potion of Healing").all()
            assert len(healing) == 1 and healing[0].effect == "Curated healing."  # curated row kept, not duplicated

        inv = {e["uid"]: e for e in client.get(f"/api/characters/{char_id}", headers=h).json()["character_data"]["inventory"]}
        fly = inv["u-fly"]
        assert fly["category"] == "potions" and fly["source_id"] == flying.id and fly["quantity"] == 3
        assert fly["attuned"] is False and "item_type" not in fly and "attunement_required" not in fly
        assert inv["u-heal"]["category"] == "potions" and inv["u-heal"]["source_id"] == ids["curated"]
        assert inv["u-heal"]["duration"] == "Instantaneous"
        assert inv["u-bag"]["category"] == "magic-items" and inv["u-bag"]["source_id"] == ids["bag"]
        assert inv["u-brew"]["category"] == "magic-items" and inv["u-brew"]["source_id"] == ids["homebrew"]

    def test_rerun_is_a_no_op(self, client):
        h, char_id, _ = self._setup(client)
        self._run()
        before = client.get(f"/api/characters/{char_id}", headers=h).json()["character_data"]["inventory"]
        assert self._run() == {"potions_created": 0, "entries_moved": 0, "magic_rows_deleted": 0}
        assert client.get(f"/api/characters/{char_id}", headers=h).json()["character_data"]["inventory"] == before
