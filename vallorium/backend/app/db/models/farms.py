"""Farm reference levels, current plots, and upgrade jobs."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, enum_values
from .enums import UpgradeStatus


class FarmLevel(Base):
    """
    Reference data for one farm type at one completed/target level.

    A row for Wood + level 5 means:
    - production after level 5 is completed
    - base time required to upgrade TO level 5
    """

    __tablename__ = "farm_level"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    farm_resource_type_id: Mapped[int] = mapped_column(
        ForeignKey("resources_types.id"),
        nullable=False,
        index=True,
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    production_per_hour: Mapped[int] = mapped_column(Integer, nullable=False)
    construction_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False)

    farm_resource_type = relationship("ResourcesTypes")
    costs = relationship(
        "FarmLevelCost",
        back_populates="farm_level",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "farm_resource_type_id",
            "level",
            name="uq_farm_resource_level",
        ),
        CheckConstraint("level >= 0", name="ck_farm_level_non_negative"),
        CheckConstraint(
            "production_per_hour >= 0",
            name="ck_farm_production_non_negative",
        ),
        CheckConstraint(
            "construction_time_seconds >= 0",
            name="ck_farm_time_non_negative",
        ),
    )


class FarmLevelCost(Base):
    """Reference resource cost required to upgrade to one farm level."""

    __tablename__ = "farm_level_cost"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    farm_level_id: Mapped[int] = mapped_column(
        ForeignKey("farm_level.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    payment_resource_type_id: Mapped[int] = mapped_column(
        ForeignKey("resources_types.id"),
        nullable=False,
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)

    farm_level = relationship("FarmLevel", back_populates="costs")
    payment_resource_type = relationship("ResourcesTypes")

    __table_args__ = (
        UniqueConstraint(
            "farm_level_id",
            "payment_resource_type_id",
            name="uq_farm_level_cost_resource",
        ),
        CheckConstraint("amount > 0", name="ck_farm_level_cost_positive"),
    )


class VillageFarmPlot(Base):
    """Current completed state of one of a village's resource-field slots."""

    __tablename__ = "village_farm_plots"

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
    farm_number: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    village = relationship("Village", back_populates="farms")
    resource_type = relationship("ResourcesTypes")
    upgrades = relationship(
        "VillageFarmUpgrade",
        back_populates="farm_plot",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "village_id",
            "farm_number",
            name="uq_village_farm_slot",
        ),
        CheckConstraint(
            "farm_number BETWEEN 1 AND 18",
            name="ck_village_farm_slot_range",
        ),
        CheckConstraint(
            "level >= 0",
            name="ck_village_farm_level_non_negative",
        ),
    )


class VillageFarmUpgrade(Base):
    """One queued, running, completed, or cancelled farm upgrade."""

    __tablename__ = "village_farm_upgrade"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    village_farm_plot_id: Mapped[int] = mapped_column(
        ForeignKey("village_farm_plots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_level: Mapped[int] = mapped_column(Integer, nullable=False)
    target_level: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[UpgradeStatus] = mapped_column(
        SAEnum(
            UpgradeStatus,
            values_callable=enum_values,
            native_enum=False,
            length=20,
            name="upgrade_status_enum",
        ),
        nullable=False,
        default=UpgradeStatus.QUEUED,
        index=True,
    )
    queued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completes_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    actual_duration_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    farm_plot = relationship("VillageFarmPlot", back_populates="upgrades")

    __table_args__ = (
        CheckConstraint(
            "from_level >= 0",
            name="ck_farm_upgrade_from_level_non_negative",
        ),
        CheckConstraint(
            "target_level = from_level + 1",
            name="ck_farm_upgrade_next_level",
        ),
        CheckConstraint(
            "actual_duration_seconds >= 0",
            name="ck_farm_upgrade_duration_non_negative",
        ),
        Index(
            "ix_farm_upgrade_plot_status",
            "village_farm_plot_id",
            "status",
        ),
        Index(
            "uq_farm_upgrade_active_per_plot",
            "village_farm_plot_id",
            unique=True,
            postgresql_where=text("status IN ('queued', 'in_progress')"),
        ),
        Index(
            "ix_farm_upgrade_status_completes_at",
            "status",
            "completes_at",
        ),
    )
