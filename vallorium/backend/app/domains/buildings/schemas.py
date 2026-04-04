from typing import List, Optional, Dict
from app.common.schemas import AppBaseModel


class ResourceCost(AppBaseModel):
    resource_id: Optional[int] = None  # e.g., 1 for WOOD
    resource_type: str  # e.g., "WOOD"
    amount: int


class BuildingPrerequisiteOut(AppBaseModel):
    required_building: str  # building name
    required_level: int


class BuildingLevelOut(AppBaseModel):
    level: int
    time: int
    population_required: int
    cost: List[ResourceCost]
    prerequisites: Optional[List[BuildingPrerequisiteOut]] = []


class BuildingTypeOut(AppBaseModel):
    name: str
    description: Optional[str] = None
    levels: List[BuildingLevelOut]


class BuildingCatalogOut(AppBaseModel):
    tribe: Optional[str] = None
    buildings: List[BuildingTypeOut]


class BuildingLevelAvailabilityOut(AppBaseModel):
    building: str
    level: int
    can_build: bool
    unmet: List[str]
    cost: List[ResourceCost]
    population_required: int
    prerequisites: List[BuildingPrerequisiteOut]


class BuildingAvailabilityListOut(AppBaseModel):
    items: List[BuildingLevelAvailabilityOut]
