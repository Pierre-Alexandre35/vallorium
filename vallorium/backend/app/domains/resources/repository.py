from collections import defaultdict
from typing import Dict, Sequence

from sqlalchemy import and_, func
from sqlalchemy.orm import Session, joinedload
import app.db.models as db


def resources_name_to_id(db_sess: Session) -> Dict[str, int]:
    rows = db_sess.query(db.ResourcesTypes).all()
    return {getattr(r.name, "value", r.name): r.id for r in rows}


def insert_initial_storage(
    db_sess: Session, village_id: int, starter: Dict[int, int], now
) -> None:
    rows = [
        db.VillageResourceStorage(
            village_id=village_id,
            resource_type_id=rid,
            stored_amount=amt,
            last_updated=now,
        )
        for rid, amt in starter.items()
    ]
    if rows:
        db_sess.bulk_save_objects(rows)


def load_storages(
    db_sess: Session,
    village_id: int,
) -> Sequence[db.VillageResourceStorage]:
    return (
        db_sess.query(db.VillageResourceStorage)
        .options(joinedload(db.VillageResourceStorage.resource_type))
        .filter(db.VillageResourceStorage.village_id == village_id)
        .all()
    )




def load_resource_state_with_production(
    db_sess: Session,
    *,
    village_id: int,
) -> list[tuple[int, object, int, object, int]]:
    """Load one village's resource balances and hourly production in one query.

    This is the hot read path for the current-village dashboard. Production is
    aggregated in a subquery and joined to the four storage rows, avoiding a
    separate production round-trip.
    """
    production = (
        db_sess.query(
            db.VillageFarmPlot.resource_type_id.label("resource_type_id"),
            func.coalesce(
                func.sum(db.FarmLevel.production_per_hour),
                0,
            ).label("hourly_production"),
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
        .group_by(db.VillageFarmPlot.resource_type_id)
        .subquery()
    )

    return (
        db_sess.query(
            db.VillageResourceStorage.resource_type_id,
            db.ResourcesTypes.name,
            db.VillageResourceStorage.stored_amount,
            db.VillageResourceStorage.last_updated,
            func.coalesce(production.c.hourly_production, 0),
        )
        .join(
            db.ResourcesTypes,
            db.ResourcesTypes.id
            == db.VillageResourceStorage.resource_type_id,
        )
        .outerjoin(
            production,
            production.c.resource_type_id
            == db.VillageResourceStorage.resource_type_id,
        )
        .filter(db.VillageResourceStorage.village_id == village_id)
        .order_by(db.VillageResourceStorage.resource_type_id)
        .all()
    )


def load_storages_by_village_ids(
    db_sess: Session,
    village_ids: list[int],
) -> dict[int, list[db.VillageResourceStorage]]:
    if not village_ids:
        return {}

    rows = (
        db_sess.query(db.VillageResourceStorage)
        .options(joinedload(db.VillageResourceStorage.resource_type))
        .filter(db.VillageResourceStorage.village_id.in_(village_ids))
        .all()
    )

    grouped: dict[int, list[db.VillageResourceStorage]] = defaultdict(list)
    for row in rows:
        grouped[row.village_id].append(row)

    return dict(grouped)


def load_storages_for_update(
    db_sess: Session,
    village_id: int,
) -> list[db.VillageResourceStorage]:
    return (
        db_sess.query(db.VillageResourceStorage)
        .filter(db.VillageResourceStorage.village_id == village_id)
        .with_for_update()
        .all()
    )


def get_resource_type_ids(
    db_sess: Session,
) -> dict[db.Resource, int]:
    rows = db_sess.query(
        db.ResourcesTypes.name,
        db.ResourcesTypes.id,
    ).all()

    return {
        resource_name: resource_type_id
        for resource_name, resource_type_id in rows
    }