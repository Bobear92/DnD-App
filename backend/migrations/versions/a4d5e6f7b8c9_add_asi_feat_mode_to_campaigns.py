"""add asi_feat_mode to campaigns

Revision ID: a4d5e6f7b8c9
Revises: f9a3c2d4e5b7
Create Date: 2026-06-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4d5e6f7b8c9'
down_revision: Union[str, Sequence[str], None] = 'f9a3c2d4e5b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'campaigns',
        sa.Column('asi_feat_mode', sa.String(length=20), nullable=False, server_default='asi_or_feat'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('campaigns', 'asi_feat_mode')
