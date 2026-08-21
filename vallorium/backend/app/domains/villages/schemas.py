from typing import List
from pydantic import Field, field_validator

from app.common.schemas import AppBaseModel
from app.domains.map.schemas import MapTileOut
from app.domains.resources.schemas import ResourceProduction, ResourceBalance


class VillageBase(AppBaseModel):
    name: str
    map_tile_id: int


class VillageCreate(VillageBase):
    pass


class VillageNameUpdate(AppBaseModel):
    name: str = Field(min_length=3, max_length=40)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class VillageOut(AppBaseModel):
    id: int
    name: str
    population: int
    tile: MapTileOut


class VillageProductionOut(AppBaseModel):
    village_id: int
    village_name: str
    production: List[ResourceProduction]


class VillageResourceOut(AppBaseModel):
    village_id: int
    village_name: str
    resources: List[ResourceBalance]


class FarmUpgradeOut(AppBaseModel):
    upgrade_id: int

    village_id: int
    village_name: str

    farm_id: int
    farm_number: int
    resource_type: str

    current_level: int
    target_level: int

    status: str
    duration_seconds: int
