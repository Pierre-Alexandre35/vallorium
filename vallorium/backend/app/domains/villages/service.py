from datetime import datetime, timedelta, timezone
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.domains.resources.schemas import ResourceProduction, ResourceBalance
from app.domains.villages.schemas import (
    VillageProductionOut,
    VillageResourceOut,
    VillageCreate,
    VillageNameOut,
    FarmUpgradeOut,
)
import app.domains.villages.repository as village_repo
import app.domains.resources.repository as resource_repo
import app.domains.resources.service as resource_service


from app.db.models import Village, UpgradeStatus, Resource, MapTile, VillageFarmPlot


logger = logging.getLogger(__name__)


def initialize_village(
    db: Session,
    *,
    name: str,
    tile: MapTile,
    owner_id: int,
) -> Village:
    farm_slots = tile.tile_type.farm_slots

    if len(farm_slots) != 18:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Map tile type {tile.map_tile_type_id} does not define 18 farm slots.",
        )

    v = village_repo.insert_village(
        db,
        name=name,
        map_tile_id=tile.id,
        owner_id=owner_id,
    )

    village_repo.insert_farm_plots(
        db,
        v.id,
        farm_slots,
    )

    resource_type_ids = resource_repo.get_resource_type_ids(db)

    try:
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
        datetime.now(timezone.utc),
    )

    db.flush()
    return v


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

        v = initialize_village(
            db,
            name=village.name,
            tile=tile,
            owner_id=owner_id,
        )

        db.commit()

        return village_repo.get_village_with_tile(db, v.id)

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def get_user_villages(db: Session, owner_id: int) -> list[Village]:
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


def update_village_name(
    db: Session,
    *,
    village_id: int,
    owner_id: int,
    name: str,
) -> VillageNameOut:
    try:
        village = get_user_village_by_id(
            db=db,
            village_id=village_id,
            owner_id=owner_id,
        )

        if village.name == name:
            return VillageNameOut(
                id=village.id,
                name=village.name,
            )

        if village_repo.village_name_exists_for_owner(
            db,
            owner_id=owner_id,
            village_name=name,
            exclude_village_id=village_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already have a village with this name.",
            )

        village_repo.update_village_name(
            db,
            village=village,
            name=name,
        )

        response = VillageNameOut(
            id=village.id,
            name=name,
        )

        db.commit()
        return response

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a village with this name.",
        ) from exc

    except Exception:
        db.rollback()
        raise


def _complete_due_farm_upgrades_for_locked_village(
    db: Session,
    *,
    village_id: int,
    now: datetime,
) -> int:
    """Materialize overdue farm upgrades for one locked village.

    ``VillageFarmUpgrade.completes_at`` is the game-time source of truth.
    Resources are settled at each completion timestamp while the old farm
    level is still active; only then is the new level materialized.

    The caller owns the surrounding transaction and must already hold the
    village row lock.
    """
    upgrades = village_repo.get_due_farm_upgrades_for_village(
        db_sess=db,
        village_id=village_id,
        now=now,
    )

    completed_count = 0

    for upgrade in upgrades:
        completion_time = upgrade.completes_at
        if completion_time is None:
            continue

        farm_plot = upgrade.farm_plot

        if farm_plot.level != upgrade.from_level:
            raise RuntimeError(
                f"Farm upgrade {upgrade.id} expected farm plot "
                f"{farm_plot.id} at level {upgrade.from_level}, "
                f"found level {farm_plot.level}."
            )

        # Production before completion belongs to the old farm level.
        resource_service.settle_and_lock_village_resources(
            db_sess=db,
            village_id=village_id,
            now=completion_time,
        )

        # The new level becomes effective at completion_time.
        farm_plot.level = upgrade.target_level
        upgrade.status = UpgradeStatus.COMPLETED

        # completed_at records when the DB row was materialized. The economic
        # completion time remains upgrade.completes_at.
        upgrade.completed_at = now

        # SessionLocal uses autoflush=False. Flush after each event so the next
        # production settlement sees this newly completed level.
        db.flush()
        completed_count += 1

    return completed_count


def reconcile_owned_village_if_due(
    db: Session,
    *,
    village_id: int,
    owner_id: int,
    now: datetime,
) -> Village:
    """Return correct village state with one cheap read in the normal path.

    Celery normally materializes completed upgrades. Request-time reconciliation
    is only a correctness fallback. Authorization and the "is anything due?"
    check share one SQL round-trip; row locking is only used when work is due.
    """
    state = village_repo.get_owned_village_with_due_upgrade_flag(
        db_sess=db,
        owner_id=owner_id,
        village_id=village_id,
        now=now,
    )

    if state is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Village not found or unauthorized",
        )

    village, has_due_upgrade = state
    if not has_due_upgrade:
        return village

    try:
        locked_village = village_repo.get_village_for_update(
            db_sess=db,
            village_id=village_id,
        )

        if locked_village is None or locked_village.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Village not found or unauthorized",
            )

        _complete_due_farm_upgrades_for_locked_village(
            db,
            village_id=village_id,
            now=now,
        )

        db.commit()
        return get_user_village_by_id(
            db=db,
            village_id=village_id,
            owner_id=owner_id,
        )

    except Exception:
        db.rollback()
        raise


def complete_due_farm_upgrades(
    db: Session,
    *,
    now: datetime | None = None,
    batch_size: int = 100,
) -> int:
    """Materialize all currently overdue farm upgrades in bounded batches.

    The discovery query is global across all users but only returns villages
    that actually have due work. Each village is committed independently, so
    locks stay short and memory use remains bounded even with many villages.
    """
    if batch_size <= 0:
        raise ValueError("batch_size must be greater than zero")

    effective_now = now or datetime.now(timezone.utc)
    total_completed = 0
    skipped_village_ids: set[int] = set()

    while True:
        village_ids = village_repo.get_village_ids_with_due_farm_upgrades(
            db_sess=db,
            now=effective_now,
            limit=batch_size,
            exclude_village_ids=skipped_village_ids,
        )

        if not village_ids:
            break

        for village_id in village_ids:
            try:
                village = village_repo.get_village_for_update(
                    db_sess=db,
                    village_id=village_id,
                    skip_locked=True,
                )

                if village is None:
                    # Another worker may own this village right now. A later
                    # scheduled sweep will pick it up if work remains.
                    db.rollback()
                    skipped_village_ids.add(village_id)
                    continue

                completed = _complete_due_farm_upgrades_for_locked_village(
                    db,
                    village_id=village_id,
                    now=effective_now,
                )

                db.commit()
                total_completed += completed

            except Exception:
                db.rollback()
                skipped_village_ids.add(village_id)
                logger.exception(
                    "Failed to complete due farm upgrades for village %s",
                    village_id,
                )

    return total_completed


def get_village_production_summary(
    db: Session, village_id: int, owner_id: int
) -> VillageProductionOut:
    now = datetime.now(timezone.utc)
    village = reconcile_owned_village_if_due(
        db,
        village_id=village_id,
        owner_id=owner_id,
        now=now,
    )
    production = village_repo.get_village_production(db, village_id)

    return VillageProductionOut(
        village_id=village.id,
        village_name=village.name,
        production=[
            ResourceProduction(
                resource_type=getattr(res, "value", str(res)),
                amount_per_hour=int(total or 0),
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
    now = datetime.now(timezone.utc)
    village = reconcile_owned_village_if_due(
        db,
        village_id=village_id,
        owner_id=owner_id,
        now=now,
    )

    balance_map = resource_service.get_computed_balance_map(
        db_sess=db,
        village_id=village_id,
        now=now,
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
        # Serialize game-state commands for this village. Construction timers
        # can still overlap for different farms; this lock only protects the
        # short database transaction.
        village = village_repo.get_village_for_update(
            db_sess=db,
            village_id=village_id,
        )

        if village is None or village.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Village not found or unauthorized.",
            )

        now = datetime.now(timezone.utc)

        # If Celery is a little late, bring the village to the correct game
        # state before evaluating costs, production, or the next target level.
        _complete_due_farm_upgrades_for_locked_village(
            db,
            village_id=village_id,
            now=now,
        )

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
                    f"Level {target_level} is not configured "
                    "for this farm type."
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

    except IntegrityError as exc:
        db.rollback()

        diag = getattr(getattr(exc, "orig", None), "diag", None)
        constraint_name = getattr(diag, "constraint_name", None)

        if constraint_name == "uq_farm_upgrade_active_per_plot":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This farm is already being upgraded.",
            ) from exc

        raise

    except Exception:
        db.rollback()
        raise


def get_village_farms(
    db: Session,
    village_id: int,
    owner_id: int,
) -> list[VillageFarmPlot]:
    now = datetime.now(timezone.utc)
    reconcile_owned_village_if_due(
        db,
        village_id=village_id,
        owner_id=owner_id,
        now=now,
    )

    return village_repo.get_farm_plots_for_village(
        db_sess=db,
        village_id=village_id,
    )
