"""Opt-in PostgreSQL tests. Use a dedicated TEST_DATABASE_URL; never DATABASE_URL.

Each test creates and removes its own isolated schema.
"""

import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier
from uuid import uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db import models as m
from app.domains.buildings import repository as buildings
from app.domains.resources import service as resources
from app.domains.villages import repository, service


@unittest.skipUnless(
    os.getenv("TEST_DATABASE_URL"), "Requires dedicated PostgreSQL TEST_DATABASE_URL"
)
class ConcurrencyTests(unittest.TestCase):
    def setUp(self):
        self.schema = "test_resources_" + uuid4().hex
        self.admin = create_engine(os.environ["TEST_DATABASE_URL"])
        if self.admin.dialect.name != "postgresql":
            self.skipTest("Row locking tests require PostgreSQL")
        with self.admin.begin() as connection:
            connection.execute(text(f"CREATE SCHEMA {self.schema}"))
        self.engine = create_engine(
            os.environ["TEST_DATABASE_URL"],
            connect_args={
                "options": f"-csearch_path={self.schema} -clock_timeout=5000 -cstatement_timeout=10000"
            },
        )
        self.sessions = sessionmaker(bind=self.engine, autoflush=False)
        m.Base.metadata.create_all(self.engine)
        buildings._DEFAULT_STORAGE_CAPS = None
        self.start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        with self.sessions.begin() as db:
            db.add_all(
                [
                    m.TribeAttributes(id=1, name=list(m.Tribe)[0]),
                    m.ResourcesTypes(id=1, name=m.Resource.WOOD),
                    m.MapTileType(id=1, code="test", name="Test"),
                    m.WarehouseCapacity(level=0, capacity=10000),
                    m.GranaryCapacity(level=0, capacity=10000),
                ]
            )
            db.flush()
            db.add_all(
                [
                    m.User(
                        id=1,
                        email="test@example.com",
                        hashed_password="unused",
                        tribe_id=1,
                    ),
                    m.MapTile(
                        id=1, x=0, y=0, is_constructible=True, map_tile_type_id=1
                    ),
                ]
            )
            db.flush()
            db.add(m.Village(id=1, name="Test", map_tile_id=1, owner_id=1))
            db.flush()
            db.add_all(
                [
                    m.VillageFarmPlot(
                        id=1, village_id=1, resource_type_id=1, farm_number=1, level=0
                    ),
                    m.VillageResourceStorage(
                        village_id=1,
                        resource_type_id=1,
                        stored_amount=1000,
                        last_updated=self.start,
                    ),
                    m.FarmLevel(
                        farm_resource_type_id=1,
                        level=0,
                        production_per_hour=100,
                        construction_time_seconds=10,
                    ),
                    m.FarmLevel(
                        farm_resource_type_id=1,
                        level=1,
                        production_per_hour=200,
                        construction_time_seconds=10,
                    ),
                ]
            )
            db.flush()
            db.add(
                m.VillageFarmUpgrade(
                    village_farm_plot_id=1,
                    from_level=0,
                    target_level=1,
                    status=m.UpgradeStatus.IN_PROGRESS,
                    started_at=self.start,
                    completes_at=self.start + timedelta(seconds=10),
                    actual_duration_seconds=10,
                )
            )

    def tearDown(self):
        self.engine.dispose()
        with self.admin.begin() as connection:
            connection.execute(text(f"DROP SCHEMA {self.schema} CASCADE"))
        self.admin.dispose()
        buildings._DEFAULT_STORAGE_CAPS = None

    def test_worker_and_request_apply_upgrade_once(self):
        barrier = Barrier(2)
        now = self.start + timedelta(seconds=23)

        def worker():
            with self.sessions() as db:
                barrier.wait(timeout=5)
                service.complete_due_farm_upgrades(db, now=now)

        def request():
            with self.sessions() as db:
                barrier.wait(timeout=5)
                service.reconcile_owned_village_if_due(
                    db, village_id=1, owner_id=1, now=now
                )

        with ThreadPoolExecutor(2) as pool:
            futures = [pool.submit(worker), pool.submit(request)]
            for future in futures:
                future.result(timeout=15)
        with self.sessions() as db:
            self.assertEqual(db.get(m.VillageFarmPlot, 1).level, 1)
            self.assertEqual(
                resources.get_computed_balance_map(db, 1, now)["wood"], 1001
            )
            self.assertEqual(service.complete_due_farm_upgrades(db, now=now), 0)

    def test_simultaneous_spending_cannot_double_spend(self):
        barrier = Barrier(2)

        def spend():
            with self.sessions() as db:
                barrier.wait(timeout=5)
                repository.get_village_for_update(db, village_id=1)
                try:
                    resources.spend_resources(db, 1, {1: 800}, now=self.start)
                    db.commit()
                    return True
                except resources.InsufficientResourcesError:
                    db.rollback()
                    return False

        with ThreadPoolExecutor(2) as pool:
            futures = [pool.submit(spend), pool.submit(spend)]
            self.assertEqual(
                sorted(f.result(timeout=15) for f in futures), [False, True]
            )
        with self.sessions() as db:
            self.assertEqual(
                db.query(m.VillageResourceStorage).one().stored_amount, 200
            )
