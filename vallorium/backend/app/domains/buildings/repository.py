# app/repositories/building_repo.py
from __future__ import annotations
from typing import Optional, Sequence, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, or_

import app.db.models as db


def fetch_building_catalog(
    db_sess: Session, *, tribe_id: Optional[int] = None
) -> Sequence[db.BuildingType]:
    q = (
        db_sess.query(db.BuildingType)
        .options(
            joinedload(db.BuildingType.levels).joinedload(
                db.BuildingLevel.costs
            ),
            joinedload(db.BuildingType.levels)
            .joinedload(db.BuildingLevel.prerequisites)
            .joinedload(db.BuildingPrerequisite.required_building_type),
        )
        .order_by(asc(db.BuildingType.name))
    )
    if tribe_id is not None:
        q = q.filter(
            or_(
                db.BuildingType.tribe_id == tribe_id,
                db.BuildingType.tribe_id.is_(None),
            )
        )
    results = q.all()
    for bt in results:
        bt.levels.sort(key=lambda x: x.level)
        for lvl in bt.levels:
            lvl.costs.sort(key=lambda c: c.resource_type_id)
            lvl.prerequisites.sort(
                key=lambda p: (p.required_building_type_id, p.required_level)
            )
    return results


def resources_enum_name_by_id(db_sess: Session) -> Dict[int, str]:
    rows = db_sess.query(db.ResourcesTypes).all()
    return {r.id: r.name.name for r in rows}


def get_storage_caps_by_village_ids(
    db_sess: Session,
    village_ids: list[int],
) -> dict[int, tuple[int, int]]:
    if not village_ids:
        return {}

    rows = (
        db_sess.query(
            db.Building.village_id,
            db.BuildingType.name,
            func.sum(db.BuildingLevel.storage_capacity).label("capacity"),
        )
        .join(
            db.BuildingType, db.Building.building_type_id == db.BuildingType.id
        )
        .join(db.BuildingLevel, db.Building.level_id == db.BuildingLevel.id)
        .filter(db.Building.village_id.in_(village_ids))
        .filter(db.BuildingType.name.in_(["Warehouse", "Granary"]))
        .group_by(db.Building.village_id, db.BuildingType.name)
        .all()
    )

    result: dict[int, dict[str, int]] = defaultdict(
        lambda: {"Warehouse": 0, "Granary": 0}
    )

    for village_id, building_name, capacity in rows:
        result[village_id][str(building_name)] = int(capacity or 0)

    return {
        village_id: (
            caps["Warehouse"],
            caps["Granary"],
        )
        for village_id, caps in result.items()
    }
