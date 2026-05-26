"""add character_classes and class_features tables

Revision ID: b3c4d5e6f7a8
Revises: 10eb538c7998
Create Date: 2026-05-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM as PGEnum


revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, Sequence[str], None] = '10eb538c7998'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'character_classes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('edition', sa.String(10), nullable=False),
        sa.Column('flavor_text', sa.Text(), nullable=False),
        sa.Column('hit_die', sa.Integer(), nullable=False),
        sa.Column('primary_ability', sa.String(100), nullable=False),
        sa.Column('spellcasting_ability', sa.String(50), nullable=True),
        sa.Column('saving_throws', sa.JSON(), nullable=False),
        sa.Column('armor_proficiencies', sa.JSON(), nullable=False),
        sa.Column('weapon_proficiencies', sa.JSON(), nullable=False),
        sa.Column('tool_proficiencies', sa.JSON(), nullable=False),
        sa.Column('skill_count', sa.Integer(), nullable=False),
        sa.Column('skills_available', sa.JSON(), nullable=False),
        sa.Column('owner_type', PGEnum('system', 'campaign', name='ownertype', create_type=False), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_character_classes_id', 'character_classes', ['id'])
    op.create_index('ix_character_classes_name', 'character_classes', ['name'])

    op.create_table(
        'class_features',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('feature_name', sa.String(200), nullable=False),
        sa.Column('feature_description', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['class_id'], ['character_classes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_class_features_id', 'class_features', ['id'])
    op.create_index('ix_class_features_class_id', 'class_features', ['class_id'])


def downgrade() -> None:
    op.drop_index('ix_class_features_class_id', table_name='class_features')
    op.drop_index('ix_class_features_id', table_name='class_features')
    op.drop_table('class_features')
    op.drop_index('ix_character_classes_name', table_name='character_classes')
    op.drop_index('ix_character_classes_id', table_name='character_classes')
    op.drop_table('character_classes')
