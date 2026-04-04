from typing import List
from app.common.schemas import AppBaseModel
from app.domains.map.schemas import MapTileOut
from app.domains.resources.schemas import ResourceProduction, ResourceBalance


class VillageBase(AppBaseModel):
    name: str
    map_tile_id: int
    population: int


class VillageCreate(VillageBase):
    pass


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
