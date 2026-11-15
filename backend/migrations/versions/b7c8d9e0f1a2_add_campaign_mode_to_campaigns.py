"""add campaign_mode to campaigns

Revision ID: b7c8d9e0f1a2
Revises: 38f389fa8daa
Create Date: 2026-11-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, Sequence[str], None] = '38f389fa8daa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'campaigns',
        sa.Column('campaign_mode', sa.String(length=20), nullable=False, server_default='full'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('campaigns', 'campaign_mode')
