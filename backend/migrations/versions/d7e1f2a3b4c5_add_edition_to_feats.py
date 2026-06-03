"""add edition to feats

Revision ID: d7e1f2a3b4c5
Revises: 4c427d8464d3
Create Date: 2026-06-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7e1f2a3b4c5'
down_revision: Union[str, Sequence[str], None] = '4c427d8464d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'feats',
        sa.Column('edition', sa.String(length=10), nullable=False, server_default='5e'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('feats', 'edition')
