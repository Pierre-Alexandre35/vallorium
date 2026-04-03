# app/services/resource_service.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy.orm import Session

import app.db.models as db
from app.repositories import building_repo, resource_repo, village_repo
from app.schemas.resource import ResourceBalance
from app.schemas.village import VillageResourceOut


class VillageNotFoundError(Exception):
    pass


@dataclass(frozen=True)
class StorageCaps:
    warehouse: int
    granary: int


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_dt(dt: datetime) -> datetime:
    """
    Ensure we always do arithmetic with timezone-aware UTC datetimes.
    If DB returns naive UTC, treat it as UTC.
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _resource_name(resource_type_name: object) -> str:
    """
    Supports either enum-backed names or plain strings.
    """
    return getattr(resource_type_name, "value", str(resource_type_name))


def _cap_for(resource_name: str, caps: StorageCaps) -> int:
    return caps.granary if resource_name == "Crop" else caps.warehouse


def _build_caps(warehouse_cap: int | None, granary_cap: int | None) -> StorageCaps:
    if warehouse_cap is None or warehouse_cap <= 0:
        raise ValueError("Invalid warehouse capacity")
    if granary_cap is None or granary_cap <= 0:
        raise ValueError("Invalid granary capacity")
    return StorageCaps(warehouse=warehouse_cap, granary=granary_cap)


def _to_rate_map(
    production_rows: Iterable[tuple[int, object, int]],
) -> dict[int, int]:
    """
    Expected row shape from repository:
      (resource_type_id, resource_type_name, hourly_production)
    """
    rate_by_res_id: dict[int, int] = {}
    for resource_type_id, _resource_name_unused, hourly_rate in production_rows:
        rate_by_res_id[resource_type_id] = int(hourly_rate or 0)
    return rate_by_res_id


def _compute_gain(hourly_rate: int, elapsed_seconds: float) -> int:
    """
    Integer-only gain calculation.
    Floors partial units, which is acceptable if last_updated is advanced only
    when accrual is persisted.

    If later you want perfect fractional carry, add a remainder column.
    """
    safe_elapsed = max(int(elapsed_seconds), 0)
    return (hourly_rate * safe_elapsed) // 3600


def accrue_and_get_balances(
    db_sess: Session,
    village_id: int,
    owner_id: int,
    now: datetime | None = None,
) -> VillageResourceOut:
    now_utc = _normalize_dt(now or _utcnow())

    village = village_repo.get_village_by_id(
        db_sess=db_sess,
        owner_id=owner_id,
        village_id=village_id,
    )
    if village is None:
        raise VillageNotFoundError(village_id)

    # Lock resource storage rows to prevent concurrent double-accrual.
    storages = resource_repo.load_storages_for_update(
        db_sess=db_sess,
        village_id=village_id,
    )

    production_rows = village_repo.get_village_production_by_resource_id(
        db_sess=db_sess,
        village_id=village_id,
    )
    rate_by_res_id = _to_rate_map(production_rows)

    warehouse_cap, granary_cap = building_repo.get_storage_caps(
        db_sess=db_sess,
        village_id=village_id,
    )
    caps = _build_caps(warehouse_cap, granary_cap)

    for storage in storages:
        last_updated_utc = _normalize_dt(storage.last_updated)
        elapsed_seconds = (now_utc - last_updated_utc).total_seconds()

        resource_name = _resource_name(storage.resource_type.name)
        cap = _cap_for(resource_name, caps)
        hourly_rate = rate_by_res_id.get(storage.resource_type_id, 0)
        gain = _compute_gain(hourly_rate, elapsed_seconds)

        new_amount = storage.stored_amount + gain
        storage.stored_amount = min(new_amount, cap)
        storage.last_updated = now_utc

    db_sess.commit()

    balances = [
        ResourceBalance(
            resource_type=_resource_name(storage.resource_type.name),
            amount=storage.stored_amount,
        )
        for storage in storages
    ]

    return VillageResourceOut(
        village_id=village.id,
        village_name=village.name,
        resources=balances,
    )
