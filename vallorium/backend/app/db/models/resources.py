"""Resource catalog, materialized balances, and transaction ledger."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, enum_values
from .enums import Resource, ResourceTransactionType


class ResourcesTypes(Base):
    __tablename__ = "resources_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[Resource] = mapped_column(
        SAEnum(
            Resource,
            values_callable=enum_values,
            native_enum=False,
            length=20,
            name="resource_enum",
        ),
        unique=True,
        nullable=False,
    )


class VillageResourceStorage(Base):
    """Current materialized resource balance for one village and resource."""

    __tablename__ = "village_resource_storage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    village_id: Mapped[int] = mapped_column(
        ForeignKey("village.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resource_type_id: Mapped[int] = mapped_column(
        ForeignKey("resources_types.id"),
        nullable=False,
    )
    stored_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    production_remainder: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0,
        server_default="0",
    )

    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    village = relationship("Village", back_populates="resource_storage")
    resource_type = relationship("ResourcesTypes")

    __table_args__ = (
        UniqueConstraint(
            "village_id",
            "resource_type_id",
            name="uq_village_resource",
        ),
        CheckConstraint(
            "stored_amount >= 0",
            name="ck_village_resource_non_negative",
        ),
        CheckConstraint(
            "production_remainder >= 0 AND production_remainder < 3600000000",
            name="ck_village_resource_remainder",
        ),
    )


class VillageResourceTransaction(Base):
    """
    One logical resource-changing operation.

    Examples: one farm upgrade, one building upgrade, one market transfer.
    The per-resource deltas are stored in VillageResourceTransactionEntry.
    """

    __tablename__ = "village_resource_transaction"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    village_id: Mapped[int] = mapped_column(
        ForeignKey("village.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    transaction_type: Mapped[ResourceTransactionType] = mapped_column(
        SAEnum(
            ResourceTransactionType,
            values_callable=enum_values,
            native_enum=False,
            length=40,
            name="resource_transaction_type_enum",
        ),
        nullable=False,
        index=True,
    )

    # Generic correlation to the game operation that caused the resource change.
    # Example: source_type="village_farm_upgrade", source_id=123.
    source_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Protects POST retries/double clicks. Generate this in the application.
    idempotency_key: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    village = relationship("Village", back_populates="resource_transactions")
    entries = relationship(
        "VillageResourceTransactionEntry",
        back_populates="transaction",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "village_id",
            "idempotency_key",
            name="uq_village_resource_transaction_idempotency",
        ),
        Index(
            "ix_resource_transaction_source",
            "source_type",
            "source_id",
        ),
    )


class VillageResourceTransactionEntry(Base):
    """One resource delta within a ledger transaction."""

    __tablename__ = "village_resource_transaction_entry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("village_resource_transaction.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resource_type_id: Mapped[int] = mapped_column(
        ForeignKey("resources_types.id"),
        nullable=False,
    )

    # Negative means spent; positive means received.
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_before: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)

    transaction = relationship(
        "VillageResourceTransaction",
        back_populates="entries",
    )
    resource_type = relationship("ResourcesTypes")

    __table_args__ = (
        UniqueConstraint(
            "transaction_id",
            "resource_type_id",
            name="uq_resource_transaction_entry_resource",
        ),
        CheckConstraint(
            "delta <> 0",
            name="ck_resource_transaction_delta_non_zero",
        ),
        CheckConstraint(
            "balance_before >= 0",
            name="ck_resource_transaction_before_non_negative",
        ),
        CheckConstraint(
            "balance_after >= 0",
            name="ck_resource_transaction_after_non_negative",
        ),
        CheckConstraint(
            "balance_after = balance_before + delta",
            name="ck_resource_transaction_balance_math",
        ),
    )
