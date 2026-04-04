from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
import app.domains.tribes.services as tribe_service
import app.domains.buildings.service as building_service

from app.domains.buildings.schemas import BuildingCatalogOut
from app.utils.cache import cached_response

building_router = APIRouter()


@building_router.get(
    "/tribes/{tribe_id}/buildings",
    response_model=BuildingCatalogOut,
    tags=["Buildings"],
    summary="Get building catalog for a tribe",
)
async def list_buildings_by_tribe(
    tribe_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    # Validate tribe
    tribe = tribe_service.get_tribe_by_id(db, tribe_id)
    if not tribe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tribe not found"
        )

    # Get buildings
    buildings = building_service.list_building_catalog(db, tribe_id=tribe_id)

    # Response model
    result = BuildingCatalogOut(tribe=tribe.name, buildings=buildings)

    # Send with ETag-based caching
    return cached_response(result, max_age=86400, request=request)
