"""add starting_equipment to campaigns

Revision ID: f9a3c2d4e5b7
Revises: e8f2a1b3c4d6
Create Date: 2026-06-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9a3c2d4e5b7'
down_revision: Union[str, Sequence[str], None] = 'e8f2a1b3c4d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'campaigns',
        sa.Column('starting_equipment', sa.String(length=20), nullable=False, server_default='equipment'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('campaigns', 'starting_equipment')
