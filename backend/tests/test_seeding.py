"""Seed scripts UPSERT system rows — deploy ticket T5b.

The seed files are the source of truth for the base compendium: re-running a seed must bring an
existing row in line with the file, or a corrected spell/item/class never reaches a database seeded
before the fix (production). Only owner_type=system rows are matched, so campaign overrides survive.

The scripts open their own SessionLocal, which conftest points at the test database. The network
seeds (spells, items) are driven by a fake API client.
"""
import pytest

import seed_classes
import seed_data
import seed_items
import seed_phb_spells
import seed_spells
import seed_starting_items
from players.classes.models import CharacterClass
from shared.database import SessionLocal
from shared.encyclopedia.items.adventuring_gear.models import AdventuringGear
from shared.encyclopedia.items.weapons.models import Weapon
from shared.encyclopedia.spells.models import Spell
from shared.enums import OwnerType
from shared.seeding import CREATED, NOT_OWNED, UNCHANGED, UPDATED, upsert_system_row
from tests.conftest import make_campaign, make_user


@pytest.fixture
def db(client):  # `client` first: it resets the test schema between tests
    session = SessionLocal()
    yield session
    session.close()


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        if self.payload is None:
            raise RuntimeError("404")

    def json(self):
        return self.payload


class FakeApi:
    """Answers GETs from a {path: payload} dict, matching on the URL's path."""

    def __init__(self, routes):
        self.routes = routes

    def get(self, url, timeout=None):
        path = url.split("dnd5eapi.co", 1)[-1]
        return FakeResponse(self.routes.get(path))


def _spell(name, desc="Old text.", classes=("Wizard",)):
    return {"name": name, "level": 1, "school": {"name": "Evocation"}, "casting_time": "1 action",
            "range": "60 feet", "components": ["V", "S"], "duration": "Instantaneous", "desc": [desc],
            "higher_level": [], "ritual": False, "concentration": False,
            "classes": [{"name": c} for c in classes]}


def _spell_api(*spells):
    routes = {"/api/spells": {"results": [{"index": s["name"].lower().replace(" ", "-"), "name": s["name"]} for s in spells]}}
    for s in spells:
        routes[f"/api/spells/{s['name'].lower().replace(' ', '-')}"] = s
    return FakeApi(routes)


def _system(db, model, name):
    db.expire_all()
    return db.query(model).filter(model.name == name, model.owner_type == OwnerType.system).all()


class TestUpsertHelper:
    def test_create_update_unchanged(self, db):
        match = {"name": "Spark", "edition": "5e"}
        base = {"level": 0, "school": "Evocation", "casting_time": "1 action", "range": "30 feet",
                "components": "V", "duration": "Instantaneous", "description": "v1", "classes": "Wizard"}
        assert upsert_system_row(db, Spell, match, base)[1] == CREATED
        db.commit()
        assert upsert_system_row(db, Spell, match, base)[1] == UNCHANGED
        assert upsert_system_row(db, Spell, match, {**base, "description": "v2"})[1] == UPDATED
        db.commit()
        rows = _system(db, Spell, "Spark")
        assert len(rows) == 1 and rows[0].description == "v2"

    def test_never_touches_a_campaign_row_with_the_same_name(self, client, db):
        h, _ = make_user(client, 1)
        cid = make_campaign(client, h)
        db.add(Spell(name="Spark", edition="5e", level=0, school="Evocation", casting_time="1 action",
                     range="30 feet", components="V", duration="Instantaneous", description="GM homebrew",
                     classes="Wizard", owner_type=OwnerType.campaign, owner_id=cid))
        db.commit()
        _, status = upsert_system_row(db, Spell, {"name": "Spark", "edition": "5e"},
                                      {"level": 0, "school": "Evocation", "casting_time": "1 action", "range": "30 feet",
                                       "components": "V", "duration": "Instantaneous", "description": "SRD",
                                       "classes": "Wizard"})
        db.commit()
        assert status == CREATED  # a separate system row, not the campaign one
        db.expire_all()
        override = db.query(Spell).filter_by(name="Spark", owner_type=OwnerType.campaign).one()
        assert override.description == "GM homebrew"

    def test_owns_false_leaves_the_row_alone(self, db):
        upsert_system_row(db, AdventuringGear, {"name": "Rope"},
                          {"category": "Standard Gear", "cost": "1 gp", "weight": "10 lb.", "description": "srd"})
        db.commit()
        _, status = upsert_system_row(db, AdventuringGear, {"name": "Rope"},
                                      {"category": "Gear", "cost": "1 gp", "weight": "10 lb.", "description": "mine"},
                                      owns=lambda r: r.category == "Gear")
        assert status == NOT_OWNED
        assert _system(db, AdventuringGear, "Rope")[0].description == "srd"


class TestSeedSpells:
    def test_rerun_updates_text_without_duplicating(self, db):
        seed_spells.seed_spells(client=_spell_api(_spell("Magic Missile")), delay=0)
        counts = seed_spells.seed_spells(client=_spell_api(_spell("Magic Missile", desc="Fixed text.")), delay=0)
        assert counts[UPDATED] == 1
        rows = _system(db, Spell, "Magic Missile")
        assert len(rows) == 1 and rows[0].description == "Fixed text."

    def test_artificer_tag_is_applied_and_survives_a_rerun(self, db):
        api = _spell_api(_spell("Cure Wounds", classes=("Cleric",)))
        seed_spells.seed_spells(client=api, delay=0)
        assert _system(db, Spell, "Cure Wounds")[0].classes == "Cleric, Artificer"
        assert seed_spells.seed_spells(client=api, delay=0)[UNCHANGED] == 1  # no flip-flop


class TestSeedPhbSpells:
    def test_rerun_restores_drifted_text(self, db):
        seed_phb_spells.seed_phb_spells()
        name = seed_phb_spells.PHB_SPELLS[0]["name"]
        row = db.query(Spell).filter_by(name=name, edition=seed_phb_spells.PHB_SPELLS[0]["edition"],
                                        owner_type=OwnerType.system).one()
        row.description = "stale"
        db.commit()
        counts = seed_phb_spells.seed_phb_spells()
        assert counts[UPDATED] == 1 and counts[UNCHANGED] == len(seed_phb_spells.PHB_SPELLS) - 1
        db.expire_all()
        assert row.description == seed_phb_spells.PHB_SPELLS[0]["description"]


class TestSeedClasses:
    def test_rerun_restores_columns_and_rebuilds_features(self, db):
        seed_classes.seed()
        fighter = db.query(CharacterClass).filter_by(name="Fighter", edition="5e", owner_type=OwnerType.system).one()
        fighter_id, n_features = fighter.id, len(fighter.features)
        fighter.hit_die = 4
        fighter.features[0].feature_description = "stale"
        db.delete(fighter.features[-1])
        db.commit()

        counts = seed_classes.seed()
        assert counts[UPDATED] == 1
        db.expire_all()
        fighter = db.get(CharacterClass, fighter_id)  # same row, updated in place
        assert fighter.hit_die == 10
        assert len(fighter.features) == n_features
        assert fighter.features[0].feature_description != "stale"
        assert seed_classes.seed()[UPDATED] == 0  # a clean re-run changes nothing


class TestSeedItems:
    def _equipment(self, weight):
        return FakeApi({
            "/api/equipment": {"results": [{"index": "dagger"}, {"index": "rope"}]},
            "/api/equipment/dagger": {"name": "Dagger", "equipment_category": {"index": "weapon"},
                                      "weapon_category": "Simple", "weapon_range": "Melee",
                                      "damage": {"damage_dice": "1d4", "damage_type": {"name": "Piercing"}},
                                      "properties": [{"name": "Finesse"}, {"name": "Thrown"}],
                                      "throw_range": {"normal": 20, "long": 60},
                                      "cost": {"quantity": 2, "unit": "gp"}, "weight": weight, "desc": []},
            "/api/equipment/rope": {"name": "Rope, hempen (50 feet)", "equipment_category": {"index": "adventuring-gear"},
                                    "gear_category": {"name": "Standard Gear"}, "cost": {"quantity": 1, "unit": "gp"},
                                    "weight": 10, "desc": ["Rope."]},
        })

    def test_equipment_rerun_updates_in_place(self, db):
        seed_items.seed_equipment(db, self._equipment(weight=1), delay=0)
        counts = seed_items.seed_equipment(db, self._equipment(weight=2), delay=0)
        assert counts[UPDATED] == 1 and counts[UNCHANGED] == 1
        daggers = _system(db, Weapon, "Dagger")
        assert len(daggers) == 1 and daggers[0].weight == seed_items._weight({"weight": 2})

    def test_a_name_listed_twice_by_the_api_settles_instead_of_flip_flopping(self, db):
        # The real API lists "Potion of Healing" twice; without first-wins, every run rewrote the row.
        def potion(rarity):
            return {"name": "Potion of Healing", "equipment_category": {"name": "Potion"},
                    "rarity": {"name": rarity}, "desc": [f"{rarity} healing."]}
        api = FakeApi({
            "/api/magic-items": {"results": [{"index": "poh", "name": "Potion of Healing"},
                                             {"index": "poh-common", "name": "Potion of Healing"}]},
            "/api/magic-items/poh": potion("Uncommon"),
            "/api/magic-items/poh-common": potion("Common"),
        })
        seed_items.seed_magic_items(db, api, delay=0)
        second = seed_items.seed_magic_items(db, api, delay=0)
        assert second[UPDATED] == 0 and second[UNCHANGED] == 1 and second["skipped"] == 1
        from shared.encyclopedia.items.magic_items.models import MagicItem
        assert _system(db, MagicItem, "Potion of Healing")[0].rarity == "Uncommon"  # first record wins

    def test_curated_lists_are_idempotent(self, db):
        first = seed_items.seed_curated(db)
        assert first[CREATED] == len(seed_items.WEAPONS_CURATED) + len(seed_items.POTIONS) + len(seed_items.FOOD_DRINK)
        assert seed_items.seed_curated(db)[UNCHANGED] == first[CREATED]


class TestSeedStartingItems:
    def test_srd_rows_with_the_same_name_are_left_to_the_srd_seed(self, db):
        db.add(AdventuringGear(name="Burglar's Pack", category="Equipment Packs", cost="16 gp",
                               weight="44.5 lb.", description="SRD text", owner_type=OwnerType.system))
        db.commit()
        counts = seed_starting_items.main()
        assert counts[NOT_OWNED] == 1
        assert _system(db, AdventuringGear, "Burglar's Pack")[0].description == "SRD text"

    def test_its_own_rows_are_brought_back_in_line(self, db):
        seed_starting_items.main()
        row = _system(db, AdventuringGear, "Thieves' Tools")[0]
        row.cost = "999 gp"
        db.commit()
        assert seed_starting_items.main()[UPDATED] == 1
        assert _system(db, AdventuringGear, "Thieves' Tools")[0].cost == "25 gp"


class TestSeedDataIsDevOnly:
    @pytest.mark.parametrize("url", [
        "postgresql://u:p@dpg-abc123-a.oregon-postgres.render.com/dnd",
        "postgresql://u:p@10.0.0.5:5432/dnd",
    ])
    def test_refuses_a_non_local_database(self, url):
        with pytest.raises(SystemExit, match="DEV ONLY"):
            seed_data.refuse_non_local_database(url)

    @pytest.mark.parametrize("url", ["postgresql://u:p@localhost:5432/dnd", "postgresql://u:p@127.0.0.1/dnd"])
    def test_allows_a_local_database(self, url):
        seed_data.refuse_non_local_database(url)  # no exception
