from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, Mapping

from sqlalchemy.orm import Session

import app.domains.buildings.repository as building_repo
import app.domains.resources.repository as resource_repo
import app.domains.villages.repository as village_repo


class VillageNotFoundError(Exception):
    pass


class InsufficientResourcesError(Exception):
    def __init__(
        self,
        resource_type_id: int,
        required: int,
        available: int,
    ) -> None:
        self.resource_type_id = resource_type_id
        self.required = required
        self.available = available

        super().__init__(
            f"Insufficient resource {resource_type_id}: "
            f"required={required}, available={available}"
        )


@dataclass(frozen=True)
class StorageCaps:
    warehouse: int
    granary: int


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_dt(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _resource_name(resource_type_name: object) -> str:
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
    rate_by_res_id: dict[int, int] = {}
    for resource_type_id, _resource_name_unused, hourly_rate in production_rows:
        rate_by_res_id[resource_type_id] = int(hourly_rate or 0)
    return rate_by_res_id


def _compute_gain(hourly_rate: int, elapsed_seconds: float) -> int:
    safe_elapsed = max(int(elapsed_seconds), 0)
    return (hourly_rate * safe_elapsed) // 3600


def get_computed_balance_map(
    db_sess: Session,
    village_id: int,
    owner_id: int,
    now: datetime | None = None,
) -> dict[str, int]:
    now_utc = _normalize_dt(now or _utcnow())

    village = village_repo.get_village_by_id(
        db_sess=db_sess,
        owner_id=owner_id,
        village_id=village_id,
    )
    if village is None:
        raise VillageNotFoundError(village_id)

    storages = resource_repo.load_storages(
        db_sess=db_sess,
        village_id=village_id,
    )

    production_rows = village_repo.get_village_production_by_village_ids(
        db_sess=db_sess,
        village_ids=[village_id],
    ).get(village_id, [])
    rate_by_res_id = _to_rate_map(production_rows)

    caps_by_village_id = building_repo.get_storage_caps_by_village_ids(
        db_sess=db_sess,
        village_ids=[village_id],
    )

    warehouse_cap, granary_cap = caps_by_village_id.get(
        village_id,
        (None, None),
    )

    caps = _build_caps(warehouse_cap, granary_cap)

    result: dict[str, int] = {}

    for storage in storages:
        last_updated_utc = _normalize_dt(storage.last_updated)
        elapsed_seconds = (now_utc - last_updated_utc).total_seconds()

        resource_name = _resource_name(storage.resource_type.name)
        cap = _cap_for(resource_name, caps)
        hourly_rate = rate_by_res_id.get(storage.resource_type_id, 0)
        gain = _compute_gain(hourly_rate, elapsed_seconds)

        computed_amount = min(storage.stored_amount + gain, cap)
        result[resource_name.lower()] = computed_amount

    return result


def settle_and_lock_village_resources(
    db_sess: Session,
    village_id: int,
    now: datetime | None = None,
):

    now_utc = _normalize_dt(now or _utcnow())

    storages = resource_repo.load_storages_for_update(
        db_sess=db_sess,
        village_id=village_id,
    )

    production_rows = village_repo.get_village_production_by_village_ids(
        db_sess=db_sess,
        village_ids=[village_id],
    ).get(village_id, [])

    rate_by_res_id = _to_rate_map(production_rows)

    caps_by_village_id = building_repo.get_storage_caps_by_village_ids(
        db_sess=db_sess,
        village_ids=[village_id],
    )

    warehouse_cap, granary_cap = caps_by_village_id.get(
        village_id,
        (None, None),
    )

    caps = _build_caps(
        warehouse_cap=warehouse_cap,
        granary_cap=granary_cap,
    )

    storage_by_resource_id = {}

    for storage in storages:
        last_updated_utc = _normalize_dt(storage.last_updated)

        elapsed_seconds = (now_utc - last_updated_utc).total_seconds()

        resource_name = _resource_name(storage.resource_type.name)

        capacity = _cap_for(
            resource_name=resource_name,
            caps=caps,
        )

        hourly_rate = rate_by_res_id.get(
            storage.resource_type_id,
            0,
        )

        gain = _compute_gain(
            hourly_rate=hourly_rate,
            elapsed_seconds=elapsed_seconds,
        )

        storage.stored_amount = min(
            storage.stored_amount + gain,
            capacity,
        )

        storage.last_updated = now_utc

        storage_by_resource_id[storage.resource_type_id] = storage

    return storage_by_resource_id


def get_computed_balance_maps_by_village_ids(
    db_sess: Session,
    village_ids: list[int],
    production_rows_by_village_id: dict[int, list[tuple[int, object, int]]],
    caps_by_village_id: dict[int, tuple[int, int]],
    now: datetime | None = None,
) -> dict[int, dict[str, int]]:
    now_utc = _normalize_dt(now or _utcnow())

    storages_by_village_id = resource_repo.load_storages_by_village_ids(
        db_sess=db_sess,
        village_ids=village_ids,
    )

    results: dict[int, dict[str, int]] = {}

    for village_id in village_ids:
        storages = storages_by_village_id.get(village_id, [])
        production_rows = production_rows_by_village_id.get(village_id, [])
        warehouse_cap, granary_cap = caps_by_village_id.get(village_id, (0, 0))

        if warehouse_cap <= 0 or granary_cap <= 0:
            results[village_id] = {}
            continue

        caps = _build_caps(warehouse_cap, granary_cap)
        rate_by_res_id = _to_rate_map(production_rows)

        village_balances: dict[str, int] = {}

        for storage in storages:
            last_updated_utc = _normalize_dt(storage.last_updated)
            elapsed_seconds = (now_utc - last_updated_utc).total_seconds()

            resource_name = _resource_name(storage.resource_type.name)
            cap = _cap_for(resource_name, caps)
            hourly_rate = rate_by_res_id.get(storage.resource_type_id, 0)
            gain = _compute_gain(hourly_rate, elapsed_seconds)

            computed_amount = min(storage.stored_amount + gain, cap)
            village_balances[resource_name.lower()] = computed_amount

        results[village_id] = village_balances

    return results


@dataclass(frozen=True)
class ResourceDelta:
    resource_type_id: int
    amount: int


def spend_resources(
    db_sess: Session,
    village_id: int,
    costs: Mapping[int, int],
    now: datetime | None = None,
) -> list[ResourceDelta]:
    """
    Settle production, validate all costs, and deduct resources.

    The caller must already have authorized access to the village.

    This function does not commit or roll back.
    """

    normalized_costs: dict[int, int] = {}

    for resource_type_id, amount in costs.items():
        resource_id = int(resource_type_id)
        required_amount = int(amount)

        normalized_costs[resource_id] = (
            normalized_costs.get(resource_id, 0) + required_amount
        )

    if not normalized_costs:
        return []

    storages = settle_and_lock_village_resources(
        db_sess=db_sess,
        village_id=village_id,
        now=now,
    )

    # Validate all resources first.
    # Do not partially deduct anything.
    for resource_type_id, required_amount in normalized_costs.items():
        storage = storages.get(resource_type_id)

        if storage.stored_amount < required_amount:
            raise InsufficientResourcesError(
                resource_type_id=resource_type_id,
                required=required_amount,
                available=storage.stored_amount,
            )

    deltas: list[ResourceDelta] = []

    # All resources are sufficient, so deductions can now be applied.
    for resource_type_id, required_amount in normalized_costs.items():
        storage = storages[resource_type_id]

        storage.stored_amount -= required_amount

        deltas.append(
            ResourceDelta(
                resource_type_id=resource_type_id,
                amount=-required_amount,
            )
        )

    return deltas
