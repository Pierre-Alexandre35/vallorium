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
            joinedload(db.BuildingType.levels).joinedload(db.BuildingLevel.costs),
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

    # Prefer explicit level 0 capacity.
    warehouse_cap = (
        db_sess.query(db.WarehouseCapacity.capacity)
        .filter(db.WarehouseCapacity.level == 0)
        .scalar()
    )

    granary_cap = (
        db_sess.query(db.GranaryCapacity.capacity)
        .filter(db.GranaryCapacity.level == 0)
        .scalar()
    )

    # Fallback in case the seeded capacity tables start at level 1.
    if warehouse_cap is None:
        warehouse_cap = (
            db_sess.query(db.WarehouseCapacity.capacity)
            .order_by(db.WarehouseCapacity.level.asc())
            .limit(1)
            .scalar()
        )

    if granary_cap is None:
        granary_cap = (
            db_sess.query(db.GranaryCapacity.capacity)
            .order_by(db.GranaryCapacity.level.asc())
            .limit(1)
            .scalar()
        )

    warehouse_cap = int(warehouse_cap or 0)
    granary_cap = int(granary_cap or 0)

    return {village_id: (warehouse_cap, granary_cap) for village_id in village_ids}
