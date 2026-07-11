"""Vallorium SQLAlchemy data model.

TABLE CATEGORIES
----------------
REFERENCE / MASTER DATA
    Stable game catalog and balance configuration. These rows describe what
    resources, tribes, farm levels, building levels, costs, prerequisites, and
    capacities exist. They do not describe a particular player's action.

CORE / WORLD ENTITIES
    Users, map tiles, map layouts, and villages.

CURRENT STATE
    The latest completed state of a village: farm levels, building levels, and
    materialized resource balances.

RUNTIME TRANSACTIONS / JOBS
    Stateful operations with a lifecycle and duration, such as queued or
    running farm/building upgrades.

LEDGER / AUDIT TRANSACTIONS
    Immutable-style history of every discrete resource change. One transaction
    header groups one or more per-resource debit/credit entries.

Use TABLE_CLASSIFICATION at the bottom of this module when you need the exact
category assigned to each database table.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def enum_values(enum_class: type[Enum]) -> list[str]:
    """Persist enum values rather than Python member names."""
    return [str(member.value) for member in enum_class]


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------


class Tribe(str, Enum):
    ROMANS = "Romans"
    TEUTONS = "Teutons"
    GAULS = "Gauls"


class Resource(str, Enum):
    WOOD = "Wood"
    CLAY = "Clay"
    IRON = "Iron"
    CROP = "Crop"


class UpgradeStatus(str, Enum):
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ResourceTransactionType(str, Enum):
    STARTING_RESOURCES = "starting_resources"
    FARM_UPGRADE = "farm_upgrade"
    BUILDING_UPGRADE = "building_upgrade"
    TROOP_TRAINING = "troop_training"
    MARKET_SEND = "market_send"
    MARKET_RECEIVE = "market_receive"
    QUEST_REWARD = "quest_reward"
    RAID_LOOT = "raid_loot"
    REFUND = "refund"
    ADMIN_ADJUSTMENT = "admin_adjustment"


# ---------------------------------------------------------------------------
# TABLE CATEGORY: REFERENCE / MASTER DATA
# ---------------------------------------------------------------------------


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


class TribeAttributes(Base):
    __tablename__ = "tribe_attributes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[Tribe] = mapped_column(
        SAEnum(
            Tribe,
            values_callable=enum_values,
            native_enum=False,
            length=20,
            name="tribe_enum",
        ),
        unique=True,
        nullable=False,
    )
    bonus: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


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


# ---------------------------------------------------------------------------
# TABLE CATEGORY: CORE / WORLD ENTITIES
# ---------------------------------------------------------------------------


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    tribe_id: Mapped[int] = mapped_column(
        ForeignKey("tribe_attributes.id"),
        nullable=False,
    )

    tribe = relationship("TribeAttributes")
    villages = relationship(
        "Village",
        back_populates="owner",
        cascade="all, delete-orphan",
    )


class MapTile(Base):
    __tablename__ = "map_tile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)
    is_constructible: Mapped[bool] = mapped_column(Boolean, nullable=False)

    village = relationship("Village", back_populates="tile", uselist=False)
    resource_layouts = relationship(
        "MapTileResourceLayout",
        back_populates="map_tile",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (UniqueConstraint("x", "y", name="uq_tile_coordinates"),)


class MapTileResourceLayout(Base):
    __tablename__ = "map_tile_resource_layout"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    map_tile_id: Mapped[int] = mapped_column(
        ForeignKey("map_tile.id", ondelete="CASCADE"),
        nullable=False,
    )
    resource_type_id: Mapped[int] = mapped_column(
        ForeignKey("resources_types.id"),
        nullable=False,
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)

    map_tile = relationship("MapTile", back_populates="resource_layouts")
    resource_type = relationship("ResourcesTypes")

    __table_args__ = (
        UniqueConstraint(
            "map_tile_id",
            "resource_type_id",
            name="uq_tile_resource",
        ),
        CheckConstraint("amount > 0", name="ck_tile_resource_amount_positive"),
    )


class Village(Base):
    __tablename__ = "village"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    map_tile_id: Mapped[int] = mapped_column(
        ForeignKey("map_tile.id"),
        unique=True,
        nullable=False,
    )
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"),
        nullable=False,
        index=True,
    )
    population: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    tile = relationship("MapTile", back_populates="village")
    owner = relationship("User", back_populates="villages")
    farms = relationship(
        "VillageFarmPlot",
        back_populates="village",
        cascade="all, delete-orphan",
    )
    buildings = relationship(
        "VillageBuilding",
        back_populates="village",
        cascade="all, delete-orphan",
    )
    resource_storage = relationship(
        "VillageResourceStorage",
        back_populates="village",
        cascade="all, delete-orphan",
    )
    resource_transactions = relationship(
        "VillageResourceTransaction",
        back_populates="village",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "owner_id",
            "name",
            name="uq_owner_village_name",
        ),
        CheckConstraint(
            "population >= 0",
            name="ck_village_population_non_negative",
        ),
    )


# ---------------------------------------------------------------------------
# TABLE CATEGORY: CURRENT STATE / MATERIALIZED STATE
# ---------------------------------------------------------------------------


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
    )


# ---------------------------------------------------------------------------
# TABLE CATEGORY: RUNTIME TRANSACTIONS / TIMED JOBS
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# TABLE CATEGORY: LEDGER / AUDIT TRANSACTIONS
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Explicit table classification
# ---------------------------------------------------------------------------
# This dictionary is application metadata only; it does not create a table.

TABLE_CLASSIFICATION: dict[str, frozenset[str]] = {
    "REFERENCE_MASTER": frozenset(
        {
            "resources_types",
            "tribe_attributes",
            "farm_level",
            "farm_level_cost",
            "building_type",
            "building_level",
            "building_level_cost",
            "building_prerequisite",
            "granary_capacity",
            "warehouse_capacity",
        }
    ),
    "CORE_WORLD": frozenset(
        {
            "user",
            "map_tile",
            "map_tile_resource_layout",
            "village",
        }
    ),
    "CURRENT_STATE": frozenset(
        {
            "village_farm_plots",
            "village_building",
            "village_resource_storage",
        }
    ),
    "RUNTIME_TRANSACTION": frozenset(
        {
            "village_farm_upgrade",
            "village_building_upgrade",
        }
    ),
    "LEDGER_TRANSACTION": frozenset(
        {
            "village_resource_transaction",
            "village_resource_transaction_entry",
        }
    ),
}
