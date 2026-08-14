"""Idempotent development seed for the Vallorium data model.

Seed policy
-----------
REFERENCE_MASTER
    Seeded and updated from ``game_config``:
    resources_types, tribe_attributes, farm_level, farm_level_cost,
    building_type, building_level, building_level_cost,
    building_prerequisite, granary_capacity, warehouse_capacity.

CORE_WORLD
    Seeded here only where appropriate:
    optional development admin user, map_tile, map_tile_resource_layout.

CURRENT_STATE
    NOT globally seeded. ``village_farm_plots``, ``village_building``, and
    ``village_resource_storage`` must be created by the village-onboarding
    application service for a specific village.

RUNTIME_TRANSACTION
    NEVER seeded. ``village_farm_upgrade`` and ``village_building_upgrade``
    are created by gameplay commands.

LEDGER_TRANSACTION
    NEVER globally seeded. ``village_resource_transaction`` and its entries
    are written atomically whenever a village's resource balance changes.

Expected farm configuration
---------------------------
Preferred flat form::

    "farm_levels": [
        {
            "resource": "WOOD",
            "level": 0,
            "production_per_hour": 30,
            "construction_time_seconds": 0,
            "cost": {}
        },
        {
            "resource": "WOOD",
            "level": 1,
            "production_per_hour": 40,
            "construction_time_seconds": 60,
            "cost": {"WOOD": 40, "CLAY": 100, "IRON": 50, "CROP": 60}
        }
    ]

The grouped form is also accepted::

    "farm_levels": {
        "WOOD": [{"level": 0, ...}, {"level": 1, ...}],
        "CLAY": [...],
        "IRON": [...],
        "CROP": [...]
    }
"""

from __future__ import annotations

import os
import random
import time
from collections.abc import Callable, Iterable, Mapping
from typing import Any

from sqlalchemy import insert, select
from sqlalchemy.orm import Session

import app.db.models as db
from app.core.config_loader import game_config
from app.core.crypto import get_password_hash
from app.db.session import SessionLocal

SEED_POLICY: dict[str, tuple[str, ...]] = {
    "REFERENCE_MASTER": (
        "resources_types",
        "tribe_attributes",
        "tribe_advantage",
        "farm_level",
        "farm_level_cost",
        "building_type",
        "building_level",
        "building_level_cost",
        "building_prerequisite",
        "granary_capacity",
        "warehouse_capacity",
    ),
    "CORE_WORLD": (
        "user (development admin only)",
        "map_tile",
        "map_tile_resource_layout",
    ),
    "CURRENT_STATE": (),
    "RUNTIME_TRANSACTION": (),
    "LEDGER_TRANSACTION": (),
}


def timed_step(
    label: str,
    fn: Callable[[Session], None],
    sess: Session,
) -> None:
    start = time.perf_counter()
    fn(sess)
    elapsed = time.perf_counter() - start
    print(f"⏱️ {label}: {elapsed:.2f}s")


def commit_phase(sess: Session, label: str) -> None:
    start = time.perf_counter()
    sess.commit()
    elapsed = time.perf_counter() - start
    print(f"💾 Commit '{label}': {elapsed:.2f}s")


def _enum_from_config(enum_class: type[Any], raw_value: Any) -> Any:
    """Accept an enum member, member name (WOOD), or value (Wood)."""
    if isinstance(raw_value, enum_class):
        return raw_value

    if not isinstance(raw_value, str):
        raise ValueError(
            f"Expected {enum_class.__name__} as a string or enum member; "
            f"received {raw_value!r}."
        )

    normalized = raw_value.strip()

    try:
        return enum_class[normalized.upper()]
    except KeyError:
        pass

    for member in enum_class:
        if str(member.value).casefold() == normalized.casefold():
            return member

    valid = [member.name for member in enum_class]
    raise ValueError(
        f"Unknown {enum_class.__name__} value {raw_value!r}. "
        f"Expected one of {valid}."
    )


def _resource_rows_by_enum(sess: Session) -> dict[db.Resource, db.ResourcesTypes]:
    rows = sess.scalars(select(db.ResourcesTypes)).all()
    return {row.name: row for row in rows}


def _resource_row(
    resource_rows: Mapping[db.Resource, db.ResourcesTypes],
    raw_value: Any,
) -> db.ResourcesTypes:
    resource = _enum_from_config(db.Resource, raw_value)
    try:
        return resource_rows[resource]
    except KeyError as exc:
        raise ValueError(
            f"Resource {resource.value!r} has not been seeded yet."
        ) from exc


# ---------------------------------------------------------------------------
# REFERENCE / MASTER DATA
# ---------------------------------------------------------------------------


def seed_tribes(sess: Session) -> None:
    definitions = {
        db.Tribe.ROMANS: {
            "bonus": "Build simultaneously",
            "playstyle": "Balanced",
            "description": (
                "Versatile empire builders with strong infrastructure "
                "and a balanced military."
            ),
            "advantages": [
                {
                    "code": "construction",
                    "title": "Efficient builders",
                    "description": "Excellent at developing settlements quickly.",
                },
                {
                    "code": "versatility",
                    "title": "Versatile army",
                    "description": "Flexible offensive and defensive options.",
                },
                {
                    "code": "economy",
                    "title": "Strong economy",
                    "description": "Reliable infrastructure for long-term growth.",
                },
            ],
        },

        db.Tribe.TEUTONS: {
            "bonus": "Fast looting",
            "playstyle": "Aggressive",
            "description": (
                "Aggressive warriors built around raiding, expansion "
                "and economical armies."
            ),
            "advantages": [
                {
                    "code": "raiding",
                    "title": "Powerful raiders",
                    "description": "Well suited to frequent offensive raids.",
                },
                {
                    "code": "infantry",
                    "title": "Affordable infantry",
                    "description": "Can field large early armies efficiently.",
                },
                {
                    "code": "pressure",
                    "title": "Early pressure",
                    "description": "Strong options for aggressive expansion.",
                },
            ],
        },

        db.Tribe.GAULS: {
            "bonus": "Great defense",
            "playstyle": "Defensive",
            "description": (
                "Mobile defenders with strong protection and flexible "
                "expansion options."
            ),
            "advantages": [
                {
                    "code": "defense",
                    "title": "Strong defenders",
                    "description": "Excellent defensive military options.",
                },
                {
                    "code": "mobility",
                    "title": "High mobility",
                    "description": "Fast units make movement and support easier.",
                },
                {
                    "code": "expansion",
                    "title": "Flexible expansion",
                    "description": "Well suited to safer territorial growth.",
                },
            ],
        },
    }

    existing = {
        row.name: row
        for row in sess.scalars(select(db.TribeAttributes)).all()
    }

    created = 0
    updated = 0

    for tribe_name, definition in definitions.items():
        tribe = existing.get(tribe_name)

        if tribe is None:
            tribe = db.TribeAttributes(
                name=tribe_name,
                bonus=definition["bonus"],
                description=definition["description"],
                playstyle=definition["playstyle"],
            )
            sess.add(tribe)
            sess.flush()

            existing[tribe_name] = tribe
            created += 1

        else:
            changed = False

            for field in ("bonus", "description", "playstyle"):
                new_value = definition[field]

                if getattr(tribe, field) != new_value:
                    setattr(tribe, field, new_value)
                    changed = True

            if changed:
                updated += 1

        existing_advantages = {
            advantage.code: advantage
            for advantage in tribe.advantages
        }

        desired_codes: set[str] = set()

        for position, advantage_definition in enumerate(
            definition["advantages"]
        ):
            code = advantage_definition["code"]
            desired_codes.add(code)

            advantage = existing_advantages.get(code)

            if advantage is None:
                tribe.advantages.append(
                    db.TribeAdvantage(
                        code=code,
                        title=advantage_definition["title"],
                        description=advantage_definition["description"],
                        position=position,
                    )
                )
                continue

            advantage.title = advantage_definition["title"]
            advantage.description = advantage_definition["description"]
            advantage.position = position

        # Remove advantages that were removed from seed configuration.
        for code, advantage in existing_advantages.items():
            if code not in desired_codes:
                sess.delete(advantage)

    sess.flush()

    print(
        f"✅ Tribes seeded "
        f"({created} created, {updated} updated)"
    )


def seed_resources(sess: Session) -> None:
    existing = {row.name for row in sess.scalars(select(db.ResourcesTypes)).all()}
    rows = [
        db.ResourcesTypes(name=resource)
        for resource in db.Resource
        if resource not in existing
    ]

    if rows:
        sess.add_all(rows)
        sess.flush()

    print(f"✅ Resources seeded ({len(rows)} created)")


def _iter_farm_level_definitions() -> Iterable[dict[str, Any]]:
    raw_definitions = game_config.get("farm_levels")
    if not raw_definitions:
        raise ValueError(
            "game_config must define 'farm_levels'. Production is now stored "
            "in FarmLevel together with construction duration and costs."
        )

    if isinstance(raw_definitions, list):
        for definition in raw_definitions:
            if not isinstance(definition, dict):
                raise ValueError("Every farm_levels list item must be an object.")
            yield definition
        return

    if isinstance(raw_definitions, dict):
        for resource_name, levels in raw_definitions.items():
            if not isinstance(levels, list):
                raise ValueError(f"farm_levels[{resource_name!r}] must be a list.")
            for level_definition in levels:
                if not isinstance(level_definition, dict):
                    raise ValueError(
                        f"Every level for {resource_name!r} must be an object."
                    )
                yield {"resource": resource_name, **level_definition}
        return

    raise ValueError("game_config['farm_levels'] must be a list or object.")


def seed_farm_levels(sess: Session) -> None:
    """Seed FarmLevel and FarmLevelCost, replacing the former Production seed."""
    resource_rows = _resource_rows_by_enum(sess)
    if not resource_rows:
        raise ValueError("Resources must be seeded before farm levels.")

    existing_levels = {
        (row.farm_resource_type_id, row.level): row
        for row in sess.scalars(select(db.FarmLevel)).all()
    }

    created_levels = 0
    updated_levels = 0
    created_costs = 0
    updated_costs = 0
    deleted_costs = 0
    seen_keys: set[tuple[int, int]] = set()

    for definition in _iter_farm_level_definitions():
        resource_row = _resource_row(resource_rows, definition.get("resource"))
        level = int(definition["level"])
        production_per_hour = int(definition["production_per_hour"])
        construction_time_seconds = int(
            definition.get(
                "construction_time_seconds",
                definition.get("time", 0),
            )
        )

        key = (resource_row.id, level)
        if key in seen_keys:
            raise ValueError(
                f"Duplicate farm level definition for "
                f"{resource_row.name.value} level {level}."
            )
        seen_keys.add(key)

        farm_level = existing_levels.get(key)
        if farm_level is None:
            farm_level = db.FarmLevel(
                farm_resource_type_id=resource_row.id,
                level=level,
                production_per_hour=production_per_hour,
                construction_time_seconds=construction_time_seconds,
            )
            sess.add(farm_level)
            sess.flush()
            existing_levels[key] = farm_level
            created_levels += 1
        else:
            changed = False
            if farm_level.production_per_hour != production_per_hour:
                farm_level.production_per_hour = production_per_hour
                changed = True
            if farm_level.construction_time_seconds != construction_time_seconds:
                farm_level.construction_time_seconds = construction_time_seconds
                changed = True
            if changed:
                updated_levels += 1

        configured_costs = definition.get("cost", definition.get("costs", {}))
        if not isinstance(configured_costs, dict):
            raise ValueError(
                f"Cost for {resource_row.name.value} level {level} must be an object."
            )

        existing_costs = {
            cost.payment_resource_type_id: cost for cost in farm_level.costs
        }
        desired_cost_resource_ids: set[int] = set()

        for raw_payment_resource, raw_amount in configured_costs.items():
            amount = int(raw_amount)
            if amount <= 0:
                raise ValueError(
                    f"Farm costs must be positive; received {amount} for "
                    f"{resource_row.name.value} level {level}."
                )

            payment_resource = _resource_row(
                resource_rows,
                raw_payment_resource,
            )
            desired_cost_resource_ids.add(payment_resource.id)

            cost = existing_costs.get(payment_resource.id)
            if cost is None:
                farm_level.costs.append(
                    db.FarmLevelCost(
                        payment_resource_type_id=payment_resource.id,
                        amount=amount,
                    )
                )
                created_costs += 1
            elif cost.amount != amount:
                cost.amount = amount
                updated_costs += 1

        for payment_resource_id, cost in existing_costs.items():
            if payment_resource_id not in desired_cost_resource_ids:
                sess.delete(cost)
                deleted_costs += 1

    sess.flush()
    print(
        "✅ Farm levels seeded "
        f"({created_levels} levels created, {updated_levels} levels updated, "
        f"{created_costs} costs created, {updated_costs} costs updated, "
        f"{deleted_costs} stale costs removed)"
    )


def seed_warehouse_and_granary_capacity(sess: Session) -> None:
    granary_values = game_config["capacities"]["granary"]
    warehouse_values = game_config["capacities"]["warehouse"]

    existing_granary = {
        row.level: row for row in sess.scalars(select(db.GranaryCapacity)).all()
    }
    existing_warehouse = {
        row.level: row for row in sess.scalars(select(db.WarehouseCapacity)).all()
    }

    granary_created = granary_updated = 0
    warehouse_created = warehouse_updated = 0

    for raw_level, raw_capacity in granary_values.items():
        level = int(raw_level)
        capacity = int(raw_capacity)
        row = existing_granary.get(level)
        if row is None:
            sess.add(db.GranaryCapacity(level=level, capacity=capacity))
            granary_created += 1
        elif row.capacity != capacity:
            row.capacity = capacity
            granary_updated += 1

    for raw_level, raw_capacity in warehouse_values.items():
        level = int(raw_level)
        capacity = int(raw_capacity)
        row = existing_warehouse.get(level)
        if row is None:
            sess.add(db.WarehouseCapacity(level=level, capacity=capacity))
            warehouse_created += 1
        elif row.capacity != capacity:
            row.capacity = capacity
            warehouse_updated += 1

    sess.flush()
    print(
        "✅ Capacities seeded "
        f"(granary: {granary_created} created/{granary_updated} updated; "
        f"warehouse: {warehouse_created} created/{warehouse_updated} updated)"
    )


def seed_buildings(sess: Session) -> None:
    building_definitions = game_config.get("buildings", [])
    if not building_definitions:
        print("ℹ️ No buildings found in config; skipping.")
        return

    resource_rows = _resource_rows_by_enum(sess)
    if not resource_rows:
        raise ValueError("Resources must be seeded before buildings.")

    tribe_rows = {
        row.name: row for row in sess.scalars(select(db.TribeAttributes)).all()
    }

    existing_types = sess.scalars(select(db.BuildingType)).all()
    type_by_key: dict[tuple[str, int | None], db.BuildingType] = {
        (row.name, row.tribe_id): row for row in existing_types
    }

    configured_types: dict[tuple[str, int | None], db.BuildingType] = {}
    created_types = 0
    updated_types = 0

    # Pass 1: types. Prerequisites can then resolve any configured building.
    for definition in building_definitions:
        tribe_id: int | None = None
        raw_tribe = definition.get("tribe")
        if raw_tribe is not None:
            tribe = _enum_from_config(db.Tribe, raw_tribe)
            tribe_row = tribe_rows.get(tribe)
            if tribe_row is None:
                raise ValueError(f"Tribe {tribe.value!r} has not been seeded.")
            tribe_id = tribe_row.id

        key = (definition["name"], tribe_id)
        if key in configured_types:
            raise ValueError(f"Duplicate building definition for {key!r}.")

        building_type = type_by_key.get(key)
        if building_type is None:
            building_type = db.BuildingType(
                name=definition["name"],
                description=definition.get("description"),
                tribe_id=tribe_id,
            )
            sess.add(building_type)
            sess.flush()
            type_by_key[key] = building_type
            created_types += 1
        else:
            description = definition.get("description")
            if building_type.description != description:
                building_type.description = description
                updated_types += 1

        configured_types[key] = building_type

    # Pass 2: levels.
    existing_levels = {
        (row.building_type_id, row.level): row
        for row in sess.scalars(select(db.BuildingLevel)).all()
    }
    configured_levels: dict[tuple[str, int | None, int], db.BuildingLevel] = {}
    created_levels = 0
    updated_levels = 0

    for definition in building_definitions:
        raw_tribe = definition.get("tribe")
        tribe_id = None
        if raw_tribe is not None:
            tribe = _enum_from_config(db.Tribe, raw_tribe)
            tribe_id = tribe_rows[tribe].id

        building_type = configured_types[(definition["name"], tribe_id)]

        for level_definition in definition.get("levels", []):
            level = int(level_definition["level"])
            construction_time_seconds = int(
                level_definition.get(
                    "construction_time_seconds",
                    level_definition.get("time", 0),
                )
            )
            population_increase = int(
                level_definition.get(
                    "population_increase",
                    level_definition.get("population_required", 0),
                )
            )

            key = (building_type.id, level)
            building_level = existing_levels.get(key)
            if building_level is None:
                building_level = db.BuildingLevel(
                    building_type_id=building_type.id,
                    level=level,
                    construction_time_seconds=construction_time_seconds,
                    population_increase=population_increase,
                )
                sess.add(building_level)
                sess.flush()
                existing_levels[key] = building_level
                created_levels += 1
            else:
                changed = False
                if (
                    building_level.construction_time_seconds
                    != construction_time_seconds
                ):
                    building_level.construction_time_seconds = construction_time_seconds
                    changed = True
                if building_level.population_increase != population_increase:
                    building_level.population_increase = population_increase
                    changed = True
                if changed:
                    updated_levels += 1

            configured_levels[(definition["name"], tribe_id, level)] = building_level

    # Pass 3: costs and prerequisites.
    created_costs = updated_costs = deleted_costs = 0
    created_prerequisites = updated_prerequisites = deleted_prerequisites = 0

    for definition in building_definitions:
        raw_tribe = definition.get("tribe")
        tribe_id = None
        if raw_tribe is not None:
            tribe = _enum_from_config(db.Tribe, raw_tribe)
            tribe_id = tribe_rows[tribe].id

        for level_definition in definition.get("levels", []):
            level = int(level_definition["level"])
            building_level = configured_levels[(definition["name"], tribe_id, level)]

            existing_costs = {
                cost.payment_resource_type_id: cost for cost in building_level.costs
            }
            desired_cost_ids: set[int] = set()

            configured_costs = level_definition.get(
                "cost",
                level_definition.get("costs", {}),
            )
            for raw_resource, raw_amount in configured_costs.items():
                amount = int(raw_amount)
                if amount <= 0:
                    raise ValueError(
                        f"Building costs must be positive; got {amount} for "
                        f"{definition['name']} level {level}."
                    )

                resource_row = _resource_row(resource_rows, raw_resource)
                desired_cost_ids.add(resource_row.id)
                cost = existing_costs.get(resource_row.id)

                if cost is None:
                    building_level.costs.append(
                        db.BuildingLevelCost(
                            payment_resource_type_id=resource_row.id,
                            amount=amount,
                        )
                    )
                    created_costs += 1
                elif cost.amount != amount:
                    cost.amount = amount
                    updated_costs += 1

            for resource_id, cost in existing_costs.items():
                if resource_id not in desired_cost_ids:
                    sess.delete(cost)
                    deleted_costs += 1

            existing_prerequisites = {
                prereq.required_building_type_id: prereq
                for prereq in building_level.prerequisites
            }
            desired_prerequisite_ids: set[int] = set()

            for prerequisite_definition in level_definition.get(
                "prerequisites",
                [],
            ):
                prerequisite_name = prerequisite_definition["building"]
                prerequisite_tribe_id = tribe_id

                # Prefer same-tribe prerequisite; fall back to global.
                prerequisite_type = configured_types.get(
                    (prerequisite_name, prerequisite_tribe_id)
                ) or configured_types.get((prerequisite_name, None))

                if prerequisite_type is None:
                    raise ValueError(
                        f"Unknown prerequisite building {prerequisite_name!r} "
                        f"for {definition['name']} level {level}."
                    )

                required_level = int(prerequisite_definition["level"])
                desired_prerequisite_ids.add(prerequisite_type.id)
                prerequisite = existing_prerequisites.get(prerequisite_type.id)

                if prerequisite is None:
                    building_level.prerequisites.append(
                        db.BuildingPrerequisite(
                            required_building_type_id=prerequisite_type.id,
                            required_level=required_level,
                        )
                    )
                    created_prerequisites += 1
                elif prerequisite.required_level != required_level:
                    prerequisite.required_level = required_level
                    updated_prerequisites += 1

            for required_type_id, prerequisite in existing_prerequisites.items():
                if required_type_id not in desired_prerequisite_ids:
                    sess.delete(prerequisite)
                    deleted_prerequisites += 1

    sess.flush()
    print(
        "✅ Buildings seeded "
        f"({created_types} types created/{updated_types} updated, "
        f"{created_levels} levels created/{updated_levels} updated, "
        f"costs {created_costs} created/{updated_costs} updated/"
        f"{deleted_costs} removed, prerequisites "
        f"{created_prerequisites} created/{updated_prerequisites} updated/"
        f"{deleted_prerequisites} removed)"
    )


# ---------------------------------------------------------------------------
# CORE / WORLD DATA
# ---------------------------------------------------------------------------


def seed_admin_user(sess: Session) -> None:
    email = os.getenv("SEED_ADMIN_EMAIL", "admin@example.com")
    password = os.getenv("SEED_ADMIN_PASSWORD", "admin123")

    existing = sess.scalar(select(db.User).where(db.User.email == email))
    if existing is not None:
        print("ℹ️ Development admin already exists; skipping.")
        return

    romans = sess.scalar(
        select(db.TribeAttributes).where(db.TribeAttributes.name == db.Tribe.ROMANS)
    )
    if romans is None:
        raise ValueError("Romans tribe must be seeded before the admin user.")

    sess.add(
        db.User(
            email=email,
            hashed_password=get_password_hash(password),
            is_superuser=True,
            is_active=True,
            tribe_id=romans.id,
        )
    )
    sess.flush()

    if "SEED_ADMIN_PASSWORD" not in os.environ:
        print(
            "⚠️ Using the development default admin password. "
            "Set SEED_ADMIN_PASSWORD outside local development."
        )
    print(f"✅ Development admin created ({email})")


def seed_map_tiles(sess: Session) -> None:
    existing_tile_count = sess.query(db.MapTile).count()
    if existing_tile_count > 0:
        print(f"ℹ️ Map already contains {existing_tile_count} tiles; skipping.")
        return

    config = game_config["map_tile"]
    size = int(config["size"])
    constructible_ratio = float(config["constructible_ratio"])
    rng = random.Random(config.get("random_seed", 1))

    if size <= 0:
        raise ValueError("map_tile.size must be positive.")
    if not 0 <= constructible_ratio <= 1:
        raise ValueError("map_tile.constructible_ratio must be between 0 and 1.")

    resource_rows = _resource_rows_by_enum(sess)
    if not resource_rows:
        raise ValueError("Resources must be seeded before map tiles.")

    layout_templates: list[list[tuple[db.Resource, int]]] = []
    layout_weights: list[float] = []

    for layout_config in config["layouts"]:
        template: list[tuple[db.Resource, int]] = []
        for raw_resource, raw_amount in layout_config["layout"]:
            resource = _enum_from_config(db.Resource, raw_resource)
            amount = int(raw_amount)
            if amount <= 0:
                raise ValueError("Map layout resource amounts must be positive.")
            template.append((resource, amount))

        layout_templates.append(template)
        layout_weights.append(float(layout_config["weight"]))

    if not layout_templates:
        raise ValueError("At least one map layout template is required.")

    print(f"🗺️ Seeding map: {size} × {size} = {size * size} tiles")

    tiles: list[db.MapTile] = []
    chosen_layouts: list[list[tuple[db.Resource, int]]] = []
    constructible_tiles = 0

    for x in range(size):
        if x % 10 == 0 or x == size - 1:
            print(f"⏳ Preparing map row {x + 1}/{size}")

        for y in range(size):
            is_constructible = rng.random() < constructible_ratio
            constructible_tiles += int(is_constructible)

            tiles.append(
                db.MapTile(
                    x=x,
                    y=y,
                    is_constructible=is_constructible,
                )
            )
            chosen_layouts.append(
                rng.choices(
                    layout_templates,
                    weights=layout_weights,
                    k=1,
                )[0]
            )

    sess.add_all(tiles)
    sess.flush()

    layout_rows: list[dict[str, int]] = []
    for tile, chosen_layout in zip(tiles, chosen_layouts, strict=True):
        for resource, amount in chosen_layout:
            layout_rows.append(
                {
                    "map_tile_id": tile.id,
                    "resource_type_id": resource_rows[resource].id,
                    "amount": amount,
                }
            )

    if layout_rows:
        sess.execute(insert(db.MapTileResourceLayout), layout_rows)
        sess.flush()

    print(
        "✅ Map seeded "
        f"({len(tiles)} tiles, {constructible_tiles} constructible, "
        f"{len(layout_rows)} layout rows)"
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def print_seed_policy() -> None:
    print("📚 Seed table policy")
    for category, tables in SEED_POLICY.items():
        table_list = ", ".join(tables) if tables else "none"
        print(f"   {category}: {table_list}")


def main() -> None:
    sess = SessionLocal()
    print("🔍 DB URL:", sess.get_bind().engine.url)
    print_seed_policy()

    try:
        # Phase 1: reference/master game rules.
        timed_step("seed_resources", seed_resources, sess)
        timed_step("seed_tribes", seed_tribes, sess)
        timed_step("seed_farm_levels", seed_farm_levels, sess)
        timed_step(
            "seed_warehouse_and_granary_capacity",
            seed_warehouse_and_granary_capacity,
            sess,
        )
        timed_step("seed_buildings", seed_buildings, sess)
        commit_phase(sess, "reference-master")

        # Phase 2: lightweight core development data.
        timed_step("seed_admin_user", seed_admin_user, sess)
        commit_phase(sess, "core-development")

        # Phase 3: heavy world data.
        timed_step("seed_map_tiles", seed_map_tiles, sess)
        commit_phase(sess, "world-map")

        print("🌱 Seeding completed")
        print(
            "ℹ️ Current-state, runtime-transaction, and ledger tables were "
            "intentionally not globally seeded."
        )

    except Exception as exc:
        sess.rollback()
        print(f"❌ Seeding failed: {exc}")
        raise
    finally:
        sess.close()


if __name__ == "__main__":
    main()
