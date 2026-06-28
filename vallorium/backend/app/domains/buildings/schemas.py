from typing import List, Optional
from app.common.schemas import AppBaseModel


class BuildingTypeBase(AppBaseModel):
    name: str
    description: Optional[str] = None
    tribe_id: Optional[int] = None


class BuildingTypeOut(BuildingTypeBase):
    id: int


class BuildingUpgradeResourceOut(AppBaseModel):
    id: int
    resource_type_id: int
    amount: int


class BuildingPrerequisiteOut(AppBaseModel):
    required_building_type_id: int
    required_level: int


class BuildingLevelOut(AppBaseModel):
    id: int
    building_type_id: int
    level: int
    construction_time: int
    population_required: int
    costs: List[BuildingUpgradeResourceOut] = []
    prerequisites: List[BuildingPrerequisiteOut] = []


class BuildingTypeWithLevelsOut(BuildingTypeOut):
    levels: List[BuildingLevelOut] = []


class BuildingLevelAvailabilityOut(AppBaseModel):
    building_type_id: int
    building_name: str
    next_level: int
    can_build: bool
    missing_requirements: List[str] = []
    construction_time: Optional[int] = None
    population_required: Optional[int] = None


class BuildingAvailabilityListOut(AppBaseModel):
    village_id: int
    items: List[BuildingLevelAvailabilityOut]


class BuildingCatalogOut(AppBaseModel):
    items: List[BuildingTypeWithLevelsOut]
