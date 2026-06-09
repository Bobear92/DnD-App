"""add effects to feats

Revision ID: b5e6f7a8c9d0
Revises: a4d5e6f7b8c9
Create Date: 2026-06-08 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5e6f7a8c9d0'
down_revision: Union[str, Sequence[str], None] = 'a4d5e6f7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('feats', sa.Column('effects', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('feats', 'effects')
