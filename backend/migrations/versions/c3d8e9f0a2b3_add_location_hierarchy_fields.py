"""add location hierarchy fields

Revision ID: c3d8e9f0a2b3
Revises: b2c7d8e9f0a1
Create Date: 2026-05-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d8e9f0a2b3'
down_revision: Union[str, Sequence[str], None] = 'b2c7d8e9f0a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('locations', sa.Column('parent_location_id', sa.Integer(), nullable=True))
    op.add_column('locations', sa.Column('is_top_level', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('locations', sa.Column('is_unknown', sa.Boolean(), nullable=False, server_default='false'))
    op.create_foreign_key(
        'fk_location_parent',
        'locations', 'locations',
        ['parent_location_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_location_parent', 'locations', type_='foreignkey')
    op.drop_column('locations', 'is_unknown')
    op.drop_column('locations', 'is_top_level')
    op.drop_column('locations', 'parent_location_id')
