from __future__ import annotations

import random
import time
from collections.abc import Callable
from typing import Any

from sqlalchemy import insert
from sqlalchemy.orm import Session

from vallorium.backend.old_backend.app.db.session import SessionLocal
import vallorium.backend.old_backend.app.db.models as db
from vallorium.backend.app.core.crypto import get_password_hash
from vallorium.backend.app.core.config_loader import game_config


def timed_step(
    label: str, fn: Callable[[Session], None], sess: Session
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


def seed_tribes(sess: Session) -> None:
    existing = {t.name for t in sess.query(db.TribeAttributes).all()}
    payload = [
        (db.Tribe.ROMANS, "Build simultaneously"),
        (db.Tribe.TEUTONS, "Fast looting"),
        (db.Tribe.GAULS, "Great defense"),
    ]

    rows_to_add = [
        db.TribeAttributes(name=name, bonus=bonus)
        for name, bonus in payload
        if name not in existing
    ]

    if rows_to_add:
        sess.add_all(rows_to_add)
        sess.flush()

    print("✅ Tribes seeded")


def seed_resources(sess: Session) -> None:
    existing = {r.name for r in sess.query(db.ResourcesTypes).all()}

    rows_to_add = [
        db.ResourcesTypes(name=res)
        for res in db.Resource
        if res not in existing
    ]

    if rows_to_add:
        sess.add_all(rows_to_add)
        sess.flush()

    print("✅ Resources seeded")


def seed_production(sess: Session) -> None:
    if sess.query(db.Production).count() > 0:
        print("ℹ️ Production already present; skipping.")
        return

    resources = sess.query(db.ResourcesTypes).all()
    if not resources:
        raise ValueError("Resources must be seeded before production.")

    rows_to_add: list[db.Production] = []
    for res in resources:
        for level in range(0, 6):
            production_value = 10 * (level + 3)
            rows_to_add.append(
                db.Production(
                    resource_type_id=res.id,
                    level=level,
                    production_value=production_value,
                )
            )

    sess.add_all(rows_to_add)
    sess.flush()
    print(f"✅ Production seeded ({len(rows_to_add)} rows)")


def seed_admin_user(sess: Session) -> None:
    email = "admin@example.com"
    if sess.query(db.User).filter_by(email=email).first():
        print("ℹ️ Admin user already exists; skipping.")
        return

    tribe = (
        sess.query(db.TribeAttributes).filter_by(name=db.Tribe.ROMANS).first()
    )
    if not tribe:
        raise ValueError("Romans tribe must be seeded first.")

    hashed = get_password_hash("admin123")
    admin = db.User(
        email=email,
        hashed_password=hashed,
        is_superuser=True,
        is_active=True,
        tribe_id=tribe.id,
    )
    sess.add(admin)
    sess.flush()
    print(f"✅ Admin user created ({email} / admin123)")


def seed_map_tiles(sess: Session) -> None:
    if sess.query(db.MapTile).count() > 0:
        print("ℹ️ Map tiles already exist; skipping.")
        return

    cfg = game_config["map_tile"]
    size = cfg["size"]
    constructible_ratio = cfg["constructible_ratio"]

    print(f"🗺️ Seeding map tiles: size={size} => {size * size} total tiles")

    layout_templates: list[list[tuple[Any, int]]] = []
    layout_weights: list[int | float] = []

    for layout_cfg in cfg["layouts"]:
        template = [
            (db.Resource[res], amt) for res, amt in layout_cfg["layout"]
        ]
        layout_templates.append(template)
        layout_weights.append(layout_cfg["weight"])

    resource_types = {r.name: r for r in sess.query(db.ResourcesTypes).all()}
    if not resource_types:
        raise ValueError("Resources must be seeded before tiles.")

    tiles: list[db.MapTile] = []
    chosen_layouts: list[list[tuple[Any, int]]] = []
    constructible_tiles = 0

    prep_start = time.perf_counter()
    for x in range(size):
        if x % 10 == 0 or x == size - 1:
            print(f"⏳ Preparing map row {x + 1}/{size}")

        for y in range(size):
            is_constructible = random.random() < constructible_ratio
            if is_constructible:
                constructible_tiles += 1

            tile = db.MapTile(x=x, y=y, is_constructible=is_constructible)
            tiles.append(tile)

            chosen_layout = random.choices(
                layout_templates,
                weights=layout_weights,
                k=1,
            )[0]
            chosen_layouts.append(chosen_layout)

    prep_elapsed = time.perf_counter() - prep_start
    print(f"✅ Prepared {len(tiles)} tiles in {prep_elapsed:.2f}s")

    insert_tiles_start = time.perf_counter()
    sess.add_all(tiles)
    sess.flush()  # assign all tile IDs in one go
    insert_tiles_elapsed = time.perf_counter() - insert_tiles_start
    print(f"✅ Inserted tile rows in {insert_tiles_elapsed:.2f}s")

    layout_rows: list[dict[str, int]] = []
    for tile, chosen_layout in zip(tiles, chosen_layouts):
        for res_name, amount in chosen_layout:
            layout_rows.append(
                {
                    "map_tile_id": tile.id,
                    "resource_type_id": resource_types[res_name].id,
                    "amount": amount,
                }
            )

    insert_layouts_start = time.perf_counter()
    if layout_rows:
        sess.execute(insert(db.MapTileResourceLayout), layout_rows)
        sess.flush()
    insert_layouts_elapsed = time.perf_counter() - insert_layouts_start

    print(
        "✅ Map tiles and layouts seeded "
        f"({len(tiles)} tiles, {constructible_tiles} constructible, "
        f"{len(layout_rows)} layout rows)"
    )
    print(f"⏱️ Layout insert: {insert_layouts_elapsed:.2f}s")


def seed_warehouse_and_granary_capacity(sess: Session) -> None:
    existing_g = {c.level for c in sess.query(db.GranaryCapacity).all()}
    existing_w = {c.level for c in sess.query(db.WarehouseCapacity).all()}

    granary_capacity_values = game_config["capacities"]["granary"]
    warehouse_capacity_values = game_config["capacities"]["warehouse"]

    granary_rows = []
    warehouse_rows = []

    for level_str, cap in granary_capacity_values.items():
        level = int(level_str)
        if level not in existing_g:
            granary_rows.append(db.GranaryCapacity(level=level, capacity=cap))

    for level_str, cap in warehouse_capacity_values.items():
        level = int(level_str)
        if level not in existing_w:
            warehouse_rows.append(
                db.WarehouseCapacity(level=level, capacity=cap)
            )

    if granary_rows:
        sess.add_all(granary_rows)
    if warehouse_rows:
        sess.add_all(warehouse_rows)

    if granary_rows or warehouse_rows:
        sess.flush()

    print(
        "✅ Granary & Warehouse capacities seeded "
        f"({len(granary_rows)} granary, {len(warehouse_rows)} warehouse)"
    )


def seed_buildings(sess: Session) -> None:
    if sess.query(db.BuildingType).count() > 0:
        print("ℹ️ Buildings already exist; skipping.")
        return

    building_defs = game_config.get("buildings", [])
    if not building_defs:
        print("ℹ️ No buildings found in config; skipping.")
        return

    resource_types = {
        r.name.name: r for r in sess.query(db.ResourcesTypes).all()
    }
    if not resource_types:
        raise ValueError("Resources must be seeded before buildings.")

    # Pass 1: create all building types, flush once
    building_type_by_name: dict[str, db.BuildingType] = {}
    building_type_rows: list[db.BuildingType] = []

    for b in building_defs:
        btype = db.BuildingType(
            name=b["name"],
            description=b.get("description"),
        )
        building_type_rows.append(btype)
        building_type_by_name[b["name"]] = btype

    sess.add_all(building_type_rows)
    sess.flush()

    # Pass 2: create all levels, flush once
    level_rows: list[db.BuildingLevel] = []
    level_index: dict[tuple[str, int], db.BuildingLevel] = {}

    for b in building_defs:
        btype = building_type_by_name[b["name"]]

        for level_def in b.get("levels", []):
            lvl = db.BuildingLevel(
                building_type_id=btype.id,
                level=level_def["level"],
                construction_time=level_def["time"],
                population_required=level_def.get("population_required", 0),
            )
            level_rows.append(lvl)
            level_index[(b["name"], level_def["level"])] = lvl

    sess.add_all(level_rows)
    sess.flush()

    # Pass 3: create costs and prerequisites
    cost_rows: list[db.BuildingUpgradeResource] = []
    prereq_rows: list[db.BuildingPrerequisite] = []

    for b in building_defs:
        for level_def in b.get("levels", []):
            lvl = level_index[(b["name"], level_def["level"])]

            for res_name, amount in level_def.get("cost", {}).items():
                if res_name not in resource_types:
                    raise ValueError(
                        f"Unknown resource: {res_name}. "
                        f"Available resources: {list(resource_types.keys())}"
                    )

                cost_rows.append(
                    db.BuildingUpgradeResource(
                        building_level_id=lvl.id,
                        resource_type_id=resource_types[res_name].id,
                        amount=amount,
                    )
                )

            for prereq in level_def.get("prerequisites", []):
                prereq_name = prereq["building"]
                required_level = prereq["level"]

                prereq_building = building_type_by_name.get(prereq_name)
                if not prereq_building:
                    raise ValueError(
                        f"Unknown prerequisite building: {prereq_name}"
                    )

                prereq_rows.append(
                    db.BuildingPrerequisite(
                        building_level_id=lvl.id,
                        required_building_type_id=prereq_building.id,
                        required_level=required_level,
                    )
                )

    if cost_rows:
        sess.add_all(cost_rows)
    if prereq_rows:
        sess.add_all(prereq_rows)

    if cost_rows or prereq_rows:
        sess.flush()

    print(
        "✅ Seeded buildings "
        f"({len(building_type_rows)} types, {len(level_rows)} levels, "
        f"{len(cost_rows)} costs, {len(prereq_rows)} prerequisites)"
    )


def main() -> None:
    sess = SessionLocal()
    print("🔍 DB URL:", sess.get_bind().engine.url)

    try:
        # Phase 1: core data
        timed_step("seed_tribes", seed_tribes, sess)
        timed_step("seed_resources", seed_resources, sess)
        timed_step("seed_production", seed_production, sess)
        timed_step("seed_admin_user", seed_admin_user, sess)
        commit_phase(sess, "core")

        # Phase 2: heavy map data
        timed_step("seed_map_tiles", seed_map_tiles, sess)
        commit_phase(sess, "map")

        # Phase 3: remaining config data
        timed_step(
            "seed_warehouse_and_granary_capacity",
            seed_warehouse_and_granary_capacity,
            sess,
        )
        timed_step("seed_buildings", seed_buildings, sess)
        commit_phase(sess, "final")

        print("🌱 Seeding completed")

    except Exception as e:
        sess.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        sess.close()


if __name__ == "__main__":
    main()
