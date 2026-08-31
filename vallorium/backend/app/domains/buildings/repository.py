# app/repositories/building_repo.py
from __future__ import annotations
from typing import Optional, Sequence, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, case, or_, select

import app.db.models as db


_DEFAULT_STORAGE_CAPS: tuple[int, int] | None = None


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


def _get_default_storage_caps(
    db_sess: Session,
) -> tuple[int, int]:
    global _DEFAULT_STORAGE_CAPS

    if _DEFAULT_STORAGE_CAPS is not None:
        return _DEFAULT_STORAGE_CAPS

    # These are reference/master values and currently identical for every
    # village. Cache them in-process after the first lookup so dashboard and
    # resource reads do not spend a DB round-trip on static data.
    warehouse_cap_query = (
        select(db.WarehouseCapacity.capacity)
        .order_by(
            case((db.WarehouseCapacity.level == 0, 0), else_=1),
            db.WarehouseCapacity.level.asc(),
        )
        .limit(1)
        .scalar_subquery()
    )
    granary_cap_query = (
        select(db.GranaryCapacity.capacity)
        .order_by(
            case((db.GranaryCapacity.level == 0, 0), else_=1),
            db.GranaryCapacity.level.asc(),
        )
        .limit(1)
        .scalar_subquery()
    )

    warehouse_cap, granary_cap = db_sess.query(
        warehouse_cap_query,
        granary_cap_query,
    ).one()

    _DEFAULT_STORAGE_CAPS = (
        int(warehouse_cap or 0),
        int(granary_cap or 0),
    )
    return _DEFAULT_STORAGE_CAPS


def get_storage_caps_by_village_ids(
    db_sess: Session,
    village_ids: list[int],
) -> dict[int, tuple[int, int]]:
    if not village_ids:
        return {}

    capacities = _get_default_storage_caps(db_sess)
    return {village_id: capacities for village_id in village_ids}
