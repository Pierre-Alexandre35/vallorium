"""Building catalog, storage capacities, current slots, and upgrade jobs."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
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
from .enums import UpgradeStatus


class BuildingType(Base):
    __tablename__ = "building_type"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tribe_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tribe_attributes.id"),
        nullable=True,
    )

    tribe = relationship("TribeAttributes")
    levels = relationship(
        "BuildingLevel",
        back_populates="building_type",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "name",
            "tribe_id",
            name="uq_building_type_name_tribe",
        ),
    )


class BuildingLevel(Base):
    """Reference data for upgrading a building type TO a specific level."""

    __tablename__ = "building_level"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    building_type_id: Mapped[int] = mapped_column(
        ForeignKey("building_type.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    construction_time_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    population_increase: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    building_type = relationship("BuildingType", back_populates="levels")
    costs = relationship(
        "BuildingLevelCost",
        back_populates="building_level",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    prerequisites = relationship(
        "BuildingPrerequisite",
        back_populates="building_level",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "building_type_id",
            "level",
            name="uq_building_type_level",
        ),
        CheckConstraint("level >= 1", name="ck_building_level_positive"),
        CheckConstraint(
            "construction_time_seconds >= 0",
            name="ck_building_time_non_negative",
        ),
        CheckConstraint(
            "population_increase >= 0",
            name="ck_building_population_non_negative",
        ),
    )


class BuildingLevelCost(Base):
    """Reference resource cost required to upgrade to one building level."""

    __tablename__ = "building_level_cost"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    building_level_id: Mapped[int] = mapped_column(
        ForeignKey("building_level.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    payment_resource_type_id: Mapped[int] = mapped_column(
        ForeignKey("resources_types.id"),
        nullable=False,
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)

    building_level = relationship("BuildingLevel", back_populates="costs")
    payment_resource_type = relationship("ResourcesTypes")

    __table_args__ = (
        UniqueConstraint(
            "building_level_id",
            "payment_resource_type_id",
            name="uq_building_level_cost_resource",
        ),
        CheckConstraint("amount > 0", name="ck_building_level_cost_positive"),
    )


class BuildingPrerequisite(Base):
    __tablename__ = "building_prerequisite"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    building_level_id: Mapped[int] = mapped_column(
        ForeignKey("building_level.id", ondelete="CASCADE"),
        nullable=False,
    )
    required_building_type_id: Mapped[int] = mapped_column(
        ForeignKey("building_type.id"),
        nullable=False,
    )
    required_level: Mapped[int] = mapped_column(Integer, nullable=False)

    building_level = relationship("BuildingLevel", back_populates="prerequisites")
    required_building_type = relationship("BuildingType")

    __table_args__ = (
        UniqueConstraint(
            "building_level_id",
            "required_building_type_id",
            name="uq_building_level_requirement",
        ),
        CheckConstraint(
            "required_level >= 1",
            name="ck_building_prerequisite_level_positive",
        ),
    )


class GranaryCapacity(Base):
    __tablename__ = "granary_capacity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("level >= 0", name="ck_granary_level_non_negative"),
        CheckConstraint("capacity >= 0", name="ck_granary_capacity_non_negative"),
    )


class WarehouseCapacity(Base):
    __tablename__ = "warehouse_capacity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("level >= 0", name="ck_warehouse_level_non_negative"),
        CheckConstraint("capacity >= 0", name="ck_warehouse_capacity_non_negative"),
    )


class VillageBuilding(Base):
    """Current completed state of one village building slot."""

    __tablename__ = "village_building"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    village_id: Mapped[int] = mapped_column(
        ForeignKey("village.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    building_type_id: Mapped[int] = mapped_column(
        ForeignKey("building_type.id"),
        nullable=False,
    )
    slot_number: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    village = relationship("Village", back_populates="buildings")
    building_type = relationship("BuildingType")
    upgrades = relationship(
        "VillageBuildingUpgrade",
        back_populates="village_building",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "village_id",
            "slot_number",
            name="uq_village_building_slot",
        ),
        CheckConstraint(
            "slot_number >= 1",
            name="ck_village_building_slot_positive",
        ),
        CheckConstraint(
            "level >= 0",
            name="ck_village_building_level_non_negative",
        ),
    )


class VillageBuildingUpgrade(Base):
    """One queued, running, completed, or cancelled building upgrade."""

    __tablename__ = "village_building_upgrade"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    village_building_id: Mapped[int] = mapped_column(
        ForeignKey("village_building.id", ondelete="CASCADE"),
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
            name="building_upgrade_status_enum",
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

    village_building = relationship("VillageBuilding", back_populates="upgrades")

    __table_args__ = (
        CheckConstraint(
            "from_level >= 0",
            name="ck_building_upgrade_from_level_non_negative",
        ),
        CheckConstraint(
            "target_level = from_level + 1",
            name="ck_building_upgrade_next_level",
        ),
        CheckConstraint(
            "actual_duration_seconds >= 0",
            name="ck_building_upgrade_duration_non_negative",
        ),
        Index(
            "ix_building_upgrade_target_status",
            "village_building_id",
            "status",
        ),
    )
