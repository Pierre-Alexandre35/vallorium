"""Preserve fractional resource production."""

import sqlalchemy as sa
from alembic import op

revision = "a82ce941b302"
down_revision = "4c7ce0d9ff50"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "village_resource_storage",
        sa.Column(
            "production_remainder", sa.BigInteger(), nullable=False, server_default="0"
        ),
    )
    op.create_check_constraint(
        "ck_village_resource_remainder",
        "village_resource_storage",
        "production_remainder >= 0 AND production_remainder < 3600000000",
    )


def downgrade():
    op.drop_constraint(
        "ck_village_resource_remainder", "village_resource_storage", type_="check"
    )
    op.drop_column("village_resource_storage", "production_remainder")
