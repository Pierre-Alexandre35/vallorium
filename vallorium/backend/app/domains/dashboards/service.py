from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.sessions import SessionUser
from app.domains.dashboards.schemas import DashboardCurrentOut, DashboardVillageOut
import app.domains.resources.service as resource_service
import app.domains.villages.service as village_service


_RESOURCE_KEYS = ("wood", "clay", "iron", "crop")


def _capacity_map(warehouse: int, granary: int) -> dict[str, int]:
    return {
        "wood": warehouse,
        "clay": warehouse,
        "iron": warehouse,
        "crop": granary,
    }


def get_current_dashboard(
    db: Session,
    current_user: SessionUser,
) -> DashboardCurrentOut:
    village_id = current_user.current_village_id
    if village_id is None:
        return DashboardCurrentOut(village=None)

    now = datetime.now(timezone.utc)

    # Celery is the normal materializer. This targeted reconciliation is only a
    # correctness fallback and combines authorization + due detection in one DB
    # round-trip when there is nothing to complete.
    village = village_service.reconcile_owned_village_if_due(
        db,
        village_id=village_id,
        owner_id=current_user.id,
        now=now,
    )

    production, resources, caps = resource_service.get_village_resource_snapshot(
        db,
        village_id=village_id,
        now=now,
    )

    production = {key: production.get(key, 0) for key in _RESOURCE_KEYS}
    resources = {key: resources.get(key, 0) for key in _RESOURCE_KEYS}

    return DashboardCurrentOut(
        village=DashboardVillageOut(
            id=village.id,
            name=village.name,
            population=village.population,
            tile_id=village.map_tile_id,
            x=village.tile.x if village.tile is not None else None,
            y=village.tile.y if village.tile is not None else None,
            production=production,
            resources=resources,
            capacities=_capacity_map(caps.warehouse, caps.granary),
        )
    )
