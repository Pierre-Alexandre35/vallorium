from csv import Error
from typing import Sequence, Optional, List
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, and_
import app.db.models as db
from collections import defaultdict
from datetime import datetime


def tile_is_occupied(db_sess: Session, map_tile_id: int) -> bool:
    return (
        db_sess.query(db.Village.id)
        .filter(db.Village.map_tile_id == map_tile_id)
        .first()
        is not None
    )


def get_tile_for_update(
    db_sess: Session,
    map_tile_id: int,
) -> Optional[db.MapTile]:
    return (
        db_sess.query(db.MapTile)
        .options(
            selectinload(db.MapTile.tile_type).selectinload(
                db.MapTileType.farm_slots
            ),
        )
        .filter(db.MapTile.id == map_tile_id)
        .with_for_update(of=db.MapTile)
        .one_or_none()
    )


def insert_village(
    db_sess: Session, *, name: str, map_tile_id: int, owner_id: int
) -> db.Village:
    v = db.Village(
        name=name,
        map_tile_id=map_tile_id,
        population=0,
        owner_id=owner_id,
    )
    db_sess.add(v)
    db_sess.flush()
    return v


def insert_farm_plots(
    db_sess: Session,
    village_id: int,
    farm_slots: Sequence[db.MapTileTypeFarmSlot],
) -> None:
    rows = []

    for slot in farm_slots:
        rows.append(
            db.VillageFarmPlot(
                village_id=village_id,
                resource_type_id=slot.resource_type_id,
                farm_number=slot.slot_number,
                level=0,
            )
        )

    if rows:
        db_sess.bulk_save_objects(rows)


def get_village_with_tile(db_sess: Session, village_id: int) -> Optional[db.Village]:
    return (
        db_sess.query(db.Village)
        .options(joinedload(db.Village.tile))
        .filter(db.Village.id == village_id)
        .first()
    )


def get_village_production(
    db_sess: Session,
    village_id: int,
) -> list[tuple[object, int]]:
    """
    Return total hourly production grouped by resource type.

    A farm plot's production is determined by matching:
      - VillageFarmPlot.resource_type_id
      - VillageFarmPlot.level
    against the corresponding FarmLevel row.
    """
    return (
        db_sess.query(
            db.ResourcesTypes.name,
            func.coalesce(
                func.sum(db.FarmLevel.production_per_hour),
                0,
            ).label("hourly_production"),
        )
        .select_from(db.VillageFarmPlot)
        .join(
            db.ResourcesTypes,
            db.ResourcesTypes.id == db.VillageFarmPlot.resource_type_id,
        )
        .join(
            db.FarmLevel,
            and_(
                db.FarmLevel.farm_resource_type_id
                == db.VillageFarmPlot.resource_type_id,
                db.FarmLevel.level == db.VillageFarmPlot.level,
            ),
        )
        .filter(db.VillageFarmPlot.village_id == village_id)
        .group_by(
            db.ResourcesTypes.id,
            db.ResourcesTypes.name,
        )
        .order_by(db.ResourcesTypes.id)
        .all()
    )


def get_user_villages(db_sess: Session, owner_id: int) -> Optional[List[db.Village]]:
    return db_sess.query(db.Village).filter(db.Village.owner_id == owner_id).all()


def get_village_by_id(
    db_sess: Session,
    owner_id: int,
    village_id: int,
) -> Optional[db.Village]:
    return (
        db_sess.query(db.Village)
        .filter(
            db.Village.id == village_id,
            db.Village.owner_id == owner_id,
        )
        .one_or_none()
    )


def get_village_by_name_and_owner(
    db_sess: Session,
    village_name: str,
    owner_id: int,
) -> Optional[db.Village]:
    return (
        db_sess.query(db.Village)
        .filter(
            db.Village.name.ilike(village_name),
            db.Village.owner_id == owner_id,
        )
        .one_or_none()
    )


def get_village_production_by_village_ids(
    db_sess: Session,
    village_ids: list[int],
) -> dict[int, list[tuple[int, object, int]]]:
    if not village_ids:
        return {}

    rows = (
        db_sess.query(
            db.VillageFarmPlot.village_id,
            db.ResourcesTypes.id.label("resource_type_id"),
            db.ResourcesTypes.name.label("resource_type_name"),
            func.coalesce(
                func.sum(db.FarmLevel.production_per_hour),
                0,
            ).label("hourly_production"),
        )
        .select_from(db.VillageFarmPlot)
        .join(
            db.ResourcesTypes,
            db.ResourcesTypes.id == db.VillageFarmPlot.resource_type_id,
        )
        .join(
            db.FarmLevel,
            and_(
                db.FarmLevel.farm_resource_type_id
                == db.VillageFarmPlot.resource_type_id,
                db.FarmLevel.level == db.VillageFarmPlot.level,
            ),
        )
        .filter(db.VillageFarmPlot.village_id.in_(village_ids))
        .group_by(
            db.VillageFarmPlot.village_id,
            db.ResourcesTypes.id,
            db.ResourcesTypes.name,
        )
        .order_by(
            db.VillageFarmPlot.village_id,
            db.ResourcesTypes.id,
        )
        .all()
    )

    grouped: dict[int, list[tuple[int, object, int]]] = {
        village_id: [] for village_id in village_ids
    }

    for (
        village_id,
        resource_type_id,
        resource_type_name,
        hourly_production,
    ) in rows:
        grouped[village_id].append(
            (
                resource_type_id,
                resource_type_name,
                int(hourly_production or 0),
            )
        )

    return grouped


def get_owned_farm_plot_for_update(
    db_sess: Session,
    *,
    village_id: int,
    farm_plot_id: int,
    owner_id: int,
) -> Optional[db.VillageFarmPlot]:
    return (
        db_sess.query(db.VillageFarmPlot)
        .join(
            db.Village,
            db.Village.id == db.VillageFarmPlot.village_id,
        )
        .options(
            selectinload(db.VillageFarmPlot.village),
            selectinload(db.VillageFarmPlot.resource_type),
        )
        .filter(
            db.VillageFarmPlot.id == farm_plot_id,
            db.VillageFarmPlot.village_id == village_id,
            db.Village.owner_id == owner_id,
        )
        .with_for_update(of=db.VillageFarmPlot)
        .one_or_none()
    )


def has_active_farm_upgrade(
    db_sess: Session,
    *,
    farm_plot_id: int,
) -> bool:
    return (
        db_sess.query(db.VillageFarmUpgrade.id)
        .filter(
            db.VillageFarmUpgrade.village_farm_plot_id == farm_plot_id,
            db.VillageFarmUpgrade.status.in_(
                (
                    db.UpgradeStatus.QUEUED,
                    db.UpgradeStatus.IN_PROGRESS,
                )
            ),
        )
        .first()
        is not None
    )


def get_farm_level_with_costs(
    db_sess: Session,
    *,
    farm_resource_type_id: int,
    level: int,
) -> Optional[db.FarmLevel]:
    return (
        db_sess.query(db.FarmLevel)
        .options(
            selectinload(db.FarmLevel.costs),
        )
        .filter(
            db.FarmLevel.farm_resource_type_id == farm_resource_type_id,
            db.FarmLevel.level == level,
        )
        .one_or_none()
    )


def insert_farm_upgrade(
    db_sess: Session,
    *,
    farm_plot_id: int,
    from_level: int,
    target_level: int,
    status: db.UpgradeStatus,
    started_at: datetime,
    completes_at: datetime,
    actual_duration_seconds: int,
) -> db.VillageFarmUpgrade:
    upgrade = db.VillageFarmUpgrade(
        village_farm_plot_id=farm_plot_id,
        from_level=from_level,
        target_level=target_level,
        status=status,
        started_at=started_at,
        completes_at=completes_at,
        actual_duration_seconds=actual_duration_seconds,
    )

    db_sess.add(upgrade)
    return upgrade
