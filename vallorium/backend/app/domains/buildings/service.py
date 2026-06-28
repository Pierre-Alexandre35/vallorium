from __future__ import annotations

from typing import Dict, Optional

from sqlalchemy.orm import Session

import app.domains.buildings.repository as building_repo
import app.domains.villages.repository as village_repo

from app.domains.buildings.schemas import (
    BuildingTypeWithLevelsOut,
    BuildingLevelOut,
    BuildingUpgradeResourceOut,
    BuildingPrerequisiteOut,
    BuildingLevelAvailabilityOut,
    BuildingAvailabilityListOut,
)


def list_building_catalog(
    db_sess: Session,
    tribe_id: Optional[int] = None,
) -> list[BuildingTypeWithLevelsOut]:
    building_types = building_repo.fetch_building_catalog(
        db_sess,
        tribe_id=tribe_id,
    )

    output: list[BuildingTypeWithLevelsOut] = []

    for building_type in building_types:
        levels: list[BuildingLevelOut] = []

        for level in building_type.levels:
            costs = [
                BuildingUpgradeResourceOut(
                    id=cost.id,
                    resource_type_id=cost.resource_type_id,
                    amount=cost.amount,
                )
                for cost in level.costs
            ]

            prerequisites = [
                BuildingPrerequisiteOut(
                    required_building_type_id=(prerequisite.required_building_type_id),
                    required_level=prerequisite.required_level,
                )
                for prerequisite in level.prerequisites
            ]

            levels.append(
                BuildingLevelOut(
                    id=level.id,
                    building_type_id=level.building_type_id,
                    level=level.level,
                    construction_time=level.construction_time,
                    population_required=level.population_required or 0,
                    costs=costs,
                    prerequisites=prerequisites,
                )
            )

        output.append(
            BuildingTypeWithLevelsOut(
                id=building_type.id,
                name=building_type.name,
                description=building_type.description,
                tribe_id=building_type.tribe_id,
                levels=levels,
            )
        )

    return output
