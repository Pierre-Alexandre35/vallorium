from __future__ import annotations
from typing import Dict, Optional, List

from sqlalchemy.orm import Session

import app.domains.buildings.repository as building_repo
import app.domains.villages.repository as village_repo
from app.domains.buildings.schemas import (
    BuildingTypeOut,
    BuildingLevelOut,
    BuildingPrerequisiteOut,
    BuildingLevelAvailabilityOut,
    BuildingAvailabilityListOut,
)


def list_building_catalog(
    db_sess: Session, *, tribe_id: Optional[int] = None
) -> List[BuildingTypeOut]:
    btypes = building_repo.fetch_building_catalog(db_sess, tribe_id=tribe_id)
    res_name_by_id = building_repo.resources_enum_name_by_id(db_sess)

    out: List[BuildingTypeOut] = []
    for bt in sorted(btypes, key=lambda b: b.name):  # stable order
        levels: List[BuildingLevelOut] = []
        for lvl in sorted(bt.levels, key=lambda x: x.level):
            cost = [
                {
                    "resource_id": c.resource_type_id,
                    "resource_type": res_name_by_id.get(
                        c.resource_type_id, "UNKNOWN"
                    ),
                    "amount": c.amount,
                }
                for c in lvl.costs
            ]

            prereqs = [
                BuildingPrerequisiteOut(
                    required_building=p.required_building_type.name,
                    required_level=p.required_level,
                )
                for p in lvl.prerequisites
            ]

            levels.append(
                BuildingLevelOut(
                    level=lvl.level,
                    time=lvl.construction_time,
                    population_required=getattr(lvl, "population_required", 0)
                    or 0,
                    cost=cost,
                    prerequisites=prereqs,
                )
            )

        out.append(
            BuildingTypeOut(
                name=bt.name,
                description=bt.description,
                levels=levels,
            )
        )

    return out


def evaluate_availability_for_village(
    db_sess: Session,
    *,
    village_id: int,
    tribe_id: Optional[int] = None,
    current_building_levels: Dict[str, int],  # {"Main Building": 2, ...}
    resources_by_enum_name: Dict[str, int],  # {"WOOD": 300, "CLAY": ...}
) -> BuildingAvailabilityListOut:
    """
    Evaluate what the village can build next (current+1 for each building),
    given population, resources, and prerequisites.
    """
    # Load state
    village = village_repo.get_village_with_tile(db_sess, village_id)
    if not village:
        raise ValueError("Village not found")

    catalog = list_building_catalog(db_sess, tribe_id=tribe_id)

    items: List[BuildingLevelAvailabilityOut] = []

    def have_building_level(name: str) -> int:
        return current_building_levels.get(name, 0)

    for b in catalog:
        cur_lvl = have_building_level(b.name)
        for lvl in b.levels:
            if lvl.level <= cur_lvl:
                continue
            if lvl.level > cur_lvl + 1:
                continue  # Only show next level

            unmet: List[str] = []

            if village.population < lvl.population_required:
                unmet.append(
                    f"Population {village.population}/{lvl.population_required}"
                )

            for cost in lvl.cost:
                rkey = cost.resource_type
                need = cost.amount
                have = resources_by_enum_name.get(rkey, 0)
                if have < need:
                    unmet.append(f"{rkey} {have}/{need}")

            for p in lvl.prerequisites:
                have_l = have_building_level(p.required_building)
                if have_l < p.required_level:
                    unmet.append(
                        f"{p.required_building} {have_l}/{p.required_level}"
                    )

            items.append(
                BuildingLevelAvailabilityOut(
                    building=b.name,
                    level=lvl.level,
                    can_build=len(unmet) == 0,
                    unmet=unmet,
                    cost=lvl.cost,
                    population_required=lvl.population_required,
                    prerequisites=lvl.prerequisites,
                )
            )

    return BuildingAvailabilityListOut(items=items)
