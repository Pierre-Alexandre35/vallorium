"""Performance budgets: SQL queries and response size per API endpoint.

Timings are too noisy to gate CI on, but the number of SQL round-trips and the
response size are deterministic and are what usually make an endpoint slower
(N+1 queries, extra lookups, payload growth). Every GET endpoint under /api/v1
must have a budget here, so a new feature cannot add a request path unnoticed.

If a change legitimately needs more queries or bytes, raise the budget in the
same PR so the cost is visible in review. If an endpoint got cheaper, the
summary printed at the end suggests lowering its budget.

The world (perf/world.py) is built from the real seed reference data and a real
signup, in an isolated PostgreSQL schema that is dropped afterwards. Requires a
dedicated TEST_DATABASE_URL (see tests/README.md); never point it at
DATABASE_URL.
"""

from __future__ import annotations

import os
import sys
import unittest
from dataclasses import dataclass

from perf.world import PerfWorld, QueryRecorder, get_route_keys


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


@unittest.skipUnless(
    os.getenv("TEST_DATABASE_URL"), "Requires dedicated PostgreSQL TEST_DATABASE_URL"
)
class PerformanceBudgetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.world = PerfWorld(os.environ["TEST_DATABASE_URL"]).__enter__()
        cls.measured: dict[str, tuple[int, float]] = {}

    @classmethod
    def tearDownClass(cls):
        cls.world.__exit__(None, None, None)
        cls._print_summary()

    def test_every_get_endpoint_has_a_budget(self):
        routes = get_route_keys()
        missing = sorted(routes - BUDGETS.keys() - EXEMPT.keys())
        stale = sorted((BUDGETS.keys() | EXEMPT.keys()) - routes)
        self.assertFalse(
            missing,
            "New GET endpoints without a performance budget. Add them to "
            f"BUDGETS (or EXEMPT with a reason): {missing}",
        )
        self.assertFalse(stale, f"Budgets for endpoints that no longer exist: {stale}")

    def test_endpoints_stay_within_budget(self):
        client = self.world.client
        for key, budget in BUDGETS.items():
            method, path = self.world.path_for(key)
            with self.subTest(endpoint=key):
                warmup = client.request(method, path)
                self.assertEqual(warmup.status_code, 200, f"{key}: {warmup.text}")

                with QueryRecorder(self.world.engine) as recorder:
                    response = client.request(method, path)
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
