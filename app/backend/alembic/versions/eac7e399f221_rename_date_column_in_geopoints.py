"""rename date column in geopoints

Revision ID: eac7e399f221
Revises: d75d83881038
Create Date: 2026-09-06 16:52:20.524132

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eac7e399f221'
down_revision: Union[str, Sequence[str], None] = 'd75d83881038'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'geopoints',
        'date',
        new_column_name='addition_date',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'geopoints',
        'addition_date',
        new_column_name='date',
    )
