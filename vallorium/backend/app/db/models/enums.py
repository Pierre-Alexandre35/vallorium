"""Shared game and operation enumerations."""

from __future__ import annotations

from enum import Enum


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
