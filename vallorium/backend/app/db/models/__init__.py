"""Vallorium SQLAlchemy data model.

TABLE CATEGORIES
----------------
REFERENCE / MASTER DATA
    Stable game catalog and balance configuration. These rows describe what
    resources, tribes, farm levels, building levels, costs, prerequisites,
    capacities, and map tile templates exist. They do not describe a particular
    player's action.

CORE / WORLD ENTITIES
    Users, map tiles, and villages.

CURRENT STATE
    The latest completed state of a village: farm levels, building levels, and
    materialized resource balances.

RUNTIME TRANSACTIONS / JOBS
    Stateful operations with a lifecycle and duration, such as queued or
    running farm/building upgrades.

LEDGER / AUDIT TRANSACTIONS
    Immutable-style history of every discrete resource change. One transaction
    header groups one or more per-resource debit/credit entries.

Use TABLE_CLASSIFICATION for the exact category assigned to each database table.

Importing this package registers every model with the shared Base metadata.
Public re-exports preserve the existing app.db.models import paths.
"""

from .base import Base, enum_values
from .buildings import (
    BuildingLevel,
    BuildingLevelCost,
    BuildingPrerequisite,
    BuildingType,
    GranaryCapacity,
    VillageBuilding,
    VillageBuildingUpgrade,
    WarehouseCapacity,
)
from .classification import TABLE_CLASSIFICATION
from .enums import Resource, ResourceTransactionType, Tribe, UpgradeStatus
from .farms import FarmLevel, FarmLevelCost, VillageFarmPlot, VillageFarmUpgrade
from .idempotency import IdempotencyRequest
from .resources import (
    ResourcesTypes,
    VillageResourceStorage,
    VillageResourceTransaction,
    VillageResourceTransactionEntry,
)
from .tribes import TribeAdvantage, TribeAttributes
from .users import User
from .villages import Village
from .world import MapTile, MapTileType, MapTileTypeFarmSlot

__all__ = [
    "Base",
    "BuildingLevel",
    "BuildingLevelCost",
    "BuildingPrerequisite",
    "BuildingType",
    "FarmLevel",
    "FarmLevelCost",
    "GranaryCapacity",
    "IdempotencyRequest",
    "MapTile",
    "MapTileType",
    "MapTileTypeFarmSlot",
    "Resource",
    "ResourceTransactionType",
    "ResourcesTypes",
    "TABLE_CLASSIFICATION",
    "Tribe",
    "TribeAdvantage",
    "TribeAttributes",
    "UpgradeStatus",
    "User",
    "Village",
    "VillageBuilding",
    "VillageBuildingUpgrade",
    "VillageFarmPlot",
    "VillageFarmUpgrade",
    "VillageResourceStorage",
    "VillageResourceTransaction",
    "VillageResourceTransactionEntry",
    "WarehouseCapacity",
    "enum_values",
]
