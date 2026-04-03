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


def get_storage_caps(db_sess: Session, village_id: int) -> tuple[int, int]:
    """
    Return (warehouse_capacity, granary_capacity) for a village.

    Current assumption:
    - village_resource_storage has one row per resource
    - building capacities are determined from configured capacity tables
    - if you do not yet store actual village building levels for warehouse/granary,
      this falls back to level 0

    Replace the level lookup part with your real village-building table once present.
    """

    # TODO: replace these defaults with real village building levels once you have
    # a village buildings table such as VillageBuilding / VillageStructure.
    warehouse_level = 0
    granary_level = 0

    warehouse_row = (
        db_sess.query(db.WarehouseCapacity)
        .filter(db.WarehouseCapacity.level == warehouse_level)
        .one_or_none()
    )
    granary_row = (
        db_sess.query(db.GranaryCapacity)
        .filter(db.GranaryCapacity.level == granary_level)
        .one_or_none()
    )

    if warehouse_row is None:
        raise ValueError(
            f"Missing warehouse capacity configuration for level {warehouse_level}"
        )
    if granary_row is None:
        raise ValueError(
            f"Missing granary capacity configuration for level {granary_level}"
        )

    return int(warehouse_row.capacity), int(granary_row.capacity)
