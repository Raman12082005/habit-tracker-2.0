from alembic import op
import sqlalchemy as sa
revision="0002_weekly_focus"
down_revision="0001_initial"
branch_labels=None
depends_on=None
def upgrade():
    op.add_column("users", sa.Column("weekly_focus", sa.String(240), nullable=False, server_default=""))
def downgrade():
    op.drop_column("users","weekly_focus")
