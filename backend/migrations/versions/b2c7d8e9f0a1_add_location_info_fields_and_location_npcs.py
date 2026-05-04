"""add location info fields and location_npcs table

Revision ID: b2c7d8e9f0a1
Revises: aab0335f1bb8
Create Date: 2026-05-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c7d8e9f0a1'
down_revision: Union[str, Sequence[str], None] = 'aab0335f1bb8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add summary to npcs
    op.add_column('npcs', sa.Column('summary', sa.Text(), nullable=True))

    # Add environment fields to locations
    op.add_column('locations', sa.Column('weather', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('plant_life', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('animal_life', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('terrain', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('climate', sa.Text(), nullable=True))

    # Add lore & culture fields to locations
    op.add_column('locations', sa.Column('history', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('rumors', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('government', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('religion', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('economy', sa.Text(), nullable=True))

    # Add adventure fields to locations
    op.add_column('locations', sa.Column('threats', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('available_services', sa.Text(), nullable=True))
    op.add_column('locations', sa.Column('points_of_interest', sa.Text(), nullable=True))

    # Create location_npcs junction table
    op.create_table(
        'location_npcs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.Column('npc_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['npc_id'], ['npcs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('location_id', 'npc_id', name='uq_location_npc'),
    )
    op.create_index(op.f('ix_location_npcs_id'), 'location_npcs', ['id'], unique=False)
    op.create_index(op.f('ix_location_npcs_location_id'), 'location_npcs', ['location_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_location_npcs_location_id'), table_name='location_npcs')
    op.drop_index(op.f('ix_location_npcs_id'), table_name='location_npcs')
    op.drop_table('location_npcs')

    op.drop_column('locations', 'points_of_interest')
    op.drop_column('locations', 'available_services')
    op.drop_column('locations', 'threats')
    op.drop_column('locations', 'economy')
    op.drop_column('locations', 'religion')
    op.drop_column('locations', 'government')
    op.drop_column('locations', 'rumors')
    op.drop_column('locations', 'history')
    op.drop_column('locations', 'climate')
    op.drop_column('locations', 'terrain')
    op.drop_column('locations', 'animal_life')
    op.drop_column('locations', 'plant_life')
    op.drop_column('locations', 'weather')

    op.drop_column('npcs', 'summary')
