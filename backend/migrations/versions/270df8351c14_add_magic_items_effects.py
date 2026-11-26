"""add magic_items effects

Revision ID: 270df8351c14
Revises: ebff797e3878
Create Date: 2026-11-25

Items deep dive T2: structured effects on magic items (nullable JSON, additive). The three "+N weapon" system rows
get their effect here too, so a database seeded before this migration works without re-running seed_items.py
(which writes the same values — seed_items.MAGIC_ITEM_EFFECTS is the source of truth from now on).
"""
import json
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = '270df8351c14'
down_revision: Union[str, Sequence[str], None] = 'ebff797e3878'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

WEAPON_BONUS = {"Weapon, +1": 1, "Weapon, +2": 2, "Weapon, +3": 3}


def upgrade() -> None:
    op.add_column('magic_items', sa.Column('effects', sa.JSON(), nullable=True))
    conn = op.get_bind()
    for name, amount in WEAPON_BONUS.items():
        # Only system rows, and only where nothing is authored yet — a re-run or a GM's homebrew is never touched.
        conn.execute(sa.text(
            "UPDATE magic_items SET effects = CAST(:e AS json) "
            "WHERE name = :n AND owner_type = 'system' AND effects IS NULL"
        ), {"e": json.dumps([{"kind": "weapon_bonus", "amount": amount}]), "n": name})


def downgrade() -> None:
    op.drop_column('magic_items', 'effects')
