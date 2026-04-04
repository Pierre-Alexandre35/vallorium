from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
import app.domains.villages.service as village_service
import app.domains.resources.service as resouce_service
from app.domains.villages.schemas import (
    VillageCreate,
    VillageOut,
    VillageProductionOut,
    VillageResourceOut,
)
from app.core.auth import get_current_active_user
from app.db.models import User

village_router = APIRouter()


@village_router.post(
    "/villages", response_model=VillageOut, response_model_exclude_none=True
)
async def village_create(
    village: VillageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new village for the current user.
    """
    return village_service.create_village(db, village, owner_id=current_user.id)


@village_router.get(
    "/villages/",
    response_model=List[VillageOut],
    response_model_exclude_none=True,
)
async def list_user_villages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List all villages owned by the current authenticated user.
    """
    return village_service.get_user_villages(db=db, owner_id=current_user.id)


@village_router.get(
    "/villages/{village_id}",
    response_model=VillageOut,
    response_model_exclude_none=True,
)
async def get_my_village(
    village_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a specific village owned by the current authenticated user.
    """
    return village_service.get_user_village_by_id(
        db, village_id, current_user.id
    )


@village_router.get(
    "/villages/name/{village_name}",
    response_model=VillageOut,
    response_model_exclude_none=True,
)
async def get_village_by_name(
    village_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a specific village by its unique name, owned by the current user.
    """
    return village_service.get_user_village_by_name(
        db, village_name, current_user.id
    )


@village_router.get(
    "/villages/{village_id}/production",
    response_model=VillageProductionOut,
    response_model_exclude_none=True,
)
async def get_village_resource_production(
    village_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the resource production per hour for a specific village.
    """
    return village_service.get_village_production_summary(
        db, village_id, current_user.id
    )


@village_router.get(
    "/villages/{village_id}/resources",
    response_model=VillageResourceOut,
    response_model_exclude_none=True,
)
async def get_village_resource_balance(
    village_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the current balance of each resource type in a village (after accrual).
    """
    return resouce_service.accrue_and_get_balances(
        db_sess=db, village_id=village_id, owner_id=current_user.id
    )
