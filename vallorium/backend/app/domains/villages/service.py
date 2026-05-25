from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.domains.resources.schemas import ResourceProduction, ResourceBalance
from app.domains.villages.schemas import (
    VillageProductionOut,
    VillageResourceOut,
    VillageCreate,
)
import app.domains.villages.repository as village_repo
import app.domains.resources.repository as resource_repo

from app.db.models import Village


def create_village(
    db: Session, village: VillageCreate, owner_id: int
) -> Village:
    if village_repo.tile_is_occupied(db, village.map_tile_id):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"Map tile {village.map_tile_id} is already occupied.",
        )

    layouts = village_repo.get_tile_layouts(db, village.map_tile_id)
    if not layouts:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=f"No resource layout found for map tile {village.map_tile_id}.",
        )

    now = datetime.utcnow()

    v = village_repo.insert_village(
        db,
        name=village.name,
        map_tile_id=village.map_tile_id,
        population=village.population,
        owner_id=owner_id,
    )

    village_repo.insert_farm_plots(db, v.id, layouts)

    starter_pack = {
        1: 50,  # WOOD
        2: 75,  # CLAY
        3: 90,  # IRON
        4: 40,  # CROP
    }
    resource_repo.insert_initial_storage(db, v.id, starter_pack, now)

    db.commit()
    return village_repo.get_village_with_tile(db, v.id)


def get_user_villages(db: Session, owner_id: int) -> Optional[List[Village]]:
    return village_repo.get_user_villages(db, owner_id)


def get_user_village_by_id(
    db: Session, village_id: int, owner_id: int
) -> Village:
    village = village_repo.get_village_by_id(db, owner_id, village_id)
    if not village:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="Village not found or unauthorized",
        )
    return village


def get_user_village_by_name(db: Session, name: str, owner_id: int) -> Village:
    village = village_repo.get_village_by_name_and_owner(db, name, owner_id)
    if not village:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="Village not found or unauthorized",
        )
    return village


def get_village_production_summary(db: Session, village_id: int, owner_id: int):
    village = get_user_village_by_id(db, village_id, owner_id)
    production = village_repo.get_village_production(db, village_id)

    return VillageProductionOut(
        village_id=village.id,
        village_name=village.name,
        production=[
            ResourceProduction(
                resource_type=getattr(res, "value", str(res)),
                total=int(total or 0),
            )
            for res, total in production
        ],
    )


def get_village_production_map(db: Session, village_id: int) -> dict[str, int]:
    production_rows = village_repo.get_village_production(db, village_id)

    return {
        getattr(resource_name, "value", str(resource_name)).lower(): int(
            total or 0
        )
        for resource_name, total in production_rows
    }


def get_village_production_maps_by_village_ids(
    db: Session,
    village_ids: list[int],
) -> dict[int, dict[str, int]]:
    rows_by_village_id = village_repo.get_village_production_by_village_ids(
        db_sess=db,
        village_ids=village_ids,
    )

    result: dict[int, dict[str, int]] = {}

    for village_id, rows in rows_by_village_id.items():
        result[village_id] = {
            getattr(resource_name, "value", str(resource_name)).lower(): int(
                total or 0
            )
            for _resource_type_id, resource_name, total in rows
        }

    return result


def get_village_resource_balances(db: Session, village_id: int, owner_id: int):
    village = get_user_village_by_id(db, village_id, owner_id)
    now = datetime.utcnow()
    storages = resource_repo.load_storages_for_update(db, village_id)

    balances = []
    for storage in storages:
        prod = village_repo.get_resource_production_value(
            db, village_id, storage.resource_type_id, storage.level
        )
        elapsed_seconds = (now - storage.last_updated).total_seconds()
        gain = int((prod / 3600) * elapsed_seconds)
        storage.stored_amount += gain
        storage.last_updated = now
        balances.append((storage.resource_type.name, storage.stored_amount))

    db.commit()
    return VillageResourceOut(
        village_id=village.id,
        village_name=village.name,
        resources=[
            ResourceBalance(
                resource_type=getattr(name, "value", str(name)),
                amount=amount,
            )
            for name, amount in balances
        ],
    )
