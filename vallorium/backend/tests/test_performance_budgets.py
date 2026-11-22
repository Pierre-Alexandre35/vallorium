"""Performance budgets: SQL queries and response size per API endpoint.

Timings are too noisy to gate CI on, but the number of SQL round-trips and the
response size are deterministic and are what usually make an endpoint slower
(N+1 queries, extra lookups, payload growth). Every GET endpoint under /api/v1
must have a budget here, so a new feature cannot add a request path unnoticed.

If a change legitimately needs more queries or bytes, raise the budget in the
same PR so the cost is visible in review. If an endpoint got cheaper, the
summary printed at the end suggests lowering its budget.

The world is built from the real seed reference data and a real signup, in an
isolated PostgreSQL schema that is dropped afterwards. Requires a dedicated
TEST_DATABASE_URL (see tests/README.md); never point it at DATABASE_URL.

Authentication is stubbed: the session lookup lives in Redis, not SQL, so it
does not change query counts.
"""

from __future__ import annotations

import io
import os
import re
import sys
import unittest
from contextlib import redirect_stdout
from dataclasses import dataclass
from uuid import uuid4

from fastapi.routing import APIRoute
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app import seed
from app.core.auth import get_current_user
from app.core.sessions import SessionUser
from app.db import models as m
from app.db.session import get_db
from app.domains.auth import service as auth_service
from app.domains.auth.schemas import SignupRequest
from app.domains.buildings import repository as buildings
from app.main import app

API_PREFIX = "/api/v1"


@dataclass(frozen=True)
class Budget:
    queries: int
    max_kb: float


# Steady-state cost of one request, measured after a warm-up call.
# Keys are "METHOD route-template" exactly as declared in the routers.
BUDGETS: dict[str, Budget] = {
    # Loaded by the /app homepage.
    "GET /auth/me": Budget(queries=0, max_kb=1),
    "GET /dashboard/current": Budget(queries=2, max_kb=1),
    "GET /villages/{village_id}/farms": Budget(queries=2, max_kb=3),
    # Other read endpoints.
    # The three village lookups lazy-load tile -> tile type -> farm slots, then
    # one resource type per slot (N+1). Eager loading would bring them to ~2.
    "GET /villages/": Budget(queries=7, max_kb=2),
    "GET /villages/{village_id}": Budget(queries=8, max_kb=2),
    "GET /villages/name/{village_name}": Budget(queries=8, max_kb=2),
    "GET /villages/{village_id}/production": Budget(queries=2, max_kb=1),
    "GET /villages/{village_id}/resources": Budget(queries=2, max_kb=1),
    "GET /users/me": Budget(queries=2, max_kb=1),
    "GET /tribes": Budget(queries=2, max_kb=2),
}

# GET endpoints deliberately left without a budget, with the reason.
EXEMPT: dict[str, str] = {
    "GET /users": "superuser-only admin listing",
    "GET /users/{user_id}": "superuser-only admin lookup",
    # Remove from here and add a budget once fixed.
    "GET /tribes/{tribe_id}/buildings": (
        "BROKEN: buildings service uses renamed model fields "
        "(resource_type_id, construction_time) and raises AttributeError"
    ),
}


def route_keys() -> set[str]:
    return {
        f"GET {route.path.removeprefix(API_PREFIX)}"
        for route in app.routes
        if isinstance(route, APIRoute)
        and "GET" in route.methods
        and route.path.startswith(API_PREFIX)
    }


class QueryRecorder:
    """Collects every SQL statement sent to the database while active."""

    def __init__(self, engine: Engine):
        self.engine = engine
        self.statements: list[str] = []

    def _record(self, conn, cursor, statement, parameters, context, executemany):
        self.statements.append(statement)

    def __enter__(self) -> QueryRecorder:
        self.statements = []
        event.listen(self.engine, "before_cursor_execute", self._record)
        return self

    def __exit__(self, *exc) -> None:
        event.remove(self.engine, "before_cursor_execute", self._record)

    def format(self, limit: int = 160) -> str:
        lines = []
        for i, statement in enumerate(self.statements, 1):
            sql = re.sub(r"\s+", " ", statement).strip()
            if len(sql) > limit:
                sql = sql[: limit - 1] + "…"
            lines.append(f"  {i:>2}. {sql}")
        return "\n".join(lines)


@unittest.skipUnless(
    os.getenv("TEST_DATABASE_URL"), "Requires dedicated PostgreSQL TEST_DATABASE_URL"
)
class PerformanceBudgetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = "test_perf_" + uuid4().hex
        cls.admin = create_engine(os.environ["TEST_DATABASE_URL"])
        with cls.admin.begin() as connection:
            connection.execute(text(f"CREATE SCHEMA {cls.schema}"))
        cls.engine = create_engine(
            os.environ["TEST_DATABASE_URL"],
            connect_args={"options": f"-csearch_path={cls.schema}"},
        )
        cls.sessions = sessionmaker(bind=cls.engine, autoflush=False)
        m.Base.metadata.create_all(cls.engine)
        buildings._DEFAULT_STORAGE_CAPS = None

        cls.user = cls._build_world()

        def override_get_db():
            db = cls.sessions()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = lambda: cls.user
        cls.client = TestClient(app)
        cls.measured: dict[str, tuple[int, float]] = {}

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        cls.engine.dispose()
        with cls.admin.begin() as connection:
            connection.execute(text(f"DROP SCHEMA {cls.schema} CASCADE"))
        cls.admin.dispose()
        buildings._DEFAULT_STORAGE_CAPS = None
        cls._print_summary()

    @classmethod
    def _build_world(cls) -> SessionUser:
        """Seed reference data and sign up a player, as in a real deployment."""
        with cls.sessions() as db, redirect_stdout(io.StringIO()):
            for step in (
                seed.seed_resources,
                seed.seed_map_tile_types,
                seed.seed_tribes,
                seed.seed_farm_levels,
                seed.seed_warehouse_and_granary_capacity,
                seed.seed_buildings,
                seed.seed_map_tiles,
            ):
                step(db)
            db.commit()

            tribe_id = db.query(m.TribeAttributes.id).order_by("id").first()[0]
            response = auth_service.signup(
                db,
                data=SignupRequest(
                    email="perf@example.com",
                    password="perf-password",
                    tribe_id=tribe_id,
                ),
                idempotency_key=uuid4().hex,
            )

        user = response.user
        return SessionUser(
            id=user.id,
            email=str(user.email),
            is_active=True,
            is_superuser=user.is_superuser,
            tribe_id=user.tribe_id,
            tribe_name=user.tribe_name,
            current_village_id=user.current_village_id,
        )

    def _path_params(self) -> dict[str, object]:
        with self.sessions() as db:
            village = db.get(m.Village, self.user.current_village_id)
            return {
                "village_id": village.id,
                "village_name": village.name,
                "tribe_id": self.user.tribe_id,
            }

    def test_every_get_endpoint_has_a_budget(self):
        routes = route_keys()
        missing = sorted(routes - BUDGETS.keys() - EXEMPT.keys())
        stale = sorted((BUDGETS.keys() | EXEMPT.keys()) - routes)
        self.assertFalse(
            missing,
            "New GET endpoints without a performance budget. Add them to "
            f"BUDGETS (or EXEMPT with a reason): {missing}",
        )
        self.assertFalse(stale, f"Budgets for endpoints that no longer exist: {stale}")

    def test_endpoints_stay_within_budget(self):
        params = self._path_params()
        for key, budget in BUDGETS.items():
            method, template = key.split(" ", 1)
            path = API_PREFIX + template.format(**params)
            with self.subTest(endpoint=key):
                warmup = self.client.request(method, path)
                self.assertEqual(warmup.status_code, 200, f"{key}: {warmup.text}")

                with QueryRecorder(self.engine) as recorder:
                    response = self.client.request(method, path)
                self.assertEqual(response.status_code, 200, f"{key}: {response.text}")

                queries = len(recorder.statements)
                kb = len(response.content) / 1024
                self.measured[key] = (queries, kb)

                self.assertLessEqual(
                    queries,
                    budget.queries,
                    f"\n{key} ran {queries} SQL queries; budget is {budget.queries}.\n"
                    f"If this is intended, raise its budget in {__file__}.\n"
                    f"Queries:\n{recorder.format()}",
                )
                self.assertLessEqual(
                    kb,
                    budget.max_kb,
                    f"\n{key} returned {kb:.2f} KB; budget is {budget.max_kb} KB.",
                )

    @classmethod
    def _print_summary(cls):
        if not cls.measured:
            return
        out = sys.stderr
        print("\nPerformance budgets (steady state, one request)", file=out)
        print(f"  {'endpoint':<42} {'queries':>11} {'size KB':>15}", file=out)
        for key, (queries, kb) in cls.measured.items():
            budget = BUDGETS[key]
            hint = "  ↓ budget can be lowered" if queries < budget.queries else ""
            print(
                f"  {key:<42} {queries:>4} / {budget.queries:<4}"
                f" {kb:>6.2f} / {budget.max_kb:<6}{hint}",
                file=out,
            )


if __name__ == "__main__":
    unittest.main()
