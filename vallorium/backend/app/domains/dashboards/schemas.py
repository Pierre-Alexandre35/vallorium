from typing import List, Dict
from app.common.schemas import AppBaseModel


class DashboardUserOut(AppBaseModel):
    id: int
    email: str
    tribe_id: int
    tribe_name: str
    is_superuser: bool


class DashboardVillageOut(AppBaseModel):
    id: int
    name: str
    population: int
    tile_id: int
    x: int | None = None
    y: int | None = None
    production: Dict[str, int]
    resources: Dict[str, int]


class DashboardTotalsOut(AppBaseModel):
    villages: int
    population: int
    production: Dict[str, int]
    resources: Dict[str, int]


class DashboardOverviewOut(AppBaseModel):
    user: DashboardUserOut
    villages: List[DashboardVillageOut]
    totals: DashboardTotalsOut
