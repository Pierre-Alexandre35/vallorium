from typing import Sequence, Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
import app.db.models as db


def tile_is_occupied(db_sess: Session, map_tile_id: int) -> bool:
    return (
        db_sess.query(db.Village.id)
        .filter(db.Village.map_tile_id == map_tile_id)
        .first()
        is not None
    )


def get_tile_layouts(
    db_sess: Session, map_tile_id: int
) -> Sequence[db.MapTileResourceLayout]:
    return (
        db_sess.query(db.MapTileResourceLayout)
        .filter(db.MapTileResourceLayout.map_tile_id == map_tile_id)
        .all()
    )


def insert_village(
    db_sess: Session,
    *,
    name: str,
    map_tile_id: int,
    population: int,
    owner_id: int
) -> db.Village:
    v = db.Village(
        name=name,
        map_tile_id=map_tile_id,
        population=population,
        owner_id=owner_id,
    )
    db_sess.add(v)
    db_sess.flush()
    return v


def insert_farm_plots(
    db_sess: Session,
    village_id: int,
    layouts: Sequence[db.MapTileResourceLayout],
) -> None:
    farm_no = 1
    rows = []
    for lay in layouts:
        for _ in range(lay.amount):
            rows.append(
                db.VillageFarmPlot(
                    village_id=village_id,
                    resource_type_id=lay.resource_type_id,
                    farm_number=farm_no,
                    level=0,
                )
            )
            farm_no += 1
    if rows:
        db_sess.bulk_save_objects(rows)


def get_village_with_tile(
    db_sess: Session, village_id: int
) -> Optional[db.Village]:
    return (
        db_sess.query(db.Village)
        .options(joinedload(db.Village.tile))
        .filter(db.Village.id == village_id)
        .first()
    )


def get_village_production(db_sess: Session, village_id: int):
    return (
        db_sess.query(
            db.ResourcesTypes.name, func.sum(db.Production.production_value)
        )
        .join(
            db.VillageFarmPlot,
            db.VillageFarmPlot.resource_type_id == db.ResourcesTypes.id,
        )
        .join(
            db.Production,
            and_(
                db.Production.resource_type_id
                == db.VillageFarmPlot.resource_type_id,
                db.Production.level == db.VillageFarmPlot.level,
            ),
        )
        .filter(db.VillageFarmPlot.village_id == village_id)
        .group_by(db.ResourcesTypes.name)
        .all()
    )


def get_user_villages(
        db_sess: Session,
        owner_id: int
) -> Optional[List[db.Village]]:
    return (
        db_sess.query(db.Village)
        .filter(db.Village.owner_id == owner_id)
        .all()
    )


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


def get_village_production_by_resource_id(
    db_sess: Session,
    village_id: int,
):
    return (
        db_sess.query(
            db.ResourcesTypes.id,
            db.ResourcesTypes.name,
            func.coalesce(func.sum(db.Production.production_value), 0),
        )
        .outerjoin(
            db.VillageFarmPlot,
            and_(
                db.VillageFarmPlot.resource_type_id == db.ResourcesTypes.id,
                db.VillageFarmPlot.village_id == village_id,
            ),
        )
        .outerjoin(
            db.Production,
            and_(
                db.Production.resource_type_id == db.VillageFarmPlot.resource_type_id,
                db.Production.level == db.VillageFarmPlot.level,
            ),
        )
        .group_by(db.ResourcesTypes.id, db.ResourcesTypes.name)
        .order_by(db.ResourcesTypes.id)
        .all()
    )
