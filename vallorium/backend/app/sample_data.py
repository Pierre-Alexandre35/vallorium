"""Create a repeatable development gameplay scenario.

Run after the normal reference seed:

    python -m app.seed
    python -m app.dev_scenario

This module creates one development user with two villages, initializes each
village's farms/resources, and force-completes several farm/building upgrades.
It is a fixture generator, not the production upgrade scheduler.
"""

from __future__ import annotations

import os
from collections.abc import Iterable
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

import app.db.models as db
from app.core.crypto import get_password_hash
from app.db.session import SessionLocal

DEV_EMAIL = os.getenv("SCENARIO_EMAIL", "scenario.player@example.com")
DEV_PASSWORD = os.getenv("SCENARIO_PASSWORD", "scenario123")
STARTING_RESOURCE_AMOUNT = int(os.getenv("SCENARIO_STARTING_RESOURCES", "100000"))


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def require_reference_data(sess: Session) -> None:
    required = {
        "resources_types": sess.scalar(select(db.ResourcesTypes.id).limit(1)),
        "tribe_attributes": sess.scalar(select(db.TribeAttributes.id).limit(1)),
        "farm_level": sess.scalar(select(db.FarmLevel.id).limit(1)),
        "building_type": sess.scalar(select(db.BuildingType.id).limit(1)),
        "map_tile": sess.scalar(select(db.MapTile.id).limit(1)),
    }
    missing = [name for name, first_id in required.items() if first_id is None]
    if missing:
        raise RuntimeError(
            "Missing reference data: "
            + ", ".join(missing)
            + ". Run `python -m app.seed` first."
        )


def get_or_create_user(sess: Session) -> db.User:
    user = sess.scalar(select(db.User).where(db.User.email == DEV_EMAIL))
    if user is not None:
        return user

    romans = sess.scalar(
        select(db.TribeAttributes).where(db.TribeAttributes.name == db.Tribe.ROMANS)
    )
    if romans is None:
        raise RuntimeError("Romans tribe is not seeded.")

    user = db.User(
        email=DEV_EMAIL,
        first_name="Scenario",
        last_name="Player",
        hashed_password=get_password_hash(DEV_PASSWORD),
        is_active=True,
        is_superuser=False,
        tribe_id=romans.id,
    )
    sess.add(user)
    sess.flush()
    print(f"✅ Created development user {DEV_EMAIL} (id={user.id})")
    return user


def next_free_constructible_tile(sess: Session) -> db.MapTile:
    tile = sess.scalar(
        select(db.MapTile)
        .outerjoin(db.Village, db.Village.map_tile_id == db.MapTile.id)
        .where(
            db.MapTile.is_constructible.is_(True),
            db.Village.id.is_(None),
        )
        .order_by(db.MapTile.id)
        .limit(1)
    )
    if tile is None:
        raise RuntimeError("No free constructible map tile is available.")
    return tile


def get_or_create_village(
    sess: Session,
    *,
    owner: db.User,
    name: str,
    population: int = 2,
) -> db.Village:
    village = sess.scalar(
        select(db.Village).where(
            db.Village.owner_id == owner.id,
            db.Village.name == name,
        )
    )
    if village is not None:
        ensure_village_state(sess, village)
        return village

    tile = next_free_constructible_tile(sess)
    village = db.Village(
        name=name,
        map_tile_id=tile.id,
        owner_id=owner.id,
        population=population,
    )
    sess.add(village)
    sess.flush()

    ensure_village_state(sess, village)
    print(
        f"✅ Created village {village.name!r} (id={village.id}) "
        f"on tile ({tile.x}, {tile.y})"
    )
    return village


def ensure_village_state(sess: Session, village: db.Village) -> None:
    ensure_farm_plots(sess, village)
    ensure_resource_storage(sess, village)


def ensure_farm_plots(sess: Session, village: db.Village) -> None:
    existing_count = len(
        sess.scalars(
            select(db.VillageFarmPlot.id).where(
                db.VillageFarmPlot.village_id == village.id
            )
        ).all()
    )
    if existing_count == 18:
        return
    if existing_count != 0:
        raise RuntimeError(
            f"Village {village.id} has {existing_count} farm slots; expected 0 or 18."
        )

    layouts = sess.scalars(
        select(db.MapTileResourceLayout)
        .where(db.MapTileResourceLayout.map_tile_id == village.map_tile_id)
        .order_by(db.MapTileResourceLayout.id)
    ).all()

    total_slots = sum(layout.amount for layout in layouts)
    if total_slots != 18:
        raise RuntimeError(
            f"Tile {village.map_tile_id} defines {total_slots} farm slots; expected 18."
        )

    slot_number = 1
    for layout in layouts:
        for _ in range(layout.amount):
            sess.add(
                db.VillageFarmPlot(
                    village_id=village.id,
                    resource_type_id=layout.resource_type_id,
                    farm_number=slot_number,
                    level=0,
                )
            )
            slot_number += 1
    sess.flush()


def ensure_resource_storage(sess: Session, village: db.Village) -> None:
    resources = sess.scalars(
        select(db.ResourcesTypes).order_by(db.ResourcesTypes.id)
    ).all()
    existing_rows = sess.scalars(
        select(db.VillageResourceStorage).where(
            db.VillageResourceStorage.village_id == village.id
        )
    ).all()
    storage_by_resource = {row.resource_type_id: row for row in existing_rows}

    missing_resources = [
        resource for resource in resources if resource.id not in storage_by_resource
    ]
    if not missing_resources:
        return

    transaction = sess.scalar(
        select(db.VillageResourceTransaction).where(
            db.VillageResourceTransaction.village_id == village.id,
            db.VillageResourceTransaction.idempotency_key
            == f"scenario:start:{village.id}",
        )
    )
    if transaction is None:
        transaction = db.VillageResourceTransaction(
            village_id=village.id,
            transaction_type=db.ResourceTransactionType.STARTING_RESOURCES,
            source_type="dev_scenario",
            source_id=village.id,
            idempotency_key=f"scenario:start:{village.id}",
            description="Development scenario starting resources",
        )
        sess.add(transaction)
        sess.flush()

    existing_entry_resource_ids = set(
        sess.scalars(
            select(db.VillageResourceTransactionEntry.resource_type_id).where(
                db.VillageResourceTransactionEntry.transaction_id == transaction.id
            )
        ).all()
    )

    for resource in missing_resources:
        storage = db.VillageResourceStorage(
            village_id=village.id,
            resource_type_id=resource.id,
            stored_amount=STARTING_RESOURCE_AMOUNT,
            last_updated=utcnow(),
        )
        sess.add(storage)

        if resource.id not in existing_entry_resource_ids:
            sess.add(
                db.VillageResourceTransactionEntry(
                    transaction_id=transaction.id,
                    resource_type_id=resource.id,
                    delta=STARTING_RESOURCE_AMOUNT,
                    balance_before=0,
                    balance_after=STARTING_RESOURCE_AMOUNT,
                )
            )
    sess.flush()


def spend_resources(
    sess: Session,
    *,
    village: db.Village,
    costs: Iterable[db.FarmLevelCost | db.BuildingLevelCost],
    transaction_type: db.ResourceTransactionType,
    source_type: str,
    source_id: int,
    idempotency_key: str,
    description: str,
) -> db.VillageResourceTransaction:
    existing_transaction = sess.scalar(
        select(db.VillageResourceTransaction).where(
            db.VillageResourceTransaction.village_id == village.id,
            db.VillageResourceTransaction.idempotency_key == idempotency_key,
        )
    )
    if existing_transaction is not None:
        return existing_transaction

    cost_by_resource: dict[int, int] = {}
    for cost in costs:
        cost_by_resource[cost.payment_resource_type_id] = (
            cost_by_resource.get(cost.payment_resource_type_id, 0) + cost.amount
        )

    storage_rows = sess.scalars(
        select(db.VillageResourceStorage)
        .where(
            db.VillageResourceStorage.village_id == village.id,
            db.VillageResourceStorage.resource_type_id.in_(cost_by_resource),
        )
        .with_for_update()
    ).all()
    storage_by_resource = {row.resource_type_id: row for row in storage_rows}

    for resource_type_id, amount in cost_by_resource.items():
        storage = storage_by_resource.get(resource_type_id)
        if storage is None:
            raise RuntimeError(
                f"Village {village.id} has no storage row for resource {resource_type_id}."
            )
        if storage.stored_amount < amount:
            raise RuntimeError(
                f"Village {village.id} lacks resource {resource_type_id}: "
                f"needs {amount}, has {storage.stored_amount}."
            )

    transaction = db.VillageResourceTransaction(
        village_id=village.id,
        transaction_type=transaction_type,
        source_type=source_type,
        source_id=source_id,
        idempotency_key=idempotency_key,
        description=description,
    )
    sess.add(transaction)
    sess.flush()

    now = utcnow()
    for resource_type_id, amount in cost_by_resource.items():
        storage = storage_by_resource[resource_type_id]
        before = storage.stored_amount
        after = before - amount
        storage.stored_amount = after
        storage.last_updated = now
        sess.add(
            db.VillageResourceTransactionEntry(
                transaction_id=transaction.id,
                resource_type_id=resource_type_id,
                delta=-amount,
                balance_before=before,
                balance_after=after,
            )
        )

    sess.flush()
    return transaction


def complete_one_farm_upgrade(
    sess: Session,
    *,
    village: db.Village,
    farm_plot: db.VillageFarmPlot,
) -> db.VillageFarmUpgrade:
    from_level = farm_plot.level
    target_level = from_level + 1

    level_definition = sess.scalar(
        select(db.FarmLevel).where(
            db.FarmLevel.farm_resource_type_id == farm_plot.resource_type_id,
            db.FarmLevel.level == target_level,
        )
    )
    if level_definition is None:
        raise RuntimeError(
            f"No FarmLevel definition for resource={farm_plot.resource_type_id}, "
            f"level={target_level}."
        )

    duration = level_definition.construction_time_seconds
    completed_at = utcnow()
    started_at = completed_at - timedelta(seconds=duration)
    job = db.VillageFarmUpgrade(
        village_farm_plot_id=farm_plot.id,
        from_level=from_level,
        target_level=target_level,
        status=db.UpgradeStatus.COMPLETED,
        queued_at=started_at,
        started_at=started_at,
        completes_at=completed_at,
        actual_duration_seconds=duration,
        completed_at=completed_at,
        cancelled_at=None,
    )
    sess.add(job)
    sess.flush()

    spend_resources(
        sess,
        village=village,
        costs=level_definition.costs,
        transaction_type=db.ResourceTransactionType.FARM_UPGRADE,
        source_type="village_farm_upgrade",
        source_id=job.id,
        idempotency_key=f"scenario:farm:{farm_plot.id}:{target_level}",
        description=f"Force-completed farm slot {farm_plot.farm_number} to level {target_level}",
    )
    farm_plot.level = target_level
    sess.flush()
    return job


def upgrade_farm_to(
    sess: Session,
    *,
    village: db.Village,
    farm_number: int,
    target_level: int,
) -> None:
    farm_plot = sess.scalar(
        select(db.VillageFarmPlot).where(
            db.VillageFarmPlot.village_id == village.id,
            db.VillageFarmPlot.farm_number == farm_number,
        )
    )
    if farm_plot is None:
        raise RuntimeError(f"Village {village.id} has no farm slot {farm_number}.")

    while farm_plot.level < target_level:
        complete_one_farm_upgrade(
            sess,
            village=village,
            farm_plot=farm_plot,
        )


def find_building_type(
    sess: Session,
    *,
    owner_tribe_id: int,
    name: str,
) -> db.BuildingType:
    candidates = sess.scalars(
        select(db.BuildingType).where(
            db.BuildingType.name == name,
            or_(
                db.BuildingType.tribe_id.is_(None),
                db.BuildingType.tribe_id == owner_tribe_id,
            ),
        )
    ).all()
    if not candidates:
        raise RuntimeError(f"Building type {name!r} is not seeded.")

    specific = next(
        (item for item in candidates if item.tribe_id == owner_tribe_id),
        None,
    )
    return specific or candidates[0]


def validate_building_prerequisites(
    sess: Session,
    *,
    village: db.Village,
    level_definition: db.BuildingLevel,
) -> None:
    for prerequisite in level_definition.prerequisites:
        matching_level = sess.scalar(
            select(db.VillageBuilding.level)
            .where(
                db.VillageBuilding.village_id == village.id,
                db.VillageBuilding.building_type_id
                == prerequisite.required_building_type_id,
            )
            .order_by(db.VillageBuilding.level.desc())
            .limit(1)
        )
        if matching_level is None or matching_level < prerequisite.required_level:
            raise RuntimeError(
                f"Cannot upgrade building type {level_definition.building_type_id} "
                f"to level {level_definition.level}: prerequisite building "
                f"{prerequisite.required_building_type_id} level "
                f"{prerequisite.required_level} is missing."
            )


def get_or_create_village_building(
    sess: Session,
    *,
    village: db.Village,
    building_type: db.BuildingType,
    slot_number: int,
) -> db.VillageBuilding:
    building = sess.scalar(
        select(db.VillageBuilding).where(
            db.VillageBuilding.village_id == village.id,
            db.VillageBuilding.slot_number == slot_number,
        )
    )
    if building is not None:
        if building.building_type_id != building_type.id:
            raise RuntimeError(
                f"Village {village.id} slot {slot_number} already contains "
                f"building type {building.building_type_id}."
            )
        return building

    building = db.VillageBuilding(
        village_id=village.id,
        building_type_id=building_type.id,
        slot_number=slot_number,
        level=0,
    )
    sess.add(building)
    sess.flush()
    return building


def complete_one_building_upgrade(
    sess: Session,
    *,
    village: db.Village,
    building: db.VillageBuilding,
) -> db.VillageBuildingUpgrade:
    from_level = building.level
    target_level = from_level + 1

    level_definition = sess.scalar(
        select(db.BuildingLevel).where(
            db.BuildingLevel.building_type_id == building.building_type_id,
            db.BuildingLevel.level == target_level,
        )
    )
    if level_definition is None:
        raise RuntimeError(
            f"No BuildingLevel definition for building={building.building_type_id}, "
            f"level={target_level}."
        )

    validate_building_prerequisites(
        sess,
        village=village,
        level_definition=level_definition,
    )

    duration = level_definition.construction_time_seconds
    completed_at = utcnow()
    started_at = completed_at - timedelta(seconds=duration)
    job = db.VillageBuildingUpgrade(
        village_building_id=building.id,
        from_level=from_level,
        target_level=target_level,
        status=db.UpgradeStatus.COMPLETED,
        queued_at=started_at,
        started_at=started_at,
        completes_at=completed_at,
        actual_duration_seconds=duration,
        completed_at=completed_at,
        cancelled_at=None,
    )
    sess.add(job)
    sess.flush()

    spend_resources(
        sess,
        village=village,
        costs=level_definition.costs,
        transaction_type=db.ResourceTransactionType.BUILDING_UPGRADE,
        source_type="village_building_upgrade",
        source_id=job.id,
        idempotency_key=f"scenario:building:{building.id}:{target_level}",
        description=(
            f"Force-completed building slot {building.slot_number} "
            f"to level {target_level}"
        ),
    )

    building.level = target_level
    village.population += level_definition.population_increase
    sess.flush()
    return job


def upgrade_building_to(
    sess: Session,
    *,
    village: db.Village,
    building_name: str,
    slot_number: int,
    target_level: int,
) -> None:
    building_type = find_building_type(
        sess,
        owner_tribe_id=village.owner.tribe_id,
        name=building_name,
    )
    building = get_or_create_village_building(
        sess,
        village=village,
        building_type=building_type,
        slot_number=slot_number,
    )

    while building.level < target_level:
        complete_one_building_upgrade(
            sess,
            village=village,
            building=building,
        )


def build_scenario(sess: Session) -> tuple[db.User, list[db.Village]]:
    require_reference_data(sess)
    user = get_or_create_user(sess)

    capital = get_or_create_village(
        sess,
        owner=user,
        name="Scenario Capital",
    )
    outpost = get_or_create_village(
        sess,
        owner=user,
        name="Scenario Outpost",
    )

    # Capital: demonstrate multiple farm and building upgrades.
    upgrade_farm_to(sess, village=capital, farm_number=1, target_level=2)
    upgrade_farm_to(sess, village=capital, farm_number=2, target_level=1)
    upgrade_building_to(
        sess,
        village=capital,
        building_name="Main Building",
        slot_number=1,
        target_level=2,
    )
    upgrade_building_to(
        sess,
        village=capital,
        building_name="Warehouse",
        slot_number=2,
        target_level=1,
    )
    upgrade_building_to(
        sess,
        village=capital,
        building_name="Barracks",
        slot_number=3,
        target_level=1,
    )

    # Second village owned by the same user.
    upgrade_farm_to(sess, village=outpost, farm_number=1, target_level=1)
    upgrade_building_to(
        sess,
        village=outpost,
        building_name="Main Building",
        slot_number=1,
        target_level=1,
    )
    upgrade_building_to(
        sess,
        village=outpost,
        building_name="Granary",
        slot_number=2,
        target_level=1,
    )

    return user, [capital, outpost]


def print_summary(sess: Session, user: db.User, villages: list[db.Village]) -> None:
    print("\n🌱 Development scenario ready")
    print(f"   login: {DEV_EMAIL} / {DEV_PASSWORD}")
    print(f"   user id: {user.id}")

    for village in villages:
        farm_count = len(
            sess.scalars(
                select(db.VillageFarmPlot.id).where(
                    db.VillageFarmPlot.village_id == village.id
                )
            ).all()
        )
        building_count = len(
            sess.scalars(
                select(db.VillageBuilding.id).where(
                    db.VillageBuilding.village_id == village.id
                )
            ).all()
        )
        transaction_count = len(
            sess.scalars(
                select(db.VillageResourceTransaction.id).where(
                    db.VillageResourceTransaction.village_id == village.id
                )
            ).all()
        )
        print(
            f"   village {village.id}: {village.name!r}, "
            f"population={village.population}, farms={farm_count}, "
            f"buildings={building_count}, ledger_transactions={transaction_count}"
        )


def main() -> None:
    sess = SessionLocal()
    print("🔍 DB URL:", sess.get_bind().url)
    try:
        user, villages = build_scenario(sess)
        sess.commit()
        print_summary(sess, user, villages)
    except Exception:
        sess.rollback()
        raise
    finally:
        sess.close()


if __name__ == "__main__":
    main()
