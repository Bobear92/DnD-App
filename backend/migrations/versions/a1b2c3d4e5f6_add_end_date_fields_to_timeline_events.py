"""add end date fields to timeline_events

Revision ID: a1b2c3d4e5f6
Revises: 639a6a3b3cba
Create Date: 2026-05-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '639a6a3b3cba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('timeline_events', sa.Column('end_era_id', sa.Integer(), nullable=True))
    op.add_column('timeline_events', sa.Column('end_year', sa.Integer(), nullable=True))
    op.add_column('timeline_events', sa.Column('end_month_order', sa.Integer(), nullable=True))
    op.add_column('timeline_events', sa.Column('end_day', sa.Integer(), nullable=True))
    op.add_column('timeline_events', sa.Column('end_absolute_year', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_timeline_events_end_era_id',
        'timeline_events', 'calendar_eras',
        ['end_era_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_timeline_events_end_era_id', 'timeline_events', type_='foreignkey')
    op.drop_column('timeline_events', 'end_absolute_year')
    op.drop_column('timeline_events', 'end_day')
    op.drop_column('timeline_events', 'end_month_order')
    op.drop_column('timeline_events', 'end_year')
    op.drop_column('timeline_events', 'end_era_id')
