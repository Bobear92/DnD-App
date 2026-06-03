"""add currency_type to campaigns

Revision ID: e8f2a1b3c4d6
Revises: d7e1f2a3b4c5
Create Date: 2026-06-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8f2a1b3c4d6'
down_revision: Union[str, Sequence[str], None] = 'd7e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'campaigns',
        sa.Column('currency_type', sa.String(length=20), nullable=False, server_default='standard'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('campaigns', 'currency_type')
