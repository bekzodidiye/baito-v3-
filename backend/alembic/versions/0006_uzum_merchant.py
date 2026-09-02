"""Orders payable from the Uzum app, and Uzum's side of each payment

Two tables rather than one. A PaymentOrder is what a customer types the number
of, and it can be attempted more than once — reversed by mistake, then paid
again. Each attempt is a UzumTransaction, keyed by the identifier Uzum gives
it, which is what makes a repeated /create answer 10010 rather than creating a
second row.

Revision ID: 0006_uzum_merchant
Revises: 0005_notif_templates
Create Date: 2026-09-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006_uzum_merchant"
down_revision: Union[str, None] = "0005_notif_templates"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payment_orders",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("orderNumber", sa.String(length=16), nullable=False),
        sa.Column("userId", sa.String(), nullable=False),
        sa.Column("purpose", sa.String(), nullable=False, server_default="deposit"),
        sa.Column("jobId", sa.String(), nullable=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="new"),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["userId"], ["users.id"]),
        sa.ForeignKeyConstraint(["jobId"], ["jobs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payment_orders_id", "payment_orders", ["id"])
    # Unique, because it is the only thing /check has to go on.
    op.create_index("ix_payment_orders_orderNumber", "payment_orders", ["orderNumber"], unique=True)
    op.create_index("ix_payment_orders_userId", "payment_orders", ["userId"])
    op.create_index("ix_payment_orders_jobId", "payment_orders", ["jobId"])
    op.create_index("ix_payment_orders_status", "payment_orders", ["status"])

    op.create_table(
        "uzum_transactions",
        sa.Column("transId", sa.String(), nullable=False),
        sa.Column("orderId", sa.String(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="CREATED"),
        sa.Column("transTime", sa.BigInteger(), nullable=False),
        sa.Column("confirmTime", sa.BigInteger(), nullable=True),
        sa.Column("reverseTime", sa.BigInteger(), nullable=True),
        sa.Column("paymentSource", sa.String(), nullable=True),
        sa.Column("processingReferenceNumber", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("cardType", sa.Integer(), nullable=True),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["orderId"], ["payment_orders.id"]),
        sa.PrimaryKeyConstraint("transId"),
    )
    op.create_index("ix_uzum_transactions_transId", "uzum_transactions", ["transId"])
    op.create_index("ix_uzum_transactions_orderId", "uzum_transactions", ["orderId"])
    # The expiry sweep reads by status and transTime; without this it walks the
    # whole table every minute.
    op.create_index("ix_uzum_transactions_status", "uzum_transactions", ["status"])


def downgrade() -> None:
    op.drop_table("uzum_transactions")
    op.drop_table("payment_orders")
