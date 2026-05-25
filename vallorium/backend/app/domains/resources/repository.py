from collections import defaultdict
from typing import Dict, Sequence

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
