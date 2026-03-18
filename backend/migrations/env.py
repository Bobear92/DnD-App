from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Import your Base and all models
from shared.database import Base
from auth.models import User
from gm.campaigns.models import Campaign, CampaignMember
from gm.campaigns.campaign_tools.npcs.models import NPC
from gm.tools.loot_tables.models import LootTable
from players.characters.models import Character
from players.races.models import Race
# Import encyclopedia models
from shared.encyclopedia.bestiary.models import Creature
from shared.encyclopedia.spells.models import Spell
from shared.encyclopedia.items.armor.models import Armor
from shared.encyclopedia.items.weapons.models import Weapon
from shared.encyclopedia.items.adventuring_gear.models import AdventuringGear
from shared.encyclopedia.items.potions.models import Potion
from shared.encyclopedia.items.food_drink.models import FoodDrink
from shared.encyclopedia.items.magic_items.models import MagicItem

# Import database URL
from config import settings

# this is the Alembic Config object
config = context.config

# Set the database URL from your config
config.set_main_option("sqlalchemy.url", settings.database_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate support
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()