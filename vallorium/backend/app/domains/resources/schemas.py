from typing import List
from app.common.schemas import AppBaseModel


class ResourceTypeOut(AppBaseModel):
    name: str


class ResourceProduction(AppBaseModel):
    resource_type: str
    total: int


class ResourceBalance(AppBaseModel):
    resource_type: str
    amount: int
    # When you’re ready to expose caps:
    # capacity: int | None = None
    # is_full: bool | None = None
    # percent: int | None = None


class ResourceCost(AppBaseModel):
    resource_id: int
    resource_type: str  # e.g., "WOOD"
    amount: int
