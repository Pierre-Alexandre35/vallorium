"""A realistic, isolated API world for performance checks.

Builds the real seed reference data plus one signed-up player inside a
throwaway PostgreSQL schema, and wires the FastAPI app to it. Used by the
query/payload budget tests and by the latency benchmark, so both measure the
same thing.

Authentication is stubbed: sessions live in Redis, not SQL, so stubbing does
not change what is measured on the database side.

This module only imports from ``app``; it must stay free of relative imports
because perf/latency.py loads it next to an app from another checkout.
"""

from __future__ import annotations

import io
import re
from contextlib import redirect_stdout
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

_SEED_STEPS = (
    seed.seed_resources,
    seed.seed_map_tile_types,
    seed.seed_tribes,
    seed.seed_farm_levels,
    seed.seed_warehouse_and_granary_capacity,
    seed.seed_buildings,
    seed.seed_map_tiles,
)


def get_route_keys() -> set[str]:
    """Every GET endpoint under /api/v1, as "GET /route/{template}"."""
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


class PerfWorld:
    """Context manager: ``with PerfWorld(url) as world: world.client.get(...)``."""

    def __init__(self, database_url: str, *, raise_server_exceptions: bool = True):
        self.database_url = database_url
        self.raise_server_exceptions = raise_server_exceptions
        self.schema = "test_perf_" + uuid4().hex

    def __enter__(self) -> PerfWorld:
        self.admin = create_engine(self.database_url)
        with self.admin.begin() as connection:
            connection.execute(text(f"CREATE SCHEMA {self.schema}"))
        try:
            self.engine = create_engine(
                self.database_url,
                connect_args={"options": f"-csearch_path={self.schema}"},
            )
            self.sessions = sessionmaker(bind=self.engine, autoflush=False)
            m.Base.metadata.create_all(self.engine)
            buildings._DEFAULT_STORAGE_CAPS = None
            self.user = self._seed_and_sign_up()
            self._install_overrides()
            self.client = TestClient(
                app, raise_server_exceptions=self.raise_server_exceptions
            )
            self.path_params = self._path_params()
        except BaseException:
            self.__exit__(None, None, None)
            raise
        return self

    def __exit__(self, *exc) -> None:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        if hasattr(self, "engine"):
            self.engine.dispose()
        with self.admin.begin() as connection:
            connection.execute(text(f"DROP SCHEMA IF EXISTS {self.schema} CASCADE"))
        self.admin.dispose()
        buildings._DEFAULT_STORAGE_CAPS = None

    def path_for(self, key: str) -> tuple[str, str]:
        """("GET /villages/{village_id}") -> ("GET", "/api/v1/villages/12")."""
        method, template = key.split(" ", 1)
        return method, API_PREFIX + template.format(**self.path_params)

    def _seed_and_sign_up(self) -> SessionUser:
        with self.sessions() as db, redirect_stdout(io.StringIO()):
            for step in _SEED_STEPS:
                step(db)
            db.commit()

            tribe_id = db.query(m.TribeAttributes.id).order_by("id").first()[0]
            user = auth_service.signup(
                db,
                data=SignupRequest(
                    email="perf@example.com",
                    password="perf-password",
                    tribe_id=tribe_id,
                ),
                idempotency_key=uuid4().hex,
            ).user

        return SessionUser(
            id=user.id,
            email=str(user.email),
            is_active=True,
            is_superuser=user.is_superuser,
            tribe_id=user.tribe_id,
            tribe_name=user.tribe_name,
            current_village_id=user.current_village_id,
        )

    def _install_overrides(self) -> None:
        def override_get_db():
            db = self.sessions()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = lambda: self.user

    def _path_params(self) -> dict[str, object]:
        with self.sessions() as db:
            village = db.get(m.Village, self.user.current_village_id)
            return {
                "village_id": village.id,
                "village_name": village.name,
                "tribe_id": self.user.tribe_id,
            }
