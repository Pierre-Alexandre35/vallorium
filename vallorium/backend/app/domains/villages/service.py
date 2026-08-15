from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.domains.resources.schemas import ResourceProduction, ResourceBalance
from app.domains.villages.schemas import (
    VillageProductionOut,
    VillageResourceOut,
    VillageCreate,
    FarmUpgradeOut,
)
import app.domains.villages.repository as village_repo
import app.domains.resources.repository as resource_repo
import app.domains.resources.service as resource_service


from app.db.models import Village, UpgradeStatus, Resource


def create_village(db: Session, village: VillageCreate, owner_id: int) -> Village:
    try:
        tile = village_repo.get_tile_for_update(
            db,
            village.map_tile_id,
        )

        if tile is None:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"Map tile {village.map_tile_id} does not exist.",
            )

        if not tile.is_constructible:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=f"Map tile {village.map_tile_id} is not constructible.",
            )

        if village_repo.tile_is_occupied(db, village.map_tile_id):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=f"Map tile {village.map_tile_id} is already occupied.",
            )

        farm_slots = tile.tile_type.farm_slots

        if len(farm_slots) != 18:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Map tile type {tile.map_tile_type_id} does not define 18 farm slots.",
            )

        now = datetime.utcnow()

        v = village_repo.insert_village(
            db,
            name=village.name,
            map_tile_id=village.map_tile_id,
            owner_id=owner_id,
        )

        village_repo.insert_farm_plots(
            db,
            v.id,
            farm_slots,
        )

        resource_type_ids = resource_repo.get_resource_type_ids(db)

        try:
            resource_type_ids = resource_repo.get_resource_type_ids(db)

            starter_pack = {
                resource_type_ids[Resource.WOOD]: 50,
                resource_type_ids[Resource.CLAY]: 75,
                resource_type_ids[Resource.IRON]: 90,
                resource_type_ids[Resource.CROP]: 40,
            }
        except KeyError as exc:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Resource types are not fully configured.",
            ) from exc

        resource_repo.insert_initial_storage(
            db,
            v.id,
            starter_pack,
            now,
        )

        db.commit()

        return village_repo.get_village_with_tile(db, v.id)

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def get_user_villages(db: Session, owner_id: int) -> Optional[List[Village]]:
    return village_repo.get_user_villages(db, owner_id)


def get_user_village_by_id(db: Session, village_id: int, owner_id: int) -> Village:
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


def get_village_production_summary(
    db: Session, village_id: int, owner_id: int
) -> VillageProductionOut:
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
        getattr(resource_name, "value", str(resource_name)).lower(): int(total or 0)
        for resource_name, total in production_rows
    }


def get_village_resource_balances(
    db: Session,
    village_id: int,
    owner_id: int,
) -> VillageResourceOut:
    village = get_user_village_by_id(
        db=db,
        village_id=village_id,
        owner_id=owner_id,
    )

    balance_map = resource_service.get_computed_balance_map(
        db_sess=db,
        village_id=village_id,
        owner_id=owner_id,
    )

    return VillageResourceOut(
        village_id=village.id,
        village_name=village.name,
        resources=[
            ResourceBalance(
                resource_type=resource_name,
                amount=amount,
            )
            for resource_name, amount in balance_map.items()
        ],
    )


def upgrade_farm_level(
    db: Session,
    village_id: int,
    farm_plot_id: int,
    owner_id: int,
) -> FarmUpgradeOut:
    try:
        farm_plot = village_repo.get_owned_farm_plot_for_update(
            db_sess=db,
            village_id=village_id,
            farm_plot_id=farm_plot_id,
            owner_id=owner_id,
        )

        if farm_plot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm plot not found or unauthorized.",
            )

        if village_repo.has_active_farm_upgrade(
            db_sess=db,
            farm_plot_id=farm_plot.id,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This farm is already being upgraded.",
            )

        target_level = farm_plot.level + 1

        level_definition = village_repo.get_farm_level_with_costs(
            db_sess=db,
            farm_resource_type_id=farm_plot.resource_type_id,
            level=target_level,
        )

        if level_definition is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Level {target_level} is not configured " "for this farm type."
                ),
            )

        duration_seconds = int(level_definition.construction_time_seconds)

        if duration_seconds <= 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The farm upgrade duration is invalid.",
            )

        if not level_definition.costs:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No resource costs are configured for this upgrade.",
            )

        costs = {
            int(cost.payment_resource_type_id): int(cost.amount)
            for cost in level_definition.costs
        }

        now = datetime.now(timezone.utc)

        resource_service.spend_resources(
            db_sess=db,
            village_id=farm_plot.village_id,
            costs=costs,
            now=now,
        )

        completes_at = now + timedelta(seconds=duration_seconds)

        upgrade = village_repo.insert_farm_upgrade(
            db_sess=db,
            farm_plot_id=farm_plot.id,
            from_level=farm_plot.level,
            target_level=target_level,
            status=UpgradeStatus.IN_PROGRESS,
            started_at=now,
            completes_at=completes_at,
            actual_duration_seconds=duration_seconds,
        )

        db.flush()
        db.commit()
        db.refresh(upgrade)

        resource_type_name = getattr(
            farm_plot.resource_type.name,
            "value",
            str(farm_plot.resource_type.name),
        )

        upgrade_status = getattr(
            upgrade.status,
            "value",
            str(upgrade.status),
        )

        return FarmUpgradeOut(
            upgrade_id=upgrade.id,
            village_id=farm_plot.village_id,
            village_name=farm_plot.village.name,
            farm_id=farm_plot.id,
            farm_number=farm_plot.farm_number,
            resource_type=resource_type_name,
            current_level=upgrade.from_level,
            target_level=upgrade.target_level,
            status=upgrade_status,
            duration_seconds=upgrade.actual_duration_seconds,
        )

    except HTTPException:
        db.rollback()
        raise

    except resource_service.InsufficientResourcesError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Not enough resources for this upgrade.",
                "resource_type_id": exc.resource_type_id,
                "required": exc.required,
                "available": exc.available,
            },
        ) from exc
