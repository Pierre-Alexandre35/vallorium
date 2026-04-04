from typing import List
from app.common.schemas import AppBaseModel
from app.domains.resources.schemas import ResourceTypeOut


class TileResourceOut(AppBaseModel):
    resource_type: ResourceTypeOut
    amount: int


class MapTileOut(AppBaseModel):
    id: int
    x: int
    y: int
    is_constructible: bool
    resource_layouts: List[TileResourceOut] = []
