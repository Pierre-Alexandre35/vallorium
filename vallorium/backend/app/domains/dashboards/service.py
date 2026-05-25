from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.domains.dashboards.schemas import (
    DashboardOverviewOut,
    DashboardTotalsOut,
    DashboardUserOut,
    DashboardVillageOut,
)
import app.domains.villages.service as village_service
import app.domains.resources.service as resource_service
import app.domains.villages.repository as village_repo
import app.domains.buildings.repository as building_repo


def _sum_resource_maps(items: list[dict[str, int]]) -> dict[str, int]:
    totals = {"wood": 0, "clay": 0, "iron": 0, "crop": 0}

    for item in items:
        for key in totals:
            totals[key] += item.get(key, 0)

    return totals


def get_dashboard_overview(db: Session, current_user) -> DashboardOverviewOut:
    villages = village_service.get_user_villages(db, current_user.id) or []
    village_ids = [v.id for v in villages]
    now = datetime.now(timezone.utc)

    production_maps_by_village_id = (
        village_service.get_village_production_maps_by_village_ids(
            db,
            village_ids,
        )
    )

    production_rows_by_village_id = (
        village_repo.get_village_production_by_village_ids(
            db_sess=db,
            village_ids=village_ids,
        )
    )

    caps_by_village_id = building_repo.get_storage_caps_by_village_ids(
        db_sess=db,
        village_ids=village_ids,
    )

    resource_maps_by_village_id = (
        resource_service.get_computed_balance_maps_by_village_ids(
            db_sess=db,
            village_ids=village_ids,
            production_rows_by_village_id=production_rows_by_village_id,
            caps_by_village_id=caps_by_village_id,
            now=now,
        )
    )

    village_rows: list[DashboardVillageOut] = []

    production_maps: list[dict[str, int]] = []
    resource_maps: list[dict[str, int]] = []

    for village in villages:
        production = production_maps_by_village_id.get(village.id, {})
        resources = resource_maps_by_village_id.get(village.id, {})

        production_maps.append(production)
        resource_maps.append(resources)

        village_rows.append(
            DashboardVillageOut(
                id=village.id,
                name=village.name,
                population=village.population,
                tile_id=village.map_tile_id,
                x=getattr(village.tile, "x", None),
                y=getattr(village.tile, "y", None),
                production=production,
                resources=resources,
            )
        )

    tribe = getattr(current_user, "tribe", None)
    tribe_name_raw = getattr(tribe, "name", None)

    if hasattr(tribe_name_raw, "value"):
        tribe_name = tribe_name_raw.value
    else:
        tribe_name = tribe_name_raw

    user = DashboardUserOut(
        id=current_user.id,
        email=current_user.email,
        tribe_id=getattr(current_user, "tribe_id", None),
        tribe_name=tribe_name,
        is_superuser=current_user.is_superuser,
    )

    totals = DashboardTotalsOut(
        villages=len(village_rows),
        population=sum(v.population for v in village_rows),
        production=_sum_resource_maps(production_maps),
        resources=_sum_resource_maps(resource_maps),
    )

    return DashboardOverviewOut(
        user=user,
        villages=village_rows,
        totals=totals,
    )
