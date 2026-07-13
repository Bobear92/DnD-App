"""add edition to spells

Revision ID: c1d2e3f4a5b6
Revises: b5e6f7a8c9d0
Create Date: 2026-07-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'b5e6f7a8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'spells',
        sa.Column('edition', sa.String(length=10), nullable=False, server_default='5e'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('spells', 'edition')
