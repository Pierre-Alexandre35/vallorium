from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
import app.domains.villages.service as village_service
from app.domains.villages.schemas import (
    VillageCreate,
    VillageNameOut,
    VillageNameUpdate,
    VillageOut,
    VillageProductionOut,
    VillageResourceOut,
    FarmUpgradeOut,
)
from app.core.auth import get_current_active_user
from app.db.models import User

village_router = APIRouter()


@village_router.post(
    "/villages", response_model=VillageOut, response_model_exclude_none=True
)
def village_create(
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
def list_user_villages(
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
def get_my_village(
    village_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a specific village owned by the current authenticated user.
    """
    return village_service.get_user_village_by_id(db, village_id, current_user.id)


@village_router.patch(
    "/villages/{village_id}",
    response_model=VillageNameOut,
    response_model_exclude_none=True,
)
def update_village_name(
    village_id: int,
    payload: VillageNameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update the name of a village owned by the current authenticated user.
    """
    return village_service.update_village_name(
        db=db,
        village_id=village_id,
        owner_id=current_user.id,
        name=payload.name,
    )


@village_router.get(
    "/villages/name/{village_name}",
    response_model=VillageOut,
    response_model_exclude_none=True,
)
def get_village_by_name(
    village_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a specific village by its unique name, owned by the current user.
    """
    return village_service.get_user_village_by_name(db, village_name, current_user.id)


@village_router.get(
    "/villages/{village_id}/production",
    response_model=VillageProductionOut,
    response_model_exclude_none=True,
)
def get_village_resource_production(
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
def get_village_resource_balance(
    village_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the current balance of each resource type in a village after accrual.
    """
    return village_service.get_village_resource_balances(
        db=db,
        village_id=village_id,
        owner_id=current_user.id,
    )


@village_router.post(
    "/villages/{village_id}/farms/{farm_plot_id}/upgrade",
    response_model=FarmUpgradeOut,
    response_model_exclude_none=True,
)
def upgrade_farm_level(
    village_id: int,
    farm_plot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmUpgradeOut:
    return village_service.upgrade_farm_level(
        db=db,
        village_id=village_id,
        farm_plot_id=farm_plot_id,
        owner_id=current_user.id,
    )
