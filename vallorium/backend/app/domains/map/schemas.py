from app.common.schemas import AppBaseModel
from app.domains.resources.schemas import ResourceTypeOut


class MapTileFarmSlotOut(AppBaseModel):
    slot_number: int
    resource_type: ResourceTypeOut


class MapTileTypeOut(AppBaseModel):
    id: int
    code: str
    name: str
    farm_slots: list[MapTileFarmSlotOut]


class MapTileOut(AppBaseModel):
    id: int
    x: int
    y: int
    is_constructible: bool
    tile_type: MapTileTypeOut
