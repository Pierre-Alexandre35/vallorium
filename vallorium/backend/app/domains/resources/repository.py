from typing import Dict, Sequence, List
from sqlalchemy.orm import Session
from sqlalchemy import func
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


def load_storages_for_update(
    db_sess: Session, village_id: int
) -> Sequence[db.VillageResourceStorage]:
    # row-level lock during accrual
    return (
        db_sess.query(db.VillageResourceStorage)
        .filter(db.VillageResourceStorage.village_id == village_id)
        .with_for_update()
        .all()
    )
