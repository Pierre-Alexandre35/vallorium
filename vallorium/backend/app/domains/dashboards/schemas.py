from typing import Dict

from app.common.schemas import AppBaseModel


class DashboardVillageOut(AppBaseModel):
    id: int
    name: str
    population: int
    tile_id: int
    x: int | None = None
    y: int | None = None
    production: Dict[str, int]
    resources: Dict[str, int]
    capacities: Dict[str, int]


class DashboardCurrentOut(AppBaseModel):
    village: DashboardVillageOut | None
