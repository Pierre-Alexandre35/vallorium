from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.domains.dashboards.schemas import (
    DashboardOverviewOut,
    DashboardTotalsOut,
    DashboardUserOut,
    DashboardVillageOut,
)
import app.domains.buildings.repository as building_repo
import app.domains.resources.service as resource_service
import app.domains.villages.repository as village_repo


_RESOURCE_KEYS = ("wood", "clay", "iron", "crop")


def _sum_resource_maps(items: list[dict[str, int]]) -> dict[str, int]:
    totals = {key: 0 for key in _RESOURCE_KEYS}

    for item in items:
        for key in totals:
            totals[key] += item.get(key, 0)

    return totals


def _production_maps(
    rows_by_village_id: dict[int, list[tuple[int, object, int]]],
) -> dict[int, dict[str, int]]:
    result: dict[int, dict[str, int]] = {}

    for village_id, rows in rows_by_village_id.items():
        production: dict[str, int] = {key: 0 for key in _RESOURCE_KEYS}
        for _resource_type_id, resource_type_name, hourly_rate in rows:
            name = getattr(resource_type_name, "value", str(resource_type_name))
            production[name.lower()] = int(hourly_rate or 0)
        result[village_id] = production

    return result


def _capacity_map(warehouse: int, granary: int) -> dict[str, int]:
    return {
        "wood": warehouse,
        "clay": warehouse,
        "iron": warehouse,
        "crop": granary,
    }


def get_dashboard_overview(db: Session, current_user) -> DashboardOverviewOut:
    # This repository query eager-loads each village's tile, avoiding an N+1 query
    # when serializing coordinates below.
    villages = village_repo.get_user_villages(db, current_user.id)
    village_ids = [village.id for village in villages]
    now = datetime.now(timezone.utc)

    # Production is fetched once and reused both for the response and for the
    # resource-accrual calculation.
    production_rows_by_village_id = village_repo.get_village_production_by_village_ids(
        db_sess=db,
        village_ids=village_ids,
    )
    production_maps_by_village_id = _production_maps(
        production_rows_by_village_id
    )

    caps_by_village_id = building_repo.get_storage_caps_by_village_ids(
        db_sess=db,
        village_ids=village_ids,
    )

    resource_maps_by_village_id = resource_service.get_computed_balance_maps_by_village_ids(
        db_sess=db,
        village_ids=village_ids,
        production_rows_by_village_id=production_rows_by_village_id,
        caps_by_village_id=caps_by_village_id,
        now=now,
    )

    village_rows: list[DashboardVillageOut] = []
    production_maps: list[dict[str, int]] = []
    resource_maps: list[dict[str, int]] = []

    for village in villages:
        production = {
            key: production_maps_by_village_id.get(village.id, {}).get(key, 0)
            for key in _RESOURCE_KEYS
        }
        resources = {
            key: resource_maps_by_village_id.get(village.id, {}).get(key, 0)
            for key in _RESOURCE_KEYS
        }
        warehouse_cap, granary_cap = caps_by_village_id.get(village.id, (0, 0))

        production_maps.append(production)
        resource_maps.append(resources)

        village_rows.append(
            DashboardVillageOut(
                id=village.id,
                name=village.name,
                population=village.population,
                tile_id=village.map_tile_id,
                x=village.tile.x if village.tile is not None else None,
                y=village.tile.y if village.tile is not None else None,
                production=production,
                resources=resources,
                capacities=_capacity_map(warehouse_cap, granary_cap),
            )
        )

    tribe = getattr(current_user, "tribe", None)
    tribe_name_raw = getattr(tribe, "name", None)
    tribe_name = (
        tribe_name_raw.value
        if hasattr(tribe_name_raw, "value")
        else tribe_name_raw
    )

    user = DashboardUserOut(
        id=current_user.id,
        email=current_user.email,
        tribe_id=current_user.tribe_id,
        tribe_name=tribe_name,
        is_superuser=current_user.is_superuser,
    )

    totals = DashboardTotalsOut(
        villages=len(village_rows),
        population=sum(village.population for village in village_rows),
        production=_sum_resource_maps(production_maps),
        resources=_sum_resource_maps(resource_maps),
    )

    return DashboardOverviewOut(
        user=user,
        villages=village_rows,
        totals=totals,
    )
